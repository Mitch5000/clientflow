import { AppData, User, AuthState } from '../types';
import { getSeedData } from '../data/seed';

const DATA_KEY = 'clientflow_data_v3';
const AUTH_KEY = 'clientflow_auth';

export function getStoredData(): AppData {
  const stored = localStorage.getItem(DATA_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // fallback to seed
    }
  }
  const seed = getSeedData();
  localStorage.setItem(DATA_KEY, JSON.stringify(seed));
  return seed;
}

export function saveData(data: AppData): void {
  localStorage.setItem(DATA_KEY, JSON.stringify(data));
}

export function getAuthState(): AuthState {
  const stored = localStorage.getItem(AUTH_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return { user: null, isAuthenticated: false };
    }
  }
  return { user: null, isAuthenticated: false };
}

export function saveAuthState(state: AuthState): void {
  localStorage.setItem(AUTH_KEY, JSON.stringify(state));
}

export function clearAuthState(): void {
  localStorage.removeItem(AUTH_KEY);
}

export function resetData(): void {
  localStorage.removeItem(DATA_KEY);
  const seed = getSeedData();
  localStorage.setItem(DATA_KEY, JSON.stringify(seed));
}

export function findUserByEmail(email: string): User | undefined {
  const data = getStoredData();
  return data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
}

export function addUser(user: User): void {
  const data = getStoredData();
  data.users.push(user);
  saveData(data);
}
