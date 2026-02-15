import { MapStatus, useMapStatus } from "@/app/[locale]/url-store";
import { Popover } from "@/components/ui/popover";
import { Tooltip } from "@/components/ui/tooltip";
import MainButton from "@/containers/map/analyze-button/main-button";
import UploadBar from "@/containers/map/analyze-button/upload-bar";

const AnalyzeButton = () => {
	const { mapStatus, setMapStatus } = useMapStatus();
	const popoverOpen = mapStatus === MapStatus.upload;

	return (
		<div className="absolute top-4 left-4">
			<Popover
				open={popoverOpen}
				onOpenChange={(open) => {
					console.log(open);
					if (mapStatus === MapStatus.analysis) return;
					setMapStatus(open ? MapStatus.upload : MapStatus.default);
				}}
			>
				<Tooltip>
					<MainButton />

					<UploadBar />
				</Tooltip>
			</Popover>
		</div>
	);
};

export default AnalyzeButton;
