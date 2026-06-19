/** English UI strings. Mirror this file to add a new language. */
const en = {
  nav: {
    home: 'Home',
    allTools: 'All tools',
    about: 'About',
    search: 'Search tools',
    skipToContent: 'Skip to content',
    toggleTheme: 'Toggle dark mode',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
  },
  common: {
    copy: 'Copy',
    copied: 'Copied!',
    reset: 'Reset',
    clear: 'Clear',
    result: 'Result',
    input: 'Input',
    output: 'Output',
    download: 'Download',
    swap: 'Swap',
    generate: 'Generate',
    example: 'Examples',
    faq: 'Frequently asked questions',
    about: 'About this tool',
    relatedTools: 'Related tools',
    categories: 'Categories',
    noResults: 'No tools found. Try a different search.',
    privacyNote: 'Everything runs in your browser. Your data never leaves your device.',
  },
  home: {
    heroTitle: 'Tiny Tools',
    heroSubtitle:
      'A growing collection of fast, free, privacy-friendly online tools. No sign-up, no tracking — everything runs right in your browser.',
    searchPlaceholder: 'Search for a tool (e.g. password, percentage, JSON)…',
    browseByCategory: 'Browse by category',
    allTools: 'All tools',
  },
  footer: {
    tagline: 'Free, fast and privacy-friendly tools for everyone.',
    about: 'About',
    privacy: 'Privacy Policy',
    terms: 'Terms of Use',
    contact: 'Contact',
    donate: 'Support this project',
    builtWith: 'Built with privacy in mind. No accounts. No tracking by default.',
  },
} as const;

export type Dictionary = typeof en;
export default en;
