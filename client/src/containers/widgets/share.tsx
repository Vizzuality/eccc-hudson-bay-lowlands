import { Share2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const ShareWidget = () => {
  const t = useTranslations("widgets.share");
  return (
    <Card>
      <CardContent className="flex items-center gap-6">
        <div>Icon</div>
        <div className="space-y-2">
          <p className="text-sm">{t("description")}</p>
          <Button variant="ghost" className="px-0!">
            <Share2Icon />
            {t("title")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ShareWidget;
