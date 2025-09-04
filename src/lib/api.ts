import type { StoreInfo, DailyPerformance, WeeklySnapshot } from '@/types';
import { mockStoreInfo, getMockPerformance, getMockSnapshots } from './mock-data';

const API_BASE = process.env.API_BASE || 'https://wingsetc.dev/api/v1';
const API_KEY = process.env.API_KEY;
const MOCK_MODE = true;

const fetcher = async (endpoint: string) => {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'x-api-key': API_KEY || '',
      'Content-Type': 'application/json',
    },
    next: { revalidate: 300 } // Revalidate every 5 minutes
  });
  if (!res.ok) {
    // In a real app, you'd want more robust error handling
    console.error(`API Error: ${res.statusText} on ${endpoint}`);
    // Return empty array or throw error depending on desired behavior for failed requests
    return [];
  }
  return res.json();
};

export const getStoreInfo = async (): Promise<StoreInfo[]> => {
  if (MOCK_MODE) return Promise.resolve(mockStoreInfo);
  return fetcher('/store-info');
};

export const getPerformance = async (startDate: string, endDate: string, store: string): Promise<DailyPerformance[]> => {
    if (MOCK_MODE) {
        return Promise.resolve(getMockPerformance(new Date(startDate), new Date(endDate), store));
    }
    const params = new URLSearchParams({ start_date: startDate, end_date: endDate, store });
    return fetcher(`/performance?${params.toString()}`);
};

export const getSnapshots = async (startDate: string, endDate: string, stores: string[]): Promise<WeeklySnapshot[]> => {
    if (MOCK_MODE) {
        return Promise.resolve(getMockSnapshots(new Date(startDate), new Date(endDate), stores));
    }
    const params = new URLSearchParams({ start_date: startDate, end_date: endDate });
    stores.forEach(store => params.append('store', store));
    return fetcher(`/snapshots?${params.toString()}`);
};
