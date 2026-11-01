import { prisma } from '../../lib/prisma.js';
import { AuthError } from '../auth/auth.service.js';
import { getAvailabilityQuerySchema } from './availability.schemas.js';

// Helpers para fechas en Bogotá
const getBogotaDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
    year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(date);
};

export async function getMyAvailability(userId: string, query: { desde: string; hasta: string }) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AuthError('Usuario no encontrado', 404);

  const start = new Date(`${query.desde}T00:00:00.000-05:00`);
  const end = new Date(`${query.hasta}T23:59:59.999-05:00`);

  // 1. Traer bloqueos del usuario
  const blocks = await prisma.availabilityBlock.findMany({
    where: { userId },
  });

  // 2. Traer configuraciones de días
  const daysConfig = await prisma.availability.findMany({
    where: { userId, date: { gte: start, lte: end } },
  });
  const dayConfigMap = new Map(daysConfig.map(d => [d.date.toISOString().slice(0, 10), d.available]));

  // 3. Traer estados de servicios
  const serviceConfigs = await prisma.availabilityService.findMany({
    where: { userId },
  });
  const serviceConfigMap = new Map(serviceConfigs.map(s => [s.serviceId, s.estado]));

  // 4. Traer servicios en el rango (que pertenezcan a los ministerios del usuario o de la iglesia)
  const userMinistries = await prisma.userMinistry.findMany({ where: { userId } });
  const ministryIds = userMinistries.map(m => m.ministryId);

  const services = await prisma.service.findMany({
    where: {
      churchId: user.churchId,
      deletedAt: null,
      date: { gte: start, lte: end },
      OR: [
        { assignments: { some: { userId } } }, // asignado directo
        // Asumiendo que todos los servicios de la iglesia aplican, o filtramos por ministerio:
        // Si Service tuviera ministryId, lo filtraríamos aquí.
      ]
    },
    include: { serviceType: true, assignments: { include: { ministry: true } } }
  });

  // Procesar días
  const result = [];
  const current = new Date(start);
  
  while (current <= end) {
    const dateStr = current.toISOString().slice(0, 10);
    const dayOfMonth = current.getDate();
    const month = current.getMonth();
    
    // Lógica de bloqueos
    let bloqueado = false;
    for (const block of blocks) {
      if (block.repite === 'NINGUNA' || !block.repite) {
        if (dateStr >= block.desde.toISOString().slice(0, 10) && dateStr <= block.hasta.toISOString().slice(0, 10)) {
          bloqueado = true; break;
        }
      } else {
        // Repetición lógica mensual/anual en Bogotá
        const blockStart = new Date(block.desde);
        if (block.repite === 'MENSUAL' && blockStart.getDate() === dayOfMonth) bloqueado = true;
        if (block.repite === 'ANUAL' && blockStart.getDate() === dayOfMonth && blockStart.getMonth() === month) bloqueado = true;
      }
    }

    const dayOverride = dayConfigMap.get(dateStr);
    const estadoDia = dayOverride === true ? 'DISPONIBLE' : dayOverride === false ? 'NO_DISPONIBLE' : null;

    const servicesOfDay = services.filter(s => getBogotaDate(s.date) === dateStr).map(s => {
      const assignedMinistry = s.assignments.find(a => a.userId === userId)?.ministry?.name ?? 'Iglesia';
      const sConfig = serviceConfigMap.get(s.id);
      
      let estado: string = 'PENDIENTE';
      let fuente: string = 'pendiente';
      
      if (bloqueado) {
        estado = 'NO_DISPONIBLE'; fuente = 'bloqueo';
      } else if (sConfig) {
        estado = sConfig; fuente = 'servicio';
      } else if (dayOverride !== undefined) {
        estado = dayOverride ? 'DISPONIBLE' : 'NO_DISPONIBLE'; fuente = 'dia';
      }

      return {
        serviceId: s.id,
        nombre: s.title ?? s.serviceType.name,
        tipo: s.serviceType.name,
        ministerio: assignedMinistry,
        horaInicio: s.startTime,
        horaFin: s.endTime,
        estado,
        fuente,
      };
    });

    result.push({
      fecha: dateStr,
      bloqueado,
      estado: estadoDia,
      servicios: servicesOfDay,
    });

    current.setDate(current.getDate() + 1);
  }

    // Formatear bloqueos con las fechas originales (sin expandir)
  const bloqueos = blocks.map((b) => ({
    id: b.id,
    desde: b.desde.toISOString().slice(0, 10),
    hasta: b.hasta.toISOString().slice(0, 10),
    repite:
      b.repite === 'ANUAL'
        ? 'anual'
        : b.repite === 'MENSUAL'
          ? 'mensual'
          : 'ninguna',
    motivo: b.motivo ?? null,
  }));

  return { dias: result, bloqueos };
}

