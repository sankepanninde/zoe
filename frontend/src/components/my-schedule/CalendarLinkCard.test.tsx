import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import { CalendarLinkCard } from './CalendarLinkCard';

const BASE = 'http://localhost:4000/api';

function renderCard() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <CalendarLinkCard />
    </QueryClientProvider>,
  );
}

let writeText: ReturnType<typeof vi.fn>;

beforeEach(() => {
  writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
});

describe('CalendarLinkCard', () => {
  it('copia el enlace al portapapeles', async () => {
    server.use(
      http.get(`${BASE}/calendar/me/link`, () =>
        HttpResponse.json({ url: 'https://zoe.test/api/calendar/abc.ics', createdAt: '2026-10-31T00:00:00Z' }),
      ),
    );
    renderCard();

    await userEvent.click(await screen.findByRole('button', { name: 'Copiar enlace' }));

    expect(writeText).toHaveBeenCalledWith('https://zoe.test/api/calendar/abc.ics');
  });

  it('regenerar pide confirmación y luego cambia el enlace', async () => {
    server.use(
      http.get(`${BASE}/calendar/me/link`, () =>
        HttpResponse.json({ url: 'https://zoe.test/api/calendar/viejo.ics', createdAt: 'x' }),
      ),
      http.post(`${BASE}/calendar/me/link/regenerate`, () =>
        HttpResponse.json({ url: 'https://zoe.test/api/calendar/nuevo.ics', createdAt: 'y' }),
      ),
    );
    renderCard();

    await userEvent.click(await screen.findByRole('button', { name: 'Regenerar' }));
    expect(screen.getByText(/dejará de funcionar/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Sí, regenerar' }));

    await waitFor(() =>
      expect(screen.getByLabelText('Enlace de suscripción')).toHaveValue('https://zoe.test/api/calendar/nuevo.ics'),
    );
  });

  it('no muestra un valor que no sea http o https', async () => {
    server.use(
      http.get(`${BASE}/calendar/me/link`, () =>
        HttpResponse.json({ url: 'javascript:alert(1)', createdAt: 'x' }),
      ),
    );
    renderCard();

    expect(await screen.findByText(/no es válido/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Copiar enlace' })).not.toBeInTheDocument();
  });
});

it('ofrece botones para Google y Apple con el enlace correcto', async () => {
  server.use(
    http.get(`${BASE}/calendar/me/link`, () =>
      HttpResponse.json({ url: 'https://zoe.test/api/calendar/abc.ics', createdAt: 'x' }),
    ),
  );
  renderCard();

  const google = await screen.findByRole('link', { name: 'Agregar a Google Calendar' });
  expect(google.getAttribute('href')).toBe(
    'https://calendar.google.com/calendar/render?cid=' +
      encodeURIComponent('https://zoe.test/api/calendar/abc.ics'),
  );
  expect(screen.getByRole('link', { name: 'Agregar a Apple / iPhone' })).toHaveAttribute(
    'href',
    'webcal://zoe.test/api/calendar/abc.ics',
  );
});