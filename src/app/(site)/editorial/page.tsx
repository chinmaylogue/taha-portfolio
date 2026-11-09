import Gallery from "@/components/Gallery";
import { getContent } from "@/lib/cms/store";

export default async function EditorialPage() {
  const { editorial } = await getContent();
  return (
    <div className="h-full">
      <Gallery items={editorial} />
    </div>
  );
}
