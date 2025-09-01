import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
  useMemo,
} from "react";
import { RentManagementData, ShopData, AdvanceTransaction } from "../types";

// Initial state
const initialData: RentManagementData = {
  years: {},
  advanceTransactions: {},
};

// State interface
interface RentState {
  data: RentManagementData;
  loading: boolean;
  error: string | null;
  loadingYears: Set<string>; // Track which years are being loaded
}

// Action types
type RentAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_DATA"; payload: RentManagementData }
  | { type: "SET_YEAR_LOADING"; payload: { year: string; loading: boolean } }
  | { type: "SET_YEAR_DATA"; payload: { year: string; yearData: any } }
  | {
      type: "ADD_TENANT";
      payload: { year: string; shopNumber: string; shopData: ShopData };
    }
  | {
      type: "UPDATE_TENANT";
      payload: { year: string; shopNumber: string; shopData: ShopData };
    }
  | { type: "DELETE_TENANT"; payload: { year: string; shopNumber: string } }
  | {
      type: "UPDATE_MONTHLY_DATA";
      payload: {
        year: string;
        shopNumber: string;
        month: string;
        monthlyData: any;
      };
    }
  | {
      type: "ADD_ADVANCE_TRANSACTION";
      payload: { shopNumber: string; transaction: AdvanceTransaction };
    };

// Reducer function
const rentReducer = (state: RentState, action: RentAction): RentState => {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.payload };

    case "SET_ERROR":
      return { ...state, error: action.payload };

    case "SET_DATA":
      return { ...state, data: action.payload, loading: false, error: null };

    case "SET_YEAR_LOADING": {
      const { year, loading } = action.payload;
      const newLoadingYears = new Set<string>(state.loadingYears);
      if (loading) {
        newLoadingYears.add(year);
      } else {
        newLoadingYears.delete(year);
      }
      return { ...state, loadingYears: newLoadingYears };
    }

    case "SET_YEAR_DATA": {
      const { year, yearData } = action.payload;
      const newData = { ...state.data };
      newData.years = { ...newData.years, [year]: yearData };
      return { ...state, data: newData };
    }

    case "ADD_TENANT": {
      const { year, shopNumber, shopData } = action.payload;
      const newData = { ...state.data };
      // Create a deep copy to ensure React detects the change
      newData.years = { ...newData.years };
      if (!newData.years[year]) {
        newData.years[year] = { shops: {} };
      } else {
        newData.years[year] = { ...newData.years[year] };
      }
      newData.years[year].shops = {
        ...newData.years[year].shops,
        [shopNumber]: shopData,
      };

      return { ...state, data: newData };
    }

    case "UPDATE_TENANT": {
      const { year, shopNumber, shopData } = action.payload;
      const newData = { ...state.data };
      if (newData.years[year] && newData.years[year].shops[shopNumber]) {
        // Create a deep copy to ensure React detects the change
        newData.years = { ...newData.years };
        newData.years[year] = { ...newData.years[year] };
        newData.years[year].shops = {
          ...newData.years[year].shops,
          [shopNumber]: shopData,
        };
      }

      return { ...state, data: newData };
    }

    case "DELETE_TENANT": {
      const { year, shopNumber } = action.payload;
      const newData = { ...state.data };
      if (newData.years[year] && newData.years[year].shops[shopNumber]) {
        // Create a deep copy to ensure React detects the change
        newData.years = { ...newData.years };
        newData.years[year] = { ...newData.years[year] };
        const { [shopNumber]: _, ...rest } = newData.years[year].shops;
        newData.years[year].shops = rest;
      }

      return { ...state, data: newData };
    }

    case "UPDATE_MONTHLY_DATA": {
      const { year, shopNumber, month, monthlyData } = action.payload;
      const newData = { ...state.data };
      if (newData.years[year] && newData.years[year].shops[shopNumber]) {
        // Create a deep copy to ensure React detects the change
        newData.years = { ...newData.years };
        newData.years[year] = { ...newData.years[year] };
        newData.years[year].shops = { ...newData.years[year].shops };
        newData.years[year].shops[shopNumber] = {
          ...newData.years[year].shops[shopNumber],
        };
        newData.years[year].shops[shopNumber].monthlyData = {
          ...newData.years[year].shops[shopNumber].monthlyData,
          [month]: monthlyData,
        };
      }

      return { ...state, data: newData };
    }

    case "ADD_ADVANCE_TRANSACTION": {
      const { shopNumber, transaction } = action.payload;
      const newData = { ...state.data };
      // Create a deep copy to ensure React detects the change
      newData.advanceTransactions = { ...newData.advanceTransactions };
      if (!newData.advanceTransactions[shopNumber]) {
        newData.advanceTransactions[shopNumber] = [];
      }
      newData.advanceTransactions[shopNumber] = [
        ...newData.advanceTransactions[shopNumber],
        transaction,
      ];

      return { ...state, data: newData };
    }

    default:
      return state;
  }
};

// Context interface
interface RentContextType {
  state: RentState;
  fetchData: () => Promise<void>;
  fetchYearData: (year: string) => Promise<void>;
  isYearLoading: (year: string) => boolean;
  addTenant: (year: string, shopNumber: string, shopData: ShopData) => void;
  updateTenant: (year: string, shopNumber: string, shopData: ShopData) => void;
  deleteTenant: (year: string, shopNumber: string) => void;
  getTenantByShopNumber: (
    year: string,
    shopNumber: string
  ) => ShopData | undefined;
  updateMonthlyData: (
    year: string,
    shopNumber: string,
    month: string,
    monthlyData: any
  ) => void;
  addAdvanceTransaction: (
    shopNumber: string,
    transaction: AdvanceTransaction
  ) => void;
  forceRefresh: () => void;
}

