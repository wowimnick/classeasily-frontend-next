import { Gradient } from "stripe-gradient";

/**
 * Soften the rotated hero strip so color dissolves to page white
 * before the canvas box, instead of clipping as a hard rectangle.
 */
const FADING_FRAGMENT = `
varying vec3 v_color;

void main() {
  vec3 color = v_color;
  vec2 st = gl_FragCoord.xy / resolution.xy;

  float fadeX = smoothstep(0.0, 0.12, st.x) * smoothstep(0.0, 0.12, 1.0 - st.x);
  float fadeY = smoothstep(0.0, 0.2, st.y) * smoothstep(0.0, 0.2, 1.0 - st.y);
  float keep = fadeX * fadeY;

  color = mix(vec3(1.0), color, keep);
  gl_FragColor = vec4(color, 1.0);
}
`;

export default class HomeHeroGradient extends Gradient {
  constructor(...args) {
    super(...args);
    this.resize = () => {
      if (!this.el || !this.minigl || !this.mesh) return;
      this.width = Math.max(2, this.el.offsetWidth || 2);
      this.height = Math.max(2, this.el.offsetHeight || 2);
      this.minigl.setSize(this.width, this.height);
      this.minigl.setOrthographicCamera();
      this.xSegCount = Math.ceil(this.width * this.conf.density[0]);
      this.ySegCount = Math.ceil(this.height * this.conf.density[1]);
      this.mesh.geometry.setTopology(this.xSegCount, this.ySegCount);
      this.mesh.geometry.setSize(this.width, this.height);
      this.mesh.material.uniforms.u_shadow_power.value =
        this.width < 600 ? 5 : 6;
    };
  }

  init() {
    if (this.shaderFiles) {
      this.shaderFiles.fragment = FADING_FRAGMENT;
    }
    super.init();
  }
}
