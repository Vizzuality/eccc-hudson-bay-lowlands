import { useRouter } from "next/navigation";
import { useMobileMenuParam } from "@/app/[locale]/url-store";
import { useIsMobile } from "@/hooks/use-is-mobile";

let openedHere = false;

export function forgetMenuEntry() {
  openedHere = false;
}

export function useMobileMenu() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const { isMenuOpen, setIsMenuOpen } = useMobileMenuParam();

  const open = () => {
    openedHere = true;
    setIsMenuOpen(true);
  };

  const close = () => {
    const isEntryPushed = new URLSearchParams(window.location.search).has(
      "menu",
    );
    if (openedHere && isEntryPushed) {
      openedHere = false;
      router.back();
      return;
    }
    setIsMenuOpen(null, { history: "replace" });
  };

  const closeInPlace = () => {
    openedHere = false;
    setIsMenuOpen(null, { history: "replace" });
  };

  return {
    isOpen: isMenuOpen && isMobile,
    open,
    close,
    closeInPlace,
  };
}
