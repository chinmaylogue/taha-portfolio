type Props = {
  name: "instagram" | "linkedin" | "spotify";
  className?: string;
};

export default function SocialIcon({ name, className = "h-4 w-4" }: Props) {
  if (name === "instagram") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
        <rect x="2.5" y="2.5" width="19" height="19" rx="5" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="12" cy="12" r="4.8" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" />
      </svg>
    );
  }

  if (name === "linkedin") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
        <rect x="2.5" y="2.5" width="19" height="19" rx="4" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="7.6" cy="8" r="1.15" fill="currentColor" />
        <path d="M7.6 11v6.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path
          d="M11.4 17.2V11M11.4 13.5c0-1.4 1-2.5 2.4-2.5s2.2 1 2.2 2.5v3.7"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M7 15.2c3-1 6.7-1 10 1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M6.4 11.8c3.6-1.2 8-1 11.2 1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M6 8.3c4-1.4 9-1.1 12.6 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
