import { Resend } from 'resend';
import { env } from './env.js';

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

interface SendAssignmentEmailParams {
  to: string;
  userName: string;
  churchName: string;
  serviceTitle: string;
  serviceDate: Date;
  startTime: string;
  endTime: string;
  position: string;
}

export async function sendAssignmentEmail(params: SendAssignmentEmailParams): Promise<void> {
  if (!resend) {
    console.warn('[email] RESEND_API_KEY no configurada — email no enviado');
    return;
  }

  const dateFormatted = new Intl.DateTimeFormat('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(params.serviceDate);

  const firstName = params.userName.split(' ')[0];
  const appUrl = `${env.FRONTEND_URL}/my-schedule`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#F1F5F9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#F1F5F9;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:560px;background:#FFFFFF;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(15,23,42,0.08);">

          <!-- HEADER -->
          <tr>
            <td style="background:linear-gradient(135deg,#2563EB 0%,#1D4ED8 100%);padding:32px 40px;">
              <div style="font-size:24px;font-weight:800;color:#FFFFFF;letter-spacing:-0.5px;">Zoe</div>
              <div style="font-size:13px;color:#BFDBFE;margin-top:4px;font-weight:500;">${params.churchName}</div>
            </td>
          </tr>

          <!-- HERO -->
          <tr>
            <td style="padding:40px 40px 24px 40px;">
              <h1 style="margin:0;font-size:24px;font-weight:700;color:#0F172A;letter-spacing:-0.5px;line-height:1.3;">
                ¡Hola ${firstName}! 🎵
              </h1>
              <p style="margin:12px 0 0 0;font-size:15px;color:#64748B;line-height:1.6;">
                Te han asignado a un nuevo turno en el ministerio de sonido.
                Revisa los detalles y confirma tu asistencia.
              </p>
            </td>
          </tr>

          <!-- CARD SERVICIO -->
          <tr>
            <td style="padding:0 40px 24px 40px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:16px;overflow:hidden;">
                <tr>
                  <td style="padding:20px 24px;border-bottom:1px solid #E2E8F0;">
                    <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#64748B;margin-bottom:4px;">Servicio</div>
                    <div style="font-size:17px;font-weight:700;color:#0F172A;">${params.serviceTitle}</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:20px 24px;border-bottom:1px solid #E2E8F0;">
                    <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#64748B;margin-bottom:4px;">Fecha</div>
                    <div style="font-size:15px;font-weight:600;color:#0F172A;text-transform:capitalize;">${dateFormatted}</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:20px 24px;border-bottom:1px solid #E2E8F0;">
                    <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#64748B;margin-bottom:4px;">Horario</div>
                    <div style="font-size:15px;font-weight:600;color:#0F172A;">${params.startTime} – ${params.endTime}</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:20px 24px;">
                    <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#64748B;margin-bottom:4px;">Tu posición</div>
                    <div style="font-size:15px;font-weight:600;color:#2563EB;">${params.position}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- BOTÓN -->
          <tr>
            <td align="center" style="padding:0 40px 32px 40px;">
              <a href="${appUrl}" style="display:inline-block;background:#2563EB;color:#FFFFFF;text-decoration:none;font-weight:600;font-size:15px;padding:14px 32px;border-radius:12px;box-shadow:0 4px 12px rgba(37,99,235,0.3);">
                Confirmar mi asistencia →
              </a>
            </td>
          </tr>

          <!-- NOTA -->
          <tr>
            <td style="padding:0 40px 32px 40px;">
              <p style="margin:0;font-size:13px;color:#94A3B8;line-height:1.6;text-align:center;">
                Si no puedes asistir, ingresa a la app y solicita un reemplazo lo antes posible.
              </p>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background:#F8FAFC;padding:24px 40px;border-top:1px solid #E2E8F0;">
              <p style="margin:0;font-size:12px;color:#94A3B8;text-align:center;line-height:1.5;">
                Enviado por <strong style="color:#64748B;">Zoe</strong> · Sistema de gestión ministerial<br>
                ${params.churchName}
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  try {
    await resend.emails.send({
      from: env.RESEND_FROM_EMAIL,
      to: params.to,
      subject: `🎵 Nuevo turno asignado — ${dateFormatted}`,
      html,
    });
    console.log(`[email] ✅ Enviado a ${params.to}`);
  } catch (err) {
    console.error('[email] ❌ Error al enviar:', err);
    // No lanzar: no queremos que falle la asignación si falla el email
  }
}