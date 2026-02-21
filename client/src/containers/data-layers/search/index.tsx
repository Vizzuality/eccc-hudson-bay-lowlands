import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";

const DataLayersSearch = () => {
  const t = useTranslations("data-layers");
  return (
    <InputGroup className="bg-white/80 rounded-full p-4 h-12 sticky top-4 z-20">
      <InputGroupInput placeholder={t("search.placeholder")} />
      <InputGroupAddon>
        <Search />
      </InputGroupAddon>
    </InputGroup>
  );
};

export default DataLayersSearch;
