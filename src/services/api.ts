/**
 * Base API fetch wrapper.
 * All service files import from here – never call fetch() directly in components or context.
 */

const BASE_URL =
    (process.env.REACT_APP_API_BASE_URL ?? 'http://localhost:5000/api/v1').replace(/\/$/, '');

export class ApiError extends Error {
    constructor(public status: number, message: string) {
        super(message);
        this.name = 'ApiError';
    }
}

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
    const url = `${BASE_URL}${path}`;
    const res = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
        ...options,
    });

    if (!res.ok) {
        let message = `API error ${res.status}`;
        try {
            const body = await res.json();
            message = body?.message ?? message;
        } catch {
            // ignore JSON parse error
        }
        throw new ApiError(res.status, message);
    }

    return res.json() as Promise<T>;
}
