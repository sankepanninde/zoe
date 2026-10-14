# Kit de UI · Gestión eclesial

Componentes React + TypeScript del acceso y los estados de la plataforma. Usa tokens CSS, sin Tailwind.

## Estructura

```
ui/
├── kit.css          tokens (claro y oscuro), botones, campos, pestañas, banners
├── Button.tsx       botón principal y secundario, con estado de carga
├── Field.tsx        campo de texto y campo de contraseña con mostrar/ocultar
├── Tabs.tsx         pestañas de rol con navegación por flechas
├── Banner.tsx       mensajes de estado (info, advertencia, error)
├── Providers.tsx    inicio con Google y Microsoft
├── LoginForm.tsx    formulario completo, en variante general o con pestañas
└── index.ts         exportaciones
```

## Instalación

1. Copia la carpeta `ui/` dentro de `src/` de tu proyecto Vite:

   ```
   src/
   └── ui/
       ├── kit.css
       ├── index.ts
       └── ...
   ```

2. Requisitos: React 18 o superior y TypeScript. No necesita dependencias extra.

3. Si usas fuentes, agrega Manrope en `index.html`:

   ```html
   <link rel="preconnect" href="https://fonts.googleapis.com" />
   <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
   <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600&display=swap" rel="stylesheet" />
   ```

   Sin fuente, el kit usa `system-ui` como respaldo.

## Importación

`index.ts` ya importa `kit.css`, así que basta con importar los componentes una vez:

```tsx
import { LoginForm, Button, Banner } from "@/ui";
```

Si no usas el alias `@`, usa la ruta relativa, por ejemplo `../ui`.

## Uso: login general

```tsx
import { LoginForm } from "@/ui";
import { login } from "@/api/auth";

export function AccesoGeneral() {
  return (
    <main className="k-main">
      <div className="k-card">
        <div className="k-heading">
          <h1>Bienvenido de nuevo.</h1>
          <p>Entra con tu correo y contraseña. Verás solo lo que tu cuenta puede administrar.</p>
        </div>
        <LoginForm
          variant="general"
          onSubmit={login}
          onProvider={(p) => window.location.assign(`/auth/${p}`)}
          onRequestAccess={() => window.location.assign("/solicitar")}
        />
      </div>
    </main>
  );
}
```

## Uso: login con pestañas de rol

```tsx
<LoginForm variant="tabs" onSubmit={login} />
```

Con `variant="tabs"` aparece el campo de código de iglesia cuando el usuario elige "Iglesia".

## Contrato con el backend

`onSubmit` recibe `{ correo, clave, cuenta, codigo? }` y debe devolver:

```ts
type LoginResult =
  | { ok: true }
  | { ok: false; reason: "credenciales" | "bloqueada" | "red" | "sesion" };
```

- `credenciales`: el correo o la contraseña no coinciden. El mensaje es genérico a propósito.
- `bloqueada`: demasiados intentos. El mensaje indica el tiempo de espera.
- `red`: no hubo respuesta del servidor. Se muestra el aviso de conexión.
- `sesion`: la sesión venció. Usa `sessionExpired` para mostrarlo sin llamar al backend.

Si `onSubmit` lanza una excepción, el formulario no muestra error. Conviene capturarla y devolver `{ ok: false, reason: "red" }`.

Ejemplo de función de login con Fastify:

```ts
export async function login(data: { correo: string; clave: string; cuenta: string; codigo?: string }) {
  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.status === 401) return { ok: false as const, reason: "credenciales" as const };
    if (res.status === 423) return { ok: false as const, reason: "bloqueada" as const };
    if (!res.ok) return { ok: false as const, reason: "red" as const };
    return { ok: true as const };
  } catch {
    return { ok: false as const, reason: "red" as const };
  }
}
```

En el backend, responde `401` para credenciales incorrectas y `423` para cuenta bloqueada. Así el front distingue los casos sin revelar qué campo falló.

