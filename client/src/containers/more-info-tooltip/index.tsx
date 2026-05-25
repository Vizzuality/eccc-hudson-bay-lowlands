import { CircleQuestionMarkIcon } from "lucide-react";
import type { FC, PropsWithChildren } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MoreInfoTooltipProps extends PropsWithChildren {
  title: string;
}

const MoreInfoTooltip: FC<MoreInfoTooltipProps> = ({ title, children }) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          data-download-exclude
          type="button"
          className="flex items-start gap-1 text-muted-foreground cursor-help"
        >
          <CircleQuestionMarkIcon className="size-4 shrink-0 mt-1" />
          <p className="text-xs font-medium leading-5 underline decoration-dashed text-left">
            {title}
          </p>
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="bottom"
        className="w-[350px] shadow-lg border text-sm font-medium leading-5 p-6"
      >
        {children}
      </TooltipContent>
    </Tooltip>
  );
};

export default MoreInfoTooltip;
