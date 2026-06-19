import type { Difficulty } from '@/lib/cms/constants';

export function DifficultyBadge({ value }: { value: Difficulty }) {
  const cls = `badge-difficulty-${value.toLowerCase()}`;
  return <span className={`badge ${cls}`}>{value}</span>;
}

export function DistroBadge({ value }: { value: string }) {
  return <span className="badge badge-distro">{value}</span>;
}

export function NeutralBadge({ children }: { children: React.ReactNode }) {
  return <span className="badge badge-neutral">{children}</span>;
}
