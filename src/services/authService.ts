import { apiFetch } from './api';

interface LoginResponse {
    success: boolean;
    message: string;
}

/**
 * Verifies the passkey against the backend.
 * POST /auth/login
 */
export const login = (password: string): Promise<LoginResponse> =>
    apiFetch<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ password }),
    });
