import ContactForm from "@/components/ContactForm";
import { site } from "@/data/content";

export default function ContactPage() {
  return (
    <div className="h-full overflow-y-auto px-6 pt-20 pb-16 md:px-10 md:pt-20 md:pb-10">
      <div className="max-w-md pb-20">
        <h1 className="text-sm text-muted">Contact</h1>
        <p className="mt-4 text-[15px] leading-relaxed">
          Available for editorial, commercial, and music commissions worldwide. For direct inquiries
          email{" "}
          <a href={`mailto:${site.email}`} className="underline underline-offset-2">
            {site.email}
          </a>
          .
        </p>

        <ContactForm />
      </div>
    </div>
  );
}
