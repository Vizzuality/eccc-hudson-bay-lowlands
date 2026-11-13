# ADR-008: Full-Width Map Canvas Clipped by the Sidebar

**Date**: 2026-11-13

**Status**: Accepted

On desktop the Mapbox canvas always fills the whole row, under the sidebar. The sidebar is shown by animating a `clip-path` on the map container and the camera `padding`, not by resizing the map: a WebGL canvas cannot resize smoothly, and a `width` transition either redraws the map on every frame or leaves it stretched until the transition ends. The costs are that all map UI must sit in an inset overlay, the PNG download must crop the hidden part, and `maxBounds` is enforced against the full canvas, including the part under the sidebar.
