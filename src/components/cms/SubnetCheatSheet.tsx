import { NeutralBadge } from './Badges';

interface Row {
  cidr: number;
  mask: string;
  wildcard: string;
  addresses: number;
  hosts: string;
}

function octets(int: number): string {
  return [(int >>> 24) & 255, (int >>> 16) & 255, (int >>> 8) & 255, int & 255].join('.');
}

/** Builds CIDR /8 … /32 rows (the practical IPv4 subnetting range). */
function buildRows(): Row[] {
  const rows: Row[] = [];
  for (let cidr = 8; cidr <= 32; cidr += 1) {
    const maskInt = cidr === 0 ? 0 : (0xffffffff << (32 - cidr)) >>> 0;
    const wildcardInt = ~maskInt >>> 0;
    const addresses = 2 ** (32 - cidr);
    let hosts: string;
    if (cidr === 32) hosts = '1 (host route)';
    else if (cidr === 31) hosts = '2 (point-to-point)';
    else hosts = (addresses - 2).toLocaleString('en-US');
    rows.push({ cidr, mask: octets(maskInt), wildcard: octets(wildcardInt), addresses, hosts });
  }
  return rows;
}

const ROWS = buildRows();
// Commonly used LAN subnets to highlight.
const COMMON = new Set([24, 25, 26, 27, 28, 29, 30]);

/**
 * A compact IPv4 subnet (CIDR) cheat sheet: for each prefix length it shows the
 * subnet mask, wildcard mask, total addresses and usable hosts. Designed to sit
 * in a sidebar as a quick networking reference next to the lessons.
 */
export function SubnetCheatSheet() {
  return (
    <section
      aria-labelledby="subnet-cheatsheet-heading"
      className="rounded-xl border border-slate-200 bg-white/95 p-4 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/95"
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 id="subnet-cheatsheet-heading" className="text-base font-bold">
          Subnet cheat sheet
        </h2>
        <NeutralBadge>IPv4 · CIDR</NeutralBadge>
      </div>
      <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
        Prefix → subnet mask, wildcard, and usable hosts. Common LAN subnets are highlighted.
      </p>
      <div className="max-h-[28rem] overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-800">
        <table className="w-full border-collapse text-left text-xs">
          <thead className="sticky top-0 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            <tr>
              <th scope="col" className="px-2 py-1.5 font-semibold">CIDR</th>
              <th scope="col" className="px-2 py-1.5 font-semibold">Subnet mask</th>
              <th scope="col" className="px-2 py-1.5 font-semibold">Wildcard</th>
              <th scope="col" className="px-2 py-1.5 text-right font-semibold">Hosts</th>
            </tr>
          </thead>
          <tbody className="font-mono">
            {ROWS.map((r) => (
              <tr
                key={r.cidr}
                className={
                  COMMON.has(r.cidr)
                    ? 'bg-brand-50 dark:bg-brand-900/20'
                    : 'odd:bg-slate-50/60 dark:odd:bg-slate-800/30'
                }
              >
                <td className="whitespace-nowrap px-2 py-1 font-semibold text-brand-700 dark:text-brand-300">
                  /{r.cidr}
                </td>
                <td className="whitespace-nowrap px-2 py-1 text-slate-700 dark:text-slate-200">{r.mask}</td>
                <td className="whitespace-nowrap px-2 py-1 text-slate-500 dark:text-slate-400">{r.wildcard}</td>
                <td className="whitespace-nowrap px-2 py-1 text-right text-slate-700 dark:text-slate-200">
                  {r.hosts}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
        Usable hosts = addresses − 2 (network + broadcast). <span className="font-mono">/31</span> is a
        2-address point-to-point link (RFC 3021); <span className="font-mono">/32</span> is a single host
        route. Example: a <span className="font-mono">/27</span> gives 32 addresses and 30 usable hosts.
      </p>
    </section>
  );
}
