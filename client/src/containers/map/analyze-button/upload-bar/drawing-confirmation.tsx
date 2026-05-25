import { CheckIcon, LoaderCircleIcon, TrashIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import RichText from "@/components/ui/rich-text";
import { MAX_AREA_KM2 } from "@/containers/map/analyze-button/upload-bar/constants";
import { UploadErrorAlert } from "./error-alert";
import type { UploadBarError } from "./types";

interface DrawingConfirmationProps {
  isPending: boolean;
  locationType: "draw" | "upload";
  fileName: string | null;
  error: UploadBarError | null;
  hasGeometry: boolean;
  onClear: () => void;
  onConfirm: () => void;
}

export const DrawingConfirmation = ({
  isPending,
  locationType,
  fileName,
  error,
  hasGeometry,
  onClear,
  onConfirm,
}: DrawingConfirmationProps) => {
  return (
    <>
      <DrawingContent
        isPending={isPending}
        locationType={locationType}
        fileName={fileName}
        error={error}
        onClear={onClear}
      />
      {error && <UploadErrorAlert error={error} />}
      <ActionButtons
        isPending={isPending}
        hasGeometry={hasGeometry}
        hasError={!!error}
        onClear={onClear}
        onConfirm={onConfirm}
      />
    </>
  );
};

function DrawingContent({
  isPending,
  locationType,
  fileName,
  error,
  onClear,
}: Pick<
  DrawingConfirmationProps,
  "isPending" | "locationType" | "fileName" | "error" | "onClear"
>) {
  const t = useTranslations("analysis");

  if (isPending) {
    return (
      <div className="flex items-center gap-2 text-sm font-medium leading-5">
        <LoaderCircleIcon className="size-4 animate-spin" aria-hidden />
        <span>{t("analyzing")}</span>
      </div>
    );
  }

  if (locationType === "draw") {
    return <RichText>{(tags) => t.rich("verify-shape", { ...tags })}</RichText>;
  }

  return (
    <div className="space-y-4">
      {error ? (
        <p>
          {t("file-upload-instructions.description", {
            maxArea: MAX_AREA_KM2,
          })}
        </p>
      ) : (
        <RichText>{(tags) => t.rich("upload-success", { ...tags })}</RichText>
      )}
      <Field>
        <InputGroup>
          <InputGroupInput
            id="input-group-file-name"
            className="text-sm text-foreground font-medium leading-5 font-sans"
            value={fileName ?? ""}
            readOnly
          />
          <InputGroupAddon
            align="inline-end"
            className="m-0 py-0"
            onClick={onClear}
          >
            <Button
              variant="ghost"
              size="icon-xs"
              className="text-foreground hover:bg-accent"
            >
              <TrashIcon />
            </Button>
          </InputGroupAddon>
        </InputGroup>
      </Field>
    </div>
  );
}

function ActionButtons({
  isPending,
  hasGeometry,
  hasError,
  onClear,
  onConfirm,
}: {
  isPending: boolean;
  hasGeometry: boolean;
  hasError: boolean;
  onClear: () => void;
  onConfirm: () => void;
}) {
  const t = useTranslations("analysis");

  return (
    <div className="flex gap-2">
      <Button
        type="button"
        variant="secondary"
        className="flex-1 font-normal lowercase first-letter:uppercase tracking-normal"
        disabled={isPending}
        onClick={onClear}
      >
        <TrashIcon />
        <span>{t("clear")}</span>
      </Button>
      <Button
        className="flex-1 font-normal tracking-normal"
        onClick={onConfirm}
        disabled={hasError || !hasGeometry || isPending}
      >
        <CheckIcon />
        <span className="lowercase first-letter:uppercase">{t("confirm")}</span>
      </Button>
    </div>
  );
}
