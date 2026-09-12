import type { Bench } from '@/types';

const STORAGE_KEY = 'bench-archive-data';
const COMPARE_STORAGE_KEY = 'bench-archive-compare';

export function loadBenches(): Bench[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Failed to load benches from localStorage:', error);
  }
  return [];
}

export function saveBenches(benches: Bench[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(benches));
  } catch (error) {
    console.error('Failed to save benches to localStorage:', error);
  }
}

export function clearBenches(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear benches from localStorage:', error);
  }
}

export function loadCompareIds(): string[] {
  try {
    const data = localStorage.getItem(COMPARE_STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed.filter((id): id is string => typeof id === 'string');
      }
    }
  } catch (error) {
    console.error('Failed to load compare ids from localStorage:', error);
  }
  return [];
}

export function saveCompareIds(ids: string[]): void {
  try {
    localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(ids));
  } catch (error) {
    console.error('Failed to save compare ids to localStorage:', error);
  }
}
