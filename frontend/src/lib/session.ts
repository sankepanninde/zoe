type Listener = () => void;

let accessToken: string | null = null;
const expiredListeners = new Set<Listener>();

export const session = {
  getToken(): string | null {
    return accessToken;
  },
  setToken(token: string | null): void {
    accessToken = token;
  },
  /** Se suscribe a la expiración de la sesión. Devuelve la función para cancelar la suscripción. */
  onExpired(listener: Listener): () => void {
    expiredListeners.add(listener);
    return () => {
      expiredListeners.delete(listener);
    };
  },
  notifyExpired(): void {
    accessToken = null;
    expiredListeners.forEach((listener) => listener());
  },
};