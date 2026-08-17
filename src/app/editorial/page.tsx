import Gallery from "@/components/Gallery";
import { editorial } from "@/data/content";

export default function EditorialPage() {
  return (
    <div className="h-full">
      <Gallery items={editorial} />
    </div>
  );
}
