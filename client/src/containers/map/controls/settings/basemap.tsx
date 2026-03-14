import Image from "next/image";
import { useTranslations } from "next-intl";
import { useMapBasemap } from "@/app/[locale]/url-store";
import { BASEMAPS } from "@/containers/map/constants";
import { cn } from "@/lib/utils";

export const BasemapControl = () => {
  const t = useTranslations("map.controls.basemap");
  const { basemap, setBasemap } = useMapBasemap();

  return (
    <>
      <h3 className="text-xs font-bold uppercase mb-4">{t("title")}</h3>
      <div className="flex gap-4 overflow-hidden">
        {Object.values(BASEMAPS).map((b) => (
          <div key={b.id} className="flex flex-col gap-1 items-center">
            <button
              key={b.id}
              type="button"
              className={cn(
                "relative w-20 h-16 cursor-pointer rounded appearance-none p-0 border-2 border-transparent overflow-hidden",
                {
                  "border-accent": basemap === b.id,
                },
              )}
              onClick={() => setBasemap(b.id)}
            >
              <Image
                fill
                loading="lazy"
                src={b.image}
                alt={b.name}
                sizes="80px"
                className="object-cover"
              />
            </button>
            <p className="text-sm font-medium">{b.name}</p>
          </div>
        ))}
      </div>
    </>
  );
};
