import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { RentManagementData, ShopData, Tenant } from '../types';

const initialData: RentManagementData = {
  years: {},
  advanceTransactions: {},
};

interface RentStore {
  data: RentManagementData;
  loading: boolean;
  error: string | null;
  fetchData: () => Promise<void>;
  addTenant: (year: string, shopNumber: string, shopData: ShopData) => void;
  updateTenant: (year: string, shopNumber: string, shopData: ShopData) => void;
  deleteTenant: (year: string, shopNumber: string) => void;
  getTenantByShopNumber: (year: string, shopNumber: string) => ShopData | undefined;
}

export const useRentStore = create<RentStore>()(
  persist(
    (set, get) => ({
      data: initialData,
      loading: true,
      error: null,
      fetchData: async () => {
        set({ loading: true, error: null });
        try {
          const res = await fetch('https://akhlaquea01.github.io/records_siwaipatti/data.json');
          const json = await res.json();
          // Transform response to { years: { ... }, advanceTransactions: ... }
          const { advanceTransactions, ...years } = json;
          set({ data: { years, advanceTransactions: advanceTransactions || {} }, loading: false });
        } catch (err) {
          set({ error: 'Failed to load data', loading: false });
        }
      },
      addTenant: (year, shopNumber, shopData) => {
        set((state) => {
          const newData = { ...state.data };
          if (!newData.years[year]) {
            newData.years[year] = { shops: {} };
          }
          newData.years[year].shops = {
            ...newData.years[year].shops,
            [shopNumber]: shopData,
          };
          return { data: newData };
        });
      },
      updateTenant: (year, shopNumber, shopData) => {
        set((state) => {
          const newData = { ...state.data };
          if (newData.years[year] && newData.years[year].shops[shopNumber]) {
            newData.years[year].shops = {
              ...newData.years[year].shops,
              [shopNumber]: shopData,
            };
          }
          return { data: newData };
        });
      },
      deleteTenant: (year, shopNumber) => {
        set((state) => {
          const newData = { ...state.data };
          if (newData.years[year] && newData.years[year].shops[shopNumber]) {
            const { [shopNumber]: _, ...rest } = newData.years[year].shops;
            newData.years[year].shops = rest;
          }
          return { data: newData };
        });
      },
      getTenantByShopNumber: (year, shopNumber) => {
        const data = get().data;
        return data.years[year]?.shops[shopNumber];
      },
    }),
    {
      name: 'rent-management-store',
      migrate: (persistedState: any, version) => {
        if (
          !persistedState ||
          !persistedState.data ||
          !persistedState.data.years ||
          Object.keys(persistedState.data.years).length === 0
        ) {
          return { data: initialData };
        }
        return persistedState;
      },
    }
  )
); 