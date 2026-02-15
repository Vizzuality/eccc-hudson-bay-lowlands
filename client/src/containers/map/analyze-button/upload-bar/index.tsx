import { CheckIcon, CloudUploadIcon, TrashIcon } from "lucide-react";
import { MapStatus, useMapShape, useMapStatus } from "@/app/[locale]/url-store";
import { Button } from "@/components/ui/button";
import { PopoverContent } from "@/components/ui/popover";

const UploadBar = () => {
	const { mapStatus, setMapStatus } = useMapStatus();
	const { mapShape, setMapShape } = useMapShape();
	let Component = (
		<>
			<p>
				Click on the map to start drawing your custom area or upload your area
				file and get insights about it.
			</p>
			<Button className="w-full" onClick={() => setMapShape(true)}>
				<CloudUploadIcon />
				<span>Upload</span>
			</Button>
		</>
	);

	if (mapShape) {
		Component = (
			<>
				<p>Verify your shape and run the analysis to access the data.</p>
				<div className="flex gap-2">
					<Button
						variant="secondary"
						className="flex-1"
						onClick={() => setMapShape(false)}
					>
						<TrashIcon />
						<span>Clear</span>
					</Button>
					<Button
						className="flex-1"
						onClick={() => setMapStatus(MapStatus.analysis)}
					>
						<CheckIcon />
						<span>Confirm</span>
					</Button>
				</div>
			</>
		);
	}

	return (
		<PopoverContent
			side="bottom"
			align="start"
			className="flex flex-col gap-4 overflow-hidden max-w-[335px] text-sm"
		>
			{Component}
		</PopoverContent>
	);
};

export default UploadBar;
