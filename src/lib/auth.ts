import { AuthSession } from "./adapters/types";

const SESSION_KEY = 'auth_session';

export const sessionManager = {
  getSession: (): AuthSession | null => {
    const sessionStr = localStorage.getItem(SESSION_KEY);
    if (!sessionStr) return null;
    try {
      return JSON.parse(sessionStr) as AuthSession;
    } catch (e) {
      console.error("Failed to parse session", e);
      return null;
    }
  },
  setSession: (session: AuthSession) => {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  },
  clearSession: () => {
    localStorage.removeItem(SESSION_KEY);
  }
};