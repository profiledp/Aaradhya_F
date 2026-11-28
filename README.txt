Aaradhya Mart Homepage - Marketplace Balanced Update

This update adjusts the homepage to present all three Aaradhya Mart stores equally:
- Fashion (fashion.html)
- Kirana (kirana.html)
- Print (print.html)

Changes made:
- Hero copy generalized from fashion-first to marketplace-wide messaging.
- Hero stat changed to 3 stores.
- Main category section changed to "Explore Our Stores" with 3 equal store cards.
- Quick Shop shortcuts reordered so Fashion, Kirana and Print appear first.
- Budget/value section wording generalized to all stores.
- Featured Products section label generalized and link points back to store categories.
- Promotions now feature Kirana and Print instead of fashion-only promotion.

Existing functions, sections outside these targeted areas, and shopping behavior were not intentionally removed.
Replace only index.html after making a backup. Other files are included unchanged.\nLive website behavior is not verified here; review on GitHub Pages after deployment.

Aaradhya Mart PWA setup
Replace the repository root index.html with this package index.html and add manifest.json, service-worker.js, and icons/ folder. Keep files at repository root (same level as index.html). GitHub Pages site URL: https://profiledp.github.io/Aaradhya_F/
PWA installation requires HTTPS and a supported browser. Service worker caching is basic and intentionally only same-origin. Live GitHub/Firebase behavior was not tested.
