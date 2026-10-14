# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
Releases are tagged `rc-vX.Y.Z` and deploy to staging (see [Deployment](docs/DEPLOYMENT.md#releasing-to-staging)).

## [0.4.0] - 2026-10-14

### Added

- Mobile layout below 1024px: Data view, map controls and legend sheet, analysis drawing, analysis results and an intro modal
- Download widget data as CSV from the widget card menu
- Multi-layer carousel in the map tooltip
- Detection of unsupported coordinate reference systems on geometry upload
- Close button on shared analyses; the logo now links home
- Tile icon tilts while drawing a geometry
- Treemap labels wrap across two lines

### Changed

- The indigenous territories layer is no longer shown by default
- Analysis widgets fit the narrower sidebar
- Snow dynamics: End of Snow axis narrowed to April–July, legend ranges based on the rasters and snow end labelled by month

### Fixed

- App height follows the dynamic viewport on mobile browsers
- Mobile drawing starts on a touch tap
- Histogram Y-axis labels are no longer clipped; histogram CSV rows include units
- Water dynamics and flood susceptibility donuts use the analysis response
- Analysis area errors distinguish below-minimum from above-maximum
- Raster values outside the colormap range are clamped
- Ecosystem widget colours come from the layer colormap, and the dominant class shows its category label
- CRS identifiers are stored without a URL scheme
- Legend trigger is translated and keeps its accessible name when open

### Security

- API 500 responses no longer include exception text
- Client: upgraded Next.js to 16.3.8, axios to 1.20.0, vite, vitest and concurrently, and refreshed transitive packages (sharp, undici, postcss, nanoid, browserslist, fflate, and others) to fix published advisories
- API: upgraded fastapi (starlette), cryptography, requests, python-multipart, werkzeug, click, urllib3, msgpack and other packages to fix published advisories
- Data processing: upgraded pip, tornado, requests, idna and pygments to fix published advisories

## [0.3.2] - 2026-05-26

Tagged as `rc-v3.1.0` by mistake. Dismissible beta banner, zoom to the selected area, AOI size returned by the analysis, and percentage values in downloaded chart legends.

## [0.3.1] - 2026-05-20

Tagged as both `rc-v3.0.1` (2026-05-19, by mistake) and `rc-v0.3.1`. Map click popup lists all overlapping polygons; translation corrections; nginx pinned to 1.30.1.

## [0.3.0] - 2026-05-19

Shareable analysis links, HBL study-area mask during upload, and legend colours in the feature popup.

## [0.2.0] - 2026-04-24

Full French translation, all user-facing strings extracted to translation files, and visible tooltips on map controls.

## [0.1.3] - 2026-03-22

Minor fixes.

## [0.1.1] - 2026-03-22

Tagged as `rc-v.0.1.1`. Indigenous territories vector layer and inferred styles for vector layers without a config.

## [0.1.0] - 2026-03-13

Tagged as `rc-v.0.1.0`. First release: category, dataset and layer endpoints, database seeding, COG tile serving from a private S3 bucket, and the map client.

[0.4.0]: https://github.com/Vizzuality/eccc-hudson-bay-lowlands/compare/rc-v3.1.0...rc-v0.4.0
[0.3.2]: https://github.com/Vizzuality/eccc-hudson-bay-lowlands/compare/rc-v0.3.1...rc-v3.1.0
[0.3.1]: https://github.com/Vizzuality/eccc-hudson-bay-lowlands/compare/rc-v0.3.0...rc-v0.3.1
[0.3.0]: https://github.com/Vizzuality/eccc-hudson-bay-lowlands/compare/rc-v0.2.0...rc-v0.3.0
[0.2.0]: https://github.com/Vizzuality/eccc-hudson-bay-lowlands/compare/rc-v0.1.3...rc-v0.2.0
[0.1.3]: https://github.com/Vizzuality/eccc-hudson-bay-lowlands/compare/rc-v.0.1.1...rc-v0.1.3
[0.1.1]: https://github.com/Vizzuality/eccc-hudson-bay-lowlands/compare/rc-v.0.1.0...rc-v.0.1.1
[0.1.0]: https://github.com/Vizzuality/eccc-hudson-bay-lowlands/releases/tag/rc-v.0.1.0
