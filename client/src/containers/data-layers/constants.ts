import { Category } from "@/app/[locale]/url-store";

const categoryLabels = {
  [Category.all]: "All",
  [Category.indigenousValue]: "Indigenous Value",
  [Category.environment]: "Environment",
  [Category.humanResources]: "Human Resources",
};

export const CATEGORIES = Object.values(Category).map((category) => ({
  id: category,
  name: categoryLabels[category],
}));
