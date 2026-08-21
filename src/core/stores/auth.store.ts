import { create } from 'zustand';
import axios from 'axios';
import type { AuthUser, Role } from '../types';
import api, { setAccessToken } from '../api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  refreshSession: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  clearError: () => void;
  hasRole: (...roles: Role[]) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      console.log('Appel API login...');
      const { data } = await api.post('/backoffice/auth/login', { email, password });
      console.log('Réponse API login:', data);
      // Stocker l'access token dans le store et dans l'interceptor
      setAccessToken(data.accessToken);
      set({ user: data.user, accessToken: data.accessToken, isAuthenticated: true, isLoading: false });
      console.log('Store mis à jour avec user:', data.user, 'isAuthenticated: true');
    } catch (err: unknown) {
      console.error('Erreur login:', err);
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Email ou mot de passe incorrect';
      set({ error: message, isLoading: false });
      throw new Error('Login failed');
    }
  },

  logout: async () => {
    try {
      await api.post('/backoffice/auth/logout');
    } catch {
      // ignore
    } finally {
      // Nettoyer le store et l'interceptor
      setAccessToken(null);
      set({ user: null, accessToken: null, isAuthenticated: false });
    }
  },

  fetchProfile: async () => {
    try {
      const { data } = await api.get('/backoffice/auth/profile');
      set({ user: data, isAuthenticated: true });
    } catch {
      setAccessToken(null);
      set({ user: null, accessToken: null, isAuthenticated: false });
    }
  },

  refreshSession: async () => {
    try {
      // Utiliser axios directement sans l'interceptor pour éviter boucle infinie
      const { data } = await axios.post(`${API_BASE_URL}/backoffice/auth/refresh`, {}, {
        withCredentials: true,
      });
      // Stocker l'access token dans le store et l'interceptor
      setAccessToken(data.accessToken);
      set({ user: data.user, accessToken: data.accessToken, isAuthenticated: true, isInitialized: true });
    } catch {
      setAccessToken(null);
      set({ user: null, accessToken: null, isAuthenticated: false, isInitialized: true });
    }
  },

  changePassword: async (currentPassword, newPassword) => {
    set({ isLoading: true, error: null });
    try {
      await api.post('/backoffice/auth/change-password', { currentPassword, newPassword });
      set({ isLoading: false });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Erreur lors du changement de mot de passe';
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  clearError: () => set({ error: null }),

  hasRole: (...roles) => {
    const user = get().user;
    return user ? roles.includes(user.role) : false;
  },
}));
