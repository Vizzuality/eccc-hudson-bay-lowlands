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
