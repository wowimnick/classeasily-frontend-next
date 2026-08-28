import { Gradient } from "stripe-gradient";

/**
 * Stripe mesh with a fragment fade to page white.
 * Soft color falloff instead of a hard circular mask — taller on Y so it
 * reaches the headline, then dissolves into the form.
 */
const FADING_FRAGMENT = `
varying vec3 v_color;

void main() {
  vec3 color = v_color;
  vec2 st = gl_FragCoord.xy / resolution.xy;

  // Bloom sits lower-left; Y is stretched so color holds further up the page.
  vec2 origin = vec2(0.10, 0.02);
  vec2 stretch = vec2(0.88, 1.55);
  float dist = length((st - origin) / stretch);

  float wash = smoothstep(0.12, 1.18, dist);
  // Fully white before the canvas’s right edge so the box never clips color.
  float right = smoothstep(0.36, 0.78, st.x);
  float top = smoothstep(0.58, 0.94, st.y);

  float fade = max(wash, max(right, top));
  color = mix(color, vec3(1.0), fade);

  gl_FragColor = vec4(color, 1.0);
}
`;

export default class OnboardGradient extends Gradient {
  constructor(...args) {
    super(...args);
    this.resize = () => {
      if (!this.el || !this.minigl || !this.mesh) return;
      const rect = this.el.getBoundingClientRect();
      this.width = Math.max(2, Math.round(rect.width));
      this.height = Math.max(2, Math.round(rect.height));
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
