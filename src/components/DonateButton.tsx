import { siteConfig } from '@/lib/site';

/** Donation button placeholder. Hidden unless NEXT_PUBLIC_DONATE_URL is set. */
export function DonateButton({ className = '' }: { className?: string }) {
  if (!siteConfig.donateUrl) return null;
  return (
    <a
      href={siteConfig.donateUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`btn-secondary ${className}`}
    >
      <span aria-hidden="true">♥</span>
      <span>Support this project</span>
    </a>
  );
}
