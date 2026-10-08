import { MaterialsList } from "@/components/MaterialsList/MaterialsList";
import { sampleMaterials } from "@/lib/materials";

export default function Materials() {
  return <MaterialsList samples={sampleMaterials} />;
}
