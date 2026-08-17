import Media from "@/components/Media";
import { info, site } from "@/data/content";

export default function InfoPage() {
  return (
    <div className="h-full overflow-y-auto px-6 pt-20 pb-16 md:px-10 md:pt-20 md:pb-10">
      <div className="grid max-w-5xl gap-8 pb-20 md:grid-cols-2 md:gap-12">
        <Media
          src={info.portrait}
          alt="Portrait of Taha Malak"
          className="aspect-square w-full md:sticky md:top-20 md:self-start"
        />

        <div className="flex flex-col gap-5 text-[15px] leading-relaxed">
          {info.bio.map((paragraph) => (
            <p key={paragraph.slice(0, 24)}>{paragraph}</p>
          ))}

          <div>
            <p className="text-muted">Selected clients</p>
            <p className="mt-1">{info.clients.join(", ")}</p>
          </div>

          <p>
            For all inquiries email{" "}
            <a href={`mailto:${site.email}`} className="underline underline-offset-2">
              {site.email}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
