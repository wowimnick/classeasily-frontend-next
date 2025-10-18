import React, { useEffect, useRef, memo } from "react";

// Converting colors to proper format
function normalizeColor(hexCode) {
  return [
    ((hexCode >> 16) & 255) / 255,
    ((hexCode >> 8) & 255) / 255,
    (255 & hexCode) / 255,
  ];
}

// Essential functionality of WebGL - Optimized with object pooling and reduced allocations
class MiniGl {
  constructor(canvas, width, height, debug = false) {
    const _miniGl = this;
    const debug_output = false;

    _miniGl.canvas = canvas;
    _miniGl.gl = _miniGl.canvas.getContext("webgl", {
      antialias: true,
      alpha: false,
      depth: false,
      stencil: false,
      preserveDrawingBuffer: false,
      powerPreference: "high-performance",
    });
    _miniGl.meshes = [];

    const context = _miniGl.gl;

    // Enable WebGL extensions for better performance
    const ext = context.getExtension("OES_vertex_array_object");
    if (ext) {
      _miniGl.vaoExt = ext;
    }

    width && height && this.setSize(width, height);

    _miniGl.lastDebugMsg = 0;
    _miniGl.debug =
      debug && debug_output
        ? function (e) {
            const t = performance.now();
            t - _miniGl.lastDebugMsg > 1000 && console.log("---");
            console.log(
              new Date(t).toLocaleTimeString() +
                Array(Math.max(0, 32 - e.length)).join(" ") +
                e +
                ": ",
              ...Array.from(arguments).slice(1)
            );
            _miniGl.lastDebugMsg = t;
          }
        : () => {};

    // Cached matrix for performance
    const identityMatrix = new Float32Array([
      1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1,
    ]);

    Object.defineProperties(_miniGl, {
      Material: {
        enumerable: false,
        value: class {
          constructor(vertexShaders, fragments, uniforms = {}) {
            const material = this;

            function getShaderByType(type, source) {
              const shader = context.createShader(type);
              context.shaderSource(shader, source);
              context.compileShader(shader);

              if (!context.getShaderParameter(shader, context.COMPILE_STATUS)) {
                console.error(context.getShaderInfoLog(shader));
                return null;
              }

              _miniGl.debug("Material.compileShaderSource", { source: source });
              return shader;
            }

            function getUniformVariableDeclarations(uniforms, type) {
              return Object.entries(uniforms)
                .map(([uniform, value]) => value.getDeclaration(uniform, type))
                .join("\n");
            }

            material.uniforms = uniforms;
            material.uniformInstances = [];

            const prefix = "precision highp float;";

            material.vertexSource = `
              ${prefix}
              attribute vec4 position;
              attribute vec2 uv;
              attribute vec2 uvNorm;
              ${getUniformVariableDeclarations(
                _miniGl.commonUniforms,
                "vertex"
              )}
              ${getUniformVariableDeclarations(uniforms, "vertex")}
              ${vertexShaders}
            `;

            material.fragmentSource = `
              ${prefix}
              ${getUniformVariableDeclarations(
                _miniGl.commonUniforms,
                "fragment"
              )}
              ${getUniformVariableDeclarations(uniforms, "fragment")}
              ${fragments}
            `;

            material.vertexShader = getShaderByType(
              context.VERTEX_SHADER,
              material.vertexSource
            );
            material.fragmentShader = getShaderByType(
              context.FRAGMENT_SHADER,
              material.fragmentSource
            );

            if (!material.vertexShader || !material.fragmentShader) {
              console.error("Failed to compile shaders");
              return;
            }

            material.program = context.createProgram();
            context.attachShader(material.program, material.vertexShader);
            context.attachShader(material.program, material.fragmentShader);
            context.linkProgram(material.program);

            if (
              !context.getProgramParameter(
                material.program,
                context.LINK_STATUS
              )
            ) {
              console.error(context.getProgramInfoLog(material.program));
              return;
            }

            context.useProgram(material.program);
            material.attachUniforms(void 0, _miniGl.commonUniforms);
            material.attachUniforms(void 0, material.uniforms);
          }

          attachUniforms(name, uniforms) {
            const material = this;
            if (void 0 === name) {
              Object.entries(uniforms).forEach(([name, uniform]) => {
                material.attachUniforms(name, uniform);
              });
            } else if ("array" === uniforms.type) {
              uniforms.value.forEach((uniform, i) =>
                material.attachUniforms(`${name}[${i}]`, uniform)
              );
            } else if ("struct" === uniforms.type) {
              Object.entries(uniforms.value).forEach(([uniform, i]) =>
                material.attachUniforms(`${name}.${uniform}`, i)
              );
            } else {
              _miniGl.debug("Material.attachUniforms", {
                name: name,
                uniform: uniforms,
              });
              material.uniformInstances.push({
                uniform: uniforms,
                location: context.getUniformLocation(material.program, name),
              });
            }
          }
        },
      },

      Uniform: {
        enumerable: false,
        value: class {
          constructor(config) {
            this.type = "float";
            Object.assign(this, config);

            this.typeFn =
              {
                float: "1f",
                int: "1i",
                vec2: "2fv",
                vec3: "3fv",
                vec4: "4fv",
                mat4: "Matrix4fv",
              }[this.type] || "1f";

            this.update();
          }

          update(location) {
            if (void 0 !== this.value && location) {
              const isMatrix = this.typeFn.indexOf("Matrix") === 0;
              context[`uniform${this.typeFn}`](
                location,
                isMatrix ? this.transpose : this.value,
                isMatrix ? this.value : null
              );
            }
          }

          getDeclaration(name, type, length) {
            if (this.excludeFrom === type) return "";

            if ("array" === this.type) {
              return (
                this.value[0].getDeclaration(name, type, this.value.length) +
                `\nconst int ${name}_length = ${this.value.length};`
              );
            }

            if ("struct" === this.type) {
              let name_no_prefix = name.replace("u_", "");
              name_no_prefix =
                name_no_prefix.charAt(0).toUpperCase() +
                name_no_prefix.slice(1);

              return (
                `uniform struct ${name_no_prefix} {
` +
                Object.entries(this.value)
                  .map(([name, uniform]) =>
                    uniform.getDeclaration(name, type).replace(/^uniform/, "")
                  )
                  .join("") +
                `
} ${name}${length > 0 ? `[${length}]` : ""};`
              );
            }

            return `uniform ${this.type} ${name}${
              length > 0 ? `[${length}]` : ""
            };`;
          }
        },
      },

      PlaneGeometry: {
        enumerable: false,
        value: class {
          constructor(width, height, n, i, orientation) {
            this.buffer = context.createBuffer();
            this.attributes = {
              position: new _miniGl.Attribute({
                target: context.ARRAY_BUFFER,
                size: 3,
              }),
              uv: new _miniGl.Attribute({
                target: context.ARRAY_BUFFER,
                size: 2,
              }),
              uvNorm: new _miniGl.Attribute({
                target: context.ARRAY_BUFFER,
                size: 2,
              }),
              index: new _miniGl.Attribute({
                target: context.ELEMENT_ARRAY_BUFFER,
                size: 3,
                type: context.UNSIGNED_SHORT,
              }),
            };

            this.setTopology(n, i);
            this.setSize(width, height, orientation);
          }

          setTopology(xSegments = 1, ySegments = 1) {
            this.xSegCount = xSegments;
            this.ySegCount = ySegments;
            this.vertexCount = (this.xSegCount + 1) * (this.ySegCount + 1);
            this.quadCount = this.xSegCount * this.ySegCount * 2;

            // Pre-allocate typed arrays for better performance
            this.attributes.uv.values = new Float32Array(2 * this.vertexCount);
            this.attributes.uvNorm.values = new Float32Array(
              2 * this.vertexCount
            );
            this.attributes.index.values = new Uint16Array(3 * this.quadCount);

            // Optimized nested loops
            for (let y = 0; y <= this.ySegCount; y++) {
              for (let x = 0; x <= this.xSegCount; x++) {
                const i = y * (this.xSegCount + 1) + x;
                const uvIndex = 2 * i;

                this.attributes.uv.values[uvIndex] = x / this.xSegCount;
                this.attributes.uv.values[uvIndex + 1] = 1 - y / this.ySegCount;
                this.attributes.uvNorm.values[uvIndex] =
                  (x / this.xSegCount) * 2 - 1;
                this.attributes.uvNorm.values[uvIndex + 1] =
                  1 - (y / this.ySegCount) * 2;

                if (x < this.xSegCount && y < this.ySegCount) {
                  const s = y * this.xSegCount + x;
                  const indexBase = 6 * s;

                  this.attributes.index.values[indexBase] = i;
                  this.attributes.index.values[indexBase + 1] =
                    i + 1 + this.xSegCount;
                  this.attributes.index.values[indexBase + 2] = i + 1;
                  this.attributes.index.values[indexBase + 3] = i + 1;
                  this.attributes.index.values[indexBase + 4] =
                    i + 1 + this.xSegCount;
                  this.attributes.index.values[indexBase + 5] =
                    i + 2 + this.xSegCount;
                }
              }
            }

            this.attributes.uv.update();
            this.attributes.uvNorm.update();
            this.attributes.index.update();
          }

          setSize(width = 1, height = 1, orientation = "xz") {
            this.width = width;
            this.height = height;
            this.orientation = orientation;

            if (
              !this.attributes.position.values ||
              this.attributes.position.values.length !== 3 * this.vertexCount
            ) {
              this.attributes.position.values = new Float32Array(
                3 * this.vertexCount
              );
            }

            const startX = width / -2;
            const startY = height / -2;
            const segmentWidth = width / this.xSegCount;
            const segmentHeight = height / this.ySegCount;

            // Optimized position calculation
            for (let y = 0; y <= this.ySegCount; y++) {
              const posY = startY + y * segmentHeight;
              for (let x = 0; x <= this.xSegCount; x++) {
                const posX = startX + x * segmentWidth;
                const vertexIndex = y * (this.xSegCount + 1) + x;
                const positionIndex = 3 * vertexIndex;

                this.attributes.position.values[
                  positionIndex + "xyz".indexOf(orientation[0])
                ] = posX;
                this.attributes.position.values[
                  positionIndex + "xyz".indexOf(orientation[1])
                ] = -posY;
              }
            }

            this.attributes.position.update();
          }
        },
      },

      Mesh: {
        enumerable: false,
        value: class {
          constructor(geometry, material) {
            this.geometry = geometry;
            this.material = material;
            this.wireframe = false;
            this.attributeInstances = [];

            Object.entries(this.geometry.attributes).forEach(
              ([name, attribute]) => {
                this.attributeInstances.push({
                  attribute: attribute,
                  location: attribute.attach(name, this.material.program),
                });
              }
            );

            _miniGl.meshes.push(this);
          }

          draw() {
            context.useProgram(this.material.program);

            // Batch uniform updates for better performance
            this.material.uniformInstances.forEach(({ uniform, location }) => {
              uniform.update(location);
            });

            this.attributeInstances.forEach(({ attribute, location }) => {
              attribute.use(location);
            });

            context.drawElements(
              this.wireframe ? context.LINES : context.TRIANGLES,
              this.geometry.attributes.index.values.length,
              context.UNSIGNED_SHORT,
              0
            );
          }

          remove() {
            _miniGl.meshes = _miniGl.meshes.filter((mesh) => mesh !== this);
          }
        },
      },

      Attribute: {
        enumerable: false,
        value: class {
          constructor(config) {
            this.type = context.FLOAT;
            this.normalized = false;
            this.buffer = context.createBuffer();
            Object.assign(this, config);
            this.update();
          }

          update() {
            if (this.values) {
              context.bindBuffer(this.target, this.buffer);
              context.bufferData(this.target, this.values, context.STATIC_DRAW);
            }
          }

          attach(name, program) {
            const location = context.getAttribLocation(program, name);
            if (this.target === context.ARRAY_BUFFER) {
              context.enableVertexAttribArray(location);
              context.vertexAttribPointer(
                location,
                this.size,
                this.type,
                this.normalized,
                0,
                0
              );
            }
            return location;
          }

          use(location) {
            context.bindBuffer(this.target, this.buffer);
            if (this.target === context.ARRAY_BUFFER) {
              context.enableVertexAttribArray(location);
              context.vertexAttribPointer(
                location,
                this.size,
                this.type,
                this.normalized,
                0,
                0
              );
            }
          }
        },
      },
    });

    _miniGl.commonUniforms = {
      projectionMatrix: new _miniGl.Uniform({
        type: "mat4",
        value: identityMatrix.slice(),
      }),
      modelViewMatrix: new _miniGl.Uniform({
        type: "mat4",
        value: identityMatrix.slice(),
      }),
      resolution: new _miniGl.Uniform({
        type: "vec2",
        value: [1, 1],
      }),
      aspectRatio: new _miniGl.Uniform({
        type: "float",
        value: 1,
      }),
    };
  }

