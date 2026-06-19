/**
 * Central tool registry. Each entry is the single source of truth for a
 * tool's routing, navigation metadata and SEO content (title, description,
 * heading, explanation, examples and FAQ). Pages, the sitemap, search and
 * category listings all read from here.
 *
 * Translation note: to localise a tool later, add a `translations` map keyed
 * by locale to a ToolDefinition and resolve it in the page layer. English is
 * the default content below.
 */

export type CategoryId =
  | 'calculators'
  | 'converters'
  | 'text'
  | 'generators'
  | 'developer';

export interface ToolCategory {
  id: CategoryId;
  name: string;
  description: string;
  icon: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface ToolDefinition {
  slug: string;
  /** Maps to a component in src/components/tools/registry.ts */
  component: string;
  category: CategoryId;
  /** Short navigational name. */
  name: string;
  /** <title> text (without the site-name suffix). */
  title: string;
  /** <meta name="description"> and Open Graph description. */
  description: string;
  /** H1 on the tool page. */
  heading: string;
  /** One-to-two paragraph explanation of what the tool does and why. */
  explanation: string[];
  /** Concrete worked examples shown on the page. */
  examples: string[];
  faq: FaqItem[];
  keywords: string[];
  /** Slugs of related tools surfaced at the bottom of the page. */
  related: string[];
}

export const CATEGORIES: ToolCategory[] = [
  {
    id: 'calculators',
    name: 'Calculators',
    description: 'Everyday math: percentages, ages, dates, loans, BMI and more.',
    icon: '🧮',
  },
  {
    id: 'converters',
    name: 'Converters',
    description: 'Convert units, temperatures, time zones, colors and encodings.',
    icon: '🔁',
  },
  {
    id: 'text',
    name: 'Text tools',
    description: 'Count, clean and transform text right in your browser.',
    icon: '📝',
  },
  {
    id: 'generators',
    name: 'Generators',
    description: 'Generate passwords, random numbers and QR codes securely.',
    icon: '✨',
  },
  {
    id: 'developer',
    name: 'Developer',
    description: 'Format and validate data formats developers use every day.',
    icon: '🛠️',
  },
];

export const TOOLS: ToolDefinition[] = [
  {
    slug: 'percentage-calculator',
    component: 'PercentageCalculator',
    category: 'calculators',
    name: 'Percentage Calculator',
    title: 'Percentage Calculator — quick percent, increase & change',
    description:
      'Free percentage calculator: find what percent of a number, what a value is as a percentage, and percentage increase or decrease. Works instantly in your browser.',
    heading: 'Percentage Calculator',
    explanation: [
      'This percentage calculator handles the three most common percentage questions in one place: finding a percentage of a number, working out what one number is as a percentage of another, and calculating the percentage change between two values.',
      'All calculations happen locally in your browser as you type, so results are instant and your numbers never leave your device.',
    ],
    examples: [
      'What is 20% of 80? → 16',
      '16 is what percent of 80? → 20%',
      'Percentage change from 80 to 96 → +20%',
    ],
    faq: [
      {
        question: 'How do I calculate a percentage of a number?',
        answer:
          'Divide the percentage by 100 and multiply by the number. For example, 20% of 80 is (20 ÷ 100) × 80 = 16. The calculator above does this automatically.',
      },
      {
        question: 'How is percentage change calculated?',
        answer:
          'Percentage change is the difference between the new and old value divided by the absolute old value, multiplied by 100. Going from 80 to 96 is a +20% change.',
      },
      {
        question: 'Is my data sent anywhere?',
        answer: 'No. Every calculation runs entirely in your browser. Nothing is uploaded or stored.',
      },
    ],
    keywords: ['percentage calculator', 'percent of', 'percentage change', 'percent increase'],
    related: ['loan-calculator', 'bmi-calculator', 'unit-converter'],
  },
  {
    slug: 'age-calculator',
    component: 'AgeCalculator',
    category: 'calculators',
    name: 'Age Calculator',
    title: 'Age Calculator — exact age in years, months and days',
    description:
      'Calculate your exact age in years, months and days from a date of birth, plus total weeks and days and your next birthday. Private and instant.',
    heading: 'Age Calculator',
    explanation: [
      'Enter a date of birth (and optionally an "age at" date) to get an exact age broken down into years, months and days, along with handy totals such as the number of weeks and days you have been alive.',
      'The calculator uses calendar-aware math, correctly accounting for varying month lengths and leap years.',
    ],
    examples: [
      'Born 1990-06-15, today 2026-06-19 → 36 years, 0 months, 4 days',
      'Total days lived is shown alongside total weeks and months',
      'Your next birthday and days remaining are displayed automatically',
    ],
    faq: [
      {
        question: 'How is age calculated exactly?',
        answer:
          'We compare the day, month and year of both dates and borrow from months and years where needed, just like counting on a calendar. Leap years and different month lengths are handled automatically.',
      },
      {
        question: 'Can I calculate age on a past or future date?',
        answer: 'Yes. Change the "age at" date to any date to see how old someone was or will be then.',
      },
      {
        question: 'Is my date of birth stored?',
        answer: 'No. The calculation happens in your browser and nothing is saved or transmitted.',
      },
    ],
    keywords: ['age calculator', 'how old am i', 'date of birth', 'exact age'],
    related: ['date-difference-calculator', 'countdown-calculator', 'unix-timestamp-converter'],
  },
  {
    slug: 'date-difference-calculator',
    component: 'DateDifferenceCalculator',
    category: 'calculators',
    name: 'Date Difference Calculator',
    title: 'Date Difference Calculator — days between two dates',
    description:
      'Find the number of days, weeks, months and years between two dates. Includes a calendar-accurate breakdown and works entirely in your browser.',
    heading: 'Date Difference Calculator',
    explanation: [
      'Pick a start date and an end date to see exactly how much time lies between them. The result is shown both as a total number of days and weeks and as a calendar-aware breakdown of years, months and days.',
      'This is useful for counting down to deadlines, measuring project durations or working out anniversaries.',
    ],
    examples: [
      '2026-01-01 to 2026-12-31 → 364 days (11 months, 30 days)',
      'Shows total weeks plus remaining days',
      'Direction-aware: order of the dates does not matter',
    ],
    faq: [
      {
        question: 'Does the order of dates matter?',
        answer: 'No. The calculator always shows the absolute difference, and indicates which date is later.',
      },
      {
        question: 'Are both end dates included?',
        answer:
          'The result counts the number of whole days between the two dates. Add one day if you need to count both the start and end dates inclusively.',
      },
      {
        question: 'How are months counted?',
        answer:
          'Months are counted on the calendar, so the breakdown respects the actual length of each month rather than assuming 30 days.',
      },
    ],
    keywords: ['date difference', 'days between dates', 'date duration calculator'],
    related: ['age-calculator', 'countdown-calculator', 'time-zone-converter'],
  },
  {
    slug: 'random-number-generator',
    component: 'RandomNumberGenerator',
    category: 'generators',
    name: 'Random Number Generator',
    title: 'Random Number Generator — secure random integers',
    description:
      'Generate one or many random integers in any range using your browser\'s cryptographically secure randomness. Optional unique values and no modulo bias.',
    heading: 'Random Number Generator',
    explanation: [
      'Generate random whole numbers within a range you choose. You can produce a single number or a list, and optionally require all values to be unique — handy for draws, raffles and sampling.',
      'Randomness comes from the Web Crypto API, and the generator uses rejection sampling to avoid the subtle bias that simple modulo approaches introduce.',
    ],
    examples: [
      'Pick a number between 1 and 100',
      'Draw 6 unique numbers between 1 and 49 for a lottery-style pick',
      'Generate 10 dice rolls between 1 and 6',
    ],
    faq: [
      {
        question: 'Is this random number generator secure?',
        answer:
          'It uses the browser\'s cryptographically secure random source (Web Crypto). That is far stronger than Math.random and suitable for most everyday and security-adjacent needs.',
      },
      {
        question: 'What does "unique values" do?',
        answer:
          'When enabled, the generator never repeats a number in the same batch. The count is capped at the size of the range.',
      },
      {
        question: 'Can it generate decimals?',
        answer: 'This tool produces whole numbers (integers). For ranges, set the minimum and maximum you need.',
      },
    ],
    keywords: ['random number generator', 'rng', 'random integer', 'pick a number'],
    related: ['password-generator', 'qr-code-generator', 'percentage-calculator'],
  },
  {
    slug: 'password-generator',
    component: 'PasswordGenerator',
    category: 'generators',
    name: 'Password Generator',
    title: 'Secure Password Generator — strong random passwords',
    description:
      'Create strong, random passwords with adjustable length and character sets. Uses cryptographically secure randomness and shows estimated strength. Nothing is sent anywhere.',
    heading: 'Secure Password Generator',
    explanation: [
      'Generate strong, unpredictable passwords with full control over length and which character types to include: lowercase, uppercase, numbers and symbols. You can also exclude visually ambiguous characters such as l, 1, O and 0.',
      'Passwords are created locally using the Web Crypto API and an unbiased selection method. They are never transmitted, logged or stored — close the tab and they are gone.',
    ],
    examples: [
      '16-character password with all character types',
      'Memorable-length 24-character passphrase-style string',
      'PIN-style numeric code by selecting only numbers',
    ],
    faq: [
      {
        question: 'Are generated passwords safe to use?',
        answer:
          'Yes. They are generated in your browser with a cryptographically secure random source and are never sent over the network.',
      },
      {
        question: 'How long should my password be?',
        answer:
          'Aim for at least 16 characters with a mix of types for important accounts. The strength meter estimates entropy to help you decide.',
      },
      {
        question: 'Why exclude ambiguous characters?',
        answer:
          'Characters like l, I, 1, O and 0 can be hard to tell apart when typed or read aloud. Excluding them reduces transcription errors.',
      },
    ],
    keywords: ['password generator', 'strong password', 'random password', 'secure password'],
    related: ['random-number-generator', 'base64-encoder-decoder', 'qr-code-generator'],
  },
  {
    slug: 'word-counter',
    component: 'WordCounter',
    category: 'text',
    name: 'Word & Character Counter',
    title: 'Word Counter — words, characters, sentences & reading time',
    description:
      'Count words, characters (with and without spaces), sentences, paragraphs and lines, plus an estimated reading time. Live, private and accurate for any text.',
    heading: 'Word & Character Counter',
    explanation: [
      'Paste or type any text to instantly see its word count, character counts (with and without spaces), sentences, paragraphs and lines, along with an estimated reading time.',
      'Counting is Unicode-aware, so emoji and accented characters are measured correctly. Everything happens as you type, entirely in your browser.',
    ],
    examples: [
      'Check a tweet or post stays under a character limit',
      'Measure an essay\'s word count and reading time',
      'Count lines in a list before pasting elsewhere',
    ],
    faq: [
      {
        question: 'How is a "word" defined?',
        answer: 'A word is any run of non-whitespace characters. Text is split on spaces, tabs and line breaks.',
      },
      {
        question: 'How is reading time estimated?',
        answer: 'Reading time assumes an average reading speed of about 200 words per minute, rounded up to the nearest minute.',
      },
      {
        question: 'Is there a length limit?',
        answer:
          'For performance, very large inputs are capped at 100,000 characters. That is more than enough for articles and documents.',
      },
    ],
    keywords: ['word counter', 'character counter', 'letter count', 'reading time'],
    related: ['text-case-converter', 'remove-duplicate-lines', 'json-formatter'],
  },
  {
    slug: 'text-case-converter',
    component: 'TextCaseConverter',
    category: 'text',
    name: 'Text Case Converter',
    title: 'Text Case Converter — UPPER, lower, Title & camelCase',
    description:
      'Convert text between UPPERCASE, lowercase, Title Case, Sentence case, camelCase, PascalCase, snake_case, kebab-case and more. Instant and private.',
    heading: 'Text Case Converter',
    explanation: [
      'Transform text into a wide range of letter cases: UPPERCASE, lowercase, Title Case, Sentence case, camelCase, PascalCase, snake_case, kebab-case, CONSTANT_CASE, aLtErNaTiNg and inVERSE case.',
      'It is handy for headlines, code identifiers, slugs and tidying up inconsistently formatted text. Conversions run instantly in your browser.',
    ],
    examples: [
      '"hello world" → "Hello World" (Title Case)',
      '"Hello World" → "helloWorld" (camelCase)',
      '"Hello World" → "hello-world" (kebab-case)',
    ],
    faq: [
      {
        question: 'What is the difference between Title Case and Sentence case?',
        answer:
          'Title Case capitalises the first letter of every word; Sentence case capitalises only the first letter of each sentence.',
      },
      {
        question: 'Does it handle code-style cases?',
        answer:
          'Yes. camelCase, PascalCase, snake_case, kebab-case and CONSTANT_CASE are all supported, which is useful when renaming variables or building slugs.',
      },
      {
        question: 'Is my text uploaded?',
        answer: 'No. All conversions happen locally in your browser.',
      },
    ],
    keywords: ['text case converter', 'uppercase', 'lowercase', 'title case', 'camelcase'],
    related: ['word-counter', 'remove-duplicate-lines', 'url-encoder-decoder'],
  },
  {
    slug: 'remove-duplicate-lines',
    component: 'RemoveDuplicateLines',
    category: 'text',
    name: 'Remove Duplicate Lines',
    title: 'Remove Duplicate Lines — dedupe and sort text lists',
    description:
      'Remove duplicate lines from any list or text, with options to ignore case, trim whitespace, drop empty lines and sort the result. Fast and private.',
    heading: 'Remove Duplicate Lines',
    explanation: [
      'Paste a list and instantly remove repeated lines. You can ignore case, trim surrounding whitespace, drop blank lines, keep the first or last occurrence of each line, and sort the output alphabetically.',
      'It is a quick way to clean up email lists, keyword lists, log lines or any line-based data — all without leaving your browser.',
    ],
    examples: [
      'Deduplicate a list of email addresses',
      'Clean a keyword list and sort it A→Z',
      'Remove repeated lines while ignoring case differences',
    ],
    faq: [
      {
        question: 'Does it keep the original order?',
        answer:
          'By default the first occurrence of each line is kept in its original position. Enable sorting to reorder the output alphabetically.',
      },
      {
        question: 'Can it ignore case when comparing?',
        answer: 'Yes. Turn off "case sensitive" so that "Apple" and "apple" are treated as duplicates.',
      },
      {
        question: 'How large a list can I process?',
        answer: 'Input is capped at 100,000 characters to keep things fast in the browser.',
      },
    ],
    keywords: ['remove duplicate lines', 'dedupe', 'unique lines', 'delete duplicates'],
    related: ['word-counter', 'text-case-converter', 'json-formatter'],
  },
  {
    slug: 'unit-converter',
    component: 'UnitConverter',
    category: 'converters',
    name: 'Unit Converter',
    title: 'Unit Converter — length, weight, volume, area, speed & data',
    description:
      'Convert between metric and imperial units for length, weight, volume, area, speed and digital storage. Accurate factors, instant results, no tracking.',
    heading: 'Unit Converter',
    explanation: [
      'Convert values across common measurement systems: length, weight and mass, volume, area, speed and digital storage. Pick a category, choose the units to convert from and to, and the result updates instantly.',
      'Conversion factors are based on internationally agreed definitions, so results are accurate for everyday and professional use.',
    ],
    examples: [
      '10 kilometres → 6.21371 miles',
      '5 kilograms → 11.0231 pounds',
      '1 gigabyte (GB) → 0.931323 gibibytes (GiB)',
    ],
    faq: [
      {
        question: 'Which measurement systems are supported?',
        answer:
          'Both metric and imperial/US units are included across length, mass, volume, area, speed and digital storage categories.',
      },
      {
        question: 'How accurate are the conversions?',
        answer:
          'Each unit uses an exact or internationally standardised factor (for example, 1 inch = 0.0254 m), so results are precise within normal display rounding.',
      },
      {
        question: 'Why are KB and KiB different?',
        answer:
          'KB is 1,000 bytes (decimal) while KiB is 1,024 bytes (binary). Both are provided so you can convert between the two conventions.',
      },
    ],
    keywords: ['unit converter', 'metric to imperial', 'length converter', 'weight converter'],
    related: ['temperature-converter', 'color-converter', 'percentage-calculator'],
  },
  {
    slug: 'temperature-converter',
    component: 'TemperatureConverter',
    category: 'converters',
    name: 'Temperature Converter',
    title: 'Temperature Converter — Celsius, Fahrenheit & Kelvin',
    description:
      'Convert temperatures between Celsius, Fahrenheit and Kelvin instantly. Includes absolute-zero validation. Private, browser-based and free.',
    heading: 'Temperature Converter',
    explanation: [
      'Convert any temperature between Celsius (°C), Fahrenheit (°F) and Kelvin (K). Enter a value in one unit and see the equivalents update immediately.',
      'The converter understands absolute zero, so it can flag physically impossible values such as temperatures below −273.15 °C.',
    ],
    examples: [
      '100 °C → 212 °F → 373.15 K',
      '32 °F → 0 °C',
      '300 K → 26.85 °C',
    ],
    faq: [
      {
        question: 'What is the formula for Celsius to Fahrenheit?',
        answer: 'Multiply the Celsius value by 9/5 and add 32. For example, 100 °C × 9/5 + 32 = 212 °F.',
      },
      {
        question: 'What is absolute zero?',
        answer:
          'Absolute zero is the lowest possible temperature: 0 K, which equals −273.15 °C or −459.67 °F. The tool warns when a value falls below it.',
      },
      {
        question: 'Is Kelvin written with a degree symbol?',
        answer: 'No. Kelvin is written without a degree symbol — for example, 300 K, not 300 °K.',
      },
    ],
    keywords: ['temperature converter', 'celsius to fahrenheit', 'fahrenheit to celsius', 'kelvin'],
    related: ['unit-converter', 'percentage-calculator', 'color-converter'],
  },
  {
    slug: 'bmi-calculator',
    component: 'BmiCalculator',
    category: 'calculators',
    name: 'BMI Calculator',
    title: 'BMI Calculator — body mass index (metric & imperial)',
    description:
      'Calculate Body Mass Index from height and weight in metric or imperial units, with the standard BMI category. Includes a neutral, informational disclaimer.',
    heading: 'BMI Calculator',
    explanation: [
      'Body Mass Index (BMI) is a simple ratio of weight to height that is widely used as a rough screening figure. Enter your height and weight in metric or imperial units to see your BMI and the standard category it falls into.',
      'BMI is a general indicator and does not account for muscle mass, body composition, age or other factors. It is provided for information only and is not medical advice; consult a qualified healthcare professional for any health decisions.',
    ],
    examples: [
      '70 kg, 175 cm → BMI 22.9 (Normal)',
      '154 lb, 69 in → BMI 22.7 (Normal)',
      'Categories: Underweight, Normal, Overweight, Obese',
    ],
    faq: [
      {
        question: 'How is BMI calculated?',
        answer:
          'In metric units, BMI = weight (kg) ÷ height (m)². In imperial units, BMI = 703 × weight (lb) ÷ height (in)².',
      },
      {
        question: 'What do the BMI categories mean?',
        answer:
          'The common adult ranges are: under 18.5 underweight, 18.5–24.9 normal, 25–29.9 overweight, and 30 or above obese. These are general guides, not diagnoses.',
      },
      {
        question: 'Is BMI accurate for everyone?',
        answer:
          'No. BMI does not distinguish muscle from fat and may be misleading for athletes, older adults, pregnant people and others. Treat it as a rough screening number only.',
      },
    ],
    keywords: ['bmi calculator', 'body mass index', 'bmi metric', 'bmi imperial'],
    related: ['percentage-calculator', 'unit-converter', 'loan-calculator'],
  },
  {
    slug: 'loan-calculator',
    component: 'LoanCalculator',
    category: 'calculators',
    name: 'Loan Payment Calculator',
    title: 'Loan Payment Calculator — monthly payment & total interest',
    description:
      'Estimate the monthly payment, total interest and total cost of a fixed-rate loan from the amount, interest rate and term. Private and instant.',
    heading: 'Loan Payment Calculator',
    explanation: [
      'Estimate the monthly payment for a fixed-rate, fully amortising loan from three inputs: the amount borrowed, the annual interest rate and the term in years. The tool also shows the total amount repaid and the total interest paid over the life of the loan.',
      'This is an estimate for planning purposes and does not include fees, insurance or taxes. Actual offers may differ.',
    ],
    examples: [
      '$20,000 at 6% over 5 years → ≈ $386.66 / month',
      'Total interest over the term is shown alongside the monthly figure',
      'Set 0% interest to split the principal evenly across the term',
    ],
    faq: [
      {
        question: 'What kind of loan does this calculate?',
        answer:
          'It models a standard fixed-rate, fully amortising loan with equal monthly payments — the structure used for most mortgages, car loans and personal loans.',
      },
      {
        question: 'Does it include fees or taxes?',
        answer:
          'No. The estimate covers principal and interest only. Add any fees, insurance or taxes separately for a complete picture.',
      },
      {
        question: 'How is the monthly payment formula derived?',
        answer:
          'It uses the standard amortisation formula: M = P · r · (1 + r)ⁿ ÷ ((1 + r)ⁿ − 1), where r is the monthly rate and n is the number of months.',
      },
    ],
    keywords: ['loan calculator', 'monthly payment', 'amortization', 'interest calculator'],
    related: ['percentage-calculator', 'bmi-calculator', 'unit-converter'],
  },
  {
    slug: 'time-zone-converter',
    component: 'TimeZoneConverter',
    category: 'converters',
    name: 'Time Zone Converter',
    title: 'Time Zone Converter — compare times across the world',
    description:
      'Convert a date and time from one time zone to another and compare multiple cities side by side. Uses your browser\'s time-zone data — no API needed.',
    heading: 'Time Zone Converter',
    explanation: [
      'Pick a date, time and source time zone to see the equivalent local time in other zones around the world, including the UTC offset for each. It is ideal for scheduling meetings and calls across regions.',
      'Time-zone rules, including daylight saving time, come from your browser\'s built-in internationalisation data, so no external service is contacted.',
    ],
    examples: [
      '09:00 in New York → 14:00 in London (during summer)',
      'Compare Tokyo, London and Los Angeles at a glance',
      'See the UTC offset for each selected zone',
    ],
    faq: [
      {
        question: 'Does it handle daylight saving time?',
        answer:
          'Yes. Conversions use your browser\'s time-zone database, which accounts for daylight saving transitions for each zone and date.',
      },
      {
        question: 'Which time zones are available?',
        answer:
          'A curated list of common zones is provided, covering major cities across every continent. Each is a standard IANA time zone.',
      },
      {
        question: 'Is an internet connection required?',
        answer: 'No external API is used. Everything is computed locally from data already in your browser.',
      },
    ],
    keywords: ['time zone converter', 'world clock', 'utc converter', 'meeting time'],
    related: ['unix-timestamp-converter', 'countdown-calculator', 'date-difference-calculator'],
  },
  {
    slug: 'unix-timestamp-converter',
    component: 'UnixTimestampConverter',
    category: 'converters',
    name: 'Unix Timestamp Converter',
    title: 'Unix Timestamp Converter — epoch time to date and back',
    description:
      'Convert Unix epoch timestamps (seconds or milliseconds) to human-readable UTC and local dates, and convert dates back to timestamps. Instant and private.',
    heading: 'Unix Timestamp Converter',
    explanation: [
      'Convert a Unix timestamp — the number of seconds (or milliseconds) since 1 January 1970 UTC — into a readable date in UTC, your local time and ISO 8601 format, with a relative description such as "3 days ago". You can also convert a date back into a timestamp.',
      'The tool auto-detects whether your input is in seconds or milliseconds, so you can paste values from almost any system.',
    ],
    examples: [
      '1700000000 → Tue, 14 Nov 2023 22:13:20 UTC',
      '1700000000000 (ms) is detected automatically',
      'Pick a date to get its epoch seconds',
    ],
    faq: [
      {
        question: 'What is a Unix timestamp?',
        answer:
          'It is the number of seconds elapsed since the Unix epoch, 00:00:00 UTC on 1 January 1970, ignoring leap seconds. It is a common way to store time in software.',
      },
      {
        question: 'Seconds or milliseconds?',
        answer:
          'Both are supported. The converter assumes seconds for smaller numbers and milliseconds for very large ones, and you can see which it used.',
      },
      {
        question: 'Why does my local time differ from UTC?',
        answer:
          'UTC is the global reference time. Your local time applies your device\'s time-zone offset, which the tool shows alongside the UTC value.',
      },
    ],
    keywords: ['unix timestamp', 'epoch converter', 'timestamp to date', 'epoch time'],
    related: ['time-zone-converter', 'date-difference-calculator', 'countdown-calculator'],
  },
  {
    slug: 'qr-code-generator',
    component: 'QrCodeGenerator',
    category: 'generators',
    name: 'QR Code Generator',
    title: 'QR Code Generator — free QR codes for links and text',
    description:
      'Generate QR codes for URLs, text, Wi-Fi and more directly in your browser. Adjust size and error correction, then download a PNG. No tracking, no uploads.',
    heading: 'QR Code Generator',
    explanation: [
      'Turn any link or short piece of text into a QR code. Adjust the size and error-correction level, then download the result as a PNG image to print or share.',
      'The QR code is rendered entirely in your browser — the text you encode is never uploaded to a server, which keeps private links private.',
    ],
    examples: [
      'Encode a website URL for a poster or business card',
      'Share Wi-Fi details or contact text',
      'Higher error correction survives smudges and logos',
    ],
    faq: [
      {
        question: 'Do QR codes generated here expire?',
        answer:
          'No. The QR code is a static image that encodes your text directly, so it never expires and does not rely on this site to keep working.',
      },
      {
        question: 'What is error correction?',
        answer:
          'Error correction adds redundancy so the code still scans if part of it is damaged or covered. Higher levels are more robust but make the code denser.',
      },
      {
        question: 'Is the content I encode private?',
        answer: 'Yes. Everything is generated locally in your browser and nothing you type is sent anywhere.',
      },
    ],
    keywords: ['qr code generator', 'qr code', 'create qr code', 'url to qr'],
    related: ['url-encoder-decoder', 'password-generator', 'base64-encoder-decoder'],
  },
  {
    slug: 'url-encoder-decoder',
    component: 'UrlEncoderDecoder',
    category: 'converters',
    name: 'URL Encoder / Decoder',
    title: 'URL Encoder / Decoder — percent-encode and decode text',
    description:
      'Encode text for safe use in URLs or decode percent-encoded URLs back to readable text. Unicode-safe, instant and entirely browser-based.',
    heading: 'URL Encoder / Decoder',
    explanation: [
      'Convert text to and from URL percent-encoding. Encoding replaces unsafe characters (like spaces, &, ? and non-ASCII letters) with %-escapes so they can travel safely in a URL or query string; decoding reverses the process.',
      'The tool is Unicode-aware, correctly handling accented letters and emoji, and runs entirely in your browser.',
    ],
    examples: [
      '"hello world & more" → "hello%20world%20%26%20more"',
      'Decode "%E2%9C%93" → "✓"',
      'Optionally encode spaces as "+" for query strings',
    ],
    faq: [
      {
        question: 'What is URL encoding?',
        answer:
          'URL (percent) encoding represents characters that are not allowed in a URL using a "%" followed by their hexadecimal byte value, so the URL stays valid.',
      },
      {
        question: 'When should I encode a space as %20 vs +?',
        answer:
          'Use %20 in the path portion of a URL. The "+" form is mainly used in query strings (application/x-www-form-urlencoded); the tool offers both.',
      },
      {
        question: 'What happens with invalid input on decode?',
        answer: 'If the input is not valid percent-encoding, the tool shows a clear error instead of producing garbled text.',
      },
    ],
    keywords: ['url encoder', 'url decoder', 'percent encoding', 'urlencode'],
    related: ['base64-encoder-decoder', 'text-case-converter', 'json-formatter'],
  },
  {
    slug: 'json-formatter',
    component: 'JsonFormatter',
    category: 'developer',
    name: 'JSON Formatter & Validator',
    title: 'JSON Formatter & Validator — beautify, minify, validate',
    description:
      'Format (pretty-print), minify and validate JSON in your browser. Clear error messages with line numbers. Your data is never uploaded.',
    heading: 'JSON Formatter & Validator',
    explanation: [
      'Paste JSON to pretty-print it with consistent indentation, minify it to a single line, or validate it. If the JSON is invalid, you get a clear error message — often with the line number — so you can fix it quickly.',
      'Parsing uses the browser\'s native, safe JSON engine. No code is executed and nothing is uploaded, so it is safe for sensitive payloads.',
    ],
    examples: [
      'Beautify a minified API response with 2-space indentation',
      'Minify a config file to a single line',
      'Catch a trailing comma or missing quote with a line number',
    ],
    faq: [
      {
        question: 'Is my JSON sent to a server?',
        answer: 'No. Formatting and validation happen entirely in your browser using the native JSON parser.',
      },
      {
        question: 'Does it execute or evaluate the JSON?',
        answer:
          'No. It uses safe JSON parsing only — never eval — so pasting data carries no risk of code execution.',
      },
      {
        question: 'Why does it reject my JSON?',
        answer:
          'Common causes are trailing commas, single quotes instead of double quotes, or unquoted keys. The error message points to where parsing failed.',
      },
    ],
    keywords: ['json formatter', 'json validator', 'json beautifier', 'json minify'],
    related: ['base64-encoder-decoder', 'url-encoder-decoder', 'remove-duplicate-lines'],
  },
  {
    slug: 'base64-encoder-decoder',
    component: 'Base64EncoderDecoder',
    category: 'converters',
    name: 'Base64 Encoder / Decoder',
    title: 'Base64 Encoder / Decoder — text to Base64 and back',
    description:
      'Encode text to Base64 or decode Base64 back to text, with UTF-8 support and an optional URL-safe variant. Instant, private and browser-based.',
    heading: 'Base64 Encoder / Decoder',
    explanation: [
      'Convert text to and from Base64, a way of representing binary or text data using a 64-character ASCII alphabet. It is commonly used in data URLs, email attachments, tokens and config files.',
      'Encoding is UTF-8 safe, so accented characters and emoji round-trip correctly, and a URL-safe variant is available for use in links. Everything runs locally in your browser.',
    ],
    examples: [
      '"Hello, world!" → "SGVsbG8sIHdvcmxkIQ=="',
      'Decode "8J+Yhw==" → "😇"',
      'URL-safe mode replaces + and / with - and _',
    ],
    faq: [
      {
        question: 'What is Base64 used for?',
        answer:
          'Base64 encodes binary or text data as ASCII so it can be embedded where only text is allowed, such as data URLs, JSON, JWTs and email.',
      },
      {
        question: 'Does Base64 encrypt my data?',
        answer:
          'No. Base64 is encoding, not encryption — anyone can decode it. Do not use it to protect secrets.',
      },
      {
        question: 'What is the URL-safe variant?',
        answer:
          'It swaps the "+" and "/" characters for "-" and "_" and drops padding, so the result is safe to place directly in URLs.',
      },
    ],
    keywords: ['base64 encode', 'base64 decode', 'base64 converter', 'base64 url safe'],
    related: ['url-encoder-decoder', 'json-formatter', 'password-generator'],
  },
  {
    slug: 'color-converter',
    component: 'ColorConverter',
    category: 'converters',
    name: 'Color Converter',
    title: 'Color Converter — HEX, RGB and HSL with live preview',
    description:
      'Convert colors between HEX, RGB and HSL with a live preview and a color picker. Copy any format instantly. Browser-based and private.',
    heading: 'Color Converter (HEX · RGB · HSL)',
    explanation: [
      'Convert colors between HEX, RGB and HSL notations with a live swatch preview. Type a value in any format, or use the color picker, and the other formats update instantly.',
      'It is perfect for web design and CSS work, letting you copy whichever format you need with one click. All conversions happen in your browser.',
    ],
    examples: [
      '#2563EB → rgb(37, 99, 235) → hsl(217, 83%, 53%)',
      'Pick a color visually and read off every format',
      'Shorthand HEX like #abc is expanded automatically',
    ],
    faq: [
      {
        question: 'What is the difference between RGB and HSL?',
        answer:
          'RGB describes a color by its red, green and blue components. HSL describes it by hue, saturation and lightness, which many people find more intuitive to adjust.',
      },
      {
        question: 'Does it support shorthand HEX codes?',
        answer: 'Yes. Three-digit codes like #abc are automatically expanded to their six-digit equivalent (#aabbcc).',
      },
      {
        question: 'Can I convert with transparency?',
        answer:
          'The converter focuses on the solid color channels (HEX, RGB, HSL). Any alpha component in an 8-digit HEX is ignored.',
      },
    ],
    keywords: ['color converter', 'hex to rgb', 'rgb to hsl', 'hex to hsl'],
    related: ['unit-converter', 'temperature-converter', 'url-encoder-decoder'],
  },
  {
    slug: 'countdown-calculator',
    component: 'CountdownCalculator',
    category: 'calculators',
    name: 'Countdown Calculator',
    title: 'Countdown Calculator — time remaining to any date',
    description:
      'Count down to any date and time and see the days, hours, minutes and seconds remaining, updating live. Also counts business days. Private and free.',
    heading: 'Countdown Calculator',
    explanation: [
      'Choose a target date and time to see exactly how long remains — in days, hours, minutes and seconds — with a live ticking display. If the date has passed, it shows how long ago it was instead.',
      'It also counts the number of business days (Monday to Friday) until your target, which is handy for deadlines and project planning.',
    ],
    examples: [
      'Count down to New Year\'s Eve',
      'Days, hours, minutes and seconds until a product launch',
      'Business days remaining until a deadline',
    ],
    faq: [
      {
        question: 'Does the countdown update live?',
        answer: 'Yes. While the page is open, the remaining time ticks down every second.',
      },
      {
        question: 'What are "business days"?',
        answer:
          'Business days are weekdays, Monday through Friday. The count excludes Saturdays and Sundays but does not account for public holidays, which vary by country.',
      },
      {
        question: 'What happens after the target passes?',
        answer: 'The display switches to show how much time has elapsed since the target date instead of time remaining.',
      },
    ],
    keywords: ['countdown calculator', 'time until', 'days until', 'countdown timer'],
    related: ['date-difference-calculator', 'age-calculator', 'time-zone-converter'],
  },
];

const TOOLS_BY_SLUG = new Map(TOOLS.map((tool) => [tool.slug, tool]));

export function getTool(slug: string): ToolDefinition | undefined {
  return TOOLS_BY_SLUG.get(slug);
}

export function getToolsByCategory(category: CategoryId): ToolDefinition[] {
  return TOOLS.filter((tool) => tool.category === category);
}

export function getCategory(id: CategoryId): ToolCategory | undefined {
  return CATEGORIES.find((c) => c.id === id);
}

export function getRelatedTools(tool: ToolDefinition): ToolDefinition[] {
  return tool.related
    .map((slug) => TOOLS_BY_SLUG.get(slug))
    .filter((t): t is ToolDefinition => Boolean(t));
}

export function allToolSlugs(): string[] {
  return TOOLS.map((tool) => tool.slug);
}
