import { XIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import CloseDialog from "@/containers/map-sidebar/analysis/close-dialog";
import { WIDGETS } from "@/containers/widgets/constants";
import ShareWidget from "@/containers/widgets/share";

const Analysis = () => {
  const [showCloseDialog, setShowCloseDialog] = useState(false);

  return (
    <>
      <header className="min-w-0 flex items-center justify-between">
        <h1>My area of interest</h1>
        <Button
          variant="secondary"
          size="icon"
          onClick={() => setShowCloseDialog(true)}
          aria-label="Leave analysis"
        >
          <XIcon />
        </Button>
      </header>
      <CloseDialog open={showCloseDialog} onOpenChange={setShowCloseDialog} />
      {WIDGETS.map((widget) => (
        <widget.component key={widget.id} />
      ))}
      <ShareWidget />
    </>
  );
};

export default Analysis;
