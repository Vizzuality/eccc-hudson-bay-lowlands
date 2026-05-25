import { UploadIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { RefObject } from "react";
import { Button } from "@/components/ui/button";
import RichText from "@/components/ui/rich-text";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MAX_AREA_KM2 } from "@/containers/map/analyze-button/upload-bar/constants";
import { UploadErrorAlert } from "./error-alert";
import type { UploadBarError } from "./types";

interface UploadInstructionsProps {
  error: UploadBarError | null;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const UploadInstructions = ({
  error,
  fileInputRef,
  onFileChange,
}: UploadInstructionsProps) => {
  const t = useTranslations("analysis");

  return (
    <>
      <RichText>{(tags) => t.rich("instructions", { ...tags })}</RichText>
      <input
        ref={fileInputRef}
        type="file"
        accept=".geojson,.json,.zip"
        className="hidden"
        onChange={onFileChange}
      />
      <Button
        type="button"
        variant="secondary"
        size="lg"
        onClick={() => fileInputRef.current?.click()}
      >
        <UploadIcon />
        <span>{t("upload-file")}</span>
      </Button>
      <Tooltip>
        <TooltipTrigger asChild>
          <p className="text-xs font-medium leading-5 underline decoration-dashed text-left cursor-help">
            {t("file-upload-instructions.title")}
          </p>
        </TooltipTrigger>
        <TooltipContent
          side="bottom"
          className="w-[350px] shadow-lg border text-sm font-medium leading-5 p-6"
        >
          {t("file-upload-instructions.description", { maxArea: MAX_AREA_KM2 })}
        </TooltipContent>
      </Tooltip>
      {error && <UploadErrorAlert error={error} />}
    </>
  );
};
