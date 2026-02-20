import { DataSet } from "@/app/[locale]/url-store";

const datasetLabels = {
  [DataSet.all]: "All",
  [DataSet.indigenousValue]: "Indigenous Value",
  [DataSet.environment]: "Environment",
  [DataSet.humanResources]: "Human Resources",
};

export const DATASETS = Object.values(DataSet).map((dataset) => ({
  id: dataset,
  name: datasetLabels[dataset],
}));
