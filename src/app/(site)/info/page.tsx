import Media from "@/components/Media";
import ContactForm from "@/components/ContactForm";
import { getContent } from "@/lib/cms/store";

export default async function InfoPage() {
  const { info, site } = await getContent();

  return (
    <>
      <div className="h-full overflow-y-auto px-6 pt-20 pb-16 text-white md:px-10 md:pt-36 md:pb-10">
        <div className="flex flex-wrap gap-16 pb-20">
          <div className="flex w-72 flex-col gap-5">
            {info.portrait && (
              <Media src={info.portrait} alt={`Portrait of ${site.name}`} className="aspect-square w-72" />
            )}

            <div className="flex flex-col gap-5 text-[13px] leading-relaxed">
              {info.bio.map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
          </div>

          <div className="flex w-72 flex-col gap-5">
            {site.email && (
              <>
                <ContactForm email={site.email} />

                <p className="text-[13px] leading-relaxed">
                  For all inquiries email{" "}
                  <a href={`mailto:${site.email}`} className="underline underline-offset-2">
                    {site.email}
                  </a>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
