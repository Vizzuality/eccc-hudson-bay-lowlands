import { PlusIcon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { FC } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { DataLayer } from "@/types";

export interface DataLayersListItemProps extends DataLayer {
	isSelected: boolean;
	onChange: (id: string, isSelected: boolean) => void;
	onLearnMore: () => void;
}

const DataLayersListItem: FC<DataLayersListItemProps> = ({
	id,
	title,
	description,
	isSelected,
	onChange,
	onLearnMore,
}) => {
	const t = useTranslations("data-layers");
	return (
		<article className="relative group block **:transition-all **:duration-200 **:ease-out">
			<label
				htmlFor={id}
				className={cn({
					"absolute right-5 top-5 z-10": true,
					"size-8 rounded-full flex items-center justify-center hover:bg-secondary group-hover:text-accent cursor-pointer": true,
					"bg-primary text-primary-foreground group-hover:bg-primary hover:bg-primary":
						isSelected,
				})}
			>
				<input
					type="checkbox"
					id={id}
					className="sr-only"
					aria-label={title}
					checked={isSelected}
					onChange={() => onChange(id, !isSelected)}
				/>
				{isSelected ? (
					<XIcon className="size-4" aria-hidden />
				) : (
					<PlusIcon className="size-4" aria-hidden />
				)}
			</label>
			<div className="px-5 pt-5 pb-4 space-y-2 group-hover:translate-x-2">
				<h2 className="text-sm font-semibold">{title}</h2>

				<p className="text-xs text-muted-foreground font-medium">
					{description}
				</p>
				<Button type="button" variant="link" onClick={onLearnMore}>
					{t("item.learn-more")}
				</Button>
			</div>
			<div className="px-5">
				<Separator className="bg-linear-to-l from-primary/20 to-secondary/30 group-hover:bg-[linear-gradient(90deg,#10B981_0%,rgba(230,244,241,0.30)_100%)]" />
			</div>
		</article>
	);
};

export default DataLayersListItem;
