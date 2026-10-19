import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

// 1. Los ministerios básicos
const MINISTRIES = [
  { name: 'Sonido', color: '#2563EB', icon: 'graphic_eq' },
  { name: 'Alabanza', color: '#7C3AED', icon: 'music_note' },
  { name: 'Audiovisuales', color: '#0891B2', icon: 'videocam' },
  { name: 'Ujieres', color: '#DC2626', icon: 'support_agent' },
];

async function main() {
  console.log('🌱 Iniciando seed de prueba...\n');

  // 1. Crear Iglesia
  const church = await prisma.church.upsert({
    where: { id: 'iglesia-prueba-id' }, // Forzamos un ID para que no se duplique
    update: {},
    create: {
      id: 'iglesia-prueba-id',
      name: 'Iglesia de Prueba',
      slug: 'iglesia-de-prueba', // <-- ESTA ES LA LÍNEA NUEVA QUE FALTABA
      plan: 'FREE',
    },
  });
  console.log(`✅ Iglesia creada: ${church.name}`);

  // 2. Crear Usuario Admin (Kevin)
  const hash = await argon2.hash('admin123');
  const admin = await prisma.user.upsert({
    where: { 
      churchId_email: {
        churchId: church.id,
        email: 'kevingololimpico@hotmail.com'
      }
    },
    update: {},
    create: {
      email: 'kevingololimpico@hotmail.com',
      name: 'Kevin Admin',
      role: 'ADMIN',
      passwordHash: hash, // <-- Corregido (era password)
      churchId: church.id,
    },
  });
  console.log(`✅ Usuario admin creado: ${admin.email} (Contraseña: admin123)`);

  // 3. Crear Tipos de Servicio
  const st1 = await prisma.serviceType.create({
    data: {
      name: 'Servicio Dominical — 1er Turno',
      churchId: church.id,
    },
  });
  const st2 = await prisma.serviceType.create({
    data: {
      name: 'Servicio Dominical — 2do Turno',
      churchId: church.id,
    },
  });

  // 4. Crear los Servicios (Domingos del año)
  console.log('📅 Creando servicios dominicales...');
  const year = new Date().getFullYear();
  let count = 0;
  
  // Recorremos todos los días del año
  for (let month = 0; month < 12; month++) {
    for (let day = 1; day <= 31; day++) {
      const date = new Date(year, month, day);
      if (date.getMonth() !== month) continue; // Evita desbordamiento de fechas
      
      if (date.getDay() === 0) { // 0 es Domingo
        date.setUTCHours(12, 0, 0, 0); // Forzamos mediodía UTC para evitar problemas de zona horaria
        
        // Primer turno
        await prisma.service.create({
          data: {
            title: 'Servicio Dominical — 1er Turno',
            date: date,
            startTime: '07:00',
            endTime: '09:45',
            churchId: church.id,
            serviceTypeId: st1.id,
          },
        });
        // Segundo turno
        await prisma.service.create({
          data: {
            title: 'Servicio Dominical — 2do Turno',
            date: date,
            startTime: '10:00',
            endTime: '12:45',
            churchId: church.id,
            serviceTypeId: st2.id,
          },
        });
        count += 2;
      }
    }
  }
  console.log(`✅ ${count} servicios creados`);

  // 5. Crear Ministerios (Lógica de tu archivo seed-ministries.ts)
  for (const m of MINISTRIES) {
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
  }
  console.log(`✅ ${MINISTRIES.length} ministerios creados`);

  console.log('\n🎉 ¡Seed completado con éxito!');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });