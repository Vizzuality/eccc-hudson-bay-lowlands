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
      <div className="flex overflow-hidden">
        {Object.values(BASEMAPS).map((b) => (
          <button
            key={b.id}
            type="button"
            className={cn(
              "cursor-pointer text-foreground shadow-muted flex appearance-none items-center gap-2 border-0 py-2 pr-4 pl-2",
              {
                "hover:bg-gray-300": basemap !== b.id,
                "bg-blue-500/25": basemap === b.id,
              },
            )}
            onClick={() => setBasemap(b.id)}
          >
            {/* <Image
							loading="lazy"
							src={b.image}
							alt={b.name}
							width={200}
							height={200}
							className="mb-1 h-10 w-10 rounded-full object-cover"
						/> */}

            {b.name}
          </button>
        ))}
      </div>
    </>
  );
};
