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
import { useApiTranslation } from "@/i18n/api-translation";
import type { Dataset, NormalizedDataset } from "@/types";

type DatasetDialogDataset = Dataset | NormalizedDataset;

function resolveField(
  field: string | Record<string, string>,
  getTranslation: (field: Record<string, string>) => string,
): string {
  return typeof field === "string" ? field : getTranslation(field);
}

const DatasetDialog = ({
  open,
  onOpenChange,
  dataset,
  icon,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dataset: DatasetDialogDataset | null;
  icon?: React.ReactNode;
}) => {
  const t = useTranslations("dataset-dialog");
  const { getTranslation } = useApiTranslation();

  const title = dataset
    ? resolveField(dataset.metadata.title, getTranslation)
    : undefined;
  const description = dataset
    ? resolveField(dataset.metadata.description, getTranslation)
    : undefined;
  const source = dataset
    ? resolveField(dataset.metadata.source, getTranslation)
    : undefined;
  const citation = dataset
    ? resolveField(dataset.metadata.citation, getTranslation)
    : undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-6">
        <DialogHeader className="gap-6">
          {icon ?? <HandHeartIcon />}
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {source && (
            <div>
              <h3 className="text-2xs font-bold uppercase">{t("source")}</h3>
              <p className="text-xs text-muted-foreground">
                {/^https?:\/\//.test(source) ? (
                  <a
                    href={source}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-foreground"
                  >
                    {source}
                  </a>
                ) : (
                  source
                )}
              </p>
            </div>
          )}
          {citation && (
            <div>
              <h3 className="text-2xs font-bold uppercase">{t("citation")}</h3>
              <p className="text-xs text-muted-foreground">{citation}</p>
            </div>
          )}
        </div>
        <DialogFooter className="sm:justify-center">
          <Button onClick={() => onOpenChange(false)}>{t("ok")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DatasetDialog;
