import { useMediaQuery } from "usehooks-ts";

// Same query as Tailwind v4's `max-lg:` variant.
const MOBILE_MEDIA_QUERY = "(width < 64rem)";

export function useIsMobile() {
  return useMediaQuery(MOBILE_MEDIA_QUERY);
}
