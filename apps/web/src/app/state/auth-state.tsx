import { createContext, useContext, useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react';
import { apiRequest } from '../../lib/api';

type AuthUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
};

type StoredSession = {
  token: string;
  refreshToken: string;
  user: AuthUser;
  role: string;
  tenantId: string;
};

type AuthState = {
  token: string | null;
  user: AuthUser | null;
  role: string | null;
  tenantId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

type AuthResponse = StoredSession & {
  expiresInMinutes: number;
};

const STORAGE_KEY = 'lumnipsi-auth';
const REFRESH_BUFFER_SECONDS = 120;
const AuthContext = createContext<AuthState | null>(null);

function readStoredSession(): StoredSession | null {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<StoredSession>;
    if (!parsed.token || !parsed.refreshToken || !parsed.user || !parsed.role || !parsed.tenantId) {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed as StoredSession;
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

function persistSession(session: StoredSession | null) {
  if (!session) {
    window.localStorage.removeItem(STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

function readTokenExpiry(token: string) {
  try {
    const [, payload] = token.split('.');
    const json = JSON.parse(window.atob(payload));
    return typeof json.exp === 'number' ? json.exp : null;
  } catch {
    return null;
  }
}

async function refreshSessionRequest(refreshToken: string) {
  return apiRequest<AuthResponse>('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  });
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<StoredSession | null>(() => readStoredSession());
  const [isLoading, setIsLoading] = useState(true);
  const refreshTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const initialSession = readStoredSession();

    async function bootstrap() {
      if (!initialSession?.refreshToken) {
        if (!cancelled) setIsLoading(false);
        return;
      }

      const accessExpiry = readTokenExpiry(initialSession.token);
      const nowInSeconds = Date.now() / 1000;

      if (!accessExpiry || accessExpiry - nowInSeconds <= REFRESH_BUFFER_SECONDS) {
        try {
          const refreshed = await refreshSessionRequest(initialSession.refreshToken);
          if (cancelled) return;

          const nextSession: StoredSession = {
            token: refreshed.token,
            refreshToken: refreshed.refreshToken,
            user: refreshed.user,
            role: refreshed.role,
            tenantId: refreshed.tenantId,
          };
          persistSession(nextSession);
          setSession(nextSession);
        } catch {
          if (cancelled) return;
          persistSession(null);
          setSession(null);
        }
      }

      if (!cancelled) setIsLoading(false);
    }

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (refreshTimeoutRef.current) {
      window.clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }

    if (!session?.refreshToken) return;

    const accessExpiry = readTokenExpiry(session.token);
    if (!accessExpiry) return;

    const timeoutMs = Math.max((accessExpiry - Date.now() / 1000 - REFRESH_BUFFER_SECONDS) * 1000, 5000);
    refreshTimeoutRef.current = window.setTimeout(() => {
      void refreshSessionRequest(session.refreshToken)
        .then((refreshed) => {
          const nextSession: StoredSession = {
            token: refreshed.token,
            refreshToken: refreshed.refreshToken,
            user: refreshed.user,
            role: refreshed.role,
            tenantId: refreshed.tenantId,
          };
          persistSession(nextSession);
          setSession(nextSession);
        })
        .catch(() => {
          persistSession(null);
          setSession(null);
        });
    }, timeoutMs);

    return () => {
      if (refreshTimeoutRef.current) {
        window.clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
    };
  }, [session?.refreshToken, session?.token]);

  const value = useMemo<AuthState>(
    () => ({
      token: session?.token ?? null,
      user: session?.user ?? null,
      role: session?.role ?? null,
      tenantId: session?.tenantId ?? null,
      isAuthenticated: Boolean(session?.token && session.user),
      isLoading,
      login: async (email: string, password: string) => {
        const result = await apiRequest<AuthResponse>('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });

        const nextSession: StoredSession = {
          token: result.token,
          refreshToken: result.refreshToken,
          user: result.user,
          role: result.role,
          tenantId: result.tenantId,
        };

        persistSession(nextSession);
        setSession(nextSession);
      },
      logout: () => {
        persistSession(null);
        setSession(null);
      },
    }),
    [isLoading, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
