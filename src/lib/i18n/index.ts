import type { Lang } from '@/types';
import { en, type TKey } from './en';
import { bn } from './bn';

export type { TKey };
export type TFn = (key: TKey, vars?: Record<string, string | number>) => string;

const dicts: Record<Lang, Record<TKey, string>> = { en, bn };

/** Translator for a language (usable in Server and Client Components). */
export function getT(lang: Lang): TFn {
  return (key, vars) => {
    let s = dicts[lang][key] ?? en[key] ?? key;
    if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
    return s;
  };
}
