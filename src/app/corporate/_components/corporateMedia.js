/**
 * Corporate landing video assets — drop MP4s into `public/videos/corporate/`
 * (see public/videos/corporate/README.md). Until files exist, components fall
 * back to poster gradients (onError / optional check).
 *
 * Hero (`hero-teams.mp4`): muted **autoplay + loop** background. Other clips
 * below the fold also loop. Encode short seamless loops for best results.
 */
export const CORPORATE_VIDEOS = {
  hero: "/videos/corporate/hero-teams.mp4",
  valueCurate: "/videos/corporate/value-curate.mp4",
  valueHost: "/videos/corporate/value-trusted-hosts.mp4",
  valueInvoice: "/videos/corporate/value-invoice.mp4",
  howTell: "/videos/corporate/how-tell.mp4",
  howCurate: "/videos/corporate/how-curate.mp4",
  howBook: "/videos/corporate/how-book.mp4",
  howCelebrate: "/videos/corporate/how-celebrate.mp4",
};
