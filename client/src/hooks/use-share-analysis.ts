import { useMutation } from "@tanstack/react-query";
import { useLocale } from "next-intl";
import { useCallback } from "react";
import { useAnalysisShare } from "@/containers/analysis/analysis-context";
import useAnalysisSettings, {
  useAnalysisResult,
} from "@/hooks/use-analysis-settings";
import { API } from "@/lib/api";
import { shareAnalysisConfig } from "@/lib/api/config";

export function useShareAnalysis() {
  const {
    createdAt,
    setCreatedAt,
    shareUrl,
    setShareUrl,
    shareDialogOpen,
    setShareDialogOpen,
  } = useAnalysisShare();
  const analysisResult = useAnalysisResult();
  const [{ geometry }] = useAnalysisSettings();
  const locale = useLocale();

  const { mutate, isPending } = useMutation({
    mutationFn: () => {
      if (!analysisResult || !geometry) throw new Error("Missing data");
      return API<{ id: string }>(shareAnalysisConfig(analysisResult, geometry));
    },
    onSuccess: (data) => {
      const url = `${window.location.origin}/${locale}/analysis/${data.id}`;
      setShareUrl(url);
      setCreatedAt(new Date().toISOString());
      setShareDialogOpen(true);
    },
  });

  const triggerShare = useCallback(() => {
    if (shareUrl) {
      setShareDialogOpen(true);
      return;
    }
    mutate();
  }, [shareUrl, setShareDialogOpen, mutate]);

  return {
    triggerShare,
    isPending,
    createdAt,
    shareUrl,
    shareDialogOpen,
    setShareDialogOpen,
  };
}
