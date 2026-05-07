# Corporate landing videos

Place **H.264 MP4** files in this folder. The corporate page references them by filename; until files exist, the UI falls back to gradients and posters.

## Recommended specs

| File | Role | Suggested length | Resolution | Max size |
|------|------|-------------------|------------|----------|
| `hero-teams.mp4` | Hero background (**muted autoplay + loop**) | 6–10 s seamless loop | 1920×1080 | ~2 MB |
| `value-curate.mp4` | Value prop card 1 (loop) | 5–8 s | 1280×720 | ~1.5 MB |
| `value-trusted-hosts.mp4` | Value prop card 2 | 5–8 s | 1280×720 | ~1.5 MB |
| `value-invoice.mp4` | Value prop card 3 | 5–8 s | 1280×720 | ~1.5 MB |
| `how-tell.mp4` | How it works step 1 | 4–6 s | 1280×720 | ~1 MB |
| `how-curate.mp4` | Step 2 | 4–6 s | 1280×720 | ~1 MB |
| `how-book.mp4` | Step 3 | 4–6 s | 1280×720 | ~1 MB |
| `how-celebrate.mp4` | Step 4 | 4–6 s | 1280×720 | ~1 MB |

- **Codec:** H.264 (avc1), AAC audio optional (hero is muted; loops should be silent).
- **Frame rate:** 24 or 30 fps.
- **Color:** sRGB; avoid HDR-only masters for broad browser support.

## Accessibility

Users with **prefers-reduced-motion** see static gradients instead of motion-heavy video scrubbing and looping clips (`CorporateHero`, `ValueProps`, `HowItWorksCorporate`). The inquiry form uses visible `:focus-visible` rings on chips and FAQ triggers; run your usual axe / keyboard pass after changing copy or layout.

## Mapping in code

Paths are defined in `src/app/corporate/_components/corporateMedia.js` (`CORPORATE_VIDEOS`).
