import { apiFetch } from './api';
import { AdvanceTransaction } from '../types';

interface AdvanceTrackerResponse {
    success: boolean;
    data: Record<string, AdvanceTransaction[]>;
    pagination: { total: number; page: number; limit: number; totalPages: number };
}

/**
 * Fetches all advance tracker records, grouped by shop_no.
 * GET /advance-tracker?limit=1000
 * Response shape matches the legacy data.json `advanceTransactions` field.
 */
export const getAll = (): Promise<AdvanceTrackerResponse> =>
    apiFetch<AdvanceTrackerResponse>('/advance-tracker?limit=1000');

interface CreateAdvanceInput {
    shop_no: string;
    tenant_name: string;
    type: 'Deposit' | 'Deduction' | 'Advance Deduction';
    amount: number;
    txn_date: string;
    description?: string;
    status?: string;
    remarks?: string;
}

/**
 * Creates a new advance tracker record.
 * POST /advance-tracker
 */
export const create = (input: CreateAdvanceInput) =>
    apiFetch('/advance-tracker', {
        method: 'POST',
        body: JSON.stringify(input),
    });
