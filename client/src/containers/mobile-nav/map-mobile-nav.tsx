"use client";
import { LayersIcon, MapIcon, PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  MapStatus,
  MobileView,
  useMapStatus,
  useMobileView,
} from "@/app/[locale]/url-store";
import {
  ANALYSIS_CTA_TRANSITION_NAME,
  MobileNav,
} from "@/containers/mobile-nav";
import { withViewTransition } from "@/lib/view-transition";

export function MapMobileNav() {
  const t = useTranslations("mobile-nav");
  const { mapStatus, setMapStatus } = useMapStatus();
  const { mobileView, setMobileView } = useMobileView();

  if (mapStatus !== MapStatus.default) return null;

  return (
    <MobileNav
      label={t("label")}
      items={[
        {
          id: "map",
          label: t("map"),
          icon: MapIcon,
          current: mobileView === null,
          onClick: () => setMobileView(null),
        },
        {
          id: "data",
          label: t("data"),
          icon: LayersIcon,
          current: mobileView === MobileView.data,
          onClick: () => setMobileView(MobileView.data),
        },
      ]}
      trailingAction={{
        label: t("analysis"),
        icon: PlusIcon,
        transitionName: ANALYSIS_CTA_TRANSITION_NAME,
        onClick: () =>
          withViewTransition(() => {
            setMobileView(null);
            setMapStatus(MapStatus.upload);
          }),
      }}
    />
  );
}
