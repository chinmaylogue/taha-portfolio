import Gallery from "@/components/Gallery";
import { getContent } from "@/lib/cms/store";

export default async function WorkPage() {
  const { work } = await getContent();
  return (
    <div className="h-full">
      <Gallery items={work} />
    </div>
  );
}
