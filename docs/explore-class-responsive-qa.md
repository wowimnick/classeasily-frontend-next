# Explore + class pages — responsive QA

Manual checks after layout changes (breakpoints: **768** mobile, **1024** tablet/map split, **1440** desktop).

| Viewport | Explore | Class detail |
|----------|---------|----------------|
| 320–375 | Filter bar scrolls; cards list layout; FAB doesn’t overlap content | Peek bar + reserve footer; hero square capped |
| 414, 560 | Subcategory row wraps | Bento readable |
| 768 | Header height 60px | Mobile title row |
| 820 (iPad mini) | Grid ↔ list transition | Hero bento vs single image |
| 1024 | Map column hidden; only one of peek/mobile footers active at boundary | Sidebar hides; sticky footers |
| 1180 | Map split ratio | Sidebar width |
| 1280–1440 | Desktop pill centered | Desktop peek bar |
| 1920–2560 | Card columns fill; map pane stable | Max width 1360 content |

## Sitemap / crawlability

Production serves `/sitemap.xml` via **Next rewrite to Django** (`next.config.mjs`). Confirm the backend sitemap lists `/classes/[slug]` and geographic `/explore/...` URLs so crawlers discover them.
