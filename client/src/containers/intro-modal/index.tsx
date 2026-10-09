"use client";

import dayjs from "dayjs";
import { useAtom } from "jotai";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import RichText from "@/components/ui/rich-text";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { COOKIE_NAME, EXPIRY_DAYS } from "./constants";
import { introDismissedAtom } from "./store";

const IntroModal = () => {
  const t = useTranslations();
  const isMobile = useIsMobile();
  const [dismissed, setDismissed] = useAtom(introDismissedAtom);

  const handleOpenChange = (open: boolean) => {
    if (open) return;
    void cookieStore.set({
      name: COOKIE_NAME,
      value: "1",
      path: "/",
      expires: dayjs().add(EXPIRY_DAYS, "day").valueOf(),
      sameSite: "lax",
    });
    setDismissed(true);
  };

  return (
    <Dialog open={isMobile && !dismissed} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        overlayClassName="bg-black/25 backdrop-blur-xs"
        className="max-w-[calc(100%-3.25rem)] gap-7 rounded-3xl border-background p-6 shadow-lg"
      >
        <DialogHeader className="gap-2 text-left">
          <DialogTitle className="text-2xl leading-8 font-extrabold text-foreground">
            {t("map.title")}
          </DialogTitle>
          <DialogDescription
            className="space-y-6 text-base leading-6 font-medium"
            asChild
          >
            <div>
              <p>{t("map.description")}</p>
              <RichText>
                {(tags) => t.rich("intro-modal.heads-up", tags)}
              </RichText>
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-row justify-center sm:justify-center">
          <DialogClose asChild>
            <Button className="text-xs font-bold">
              {t("intro-modal.dismiss")}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default IntroModal;
