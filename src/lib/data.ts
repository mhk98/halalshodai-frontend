import 'server-only';
import { cache } from 'react';
import { apiGetSafe } from './api-server';
import type { Category, Settings } from '@/types';

/** Shared, request-deduplicated loaders used by layouts and pages. */
export const getSettings = cache(() => apiGetSafe<Settings>('/settings', {}, { revalidate: 300 }));
export const getCategories = cache(() => apiGetSafe<Category[]>('/categories', [], { revalidate: 300 }));
