import { useDataSet } from "@/app/[locale]/url-store";
import { DATASETS } from "@/containers/data-layers/constants";
import { cn } from "@/lib/utils";

const DatasetSelector = () => {
  const { dataSet, setDataSet } = useDataSet();
  return (
    <fieldset className="grid grid-cols-2 gap-2" aria-label="Dataset filter">
      <legend className="sr-only">Select a dataset</legend>
      {DATASETS.map((dataset) => {
        const isActive = dataSet === dataset.id;
        return (
          <label
            key={dataset.id}
            htmlFor={dataset.id}
            className={cn({
              "bg-white/80 rounded-4xl p-6 cursor-pointer flex flex-col gap-2 shadow-lg transition-all": true,
              "border border-transparent select-none": true,
              "hover:bg-[linear-gradient(270deg,var(--accent)_0%,rgba(15,23,43,0)_100%)] hover:bg-blend-color-burn hover:border-accent":
                !isActive,
              "has-focus-visible:ring-2 has-focus-visible:ring-ring has-focus-visible:ring-offset-2": true,
              "bg-primary hover:bg-[linear-gradient(270deg,var(--accent)_0%,rgba(15,23,43,0)_100%)] bg-clip-padding":
                isActive,
            })}
          >
            <input
              type="radio"
              name="dataset"
              value={dataset.id}
              id={dataset.id}
              checked={isActive}
              onChange={() => setDataSet(dataset.id)}
              className="sr-only"
            />
            <span
              className={cn({
                "relative text-sm font-medium": true,
                "text-primary-foreground": isActive,
              })}
            >
              {dataset.name}
            </span>
            <span className="relative text-xs text-muted-foreground font-semibold">
              5 data layers
            </span>
          </label>
        );
      })}
    </fieldset>
  );
};

export default DatasetSelector;
