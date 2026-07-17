import { useAuthStore } from '@/core/stores/auth.store';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

class ApiClient {
  private baseURL: string;
  private refreshPromise: Promise<void> | null = null;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  private getToken(): string | null {
    // Utiliser le store Zustand au lieu de localStorage
    return useAuthStore.getState().accessToken;
  }

  setToken(_token: string) {
    // Déprécié : le token est maintenant géré par le store
    console.warn('setToken is deprecated, tokens are managed by auth store');
  }

  clearToken() {
    // Déprécié : le token est maintenant géré par le store
    console.warn('clearToken is deprecated, tokens are managed by auth store');
  }

  // Fonction utilitaire pour lire le cookie CSRF
  private getCookie(name: string): string | null {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      return parts.pop()?.split(';').shift() || null;
    }
    return null;
  }

  private buildHeaders(options: RequestInit): Headers {
    const token = this.getToken();
    const headers = new Headers({
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
    });

    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    // Ajouter les headers fournis par l'appelant
    if (options.headers) {
      const providedHeaders = options.headers as Record<string, string>;
      Object.entries(providedHeaders).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          headers.set(key, value);
        }
      });
    }

    // Ajouter le header CSRF pour les mutations
    const method = options.method || 'GET';
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase())) {
      const csrfToken = this.getCookie('bo_csrf_token');
      if (csrfToken) {
        headers.set('X-CSRF-Token', csrfToken);
      }
    }

    return headers;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    isRetry = false,
  ): Promise<{ data: T }> {
    const url = `${this.baseURL}${endpoint}`;
    const headers = this.buildHeaders(options);

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include', // Pour envoyer les cookies httpOnly
    });

    if (!response.ok) {
      // Rafraîchir le token en cas d'expiration et réessayer une fois
      if (response.status === 401 && !isRetry) {
        try {
          await this.refreshToken();
        } catch (refreshError) {
          window.location.href = '/login';
          throw new Error('Session expirée, veuillez vous reconnecter');
        }
        return this.request<T>(endpoint, options, true);
      }

      const error = await response.json().catch(() => ({ message: 'Une erreur est survenue' }));
      throw new Error(error.message || `Erreur HTTP ${response.status}`);
    }

    const json = await response.json();
    return { data: json };
  }

  private async refreshToken(): Promise<void> {
    if (!this.refreshPromise) {
      this.refreshPromise = useAuthStore
        .getState()
        .refreshSession()
        .finally(() => {
          this.refreshPromise = null;
        });
    }
    await this.refreshPromise;
  }

  async get<T>(endpoint: string): Promise<{ data: T }> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, body?: any): Promise<{ data: T }> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async put<T>(endpoint: string, body?: any): Promise<{ data: T }> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  async patch<T>(endpoint: string, body?: any): Promise<{ data: T }> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  async delete<T>(endpoint: string): Promise<{ data: T }> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  getBaseUrl(): string {
    return this.baseURL;
  }
}

export const apiClient = new ApiClient();
