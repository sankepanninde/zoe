import { useMemo, useState, type CSSProperties, type FormEvent } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import './kit.css';
import './Cronograma.css';
import { getApiError } from '@/lib/api';
import {
  createAssignment,
  createService,
  deleteAssignment,
  listMyServices,
  listServiceTypes,
  listServices,
  type CreateServicePayload,
} from '@/lib/services.api';
import { listUsers } from '@/lib/users.api';
import { useAuth } from '@/stores/auth.store';
import type { Service, ServiceAssignment, User } from '@/types';

// ---------- Fechas y horas ----------
const pad = (n: number) => String(n).padStart(2, '0');
const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
const diaSemana = (d: Date) => (d.getDay() + 6) % 7; // 0 = lunes
const lunesDe = (f: string) => {
  const d = new Date(f + 'T00:00');
  return addDays(d, -diaSemana(d));
};
const fechaDe = (s: Service) => s.date.slice(0, 10);
const hora = (t: string) => t.slice(0, 5);
const aMin = (t: string) => {
  const [h, m] = hora(t).split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
};
const fmt = (f: string, o: Intl.DateTimeFormatOptions) =>
  new Date(f + 'T00:00').toLocaleDateString('es-CO', o);
const capitalizar = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const DIAS_CORTOS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const ESTADO_TXT: Record<ServiceAssignment['status'], string> = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmado',
  REJECTED: 'Rechazado',
};