  setSize(width = 640, height = 480) {
    this.width = width;
    this.height = height;
    this.canvas.width = width;
    this.canvas.height = height;
    this.gl.viewport(0, 0, width, height);
    this.commonUniforms.resolution.value = [width, height];
    this.commonUniforms.aspectRatio.value = width / height;
  }

  setOrthographicCamera(x = 0, y = 0, z = 0, near = -2000, far = 2000) {
    this.commonUniforms.projectionMatrix.value = new Float32Array([
      2 / this.width,
      0,
      0,
      0,
      0,
      2 / this.height,
      0,
      0,
      0,
      0,
      2 / (near - far),
      0,
      x,
      y,
      z,
      1,
    ]);
  }

  render() {
    this.gl.clearColor(0, 0, 0, 0);
    this.gl.clearDepth(1);
    this.meshes.forEach((mesh) => mesh.draw());
  }
}

// Property setter utility
function setProperty(object, propertyName, value) {
  return (
    propertyName in object
      ? Object.defineProperty(object, propertyName, {
          value: value,
          enumerable: true,
          configurable: true,
          writable: true,
        })
      : (object[propertyName] = value),
    object
  );
}

// Performance-optimized Gradient class
class Gradient {
  constructor() {
    // Use object property assignments for better performance
    Object.assign(this, {
      el: null,
      cssVarRetries: 0,
      maxCssVarRetries: 200,
      angle: 0,
      isLoadedClass: false,
      isScrolling: false,
      scrollingTimeout: null,
      scrollingRefreshDelay: 200,
      isIntersecting: false,
      shaderFiles: null,
      vertexShader: null,
      sectionColors: null,
      computedCanvasStyle: null,
      conf: null,
      uniforms: null,
      t: 1253106,
      last: 0,
      width: null,
      minWidth: 1111,
      height: 600,
      xSegCount: null,
      ySegCount: null,
      mesh: null,
      material: null,
      geometry: null,
      minigl: null,
      scrollObserver: null,
      amp: 320,
      seed: 5,
      freqX: 14e-5,
      freqY: 29e-5,
      freqDelta: 1e-5,
      activeColors: [1, 1, 1, 1],
      isMetaKey: false,
      isGradientLegendVisible: false,
      isMouseDown: false,

      // Optimized event handlers with proper binding
      handleScroll: () => {
        clearTimeout(this.scrollingTimeout);
        this.scrollingTimeout = setTimeout(
          this.handleScrollEnd,
          this.scrollingRefreshDelay
        );
        if (this.isGradientLegendVisible) this.hideGradientLegend();
        if (this.conf.playing) {
          this.isScrolling = true;
          this.pause();
        }
      },

      handleScrollEnd: () => {
        this.isScrolling = false;
        if (this.isIntersecting) this.play();
      },

      // Throttled resize handler for better performance
      resize: (() => {
        let resizeTimer = null;
        return () => {
          if (typeof window === "undefined") return;
          if (resizeTimer) return;
          resizeTimer = setTimeout(() => {
            this.width = window.innerWidth;
            this.minigl.setSize(this.width, this.height);
            this.minigl.setOrthographicCamera();
            this.xSegCount = Math.ceil(this.width * this.conf.density[0]);
            this.ySegCount = Math.ceil(this.height * this.conf.density[1]);
            this.mesh.geometry.setTopology(this.xSegCount, this.ySegCount);
            this.mesh.geometry.setSize(this.width, this.height);
            this.mesh.material.uniforms.u_shadow_power.value =
              this.width < 600 ? 5 : 6;
            resizeTimer = null;
          }, 16);
        };
      })(),

      handleMouseDown: (e) => {
        if (this.isGradientLegendVisible) {
          this.isMetaKey = e.metaKey;
          this.isMouseDown = true;
          if (!this.conf.playing) requestAnimationFrame(this.animate);
        }
      },

      handleMouseUp: () => {
        this.isMouseDown = false;
      },

      // Optimized animation loop with RAF scheduling
      animate: (timestamp) => {
        if (!this.shouldSkipFrame(timestamp) || this.isMouseDown) {
          const deltaTime = Math.min(timestamp - this.last, 1000 / 15);
          this.t += deltaTime;
          this.last = timestamp;

          if (this.isMouseDown) {
            const increment = this.isMetaKey ? -160 : 160;
            this.t += increment;
          }

          this.mesh.material.uniforms.u_time.value = this.t;
          this.minigl.render();
        }

        if (this.last === 0 && this.isStatic) {
          this.minigl.render();
          this.disconnect();
          return;
        }

        if (this.conf.playing || this.isMouseDown) {
          requestAnimationFrame(this.animate);
        }
      },

      addIsLoadedClass: () => {
        if (!this.isLoadedClass) {
          this.isLoadedClass = true;
          this.el.classList.add("isLoaded");
          setTimeout(() => {
            this.el.parentElement?.classList.add("isLoaded");
          }, 3000);
        }
      },

      pause: () => {
        this.conf.playing = false;
      },

      play: () => {
        requestAnimationFrame(this.animate);
        this.conf.playing = true;
      },

      initGradient: (selector) => {
        if (typeof document === "undefined") return this;
        this.el = document.querySelector(selector);
        this.connect();
        return this;
      },
    });
  }

