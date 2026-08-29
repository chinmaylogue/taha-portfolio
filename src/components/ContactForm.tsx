"use client";

import { useState } from "react";
import { site } from "@/data/content";

const glass =
  "border border-white/40 bg-white/20 backdrop-blur-xl backdrop-saturate-150 shadow-[0_8px_32px_rgba(0,0,0,0.12)] outline-none placeholder:text-white/70 focus:border-white/80 focus:bg-white/30";

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
    <form onSubmit={handleSubmit} className="flex w-72 flex-col gap-3 text-white">
      <input
        name="name"
        required
        placeholder="Name"
        className={`px-4 py-3 text-[13px] text-white transition-colors ${glass}`}
      />
      <input
        name="email"
        type="email"
        required
        placeholder="Email"
        className={`px-4 py-3 text-[13px] text-white transition-colors ${glass}`}
      />
      <textarea
        name="message"
        required
        rows={7}
        placeholder="Message"
        className={`px-4 py-3 text-[13px] text-white transition-colors ${glass}`}
      />
      <button
        type="submit"
        className="mt-1 w-fit rounded-none bg-white px-6 py-3 text-[13px] text-black shadow-[0_8px_32px_rgba(0,0,0,0.12)] transition-all duration-150 hover:bg-blue-600 hover:text-white active:scale-95 active:shadow-none"
      >
        Send Message
      </button>
      {sent && <p className="text-sm text-white/70">Opening your mail client…</p>}
    </form>
  );
}