## Modo oscuro

El kit sigue la preferencia del sistema. Para forzar un tema, pon `data-theme="dark"` o `data-theme="light"` en `<html>`.

## Accesibilidad

- Los campos con error llevan `aria-invalid` y el mensaje queda vinculado con `aria-describedby`.
- Los banners de error usan `role="alert"`. Los de estado usan `role="status"`.
- Las pestañas se mueven con las flechas izquierda y derecha.
- Todo foco tiene un contorno visible, y se respeta `prefers-reduced-motion`.

---

## Dashboard (ámbito `.k-dash`)

Los estilos del dashboard están en `dashboard.css` (basado en `dashboard.html`) y `roles.css` (basado en `dashboard-roles.html`). Ambos se aplican solo dentro de `.k-dash`, así que no afectan al login.

```
ui/
├── dashboard.css       estilos del dashboard, con alcance .k-dash
├── roles.css           estilos del panel por rol, con alcance .k-dash .rol
├── Dashboard.tsx       panel completo: encabezado, resumen, anuncios, pestañas, modales
├── Announcements.tsx   resumen, buscador y filtros, lista, detalle con comentarios
├── NuevoAnuncio.tsx    formulario de nuevo anuncio
├── Bloques.tsx         próximos eventos, Hoy, cupos, borradores, oración, vista general
├── PanelRol.tsx        panel por rol: Técnico, Líder y Admin
├── permisos.ts         matriz de permisos (fuente única para mostrar u ocultar acciones)
├── RolesPanel.tsx      vista de roles y permisos para administración
├── demo.ts             datos de ejemplo, no usar en producción
└── schema.sql          esquema MySQL de referencia (no se ejecuta desde el kit)
```

### Uso básico

```tsx
import { Dashboard } from "@/ui";
import { demoAnuncios, demoEventos, demoHoy, demoInscripciones, demoBorradores, demoPeticiones, demoIglesias, demoTendencia } from "@/ui/demo";

<Dashboard
  iglesia="Betania"
  iniciales="LM"
  anuncios={anuncios}              // datos del backend
  eventos={eventos}
  hoy={hoy}                        // ítems de "Hoy" (ver abajo)
  tendencia={tendencia}            // 7 valores para la línea de la tarjeta Anuncios
  inscripciones={inscripciones}
  borradores={borradores}
  peticiones={esLider ? peticiones : undefined}   // solo líderes; el servidor también debe restringirlo
  general={esAdminGeneral ? { iglesias, administradores } : undefined}
  roles={{ datos: datosPorRol, onAsignar: asignar }} // opcional: muestra Técnico / Líder / Admin
  cargando={cargando}
  onMarcarLeido={marcarLeido}
  onMarcarTodoLeido={marcarTodo}
  onComentar={comentar}
  onCrearAnuncio={crear}
/>
```

- **`hoy`**: cada ítem puede tener `rol` (cambia el selector de rol al hacer clic en Ver) y `destino` (id de la sección a la que se desplaza, por ejemplo `asignar` o `sem`).
- **`roles`**: si se pasa, el encabezado muestra Técnico / Líder / Admin en lugar de Iglesia / General.
- **`peticiones`**: la pestaña Oración aparece solo cuando se pasa esta prop. La restricción debe aplicarse también en el servidor.

### Accesibilidad

- Los modales cierran con Escape y devuelven el foco al elemento que los abrió.
- El campo con error recibe el foco al publicar.
- La línea de tendencia tiene `role="img"` y una etiqueta descriptiva.
- Con `prefers-reduced-motion` se desactivan las animaciones.

### Pendiente antes de producción

- Conectar `onMarcarLeido`, `onComentar` y `onCrearAnuncio` con el backend.
- Reemplazar los datos de `demo.ts`.
- Confirmar las decisiones abiertas: quién ve Oración, si las inscripciones van en esta plataforma y quién publica anuncios.
