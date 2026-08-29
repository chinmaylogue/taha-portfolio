import Media from "@/components/Media";
import ContactForm from "@/components/ContactForm";
import { info, site } from "@/data/content";

export default function InfoPage() {
  return (
    <>
      <div className="h-full overflow-y-auto px-6 pt-20 pb-16 text-white md:px-10 md:pt-36 md:pb-10">
        <div className="flex flex-wrap gap-16 pb-20">
          <div className="flex w-72 flex-col gap-5">
            <Media src={info.portrait} alt="Portrait of Taha Malak" className="aspect-square w-72" />

            <div className="flex flex-col gap-5 text-[13px] leading-relaxed">
              {info.bio.map((paragraph) => (
                <p key={paragraph.slice(0, 24)}>{paragraph}</p>
              ))}
            </div>
          </div>

          <div className="flex w-72 flex-col gap-5">
            <ContactForm />

            <p className="text-[13px] leading-relaxed">
              For all inquiries email{" "}
              <a href={`mailto:${site.email}`} className="underline underline-offset-2">
                {site.email}
              </a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
