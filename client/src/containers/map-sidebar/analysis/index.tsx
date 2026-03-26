import { XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import RichText from "@/components/ui/rich-text";
import CloseDialog from "@/containers/map-sidebar/analysis/close-dialog";
import ShareButton from "@/containers/share-button";
import { WIDGETS } from "@/containers/widgets/constants";
import ShareWidget from "@/containers/widgets/share";

const Analysis = () => {
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const t = useTranslations("analysis");

  return (
    <>
      <header className="min-w-0 space-y-4 mb-4">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-4xl font-normal leading-10">{t("title")}</h1>
          <ShareButton size="xl" className="font-bold" />
          <Button
            variant="secondary"
            size="icon"
            className="size-14"
            onClick={() => setShowCloseDialog(true)}
            aria-label="Leave analysis"
          >
            <XIcon />
          </Button>
        </div>
        <RichText className="text-muted-foreground text-sm">
          {(tags) =>
            t.rich("description", {
              ...tags,
              aoi_size: 100,
            })
          }
        </RichText>
      </header>
      <section className="space-y-4">
        {WIDGETS.map((widget) => (
          <widget.component key={widget.id} />
        ))}
        <ShareWidget />
      </section>
      <CloseDialog open={showCloseDialog} onOpenChange={setShowCloseDialog} />
    </>
  );
};

export default Analysis;
