"use client";

import { useState } from "react";
import { site } from "@/data/content";

export default function ContactForm() {
  const [sent, setSent] = useState(false);

  // No backend yet — hands the message off to the visitor's mail client.
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const subject = `Inquiry from ${data.get("name")}`;
    const body = `${data.get("message")}\n\n— ${data.get("name")} (${data.get("email")})`;
    window.location.href = `mailto:${site.email}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
    setSent(true);
  }

  return (
    <form onSubmit={handleSubmit} className="mt-10 flex flex-col gap-3">
      <input
        name="name"
        required
        placeholder="Name"
        className="border border-neutral-300 px-4 py-3 text-[15px] outline-none focus:border-foreground"
      />
      <input
        name="email"
        type="email"
        required
        placeholder="Email"
        className="border border-neutral-300 px-4 py-3 text-[15px] outline-none focus:border-foreground"
      />
      <textarea
        name="message"
        required
        rows={7}
        placeholder="Message"
        className="border border-neutral-300 px-4 py-3 text-[15px] outline-none focus:border-foreground"
      />
      <button
        type="submit"
        className="mt-1 w-fit border border-neutral-300 px-6 py-3 text-[15px] hover:border-foreground"
      >
        Send Message
      </button>
      {sent && <p className="text-sm text-muted">Opening your mail client…</p>}
    </form>
  );
}
