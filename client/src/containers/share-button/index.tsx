import { Share2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { FC } from "react";
import { Button } from "@/components/ui/button";

interface ShareButtonProps {
  className?: string;
  size?: "default" | "xl" | "lg" | "sm" | "xs";
}
const ShareButton: FC<ShareButtonProps> = ({ className, size = "default" }) => {
  const t = useTranslations("share");

  return (
    <Button
      variant="ghost"
      size={size}
      className={className}
      aria-label={t("title")}
    >
      <Share2Icon />
      <span>{t("title")}</span>
    </Button>
  );
};

export default ShareButton;
