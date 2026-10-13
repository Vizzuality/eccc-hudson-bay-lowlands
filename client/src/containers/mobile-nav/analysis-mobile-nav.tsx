"use client";
import { FileChartLineIcon, MapIcon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import {
  MapStatus,
  MobileView,
  useMapStatus,
  useMobileView,
} from "@/app/[locale]/url-store";
import CloseDialog from "@/containers/analysis/close-dialog";
import { MobileNav } from "@/containers/mobile-nav";

export function AnalysisMobileNav() {
  const t = useTranslations("mobile-nav");
  const tAnalysis = useTranslations("analysis");
  const { mapStatus } = useMapStatus();
  const { mobileView, setMobileView } = useMobileView();
  const [showCloseDialog, setShowCloseDialog] = useState(false);

  if (mapStatus !== MapStatus.analysis) return null;

  return (
    <>
      <MobileNav
        label={t("label")}
        items={[
          {
            id: "analysis",
            label: t("analysis"),
            icon: FileChartLineIcon,
            current: mobileView === MobileView.results,
            onClick: () => setMobileView(MobileView.results),
          },
          {
            id: "map",
            label: t("map"),
            icon: MapIcon,
            current: mobileView === null,
            onClick: () => setMobileView(null),
          },
          {
            id: "close",
            label: tAnalysis("leave-aria-label"),
            icon: XIcon,
            cta: true,
            iconOnly: true,
            onClick: () => setShowCloseDialog(true),
          },
        ]}
      />
      <CloseDialog open={showCloseDialog} onOpenChange={setShowCloseDialog} />
    </>
  );
}
