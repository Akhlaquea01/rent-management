import { apiFetch } from './api';
import { ApiTenant } from '../types';

// ── Response shapes ───────────────────────────────────────────────────────────

export interface ApiTenantRecord {
    _id: string;
    shop_no: string;
    tenant: ApiTenant;
    createdAt: string;
    updatedAt: string;
}

interface TenantListResponse {
    success: boolean;
    data: ApiTenantRecord[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
}

interface TenantSingleResponse {
    success: boolean;
    data: ApiTenantRecord;
}

// ── Queries ───────────────────────────────────────────────────────────────────

/**
 * Fetches all tenants.
 * GET /tenants?limit=1000
 */
export const getAll = (params?: {
    status?: 'Active' | 'Inactive';
    shop_no?: string;
    tenant_name?: string;
}): Promise<TenantListResponse> => {
    const qs = new URLSearchParams({ limit: '1000' });
    if (params?.status) qs.set('status', params.status);
    if (params?.shop_no) qs.set('shop_no', params.shop_no);
    if (params?.tenant_name) qs.set('tenant_name', params.tenant_name);
    return apiFetch<TenantListResponse>(`/tenants?${qs.toString()}`);
};

/**
 * Fetches a single tenant by MongoDB _id.
 * GET /tenants/:id
 */
export const getById = (id: string): Promise<TenantSingleResponse> =>
    apiFetch<TenantSingleResponse>(`/tenants/${id}`);

// ── Mutations ─────────────────────────────────────────────────────────────────

interface CreateTenantInput {
    shop_no: string;
    tenant_name: string;
    tenant_name_hindi?: string;
    mobile_number: string;
    monthly_rent: number;
    status: 'Active' | 'Inactive';
    agreement_status?: string;
    fathers_name?: string;
    address?: string;
    email?: string;
    id_number?: string;
    advance_paid?: number;
    advance_remaining?: number;
    total_due?: number;
    due_months?: string;
    comment?: string;
}

/**
 * Creates a new tenant.
 * POST /tenants
 */
export const create = (input: CreateTenantInput): Promise<TenantSingleResponse> =>
    apiFetch<TenantSingleResponse>('/tenants', {
        method: 'POST',
        body: JSON.stringify(input),
    });

/**
 * Fully replaces a tenant record.
 * PUT /tenants/:id
 */
export const update = (id: string, input: CreateTenantInput): Promise<TenantSingleResponse> =>
    apiFetch<TenantSingleResponse>(`/tenants/${id}`, {
        method: 'PUT',
        body: JSON.stringify(input),
    });

/**
 * Partially updates a tenant.
 * PATCH /tenants/:id
 */
export const partialUpdate = (
    id: string,
    patch: Partial<CreateTenantInput>
): Promise<TenantSingleResponse> =>
    apiFetch<TenantSingleResponse>(`/tenants/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
    });

/**
 * Deletes a tenant.
 * DELETE /tenants/:id
 */
export const remove = (id: string) =>
    apiFetch(`/tenants/${id}`, { method: 'DELETE' });
