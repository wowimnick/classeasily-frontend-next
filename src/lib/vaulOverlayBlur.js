/**
 * Vaul Drawer.Overlay: backdrop-filter does not reliably apply from globals.css
 * (load order vs styled-components / portal). Use this inside styled(Drawer.Overlay)`…`.
 */
export const VAUL_OVERLAY_BACKDROP_BLUR = `
  -webkit-backdrop-filter: blur(4px);
  backdrop-filter: blur(4px);
`;

/** For Drawer.Overlay style={{ ... }} */
export const vaulOverlayInlineBlur = {
  WebkitBackdropFilter: "blur(4px)",
  backdropFilter: "blur(4px)",
};
