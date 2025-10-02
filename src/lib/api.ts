import type { StoreInfo, DailyPerformance, WeeklySnapshot } from '@/types';
import { mockStoreInfo, getMockPerformance, getMockSnapshots } from './mock-data';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://wingsetc.dev/api/v1';
const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
const MOCK_MODE = false;

const fetcher = async (endpoint: string) => {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'x-api-key': API_KEY || '',
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) {
    console.error(`API Error: ${res.statusText} on ${endpoint}`);
    // Return empty array or throw error depending on desired behavior for failed requestss need
    return [];
  }
  return res.json();
};

export const getStoreInfo = async (): Promise<StoreInfo[]> => {
  if (MOCK_MODE) return Promise.resolve(mockStoreInfo);
  
  let allStores: StoreInfo[] = [];
  let page = 1;
  let hasNext = true;
  
  while (hasNext) {
    const params = new URLSearchParams({ 
      page: page.toString(),
      per_page: '100' // Get more items per page to reduce API calls
    });
    
    const response = await fetcher(`/store?${params.toString()}`);
    
    if (!response) {
      console.log('No response received, breaking pagination loop');
      break;
    }
    
    // Check pagination info
    hasNext = response.has_next === true;
    
    // Extract store data from response
    let pageData: StoreInfo[] = [];
    if (Array.isArray(response)) {
      pageData = response;
      hasNext = false; // No pagination info available
    } else if (response && Array.isArray(response.data)) {
      pageData = response.data;
    } else if (response && Array.isArray(response.stores)) {
      pageData = response.stores;
    } else {
      console.log('No store data found in response structure');
      hasNext = false;
    }
    
    allStores.push(...pageData);
    page++;
    
    // Safety break to prevent infinite loops
    if (page > 100) {
      console.warn('Reached maximum page limit (100), breaking store info pagination loop');
      break;
    }
  }
  
  return allStores;
};

export const getPerformance = async (startDate: string, endDate: string, stores: string[] = []): Promise<DailyPerformance[]> => {
    if (MOCK_MODE) {
        const store = stores.length > 0 ? stores[0] : 'all';
        return Promise.resolve(getMockPerformance(new Date(startDate), new Date(endDate), store));
    }
    
    let allPerformanceData: DailyPerformance[] = [];
    let page = 1;
    let hasNext = true;
    
    while (hasNext) {
        const params = new URLSearchParams({ 
            start_date: startDate, 
            end_date: endDate,
            page: page.toString(),
            per_page: '100' // Get more items per page to reduce API calls
        });
        
        // Add store filtering if stores provided
        if (stores && stores.length > 0) {
            stores.forEach(store => {
                params.append('store', store);
            });
        }
        
        const response = await fetcher(`/performance?${params.toString()}`);
        
        if (!response) {
            console.log('No response received, breaking pagination loop');
            break;
        }
        
        // Check pagination info
        hasNext = response.has_next === true;
        
        // Handle different possible response structures
        let pageData: DailyPerformance[] = [];
        
        if (Array.isArray(response)) {
            // If response is directly an array
            pageData = response;
            hasNext = false; // No pagination info available
        } else if (response && response.dates && Array.isArray(response.dates)) {
            // If data is in a 'dates' property (which seems to be the case)
            response.dates.forEach((dateEntry: any) => {
                if (dateEntry.stores && Array.isArray(dateEntry.stores)) {
                    dateEntry.stores.forEach((storeData: any) => {
                        // Flatten the nested structure - extract sales data to top level
                        const flattenedData = {
                            Date: dateEntry.date,
                            StoreNbr: storeData.StoreNbr || storeData.store_nbr,
                            // Extract sales data to top level
                            ...(storeData.sales || {}),
                            // Extract labor data to top level  
                            ...(storeData.Labor || {}),
                            // Keep any other top-level properties
                            ...storeData,
                        };
                        pageData.push(flattenedData);
                    });
                }
            });
        } else if (response && Array.isArray(response.data)) {
            // If data is in a 'data' property
            pageData = response.data;
        } else if (response && response.performance && Array.isArray(response.performance)) {
            // If data is in a 'performance' property
            pageData = response.performance;
        }
        
        allPerformanceData.push(...pageData);
        page++;
        
        // Safety break to prevent infinite loops
        if (page > 100) {
            console.warn('Reached maximum page limit (100), breaking pagination loop');
            break;
        }
    }
    
    return allPerformanceData;
};

export const getSnapshots = async (startDate: string, endDate: string, stores: string[] = []): Promise<WeeklySnapshot[]> => {
    if (MOCK_MODE) {
        return Promise.resolve(getMockSnapshots(new Date(startDate), new Date(endDate), stores));
    }
    
    let allSnapshots: WeeklySnapshot[] = [];
    let page = 1;
    let hasNext = true;
    

    while (hasNext) { // Remove page limit for comprehensive data
        
        const params = new URLSearchParams({ 
            start_date: startDate, 
            end_date: endDate,
            page: page.toString(),
            per_page: '100'
        });

        // Add store filtering if stores provided
        if (stores && stores.length > 0) {
            stores.forEach(store => {
                params.append('store', store);
            });
        }

        const apiUrl = `/snapshots?${params.toString()}`;
        
        const response = await fetcher(apiUrl);
        
        if (!response) {
            console.log('❌ No response received from snapshots API');
            break;
        }


        // Extract snapshot data from response
        let pageData: WeeklySnapshot[] = [];
        if (Array.isArray(response)) {
            pageData = response;
        } else if (response && Array.isArray(response.data)) {
            pageData = response.data;
        } else if (response && Array.isArray(response.snapshots)) {
            pageData = response.snapshots;
        } else if (response && Array.isArray(response.snapshot_data)) {
            pageData = response.snapshot_data;
        } else {
            console.log('❌ No snapshot data found in any expected location');
            console.log('📦 Available keys:', response ? Object.keys(response) : 'none');
            break;
        }

        allSnapshots.push(...pageData);
        hasNext = response.has_next;
        page++;
    }


    return allSnapshots;
};