// ===========================================
// GET /availability/me/blocks
// ===========================================
export async function listBlocks(
  userId: string,
  query: { desde: string; hasta: string }
) {
  const start = new Date(`${query.desde}T00:00:00.000-05:00`);
  const end = new Date(`${query.hasta}T23:59:59.999-05:00`);

  // Solapamiento: el bloqueo [b.desde, b.hasta] se solapa con [start, end] si:
  //   b.desde <= end  AND  b.hasta >= start
  const blocks = await prisma.availabilityBlock.findMany({
    where: {
      userId,
      desde: { lte: end },
      hasta: { gte: start },
    },
    orderBy: { desde: 'asc' },
  });

  // Devolvemos con las fechas originales (NO expandimos repetidos)
  return blocks.map((b) => ({
    id: b.id,
    desde: b.desde.toISOString().slice(0, 10),
    hasta: b.hasta.toISOString().slice(0, 10),
    repite:
      b.repite === 'ANUAL'
        ? 'anual'
        : b.repite === 'MENSUAL'
          ? 'mensual'
          : 'ninguna',
    motivo: b.motivo ?? null,
  }));
}

export async function setDayState(userId: string, fecha: string, estado: 'DISPONIBLE' | 'NO_DISPONIBLE') {
  const date = new Date(`${fecha}T12:00:00.000Z`); // Mediodía para evitar problemas de TZ
  const available = estado === 'DISPONIBLE';

  await prisma.availability.upsert({
    where: { userId_date: { userId, date } },
    update: { available },
    create: { userId, date, available },
  });
}

export async function setServiceState(userId: string, serviceId: string, estado: 'DISPONIBLE' | 'NO_DISPONIBLE' | null) {
  // Validar que el servicio existe y el usuario tiene acceso (ej. está en un ministerio relacionado)
  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!service) throw new AuthError('Servicio no encontrado', 404);

  if (estado === null) {
    await prisma.availabilityService.deleteMany({ where: { userId, serviceId } });
  } else {
    await prisma.availabilityService.upsert({
      where: { userId_serviceId: { userId, serviceId } },
      update: { estado },
      create: { userId, serviceId, estado },
    });
  }
}

export async function createBlock(userId: string, data: { desde: string; hasta: string; repite: string; motivo?: string }) {
  const desde = new Date(`${data.desde}T12:00:00.000Z`);
  const hasta = new Date(`${data.hasta}T12:00:00.000Z`);
  
  // Prisma enum mapping
  const repiteEnum = data.repite === 'anual' ? 'ANUAL' : data.repite === 'mensual' ? 'MENSUAL' : 'NINGUNA';

  return prisma.availabilityBlock.create({
    data: { userId, desde, hasta, repite: repiteEnum, motivo: data.motivo }
  });
}

export async function updateBlock(userId: string, id: string, data: any) {
  const block = await prisma.availabilityBlock.findFirst({ where: { id, userId } });
  if (!block) throw new AuthError('Bloqueo no encontrado', 404);

  return prisma.availabilityBlock.update({
    where: { id },
    data: {
      ...(data.desde && { desde: new Date(`${data.desde}T12:00:00.000Z`) }),
      ...(data.hasta && { hasta: new Date(`${data.hasta}T12:00:00.000Z`) }),
      ...(data.repite && { repite: data.repite === 'anual' ? 'ANUAL' : data.repite === 'mensual' ? 'MENSUAL' : 'NINGUNA' }),
      ...(data.motivo !== undefined && { motivo: data.motivo }),
    }
  });
}

export async function deleteBlock(userId: string, id: string) {
  const block = await prisma.availabilityBlock.findFirst({ where: { id, userId } });
  if (!block) throw new AuthError('Bloqueo no encontrado', 404);
  await prisma.availabilityBlock.delete({ where: { id } });
}