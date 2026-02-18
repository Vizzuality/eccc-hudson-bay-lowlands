import { env } from "@/env";

export enum BasemapId {
  DEFAULT = "default",
  SATELLITE = "satellite",
}

export const BASEMAPS = {
  [BasemapId.DEFAULT]: {
    id: BasemapId.DEFAULT,
    name: "Default",
    mapStyle: "mapbox://styles/ecc-design/cmkmsriml009q01sga3pzgmak",
    image: `https://api.mapbox.com/styles/v1/ecc-design/cmkmsriml009q01sga3pzgmak/static/7.1924,4.7851,3.85,0/200x200?access_token=${env.NEXT_PUBLIC_MAPBOX_API_TOKEN}&attribution=false&logo=false`,
  },
  [BasemapId.SATELLITE]: {
    id: BasemapId.SATELLITE,
    name: "Satellite",
    mapStyle: "mapbox://styles/ecc-design/cmk2eevpe00k801s91cva9417",
    image: `https://api.mapbox.com/styles/v1/ecc-design/cmk2eevpe00k801s91cva9417/static/7.1924,4.7851,3.85,0/200x200?access_token=${env.NEXT_PUBLIC_MAPBOX_API_TOKEN}&attribution=false&logo=false`,
  },
} as const;
