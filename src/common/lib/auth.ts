export interface AuthSession {
  isLoggedIn: boolean;
  npa: string;
  name: string;
  role: string;
  loginAt: number;
}

const SESSION_KEY = "simpa_session";

export function getSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(SESSION_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored) as AuthSession;
  } catch (e) {
    return null;
  }
}

export function setSession(session: AuthSession) {
  if (typeof window !== "undefined") {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    // Dispatch a custom event to notify listeners of role or session changes
    window.dispatchEvent(new Event("simpa_role_changed"));
  }
}

export function clearSession() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(SESSION_KEY);
    window.dispatchEvent(new Event("simpa_role_changed"));
  }
}

export function isLoggedIn(): boolean {
  const session = getSession();
  return !!session && session.isLoggedIn;
}

export function getSessionRole(): string {
  const session = getSession();
  return session ? session.role : "Anggota";
}

export function getSessionUser() {
  const session = getSession();
  return session ? { npa: session.npa, name: session.name } : { npa: "", name: "" };
}
