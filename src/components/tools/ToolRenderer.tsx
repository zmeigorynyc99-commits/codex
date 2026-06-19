'use client';

import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';

/**
 * Maps a tool's `component` key (from the registry in src/lib/tools.ts) to its
 * implementation. Each tool is code-split with next/dynamic so a given tool
 * page ships only the JavaScript it needs.
 */
const loading = () => (
  <div className="card animate-pulse">
    <div className="h-6 w-1/3 rounded bg-slate-200 dark:bg-slate-800" />
    <div className="mt-4 h-32 rounded bg-slate-100 dark:bg-slate-900" />
  </div>
);

const REGISTRY: Record<string, ComponentType> = {
  PercentageCalculator: dynamic(() => import('./PercentageCalculator'), { loading }),
  AgeCalculator: dynamic(() => import('./AgeCalculator'), { loading }),
  DateDifferenceCalculator: dynamic(() => import('./DateDifferenceCalculator'), { loading }),
  RandomNumberGenerator: dynamic(() => import('./RandomNumberGenerator'), { loading }),
  PasswordGenerator: dynamic(() => import('./PasswordGenerator'), { loading }),
  WordCounter: dynamic(() => import('./WordCounter'), { loading }),
  TextCaseConverter: dynamic(() => import('./TextCaseConverter'), { loading }),
  RemoveDuplicateLines: dynamic(() => import('./RemoveDuplicateLines'), { loading }),
  UnitConverter: dynamic(() => import('./UnitConverter'), { loading }),
  TemperatureConverter: dynamic(() => import('./TemperatureConverter'), { loading }),
  BmiCalculator: dynamic(() => import('./BmiCalculator'), { loading }),
  LoanCalculator: dynamic(() => import('./LoanCalculator'), { loading }),
  TimeZoneConverter: dynamic(() => import('./TimeZoneConverter'), { loading }),
  UnixTimestampConverter: dynamic(() => import('./UnixTimestampConverter'), { loading }),
  QrCodeGenerator: dynamic(() => import('./QrCodeGenerator'), { loading }),
  UrlEncoderDecoder: dynamic(() => import('./UrlEncoderDecoder'), { loading }),
  JsonFormatter: dynamic(() => import('./JsonFormatter'), { loading }),
  Base64EncoderDecoder: dynamic(() => import('./Base64EncoderDecoder'), { loading }),
  ColorConverter: dynamic(() => import('./ColorConverter'), { loading }),
  CountdownCalculator: dynamic(() => import('./CountdownCalculator'), { loading }),
};

export function ToolRenderer({ component }: { component: string }) {
  const Component = REGISTRY[component];
  if (!Component) {
    return <p className="text-sm text-red-600">Tool unavailable.</p>;
  }
  return <Component />;
}
