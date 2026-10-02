"use client";
import { LayersIcon, MapIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  MapStatus,
  MobileView,
  useMapStatus,
  useMobileView,
} from "@/app/[locale]/url-store";
import { MobileNav } from "@/containers/mobile-nav";

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
        {
          id: "analysis",
          label: t("analysis"),
          cta: true,
          onClick: () => {
            setMobileView(null);
            setMapStatus(MapStatus.upload);
          },
        },
      ]}
    />
  );
}
