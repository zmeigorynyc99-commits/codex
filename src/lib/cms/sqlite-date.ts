/** Converts SQLite's `datetime('now')` (UTC, space-separated) to ISO 8601. */
export function toIso(sqliteDate: string): string {
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(sqliteDate)) {
    return new Date(`${sqliteDate.replace(' ', 'T')}Z`).toISOString();
  }
  const d = new Date(sqliteDate);
  return Number.isNaN(d.getTime()) ? sqliteDate : d.toISOString();
}
