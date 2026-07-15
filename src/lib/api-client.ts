import { useAuthStore } from '@/core/stores/auth.store';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

class ApiClient {
  private baseURL: string;

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

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<{ data: T }> {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getToken();
    
    // Fonction utilitaire pour lire le cookie CSRF
    const getCookie = (name: string): string | null => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) {
        return parts.pop()?.split(';').shift() || null;
      }
      return null;
    };

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      ...options.headers,
    };

    // Ajouter le header CSRF pour les mutations
    const method = options.method || 'GET';
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase())) {
      const csrfToken = getCookie('bo_csrf_token');
      if (csrfToken) {
        (headers as Record<string, string>)['X-CSRF-Token'] = csrfToken;
      }
    }

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include', // Pour envoyer les cookies httpOnly
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Une erreur est survenue' }));
      throw new Error(error.message || `Erreur HTTP ${response.status}`);
    }

    const json = await response.json();
    return { data: json };
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
