import { NAVIGATION } from "@/containers/top-bar/constants";
import { usePathname } from "@/i18n/navigation";

export function useNavigation() {
  const pathname = usePathname();

  return NAVIGATION.flatMap(({ id, href }) => {
    const isAnalysis = id === "analysis";
    if (isAnalysis && !pathname.startsWith("/analysis")) return [];
    const isCurrent =
      href === "/" ? pathname === "/" : pathname.startsWith(href);
    return [{ id, href: isAnalysis ? pathname : href, isCurrent }];
  });
}
