/**
 * Representa um usuário do sistema (Mestre ou Jogador).
 */
export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  /** @deprecated Usado apenas para validação simulada no frontend */
  password?: string;
  createdAt?: string;
}

/**
 * Estado global do contexto de autenticação.
 */
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

/** Credenciais para login */
export interface LoginCredentials {
  email: string;
  pass: string;
}

/** Credenciais para registro */
export interface RegisterCredentials {
  name: string;
  email: string;
  pass: string;
}