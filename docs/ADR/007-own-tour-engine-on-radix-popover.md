# ADR-007: Own Tour Engine on Radix Popover

**Date**: 2026-11-05

**Status**: Accepted

## Context

The onboarding design (EH-182) has a custom Tour Card with React content and seven pointer positions, three spotlight shapes, hotspots, and a vaul bottom sheet on mobile. driver.js renders its own popover as plain DOM, so React content would need a portal into the node it creates, and its layout would fight the card design. react-joyride and onborda bring their own tooltip and overlay models with the same mismatch.

## Decision

Build the tour in the client: a fixed spotlight `div` with a large `box-shadow` as the dim overlay, and a modal Radix `Popover` anchored to the target with `Popover.Anchor virtualRef`.

## Consequences

### Positive

- The card matches the Figma design exactly, with no new dependency (`radix-ui` is already installed).
- Focus trapping, Escape to close, and collision flipping come from Radix.

### Negative

- We maintain the spotlight positioning (scroll, resize) ourselves.