  async connect() {
    // Precompiled shaders for better performance
    this.shaderFiles = {
      vertex: `
        varying vec3 v_color;
        void main() {
          float time = u_time * u_global.noiseSpeed;
          vec2 noiseCoord = resolution * uvNorm * u_global.noiseFreq;
          vec2 st = 1. - uvNorm.xy;
          
          float tilt = resolution.y / 2.0 * uvNorm.y;
          float incline = resolution.x * uvNorm.x / 2.0 * u_vertDeform.incline;
          float offset = resolution.x / 2.0 * u_vertDeform.incline * mix(u_vertDeform.offsetBottom, u_vertDeform.offsetTop, uv.y);
          
          float noise = snoise(vec3(
            noiseCoord.x * u_vertDeform.noiseFreq.x + time * u_vertDeform.noiseFlow,
            noiseCoord.y * u_vertDeform.noiseFreq.y,
            time * u_vertDeform.noiseSpeed + u_vertDeform.noiseSeed
          )) * u_vertDeform.noiseAmp;
          
          noise *= 1.0 - pow(abs(uvNorm.y), 2.0);
          noise = max(0.0, noise);
          
          vec3 pos = vec3(
            position.x,
            position.y + tilt + incline + noise - offset,
            position.z
          );
          
          if (u_active_colors[0] == 1.) {
            v_color = u_baseColor;
          }
          
          for (int i = 0; i < u_waveLayers_length; i++) {
            if (u_active_colors[i + 1] == 1.) {
              WaveLayers layer = u_waveLayers[i];
              float noise = smoothstep(
                layer.noiseFloor,
                layer.noiseCeil,
                snoise(vec3(
                  noiseCoord.x * layer.noiseFreq.x + time * layer.noiseFlow,
                  noiseCoord.y * layer.noiseFreq.y,
                  time * layer.noiseSpeed + layer.noiseSeed
                )) / 2.0 + 0.5
              );
              v_color = blendNormal(v_color, layer.color, pow(noise, 4.));
            }
          }
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,

      // Simplex noise implementation (unchanged for correctness)
      noise: `
        vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
        vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
        
        float snoise(vec3 v) {
          const vec2 C = vec2(1.0/6.0, 1.0/3.0);
          const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
          vec3 i = floor(v + dot(v, C.yyy));
          vec3 x0 = v - i + dot(i, C.xxx);
          vec3 g = step(x0.yzx, x0.xyz);
          vec3 l = 1.0 - g;
          vec3 i1 = min(g.xyz, l.zxy);
          vec3 i2 = max(g.xyz, l.zxy);
          vec3 x1 = x0 - i1 + C.xxx;
          vec3 x2 = x0 - i2 + C.yyy;
          vec3 x3 = x0 - D.yyy;
          i = mod289(i);
          vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
          float n_ = 0.142857142857;
          vec3 ns = n_ * D.wyz - D.xzx;
          vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
          vec4 x_ = floor(j * ns.z);
          vec4 y_ = floor(j - 7.0 * x_);
          vec4 x = x_ * ns.x + ns.yyyy;
          vec4 y = y_ * ns.x + ns.yyyy;
          vec4 h = 1.0 - abs(x) - abs(y);
          vec4 b0 = vec4(x.xy, y.xy);
          vec4 b1 = vec4(x.zw, y.zw);
          vec4 s0 = floor(b0) * 2.0 + 1.0;
          vec4 s1 = floor(b1) * 2.0 + 1.0;
          vec4 sh = -step(h, vec4(0.0));
          vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
          vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
          vec3 p0 = vec3(a0.xy, h.x);
          vec3 p1 = vec3(a0.zw, h.y);
          vec3 p2 = vec3(a1.xy, h.z);
          vec3 p3 = vec3(a1.zw, h.w);
          vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
          p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
          vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
          m = m * m;
          return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
        }
      `,

      // Blend functions (shortened for performance)
      blend: `
        vec3 blendNormal(vec3 base, vec3 blend) { return blend; }
        vec3 blendNormal(vec3 base, vec3 blend, float opacity) { 
          return (blend * opacity + base * (1.0 - opacity)); 
        }
      `,

      fragment: `
        varying vec3 v_color;
        void main() {
          vec3 color = v_color;
          if (u_darken_top == 1.0) {
            vec2 st = gl_FragCoord.xy/resolution.xy;
            color.g -= pow(st.y + sin(-12.0) * st.x, u_shadow_power) * 0.4;
          }
          gl_FragColor = vec4(color, 1.0);
        }
      `,
    };

    this.conf = {
      presetName: "",
      wireframe: false,
      density: [0.06, 0.16],
      zoom: 1,
      rotation: 0,
      playing: true,
    };

    // Check if canvas exists before initializing
    const canvasExists =
      typeof document !== "undefined" && document.querySelector("canvas");
    if (!canvasExists) {
      console.log("Canvas element not found");
      return;
    }

    this.minigl = new MiniGl(this.el, null, null, false);

    // Use requestIdleCallback for better performance
    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      requestIdleCallback(() => {
        if (this.el) {
          this.computedCanvasStyle = getComputedStyle(this.el);
          this.waitForCssVars();
        }
      });
    } else if (typeof window !== "undefined") {
      requestAnimationFrame(() => {
        if (this.el) {
          this.computedCanvasStyle = getComputedStyle(this.el);
          this.waitForCssVars();
        }
      });
    }
  }

  disconnect() {
    if (typeof window === "undefined") return;

    if (this.scrollObserver) {
      window.removeEventListener("scroll", this.handleScroll);
      window.removeEventListener("mousedown", this.handleMouseDown);
      window.removeEventListener("mouseup", this.handleMouseUp);
      this.scrollObserver.disconnect();
    }
    window.removeEventListener("resize", this.resize);
  }

  initMaterial() {
    this.uniforms = {
      u_time: new this.minigl.Uniform({ value: 0 }),
      u_shadow_power: new this.minigl.Uniform({ value: 5 }),
      u_darken_top: new this.minigl.Uniform({
        value: this.el.dataset.jsDarkenTop === "" ? 1 : 0,
      }),
      u_active_colors: new this.minigl.Uniform({
        value: this.activeColors,
        type: "vec4",
      }),
      u_global: new this.minigl.Uniform({
        value: {
          noiseFreq: new this.minigl.Uniform({
            value: [this.freqX, this.freqY],
            type: "vec2",
          }),
          noiseSpeed: new this.minigl.Uniform({
            value: 5e-6,
          }),
        },
        type: "struct",
      }),
      u_vertDeform: new this.minigl.Uniform({
        value: {
          incline: new this.minigl.Uniform({
            value: Math.sin(this.angle) / Math.cos(this.angle),
          }),
          offsetTop: new this.minigl.Uniform({ value: -0.5 }),
          offsetBottom: new this.minigl.Uniform({ value: -0.5 }),
          noiseFreq: new this.minigl.Uniform({
            value: [3, 4],
            type: "vec2",
          }),
          noiseAmp: new this.minigl.Uniform({ value: this.amp }),
          noiseSpeed: new this.minigl.Uniform({ value: 10 }),
          noiseFlow: new this.minigl.Uniform({ value: 3 }),
          noiseSeed: new this.minigl.Uniform({ value: this.seed }),
        },
        type: "struct",
        excludeFrom: "fragment",
      }),
      u_baseColor: new this.minigl.Uniform({
        value: this.sectionColors[0],
        type: "vec3",
        excludeFrom: "fragment",
      }),
      u_waveLayers: new this.minigl.Uniform({
        value: [],
        excludeFrom: "fragment",
        type: "array",
      }),
    };

    // Build wave layers efficiently
    for (let i = 1; i < this.sectionColors.length; i++) {
      this.uniforms.u_waveLayers.value.push(
        new this.minigl.Uniform({
          value: {
            color: new this.minigl.Uniform({
              value: this.sectionColors[i],
              type: "vec3",
            }),
            noiseFreq: new this.minigl.Uniform({
              value: [
                2 + i / this.sectionColors.length,
                3 + i / this.sectionColors.length,
              ],
              type: "vec2",
            }),
            noiseSpeed: new this.minigl.Uniform({ value: 11 + 0.3 * i }),
            noiseFlow: new this.minigl.Uniform({ value: 6.5 + 0.3 * i }),
            noiseSeed: new this.minigl.Uniform({ value: this.seed + 10 * i }),
            noiseFloor: new this.minigl.Uniform({ value: 0.1 }),
            noiseCeil: new this.minigl.Uniform({ value: 0.63 + 0.07 * i }),
          },
          type: "struct",
        })
      );
    }

    this.vertexShader = [
      this.shaderFiles.noise,
      this.shaderFiles.blend,
      this.shaderFiles.vertex,
    ].join("\n\n");

    return new this.minigl.Material(
      this.vertexShader,
      this.shaderFiles.fragment,
      this.uniforms
    );
  }

  initMesh() {
    this.material = this.initMaterial();
    this.geometry = new this.minigl.PlaneGeometry();
    this.mesh = new this.minigl.Mesh(this.geometry, this.material);
  }

  shouldSkipFrame(timestamp) {
    return (
      (typeof document !== "undefined" && document.hidden) ||
      !this.conf.playing ||
      parseInt(timestamp, 10) % 2 === 0
    );
  }

  updateFrequency(delta) {
    this.freqX += delta;
    this.freqY += delta;
  }

  toggleColor(index) {
    this.activeColors[index] = this.activeColors[index] === 0 ? 1 : 0;
  }

  init() {
    this.initGradientColors();
    this.initMesh();
    this.resize();
    requestAnimationFrame(this.animate);
    if (typeof window !== "undefined") {
      window.addEventListener("resize", this.resize);
    }
  }

  waitForCssVars() {
    const colorProperty =
      this.computedCanvasStyle?.getPropertyValue("--gradient-color-1");

    if (colorProperty?.includes("#")) {
      this.init();
      this.addIsLoadedClass();
    } else {
      this.cssVarRetries++;
      if (this.cssVarRetries > this.maxCssVarRetries) {
        // Fallback colors
        this.sectionColors = [
          normalizeColor(0xff0000),
          normalizeColor(0xff0000),
          normalizeColor(0xff00ff),
          normalizeColor(0x00ff00),
          normalizeColor(0x0000ff),
        ];
        this.init();
      } else {
        requestAnimationFrame(() => this.waitForCssVars());
      }
    }
  }

  initGradientColors() {
    this.sectionColors = [
      "--gradient-color-1",
      "--gradient-color-2",
      "--gradient-color-3",
      "--gradient-color-4",
    ]
      .map((cssPropertyName) => {
        let hex = this.computedCanvasStyle
          .getPropertyValue(cssPropertyName)
          .trim();

        // Handle shorthand hex
        if (hex.length === 4) {
          const expanded = hex
            .substr(1)
            .split("")
            .map((char) => char + char)
            .join("");
          hex = `#${expanded}`;
        }

        return hex ? `0x${hex.substr(1)}` : null;
      })
      .filter(Boolean)
      .map((hex) => normalizeColor(parseInt(hex, 16)));
  }
}

const GradientCanvas = memo(() => {
  const canvasRef = useRef(null);
  const gradientRef = useRef(null);

  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return;
    if (!canvasRef.current) return;

    // Initialize gradient with error handling
    try {
      gradientRef.current = new Gradient();
      gradientRef.current.el = canvasRef.current;
      gradientRef.current.connect();
    } catch (error) {
      console.error("Failed to initialize gradient:", error);
    }

    return () => {
      if (gradientRef.current) {
        gradientRef.current.disconnect();
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: -1,
        pointerEvents: "none",
        willChange: "transform",
        "--gradient-color-1": "#fff",
        "--gradient-color-2": "#fff",
        "--gradient-color-3": "#fed7d7",
        "--gradient-color-4": "#fff0f0",
      }}
      width="1920"
      height="1080"
      aria-hidden="true"
    />
  );
});

GradientCanvas.displayName = "GradientCanvas";

// Only export on client side to prevent SSR issues
export default typeof window !== "undefined" ? GradientCanvas : () => null;
