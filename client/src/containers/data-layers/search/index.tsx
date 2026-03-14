import { Search, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useDataLayersSearch } from "@/app/[locale]/url-store";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";

const DataLayersSearch = () => {
  const t = useTranslations("data-layers");
  const { dataLayersSearch, setDataLayersSearch } = useDataLayersSearch();
  const [search, setSearch] = useState(dataLayersSearch);
  const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setDataLayersSearch(search);
  };
  const handleReset = () => {
    setSearch("");
    setDataLayersSearch("");
  };

  return (
    <form onSubmit={handleSubmit}>
      <InputGroup className="bg-white/80 rounded-full p-4 h-12 sticky top-4 z-20">
        <InputGroupInput
          placeholder={t("search.placeholder")}
          value={search ?? ""}
          onChange={(e) => {
            const value = e.target.value;
            setSearch(value);
            if (value === "") setDataLayersSearch("");
          }}
        />
        {(search ?? "") !== "" && (
          <InputGroupAddon align="inline-end">
            <InputGroupButton
              type="button"
              size="icon-xs"
              onClick={handleReset}
              aria-label={t("search.clear")}
            >
              <XIcon className="size-4" />
            </InputGroupButton>
          </InputGroupAddon>
        )}
        <InputGroupAddon>
          <Search />
        </InputGroupAddon>
      </InputGroup>
    </form>
  );
};

export default DataLayersSearch;