// ---------- Componente principal ----------
export function Cronograma() {
  const user = useAuth((s) => s.user);
  const esLider = !!user && user.role !== 'SIERVO';
  const hoy = new Date();

  const [vista, setVista] = useState<'anio' | 'semana'>('anio');
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [semana, setSemana] = useState(() => lunesDe(iso(hoy)));
  const [diaSel, setDiaSel] = useState(diaSemana(hoy));
  const [selFecha, setSelFecha] = useState<string | null>(iso(hoy));
  const [selId, setSelId] = useState<string | null>(null);
  const [creandoEn, setCreandoEn] = useState<string | null>(null);

  const desde = vista === 'anio' ? `${anio}-01-01` : iso(semana);
  const hasta = vista === 'anio' ? `${anio}-12-31` : iso(addDays(semana, 6));

  const servicios = useQuery({
    queryKey: ['services', esLider ? 'lider' : 'siervo', desde, hasta],
    queryFn: () => (esLider ? listServices({ from: desde, to: hasta }) : listMyServices()),
    placeholderData: keepPreviousData,
    enabled: !!user,
  });
  const tipos = useQuery({
    queryKey: ['service-types'],
    queryFn: listServiceTypes,
    enabled: esLider,
  });
  const usuarios = useQuery({
    queryKey: ['users', 'active'],
    queryFn: () => listUsers(true),
    enabled: esLider,
  });

  const lista = useMemo(
    () =>
      (servicios.data ?? [])
        .filter((s) => s.status !== 'CANCELLED' && fechaDe(s) >= desde && fechaDe(s) <= hasta)
        .sort((a, b) => fechaDe(a).localeCompare(fechaDe(b)) || aMin(a.startTime) - aMin(b.startTime)),
    [servicios.data, desde, hasta],
  );

  const porFecha = useMemo(() => {
    const m: Record<string, Service[]> = {};
    for (const s of lista) (m[fechaDe(s)] ||= []).push(s);
    return m;
  }, [lista]);

  const servicio = lista.find((s) => s.id === selId) ?? null;

  const irASemana = (f: string) => {
    setSemana(lunesDe(f));
    setDiaSel(diaSemana(new Date(f + 'T00:00')));
    setSelId(null);
    setVista('semana');
  };

  // ---------- Mutaciones ----------
  const qc = useQueryClient();
  const refrescar = () => qc.invalidateQueries({ queryKey: ['services'] });

  const asignar = useMutation({
    mutationFn: (v: { serviceId: string; userId: string; position: string }) =>
      createAssignment(v.serviceId, { userId: v.userId, position: v.position }),
    onSuccess: () => {
      toast.success('Persona asignada');
      void refrescar();
    },
    onError: (e) => toast.error(getApiError(e)),
  });

  const quitar = useMutation({
    mutationFn: (v: { serviceId: string; assignmentId: string }) =>
      deleteAssignment(v.serviceId, v.assignmentId),
    onSuccess: () => {
      toast.success('Asignación quitada');
      void refrescar();
    },
    onError: (e) => toast.error(getApiError(e)),
  });

  const titulo =
    vista === 'anio'
      ? `Año ${anio}`
      : `${fmt(iso(semana), { day: 'numeric', month: 'short' })} – ${fmt(iso(addDays(semana, 6)), { day: 'numeric', month: 'short', year: 'numeric' })}`;

  return (
    <div className="cro-wrap">
      <header className="cro-cab">
        <div>
          <span className="k-label">{esLider ? 'Cronograma' : 'Mis turnos'}</span>
          <h1>{titulo}</h1>
        </div>
        <div className="cro-acciones">
          <button type="button" className="k-btn k-btn--ghost k-btn--auto" aria-label="Anterior"
            onClick={() => (vista === 'anio' ? setAnio(anio - 1) : setSemana(addDays(semana, -7)))}>←</button>
          <button type="button" className="k-btn k-btn--ghost k-btn--auto" aria-label="Siguiente"
            onClick={() => (vista === 'anio' ? setAnio(anio + 1) : setSemana(addDays(semana, 7)))}>→</button>
          {esLider && (
            <button type="button" className="k-btn k-btn--auto" onClick={() => setCreandoEn(selFecha ?? iso(hoy))}>
              + Nuevo servicio
            </button>
          )}
        </div>
      </header>

      <div className="cro-controles">
        <div className="k-seg" role="group" aria-label="Vista">
          <button type="button" aria-pressed={vista === 'anio'} onClick={() => setVista('anio')}>Año</button>
          <button type="button" aria-pressed={vista === 'semana'} onClick={() => setVista('semana')}>Semana</button>
        </div>
      </div>

      {servicios.isError && (
        <p className="ms-err" role="alert">{getApiError(servicios.error)}</p>
      )}
      {servicios.isPending && <p className="k-muted" role="status">Cargando servicios…</p>}

      {vista === 'anio' ? (
        <VistaAnio
  anio={anio}
  porFecha={porFecha}
  selFecha={selFecha}
  onDia={setSelFecha}
  onVerSemana={irASemana}
  esLider={esLider}
  usuarios={usuarios.data ?? []}
  miId={user?.id ?? ''}
  onAsignar={(serviceId, userId, position) => asignar.mutate({ serviceId, userId, position })}
  onQuitar={(serviceId, assignmentId) => quitar.mutate({ serviceId, assignmentId })}
  asignando={asignar.isPending}
/>
      ) : (
        <VistaSemana
          semana={semana}
          diaSel={diaSel}
          setDiaSel={setDiaSel}
          porFecha={porFecha}
          servicio={servicio}
          setSelId={setSelId}
          esLider={esLider}
          usuarios={usuarios.data ?? []}
          miId={user?.id ?? ''}
          onAsignar={(serviceId, userId, position) => asignar.mutate({ serviceId, userId, position })}
          onQuitar={(serviceId, assignmentId) => quitar.mutate({ serviceId, assignmentId })}
          asignando={asignar.isPending}
          onCrearEn={(f) => setCreandoEn(f)}
        />
      )}

      {creandoEn && (
        <NuevoServicio
          fechaInicial={creandoEn}
          tipos={tipos.data ?? []}
          onCerrar={() => setCreandoEn(null)}
        />
      )}
    </div>
  );
}

