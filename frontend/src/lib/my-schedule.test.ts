import { describe, expect, it } from 'vitest';
import {
  bogotaNow,
  dayOfWeek,
  groupByDate,
  isDateKey,
  isUpcoming,
  nextShift,
  summarizeByMonth,
  formatFechaLarga,
  type MyService,
} from './my-schedule';

const make = (overrides: Partial<MyService> & Pick<MyService, 'date' | 'startTime'>): MyService => ({
  serviceId: `${overrides.date}-${overrides.startTime}`,
  soundCheckTime: null,
  serviceType: 'Culto dominical',
  ministry: 'Sonido',
  assignment: { id: 'a1', position: 'FOH', status: 'PENDING' },
  ...overrides,
});

describe('isDateKey', () => {
  it('acepta fechas reales en formato YYYY-MM-DD', () => {
    expect(isDateKey('2026-10-29')).toBe(true);
    expect(isDateKey('2028-02-29')).toBe(true);
  });

  it('rechaza fechas inexistentes y otros formatos', () => {
    expect(isDateKey('2026-02-30')).toBe(false);
    expect(isDateKey('2026-13-01')).toBe(false);
    expect(isDateKey('2026-1-5')).toBe(false);
    expect(isDateKey('2026-10-29T00:00:00Z')).toBe(false);
    expect(isDateKey('')).toBe(false);
  });
});

describe('dayOfWeek', () => {
  it('calcula el día de la semana sin depender de la zona horaria', () => {
    expect(dayOfWeek('2026-10-29')).toBe(4); // jueves
    expect(dayOfWeek('2026-11-01')).toBe(0); // domingo
  });
});

describe('bogotaNow', () => {
  it('cambia de año en la fecha de Bogotá, no en UTC', () => {
    // 2027-01-01 04:30 UTC = 2026-12-31 23:30 en Bogotá (UTC-5)
    const now = new Date('2027-01-01T04:30:00Z');
    expect(bogotaNow(now)).toEqual({ dateKey: '2026-12-31', time: '23:30' });
  });
});

describe('isUpcoming', () => {
  const now = new Date('2026-10-29T20:30:00-05:00');

  it('un turno que ya empezó no es próximo', () => {
    expect(isUpcoming(make({ date: '2026-10-29', startTime: '20:00' }), now)).toBe(false);
  });

  it('un turno que empieza en este mismo minuto ya no es próximo', () => {
    expect(isUpcoming(make({ date: '2026-10-29', startTime: '20:30' }), now)).toBe(false);
  });

  it('un turno de hoy más tarde sí es próximo', () => {
    expect(isUpcoming(make({ date: '2026-10-29', startTime: '21:00' }), now)).toBe(true);
  });

  it('cualquier turno de un día futuro es próximo', () => {
    expect(isUpcoming(make({ date: '2026-10-30', startTime: '07:00' }), now)).toBe(true);
  });
});

describe('nextShift', () => {
  const now = new Date('2026-10-29T20:30:00-05:00');

  it('devuelve null si no hay turnos', () => {
    expect(nextShift([], now)).toBeNull();
  });

  it('devuelve el primer turno que aún no empieza', () => {
    const later = make({ date: '2026-11-01', startTime: '09:00' });
    const soon = make({ date: '2026-10-29', startTime: '21:00' });
    const past = make({ date: '2026-10-29', startTime: '08:00' });
    expect(nextShift([later, past, soon], now)?.serviceId).toBe(soon.serviceId);
  });

  it('ignora los turnos rechazados', () => {
    const rejected = make({
      date: '2026-10-29',
      startTime: '21:00',
      assignment: { id: 'a2', position: 'FOH', status: 'REJECTED' },
    });
    const pending = make({ date: '2026-11-01', startTime: '09:00' });
    expect(nextShift([rejected, pending], now)?.serviceId).toBe(pending.serviceId);
  });
});

describe('groupByDate', () => {
  it('agrupa varios servicios del mismo día ordenados por hora', () => {
    const grouped = groupByDate([
      make({ date: '2026-11-01', startTime: '18:00' }),
      make({ date: '2026-11-01', startTime: '09:00' }),
      make({ date: '2026-11-08', startTime: '09:00' }),
    ]);
    expect(grouped.get('2026-11-01')?.map((s) => s.startTime)).toEqual(['09:00', '18:00']);
    expect(grouped.get('2026-11-08')).toHaveLength(1);
  });
});

describe('summarizeByMonth', () => {
  it('cuenta un turno del 31 de diciembre en diciembre, no en enero', () => {
    const summary = summarizeByMonth(
      [make({ date: '2026-12-31', startTime: '20:00' })],
      2026,
    );
    expect(summary[11]?.total).toBe(1);
    expect(summary[0]?.total).toBe(0);
  });

  it('separa confirmados, pendientes y rechazados', () => {
    const summary = summarizeByMonth(
      [
        make({ date: '2026-10-04', startTime: '09:00', assignment: { id: '1', position: 'FOH', status: 'CONFIRMED' } }),
        make({ date: '2026-10-11', startTime: '09:00', assignment: { id: '2', position: 'FOH', status: 'PENDING' } }),
        make({ date: '2026-10-18', startTime: '09:00', assignment: { id: '3', position: 'FOH', status: 'REJECTED' } }),
      ],
      2026,
    );
    expect(summary[9]).toMatchObject({ total: 3, confirmed: 1, pending: 1, rejected: 1 });
  });

  it('ignora turnos de otros años', () => {
    const summary = summarizeByMonth([make({ date: '2025-10-04', startTime: '09:00' })], 2026);
    expect(summary.reduce((acc, m) => acc + m.total, 0)).toBe(0);
  });

  it('devuelve 12 meses aunque no haya turnos', () => {
    expect(summarizeByMonth([], 2026)).toHaveLength(12);
  });
});

describe('formatFechaLarga', () => {
  it('muestra el día de la semana y el número correctos sin desfase', () => {
    const texto = formatFechaLarga('2026-10-29');
    expect(texto).toContain('Jueves');
    expect(texto).toContain('29');
  });
});