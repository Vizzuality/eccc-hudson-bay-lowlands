# Hudson Bay Lowlands map

A map of data layers for the Hudson Bay Lowlands (HBL) study area, with tools to analyse a drawn or uploaded area.

## Masks

**Basemap mask**:
The permanent dark overlay in the basemap style that dims everything outside the HBL study area, clipping data layers to it.
_Avoid_: mask (alone), HBL mask

**Upload mask**:
The overlay shown while the user draws or uploads an area, marking where a selection is allowed.
_Avoid_: HBL area mask

**Analysis mask**:
The overlay shown during an analysis, dimming everything outside the analysed area.

## Layers

**Above-mask layer**:
A data layer drawn on top of the basemap mask, so it stays visible outside the HBL study area; it is still covered by the upload and analysis masks.
_Avoid_: unclipped layer

**Mushkegowuk Territory**:
The territory of the Mushkegowuk Council, the Indigenous community the project works with; the only above-mask layer.

**Default layer**:
The data layer shown when the map opens with no layers chosen; currently Carbon Storage.

## Onboarding

**Map tour**:
The guided sequence of steps that points out how to find data, add and control layers, and start an analysis on the map.
_Avoid_: onboarding (alone), tutorial

**Analysis tour**:
The guided sequence of steps that explains the results of an analysis; separate from the map tour.

**Welcome card**:
The card shown once, on a visitor's first visit to the main map view, that introduces the map and offers to start the map tour.
_Avoid_: intro modal

**Tour step**:
One stop in a tour: a highlighted part of the screen with a card that explains it.

**Spotlight**:
The cut-out in the dimmed screen that marks what the current tour step is about.
_Avoid_: highlight, mask
