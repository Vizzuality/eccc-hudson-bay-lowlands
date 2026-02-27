import { env } from "@/env";

export enum BasemapId {
  LIGHT = "light",
  SATELLITE = "satellite",
}

export const BASEMAPS = {
  [BasemapId.LIGHT]: {
    id: BasemapId.LIGHT,
    name: "Light",
    mapStyle: "mapbox://styles/ecc-design/cmkmsriml009q01sga3pzgmak",
    image: `https://api.mapbox.com/styles/v1/ecc-design/cmkmsriml009q01sga3pzgmak/static/7.1924,4.7851,3.85,0,0/200x200@2x?access_token=${env.NEXT_PUBLIC_MAPBOX_API_TOKEN}&attribution=false&logo=false`,
  },
  [BasemapId.SATELLITE]: {
    id: BasemapId.SATELLITE,
    name: "Satellite",
    mapStyle: "mapbox://styles/ecc-design/cmm3mbhoq008m01r6hmz29bcn",
    image: `https://api.mapbox.com/styles/v1/ecc-design/cmm3mbhoq008m01r6hmz29bcn/static/7.1924,4.7851,3.85,0,0/200x200@2x?access_token=${env.NEXT_PUBLIC_MAPBOX_API_TOKEN}&attribution=false&logo=false`,
  },
} as const;
