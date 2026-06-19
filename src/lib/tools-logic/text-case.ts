/** Text case transformations. */

export type CaseMode =
  | 'upper'
  | 'lower'
  | 'title'
  | 'sentence'
  | 'camel'
  | 'pascal'
  | 'snake'
  | 'kebab'
  | 'constant'
  | 'alternating'
  | 'inverse';

function words(text: string): string[] {
  return text
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_\-]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

export function convertCase(text: string, mode: CaseMode): string {
  switch (mode) {
    case 'upper':
      return text.toUpperCase();
    case 'lower':
      return text.toLowerCase();
    case 'title':
      return text
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase());
    case 'sentence':
      return text
        .toLowerCase()
        .replace(/(^\s*\w|[.!?]\s+\w)/g, (c) => c.toUpperCase());
    case 'camel': {
      const w = words(text).map((word) => word.toLowerCase());
      return w
        .map((word, i) => (i === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)))
        .join('');
    }
    case 'pascal':
      return words(text)
        .map((word) => word.toLowerCase())
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join('');
    case 'snake':
      return words(text).map((word) => word.toLowerCase()).join('_');
    case 'kebab':
      return words(text).map((word) => word.toLowerCase()).join('-');
    case 'constant':
      return words(text).map((word) => word.toUpperCase()).join('_');
    case 'alternating':
      return [...text]
        .map((c, i) => (i % 2 === 0 ? c.toLowerCase() : c.toUpperCase()))
        .join('');
    case 'inverse':
      return [...text]
        .map((c) => (c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase()))
        .join('');
    default:
      return text;
  }
}