// Create context
const RentContext = createContext<RentContextType | undefined>(undefined);

// Provider component
interface RentProviderProps {
  children: ReactNode;
}

export const RentProvider: React.FC<RentProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(rentReducer, {
    data: initialData,
    loading: true,
    error: null,
    loadingYears: new Set<string>(),
  });

  // Fetch advance transactions from data.json
  const fetchAdvanceTransactions = async () => {
    try {
      const res = await fetch(
        "https://akhlaquea01.github.io/records_siwaipatti/data.json"
      );
      const json = await res.json();

      // data.json now only contains advanceTransactions
      const transformedData = {
        years: {},
        advanceTransactions: json.advanceTransactions || {},
      };

      dispatch({ type: "SET_DATA", payload: transformedData });
    } catch (err) {
      console.error("Error loading advance transactions:", err);
      dispatch({ type: "SET_ERROR", payload: "Failed to load advance transactions" });
    }
  };

  // Fetch data from API (legacy function - kept for backward compatibility)
  const fetchData = async () => {
    dispatch({ type: "SET_LOADING", payload: true });
    dispatch({ type: "SET_ERROR", payload: null });

    try {
      await fetchAdvanceTransactions();
      dispatch({ type: "SET_LOADING", payload: false });
    } catch (err) {
      dispatch({ type: "SET_ERROR", payload: "Failed to load data" });
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  // Fetch year-specific data
  const fetchYearData = async (year: string) => {
    // Don't fetch if already loading or already loaded
    if (state.loadingYears.has(year) || state.data.years[year]) {
      return;
    }

    dispatch({ type: "SET_YEAR_LOADING", payload: { year, loading: true } });

    try {
      const res = await fetch(
        `https://akhlaquea01.github.io/records_siwaipatti/${year}.json`
      );
      
      if (!res.ok) {
        throw new Error(`Failed to load data for year ${year}`);
      }
      
      const json = await res.json();
      
      // Extract the year data from the response
      const yearData = json[year];
      if (!yearData) {
        throw new Error(`No data found for year ${year}`);
      }

      dispatch({ type: "SET_YEAR_DATA", payload: { year, yearData } });
    } catch (err) {
      console.error(`Error loading year ${year}:`, err);
      dispatch({ type: "SET_ERROR", payload: `Failed to load data for year ${year}` });
    } finally {
      dispatch({ type: "SET_YEAR_LOADING", payload: { year, loading: false } });
    }
  };

  // Check if a specific year is loading
  const isYearLoading = (year: string): boolean => {
    return state.loadingYears.has(year);
  };

  // Action creators
  const addTenant = (year: string, shopNumber: string, shopData: ShopData) => {
    dispatch({
      type: "ADD_TENANT",
      payload: { year, shopNumber, shopData },
    });
  };

  const updateTenant = (
    year: string,
    shopNumber: string,
    shopData: ShopData
  ) => {
    dispatch({
      type: "UPDATE_TENANT",
      payload: { year, shopNumber, shopData },
    });
  };

  const deleteTenant = (year: string, shopNumber: string) => {
    dispatch({
      type: "DELETE_TENANT",
      payload: { year, shopNumber },
    });
  };

  const getTenantByShopNumber = (
    year: string,
    shopNumber: string
  ): ShopData | undefined => {
    return state.data.years[year]?.shops[shopNumber];
  };

  const updateMonthlyData = (
    year: string,
    shopNumber: string,
    month: string,
    monthlyData: any
  ) => {
    dispatch({
      type: "UPDATE_MONTHLY_DATA",
      payload: { year, shopNumber, month, monthlyData },
    });
  };

  const addAdvanceTransaction = (
    shopNumber: string,
    transaction: AdvanceTransaction
  ) => {
    dispatch({
      type: "ADD_ADVANCE_TRANSACTION",
      payload: { shopNumber, transaction },
    });
  };

  const forceRefresh = () => {
    // Clear all loaded years and reload current year if any
    const currentYears = Object.keys(state.data.years);
    if (currentYears.length > 0) {
      // Reload the most recent year
      const latestYear = currentYears.sort().reverse()[0];
      fetchYearData(latestYear);
    }
  };

  // Load initial data on mount (load advance transactions and current year by default)
  useEffect(() => {
    const currentYear = new Date().getFullYear().toString(); // Use actual current year
    fetchAdvanceTransactions();
    fetchYearData(currentYear);
  }, []);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue: RentContextType = useMemo(
    () => ({
      state,
      fetchData,
      fetchYearData,
      isYearLoading,
      addTenant,
      updateTenant,
      deleteTenant,
      getTenantByShopNumber,
      updateMonthlyData,
      addAdvanceTransaction,
      forceRefresh,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state]
  );

  return (
    <RentContext.Provider value={contextValue}>{children}</RentContext.Provider>
  );
};

// Custom hook to use the context
export const useRentContext = () => {
  const context = useContext(RentContext);
  if (context === undefined) {
    throw new Error("useRentContext must be used within a RentProvider");
  }
  return context;
};

// Export for backward compatibility (replaces useRentStore)
export const useRentStore = useRentContext;
