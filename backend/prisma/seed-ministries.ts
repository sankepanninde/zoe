import { PrismaClient } from '@prisma/client';


const prisma = new PrismaClient();

// Los 12 ministerios de tu iglesia con colores distintivos
const MINISTRIES = [
  { name: 'Sonido',          color: '#2563EB', icon: 'graphic_eq' },
  { name: 'Alabanza',        color: '#7C3AED', icon: 'music_note' },
  { name: 'Audiovisuales',   color: '#0891B2', icon: 'videocam' },
  { name: 'Damas',           color: '#DB2777', icon: 'woman' },
  { name: 'Varones',         color: '#1E40AF', icon: 'man' },
  { name: 'Jóvenes Adultos', color: '#059669', icon: 'groups' },
  { name: 'Jóvenes',         color: '#F59E0B', icon: 'sports_handball' },
  { name: 'Ujieres',         color: '#DC2626', icon: 'support_agent' },
  { name: 'Adolescentes',    color: '#8B5CF6', icon: 'backpack' },
  { name: 'Infantes',        color: '#EC4899', icon: 'child_care' },
  { name: 'Párvulos',        color: '#F97316', icon: 'toys' },
  { name: 'Nuevos',          color: '#10B981', icon: 'waving_hand' },
];

async function main() {
  console.log('🌱 Iniciando seed de ministerios...\n');

  const churches = await prisma.church.findMany({
    select: { id: true, name: true },
  });

  console.log(`📋 Encontradas ${churches.length} iglesias\n`);

  for (const church of churches) {
    console.log(`🏛️  Procesando: ${church.name}`);

    // 1. Crear los 12 ministerios por defecto
    let created = 0;
    for (const m of MINISTRIES) {
      const exists = await prisma.ministry.findFirst({
        where: { churchId: church.id, name: m.name },
      });

      if (!exists) {
        await prisma.ministry.create({
          data: {
            churchId: church.id,
            name: m.name,
            color: m.color,
            icon: m.icon,
            isDefault: true,
            active: true,
          },
        });
        created++;
      }
    }
    console.log(`   ✅ ${created} ministerios creados`);

    // 2. Obtener el ministerio "Sonido" para migrar datos existentes
    const soundMinistry = await prisma.ministry.findFirst({
      where: { churchId: church.id, name: 'Sonido' },
    });

    if (!soundMinistry) {
      console.log(`   ⚠️  No se encontró el ministerio "Sonido"\n`);
      continue;
    }

    // 3. Migrar usuarios existentes: todos con position → Sonido
    const users = await prisma.user.findMany({
      where: { churchId: church.id },
      select: { id: true, name: true, role: true, position: true },
    });

    let usersMigrated = 0;
    for (const user of users) {
      if (!user.position) continue;

      const alreadyMigrated = await prisma.userMinistry.findFirst({
        where: { userId: user.id, ministryId: soundMinistry.id },
      });

      if (!alreadyMigrated) {
        await prisma.userMinistry.create({
          data: {
            userId: user.id,
            ministryId: soundMinistry.id,
            isLeader: user.role === 'LEADER' || user.role === 'ADMIN',
            position: user.position,
          },
        });
        usersMigrated++;
      }
    }
    console.log(`   ✅ ${usersMigrated} usuarios migrados a "Sonido"`);

    // 4. Migrar asignaciones existentes (todas a Sonido)
    const assignmentsResult = await prisma.assignment.updateMany({
      where: {
        ministryId: null,
        service: { churchId: church.id },
      },
      data: { ministryId: soundMinistry.id },
    });
    console.log(`   ✅ ${assignmentsResult.count} asignaciones migradas a "Sonido"\n`);
  }

  console.log('✅ Seed completado con éxito\n');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    throw e; // Node termina con código de error automáticamente
  })
  .finally(async () => {
    await prisma.$disconnect();
  });