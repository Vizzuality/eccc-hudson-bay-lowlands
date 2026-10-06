"use client";

import { useTranslations } from "next-intl";
import { useId } from "react";
import { useIsMobileDataViewOpen } from "@/app/[locale]/url-store";
import { PAGE_BACKGROUND } from "@/containers/map-layout/constants";
import Main from "@/containers/map-sidebar/main";
import { useCategories } from "@/hooks/use-categories";

function MobileDataHeader({ id }: Readonly<{ id: string }>) {
  const t = useTranslations("map");
  const { totalLayerCount } = useCategories();

  return (
    <header className="min-w-0 px-6 pt-4">
      <h1 id={id} className="text-xl">
        {t("mobile-title", { count: totalLayerCount })}
      </h1>
    </header>
  );
}

export default function MobileDataView() {
  const headingId = useId();
  const isOpen = useIsMobileDataViewOpen();

  if (!isOpen) return null;

  return (
    <section
      aria-labelledby={headingId}
      className="absolute inset-0 flex min-h-0 flex-col lg:hidden"
      style={PAGE_BACKGROUND}
    >
      <Main header={<MobileDataHeader id={headingId} />} />
    </section>
  );
}
