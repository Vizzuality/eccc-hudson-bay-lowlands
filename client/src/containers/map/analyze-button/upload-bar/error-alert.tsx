import { CircleAlertIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Alert, AlertDescription } from "@/components/ui/alert";
import RichText from "@/components/ui/rich-text";
import { MAX_AREA_KM2 } from "@/containers/map/analyze-button/upload-bar/constants";
import type { UploadBarError } from "./types";

export const UploadErrorAlert = ({ error }: { error: UploadBarError }) => {
  const t = useTranslations("analysis");

  return (
    <Alert className="right-0 bg-red-100 text-red-600" variant="destructive">
      <CircleAlertIcon aria-hidden />
      <AlertDescription className="text-red-600 text-sm font-medium leading-5">
        <RichText>
          {(tags) => t.rich(error, { ...tags, maxArea: MAX_AREA_KM2 })}
        </RichText>
      </AlertDescription>
    </Alert>
  );
};
