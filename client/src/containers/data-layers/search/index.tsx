import { Search } from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";

const DataLayersSearch = () => {
  return (
    <InputGroup className="bg-white/80 rounded-full p-4 h-12 sticky top-4 z-20">
      <InputGroupInput placeholder="Search..." />
      <InputGroupAddon>
        <Search />
      </InputGroupAddon>
    </InputGroup>
  );
};

export default DataLayersSearch;
