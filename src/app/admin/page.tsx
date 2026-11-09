import { requireAdminPage } from "@/lib/cms/auth";
import { getContent, isReadOnly, storageMode } from "@/lib/cms/store";
import Editor from "./_components/Editor";

export default async function AdminPage() {
  await requireAdminPage();
  const content = await getContent();
  return <Editor initial={content} storage={storageMode()} readOnly={isReadOnly()} />;
}