// ---------- Vista año ----------
// ---------- Vista año ----------
function VistaAnio(props: {
  anio: number;
  porFecha: Record<string, Service[]>;
  selFecha: string | null;
  onDia: (f: string) => void;
  onVerSemana: (f: string) => void;
  esLider: boolean;
  usuarios: User[];
  miId: string;
  onAsignar: (serviceId: string, userId: string, position: string) => void;
  onQuitar: (serviceId: string, assignmentId: string) => void;
  asignando: boolean;
}) {
  const { anio, porFecha, selFecha, onDia, onVerSemana, esLider, usuarios, miId, onAsignar, onQuitar, asignando } = props;
  const lista = selFecha ? porFecha[selFecha] ?? [] : [];

  return (
    <>
      <div className="anio">
        {Array.from({ length: 12 }, (_, m) => {
          const primero = new Date(anio, m, 1);
          const offset = diaSemana(primero);
          const dias = new Date(anio, m + 1, 0).getDate();
          const celdas = [];
          for (let i = 0; i < offset; i++) celdas.push(<span key={`v${i}`} className="dia dia--vacio" />);
          for (let dd = 1; dd <= dias; dd++) {
            const f = iso(new Date(anio, m, dd));
            const items = porFecha[f] ?? [];
            const colores = [...new Map(items.map((s) => [s.serviceType.color, s.serviceType.color])).values()].slice(0, 3);
            const cls = ['dia', selFecha === f && 'dia--sel', items.length === 0 && 'dia--atenuado']
              .filter(Boolean).join(' ');
            celdas.push(
              <button key={f} type="button" className={cls} onClick={() => onDia(f)}>
                {dd}
                {colores.length > 0 && (
                  <span className="dia__pts">
                    {colores.map((c) => <i key={c} style={{ '--c': c } as CSSProperties} />)}
                  </span>
                )}
              </button>,
            );
          }
          return (
            <div key={m} className="mes">
              <h3>{capitalizar(primero.toLocaleDateString('es-CO', { month: 'long' }))}</h3>
              <div className="mes__rejilla">
                {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((x) => <span key={x} className="mes__dia-n">{x}</span>)}
                {celdas}
              </div>
            </div>
          );
        })}
      </div>

      <div className="caja detalle">
        {!selFecha && <p className="k-muted">Toca un día para ver sus servicios.</p>}
        {selFecha && (
          <>
            <strong>{capitalizar(fmt(selFecha, { weekday: 'long', day: 'numeric', month: 'long' }))}</strong>
            {lista.length === 0 && <p className="k-muted">Sin servicios este día.</p>}
            {lista.map((s) => (
              <div key={s.id} className="caja" style={{ display: 'grid', gap: 12 }}>
                <DetalleServicio
                  servicio={s}
                  esLider={esLider}
                  usuarios={usuarios}
                  miId={miId}
                  onAsignar={onAsignar}
                  onQuitar={onQuitar}
                  asignando={asignando}
                />
              </div>
            ))}
            <div className="acciones">
              <button type="button" className="k-btn" onClick={() => onVerSemana(selFecha)}>
                {esLider ? 'Ver esta semana' : 'Ver mi semana'}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}

// ---------- Vista semana ----------
function VistaSemana(props: {
  semana: Date;
  diaSel: number;
  setDiaSel: (n: number) => void;
  porFecha: Record<string, Service[]>;
  servicio: Service | null;
  setSelId: (id: string | null) => void;
  esLider: boolean;
  usuarios: User[];
  miId: string;
  onAsignar: (serviceId: string, userId: string, position: string) => void;
  onQuitar: (serviceId: string, assignmentId: string) => void;
  asignando: boolean;
  onCrearEn: (f: string) => void;
}) {
  const { semana, diaSel, setDiaSel, porFecha, servicio, setSelId, esLider, usuarios, miId, onAsignar, onQuitar, asignando, onCrearEn } = props;
  const dias = Array.from({ length: 7 }, (_, i) => addDays(semana, i));
  const hoyIso = iso(new Date());
  const top = (t: string) => ((aMin(t) - 420) * 40) / 60;
  const alto = (d: string, h: string) => ((aMin(h) - aMin(d)) * 40) / 60;

  return (
    <div className="cro-semana">
      <div className="cro-semana__cal">
        <div className="cal-sel">
          {dias.map((d, i) => (
            <button key={i} type="button" className={`k-btn ${i === diaSel ? '' : 'k-btn--ghost'}`}
              style={{ width: 'auto' }} onClick={() => setDiaSel(i)}>
              {DIAS_CORTOS[i]} {d.getDate()}
            </button>
          ))}
        </div>

        <div className="cal">
          <div className="cal__head" />
          {dias.map((d, i) => (
            <div key={i} className={`cal__head ${iso(d) === hoyIso ? 'cal__head--hoy' : ''} ${i === diaSel ? 'cal__head--sel' : ''}`}>
              <b>{d.getDate()}</b>{DIAS_CORTOS[i]}
            </div>
          ))}
          <div className="cal__horas">
            {Array.from({ length: 16 }, (_, k) => 7 + k).map((h) => (
              <span key={h} style={{ top: ((h * 60 - 420) * 40) / 60 }}>{pad(h)}:00</span>
            ))}
          </div>
          {dias.map((d, i) => {
            const f = iso(d);
            return (
              <div key={i} className={`cal__col ${i === diaSel ? 'cal__col--sel' : ''}`}>
                {(porFecha[f] ?? []).map((s) => (
                  <button key={s.id} type="button" className="bloque"
                    style={{ top: top(s.startTime), height: Math.max(alto(s.startTime, s.endTime), 28), '--c': s.serviceType.color } as CSSProperties}
                    aria-pressed={servicio?.id === s.id} onClick={() => setSelId(s.id)}>
                    <b>{s.title || s.serviceType.name}</b>
                    <small>{hora(s.startTime)}–{hora(s.endTime)}</small>
                  </button>
                ))}
                {esLider && (porFecha[f] ?? []).length === 0 && (
                  <button type="button" className="k-btn k-btn--ghost k-btn--auto cro-vacio"
                    onClick={() => onCrearEn(f)}>+ Crear</button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <aside className="caja cro-panel" aria-label="Detalle del servicio">
        {!servicio && <p className="k-muted">Toca un bloque para ver el detalle y asignar personas.</p>}
        {servicio && (
          <DetalleServicio
            servicio={servicio}
            esLider={esLider}
            usuarios={usuarios}
            miId={miId}
            onAsignar={onAsignar}
            onQuitar={onQuitar}
            asignando={asignando}
          />
        )}
      </aside>
    </div>
  );
}

// ---------- Detalle de un servicio ----------
function DetalleServicio(props: {
  servicio: Service;
  esLider: boolean;
  usuarios: User[];
  miId: string;
  onAsignar: (serviceId: string, userId: string, position: string) => void;
  onQuitar: (serviceId: string, assignmentId: string) => void;
  asignando: boolean;
}) {
  const { servicio, esLider, usuarios, miId, onAsignar, onQuitar, asignando } = props;
  const [userId, setUserId] = useState('');
  const [cargo, setCargo] = useState('');
  const ocupados = new Set(servicio.assignments.map((a) => a.userId));
  const opciones = usuarios.filter((u) => !ocupados.has(u.id));

  const agregar = (e: FormEvent) => {
    e.preventDefault();
    if (!userId || !cargo.trim()) return;
    onAsignar(servicio.id, userId, cargo.trim());
    setUserId('');
    setCargo('');
  };

  return (
    <>
      <div className="cro-fila">
        <strong>{servicio.title || servicio.serviceType.name}</strong>
        <span className="k-muted">
          {capitalizar(fmt(fechaDe(servicio), { weekday: 'long', day: 'numeric', month: 'short' }))} · {hora(servicio.startTime)}–{hora(servicio.endTime)}
        </span>
      </div>
      {servicio.location && <span className="k-muted">{servicio.location}</span>}

      <div>
        {servicio.assignments.length === 0 && <p className="k-muted">Sin personas asignadas.</p>}
        {servicio.assignments.map((a) => (
          <div key={a.id} className="cro-fila">
            <div>
              <strong>{a.user.name}</strong>
              <div className="k-muted">{a.position} · {ESTADO_TXT[a.status]}</div>
            </div>
            {esLider && (
              <button type="button" className="k-btn k-btn--ghost k-btn--auto" disabled={asignando}
                onClick={() => onQuitar(servicio.id, a.id)}>Quitar</button>
            )}
            {!esLider && a.userId === miId && <span className="k-status k-status--ok">Tú</span>}
          </div>
        ))}
      </div>

      {esLider && (
        <form className="cro-fila cro-fila--final" onSubmit={agregar}>
          <label className="k-field" style={{ minWidth: 200 }}>
            <span className="k-field__label">Persona</span>
            <select className="k-select" value={userId} onChange={(e) => setUserId(e.target.value)}>
              <option value="">Elegir…</option>
              {opciones.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </label>
          <label className="k-field" style={{ minWidth: 160 }}>
            <span className="k-field__label">Cargo</span>
            <input className="k-input" value={cargo} onChange={(e) => setCargo(e.target.value)} placeholder="Ej. Sonido" />
          </label>
          <button type="submit" className="k-btn k-btn--auto" disabled={asignando || !userId || !cargo.trim()}>
            Asignar
          </button>
        </form>
      )}
    </>
  );
}

// ---------- Crear servicio ----------
function NuevoServicio(props: {
  fechaInicial: string;
  tipos: { id: string; name: string }[];
  onCerrar: () => void;
}) {
  const { fechaInicial, tipos, onCerrar } = props;
  const qc = useQueryClient();
  const [tipoId, setTipoId] = useState(tipos[0]?.id ?? '');
  const [fecha, setFecha] = useState(fechaInicial);
  const [inicio, setInicio] = useState('09:00');
  const [fin, setFin] = useState('10:30');
  const [titulo, setTitulo] = useState('');
  const [lugar, setLugar] = useState('');
  const [error, setError] = useState<string | null>(null);

  const crear = useMutation({
    mutationFn: (p: CreateServicePayload) => createService(p),
    onSuccess: () => {
      toast.success('Servicio creado');
      void qc.invalidateQueries({ queryKey: ['services'] });
      onCerrar();
    },
    onError: (e) => setError(getApiError(e)),
  });

  const enviar = (e: FormEvent) => {
    e.preventDefault();
    if (!tipoId) {
      setError('Elige un tipo de servicio. Si no hay ninguno, créalo primero.');
      return;
    }
    if (aMin(fin) <= aMin(inicio)) {
      setError('La hora de fin debe ser posterior a la de inicio.');
      return;
    }
    setError(null);
    crear.mutate({
      serviceTypeId: tipoId,
      date: fecha,
      startTime: inicio,
      endTime: fin,
      title: titulo.trim() || null,
      location: lugar.trim() || null,
    });
  };

  return (
    <div role="presentation" onClick={onCerrar}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 50 }}>
      <form role="dialog" aria-modal="true" aria-label="Nuevo servicio" className="caja"
        onClick={(e) => e.stopPropagation()} onSubmit={enviar}
        style={{ width: 'min(440px, 100%)', maxHeight: '90vh', overflow: 'auto', display: 'grid', gap: 12 }}>
        <h2 style={{ margin: 0, fontSize: 18 }}>Nuevo servicio</h2>

        <label className="k-field">
          <span className="k-field__label">Tipo</span>
          <select className="k-select" value={tipoId} onChange={(e) => setTipoId(e.target.value)}>
            {tipos.length === 0 && <option value="">Sin tipos de servicio</option>}
            {tipos.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </label>

        <label className="k-field">
          <span className="k-field__label">Fecha</span>
          <input className="k-input" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </label>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <label className="k-field">
            <span className="k-field__label">Inicio</span>
            <input className="k-input" type="time" value={inicio} onChange={(e) => setInicio(e.target.value)} />
          </label>
          <label className="k-field">
            <span className="k-field__label">Fin</span>
            <input className="k-input" type="time" value={fin} onChange={(e) => setFin(e.target.value)} />
          </label>
        </div>

        <label className="k-field">
          <span className="k-field__label">Título (opcional)</span>
          <input className="k-input" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
        </label>

        <label className="k-field">
          <span className="k-field__label">Lugar (opcional)</span>
          <input className="k-input" value={lugar} onChange={(e) => setLugar(e.target.value)} />
        </label>

        {error && <p className="k-error" role="alert">{error}</p>}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button type="button" className="k-btn k-btn--ghost k-btn--auto" onClick={onCerrar}>Cancelar</button>
          <button type="submit" className="k-btn k-btn--auto" disabled={crear.isPending}>
            {crear.isPending ? 'Guardando…' : 'Crear servicio'}
          </button>
        </div>
      </form>
    </div>
  );
}