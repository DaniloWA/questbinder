
import { LoginCredentials, RegisterCredentials, User, ApiResponse } from '../types';
import { apiService } from './apiService';

const SESSION_KEY = 'auth_user_session';

export const authService = {
  login: async (creds: LoginCredentials): Promise<ApiResponse<User>> => {
    // 1. Busca usuário na "API"
    const response = await apiService.get<User>('users', (u) => u.email === creds.email);
    const user = response.data?.[0];

    // 2. Valida senha (simulado)
    if (user && user.password === creds.pass) {
      const { password, ...safeUser } = user;
      localStorage.setItem(SESSION_KEY, JSON.stringify(safeUser));
      return { success: true, data: safeUser as User };
    }

    return { success: false, message: 'Credenciais inválidas.' };
  },

  register: async (creds: RegisterCredentials): Promise<ApiResponse<User>> => {
    // 1. Verifica duplicidade
    const check = await apiService.get<User>('users', (u) => u.email === creds.email);
    if (check.data && check.data.length > 0) {
      return { success: false, message: 'Este email já está em uso.' };
    }

    // 2. Cria via API
    const createRes = await apiService.post<User>('users', {
      name: creds.name,
      email: creds.email,
      password: creds.pass, // Em produção, hash aqui!
      avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${creds.name}`
    });

    if (createRes.success && createRes.data) {
        const { password, ...safeUser } = createRes.data;
        localStorage.setItem(SESSION_KEY, JSON.stringify(safeUser));
        return { success: true, data: safeUser as User };
    }
    
    return { success: false, message: 'Erro ao criar usuário.' };
  },

  logout: async (): Promise<void> => {
    // Simula latência de logout
    await new Promise(resolve => setTimeout(resolve, 300));
    localStorage.removeItem(SESSION_KEY);
  },

  getSession: async (): Promise<User | null> => {
    const stored = localStorage.getItem(SESSION_KEY);
    if (stored) {
      try {
        return JSON.parse(stored) as User;
      } catch (e) {
        localStorage.removeItem(SESSION_KEY);
        return null;
      }
    }
    return null;
  }
};
