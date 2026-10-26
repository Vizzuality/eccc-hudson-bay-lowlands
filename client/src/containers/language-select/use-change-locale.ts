import { useParams, useSearchParams } from "next/navigation";
import type { Locale } from "next-intl";
import { useTransition } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";

export function useChangeLocale() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const searchParams = useSearchParams();

  const [isPending, startTransition] = useTransition();
  const changeLocale = (value: Locale) => {
    startTransition(() => {
      router.replace(
        {
          pathname,
          // @ts-expect-error -- next-intl types params per pathname; the current route's params always match it
          params,
          query: Object.fromEntries(searchParams.entries()),
        },
        { locale: value },
      );
    });
  };

  return { changeLocale, isPending };
}
