import { apiFetch } from './api';
import { YearData } from '../types';

interface YearViewResponse {
    success: boolean;
    message: string;
    data: {
        [year: string]: YearData;
    };
}

/**
 * Fetches aggregated rent data for all shops in a given year.
 * GET /rent-ledger/year/:year
 * Response shape matches the legacy {year}.json format exactly.
 */
export const getYearView = (year: string): Promise<YearViewResponse> =>
    apiFetch<YearViewResponse>(`/rent-ledger/year/${year}`);
