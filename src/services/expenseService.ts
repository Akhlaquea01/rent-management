import { apiFetch } from './api';
import { Expense } from '../types';

// ── Response shapes from the backend ──────────────────────────────────────────

interface ApiMonthData {
    incomeDetails: { totalIncome: number };
    expense_details: Array<{
        date: string;
        amount: number;
        category: string;
        description: string;
        sub_category: string;
        paymentMethod: string;
        tags?: string[];
    }>;
}

interface ExpenseApiResponse {
    success: boolean;
    data: Record<string, Record<string, ApiMonthData>>;
}

// ── Adapter ───────────────────────────────────────────────────────────────────

/**
 * Flattens the nested `{ year → month → {expense_details} }` API response
 * into a flat `Expense[]` array that the existing UI expects.
 */
export const flattenExpenses = (
    apiData: Record<string, Record<string, ApiMonthData>>
): Expense[] =>
    Object.values(apiData).flatMap((yearData) =>
        Object.values(yearData).flatMap((monthData) =>
            (monthData.expense_details ?? []).map((e, idx) => ({
                id: idx, // placeholder – API doesn't return id in flat list
                date: e.date,
                amount: e.amount,
                category: e.category,
                description: e.description,
                sub_category: e.sub_category,
                paymentMethod: e.paymentMethod,
                tags: e.tags ?? [],
            }))
        )
    );

// ── Service methods ───────────────────────────────────────────────────────────

/**
 * Fetches all expenses grouped by year/month.
 * GET /expenses?limit=1000[&year=YYYY]
 */
export const getAll = (year?: number): Promise<ExpenseApiResponse> =>
    apiFetch<ExpenseApiResponse>(
        `/expenses?limit=1000${year !== undefined ? `&year=${year}` : ''}`
    );

/**
 * Convenience: fetch all expenses and return a flat Expense[] ready for the UI.
 */
export const fetchFlatExpenses = async (year?: number): Promise<Expense[]> => {
    const res = await getAll(year);
    return flattenExpenses(res.data);
};

interface CreateExpenseInput {
    txn_date: string;
    amount: number;
    description: string;
    category: string;
    sub_category: string;
    payment_method: string;
    tags?: string[];
}

/**
 * Creates a new expense record.
 * POST /expenses
 */
export const create = (input: CreateExpenseInput) =>
    apiFetch('/expenses', {
        method: 'POST',
        body: JSON.stringify(input),
    });
