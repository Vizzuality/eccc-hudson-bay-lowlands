import { useRouter } from "next/navigation";
import type { FC } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

const CloseDialog: FC<{
	open: boolean;
	onOpenChange: (open: boolean) => void;
}> = ({ open, onOpenChange }) => {
	const router = useRouter();
	const handleClearAndGoBack = () => {
		router.push("/");
		onOpenChange(false);
	};
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent showCloseButton={false}>
				<DialogHeader>
					<DialogTitle>Leave current analysis?</DialogTitle>
					<DialogDescription className="space-y-4">
						<p>
							Going back will clear your current analysis and return you to the
							default view.
						</p>
						<p>
							If you want to come back to this analysis later, you can save it
							by copying the URL before leaving.
						</p>
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button variant="ghost" onClick={() => onOpenChange(false)}>
						Cancel
					</Button>
					<Button onClick={handleClearAndGoBack}>Clear & go back</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default CloseDialog;
