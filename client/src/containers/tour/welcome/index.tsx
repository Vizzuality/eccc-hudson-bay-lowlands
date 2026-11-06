"use client";

import dayjs from "dayjs";
import { useAtom } from "jotai";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useMapTour } from "@/containers/tour/use-map-tour";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { cn } from "@/lib/utils";
import { COOKIE_NAME, EXPIRY_DAYS } from "./constants";
import { welcomeDismissedAtom } from "./store";

type FeatureId = "explore-data" | "choose-area" | "get-analysis";

interface Feature {
  id: FeatureId;
  src: string;
  width: number;
  height: number;
  imageClassName: string;
}

const FEATURES: Feature[] = [
  {
    id: "explore-data",
    src: "/images/welcome-explore-data.webp",
    width: 600,
    height: 457,
    imageClassName: "size-full object-cover",
  },
  {
    id: "choose-area",
    src: "/images/welcome-choose-area.webp",
    width: 600,
    height: 457,
    imageClassName: "size-full object-cover",
  },
  {
    id: "get-analysis",
    src: "/images/welcome-get-analysis.webp",
    width: 720,
    height: 561,
    imageClassName: "absolute top-1.5 left-0 h-auto w-[120%] max-w-none",
  },
];

const EYEBROW_CLASS =
  "text-xs leading-4 font-bold tracking-[1.2px] text-emerald-700 uppercase";
const TITLE_CLASS = "text-2xl leading-8 font-extrabold text-foreground";
const DESCRIPTION_CLASS =
  "text-base leading-6 font-medium text-muted-foreground";
const FEATURE_TEXT_CLASS =
  "text-sm leading-5 font-medium text-muted-foreground";

function FeaturePreview({
  feature,
  className,
}: {
  feature: Feature;
  className: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-slate-200 bg-slate-100",
        className,
      )}
    >
      <Image
        src={feature.src}
        alt=""
        width={feature.width}
        height={feature.height}
        sizes="(width < 64rem) 104px, 240px"
        className={feature.imageClassName}
      />
    </div>
  );
}

function FeatureHeading({ number, label }: { number: number; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <span
        aria-hidden
        className="flex size-6 shrink-0 items-center justify-center rounded-full bg-accent text-xs leading-5 font-bold tracking-[1px] text-accent-foreground"
      >
        {number}
      </span>
      <h3 className="text-sm leading-5 font-semibold text-foreground">
        {label}
      </h3>
    </div>
  );
}

export default function Welcome() {
  const t = useTranslations("tour.welcome");
  const isMobile = useIsMobile();
  const [dismissed, setDismissed] = useAtom(welcomeDismissedAtom);
  const { start } = useMapTour();

  const dismiss = () => {
    void cookieStore.set({
      name: COOKIE_NAME,
      value: "1",
      path: "/",
      expires: dayjs().add(EXPIRY_DAYS, "day").valueOf(),
      sameSite: "lax",
    });
    setDismissed(true);
  };

  const startTour = () => {
    dismiss();
    start();
  };

  const onOpenChange = (open: boolean) => {
    if (!open) dismiss();
  };

  if (isMobile) {
    return (
      <Drawer open={!dismissed} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[calc(100dvh-4rem)] gap-6 rounded-t-3xl border-t-0 px-6 pt-3 pb-8">
          <div className="flex flex-col gap-6 overflow-y-auto">
            <div className="flex flex-col gap-2">
              <p className={EYEBROW_CLASS}>{t("eyebrow")}</p>
              <DrawerTitle className={TITLE_CLASS}>{t("title")}</DrawerTitle>
              <DrawerDescription className={DESCRIPTION_CLASS}>
                {t("description")}
              </DrawerDescription>
            </div>
            <ol className="flex flex-col gap-4">
              {FEATURES.map((feature, i) => (
                <li key={feature.id} className="flex items-center gap-3">
                  <FeaturePreview
                    feature={feature}
                    className="h-16 w-22 shrink-0"
                  />
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <FeatureHeading
                      number={i + 1}
                      label={t(`features.${feature.id}.title`)}
                    />
                    <p className={FEATURE_TEXT_CLASS}>
                      {t(`features.${feature.id}.mobile-description`)}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <div className="flex flex-col gap-1">
            <Button className="w-full text-xs font-bold" onClick={startTour}>
              {t("start")}
            </Button>
            <Button
              variant="ghost"
              className="w-full text-xs font-bold"
              onClick={dismiss}
            >
              {t("skip")}
            </Button>
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={!dismissed} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        overlayClassName="bg-slate-950/60"
        onCloseAutoFocus={(event) => event.preventDefault()}
        className="max-h-[calc(100dvh-2rem)] gap-8 overflow-y-auto rounded-3xl border-0 bg-card p-8 shadow-[0_10px_16px_rgb(41_77_164/0.1)] sm:max-w-[680px]"
      >
        <div className="flex flex-col gap-2">
          <p className={EYEBROW_CLASS}>{t("eyebrow")}</p>
          <DialogTitle className={TITLE_CLASS}>{t("title")}</DialogTitle>
          <DialogDescription className={DESCRIPTION_CLASS}>
            {t("description")}
          </DialogDescription>
        </div>
        <ol className="grid grid-cols-3 gap-4">
          {FEATURES.map((feature, i) => (
            <li key={feature.id} className="flex flex-col gap-3">
              <FeaturePreview feature={feature} className="h-37 w-full" />
              <FeatureHeading
                number={i + 1}
                label={t(`features.${feature.id}.title`)}
              />
              <p className={FEATURE_TEXT_CLASS}>
                {t(`features.${feature.id}.description`)}
              </p>
            </li>
          ))}
        </ol>
        <div className="flex items-center justify-between gap-4">
          <p className={FEATURE_TEXT_CLASS}>{t("duration")}</p>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              className="text-xs font-bold"
              onClick={dismiss}
            >
              {t("skip")}
            </Button>
            <Button className="text-xs font-bold" onClick={startTour}>
              {t("start")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
