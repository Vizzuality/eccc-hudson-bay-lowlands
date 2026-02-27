import { HandHeartIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { NormalizedDataset } from "@/types";

const DataLayersListItemDialog = ({
  open,
  onOpenChange,
  dataset,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dataset: NormalizedDataset | null;
}) => {
  const t = useTranslations("data-layers.item-dialog");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-6">
        <DialogHeader className="gap-6">
          <HandHeartIcon />
          <DialogTitle>{dataset?.metadata.title}</DialogTitle>
          <DialogDescription>{dataset?.metadata.description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <h3 className="text-2xs font-bold uppercase">{t("source")}</h3>
            <p className="text-xs text-muted-foreground">
              {dataset?.metadata.source}
            </p>
          </div>
          <div>
            <h3 className="text-2xs font-bold uppercase">{t("citation")}</h3>
            <p className="text-xs text-muted-foreground">
              {dataset?.metadata.citation}
            </p>
          </div>
        </div>
        <DialogFooter className="sm:justify-center">
          <Button onClick={() => onOpenChange(false)}>{t("ok")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DataLayersListItemDialog;
