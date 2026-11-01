import { beforeEach, describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import { api } from './api';
import { session } from './session';

const BASE = 'http://localhost:4000/api';
let refreshes = 0;

function mockRefresh(newToken = 'nuevo') {
  server.use(
    http.post(`${BASE}/auth/refresh`, () => {
      refreshes += 1;
      return HttpResponse.json({ accessToken: newToken });
    }),
  );
}

function mockProtected() {
  server.use(
    http.get(`${BASE}/me/services`, ({ request }) =>
      request.headers.get('authorization') === 'Bearer nuevo'
        ? HttpResponse.json({ ok: true })
        : HttpResponse.json({ code: 'UNAUTHORIZED', message: 'Sesión expirada' }, { status: 401 }),
    ),
  );
}

beforeEach(() => {
  refreshes = 0;
  session.setToken('viejo');
});

describe('api: refresh de sesión', () => {
  it('ante un 401 en un endpoint protegido refresca el token y reintenta', async () => {
    mockRefresh();
    mockProtected();

    const { data } = await api.get('/me/services');

    expect(data).toEqual({ ok: true });
    expect(refreshes).toBe(1);
    expect(session.getToken()).toBe('nuevo');
  });

  it('un 401 en /auth/login no intenta refrescar', async () => {
    mockRefresh();
    server.use(
      http.post(`${BASE}/auth/login`, () =>
        HttpResponse.json({ code: 'INVALID_CREDENTIALS', message: 'Credenciales inválidas' }, { status: 401 }),
      ),
    );

    await expect(api.post('/auth/login', { email: 'a@b.co', password: 'x' })).rejects.toThrow();
    expect(refreshes).toBe(0);
  });

  it('si el refresh falla, limpia el token y notifica la expiración', async () => {
    server.use(
      http.post(`${BASE}/auth/refresh`, () =>
        HttpResponse.json({ code: 'UNAUTHORIZED', message: 'Sin sesión' }, { status: 401 }),
      ),
    );
    mockProtected();
    const expired = vi.fn();
    const unsubscribe = session.onExpired(expired);

    await expect(api.get('/me/services')).rejects.toThrow();

    expect(session.getToken()).toBeNull();
    expect(expired).toHaveBeenCalledTimes(1);
    unsubscribe();
  });

  it('varias peticiones concurrentes comparten un solo refresh', async () => {
    mockRefresh();
    mockProtected();

    const results = await Promise.all([
      api.get('/me/services'),
      api.get('/me/services'),
      api.get('/me/services'),
    ]);

    expect(results.every((r) => r.data.ok === true)).toBe(true);
    expect(refreshes).toBe(1);
  });
});