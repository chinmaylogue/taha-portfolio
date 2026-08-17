import Gallery from "@/components/Gallery";
import { work } from "@/data/content";

export default function WorkPage() {
  return (
    <div className="h-full">
      <Gallery items={work} />
    </div>
  );
}
