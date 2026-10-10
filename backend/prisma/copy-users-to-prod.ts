import { PrismaClient } from '@prisma/client';

const LOCAL_URL = process.env.LOCAL_DATABASE_URL!;
const PROD_URL = process.env.PROD_DATABASE_URL!;

const local = new PrismaClient({ datasources: { db: { url: LOCAL_URL } } });
const prod = new PrismaClient({ datasources: { db: { url: PROD_URL } } });

async function main() {
  console.log('🚀 Copiando usuarios de LOCAL → PRODUCCIÓN\n');

  const prodChurch = await prod.church.findFirst();
  if (!prodChurch) throw new Error('No hay iglesia en producción');

  const prodMinistries = await prod.ministry.findMany({
    where: { churchId: prodChurch.id },
  });
  const ministryMap = new Map(prodMinistries.map((m) => [m.name, m.id]));

  const localUsers = await local.user.findMany({
    include: { ministries: { include: { ministry: true } } },
  });

  console.log(`📋 ${localUsers.length} usuarios en local\n`);

  let created = 0, skipped = 0;

  for (const u of localUsers) {
    const exists = await prod.user.findFirst({
      where: { churchId: prodChurch.id, email: u.email },
    });
    if (exists) {
      console.log(`   ⏭️  ${u.email} ya existe`);
      skipped++;
      continue;
    }

    const newUser = await prod.user.create({
      data: {
        churchId: prodChurch.id,
        email: u.email,
        passwordHash: u.passwordHash,  // ← MISMA contraseña
        name: u.name,
        phone: u.phone,
        role: u.role,
        position: u.position,
        active: u.active,
        mustChangePassword: false,
      },
    });

    for (const um of u.ministries) {
      const ministryId = ministryMap.get(um.ministry.name);
      if (ministryId) {
        await prod.userMinistry.create({
          data: {
            userId: newUser.id,
            ministryId,
            isLeader: um.isLeader,
            position: um.position,
          },
        });
      }
    }

    console.log(`   ✅ ${u.email} (${u.role})`);
    created++;
  }

  console.log(`\n✅ ${created} creados · ${skipped} ya existían\n`);
}

main()
  .catch((e) => { console.error(e); throw e; })
  .finally(async () => {
    await local.$disconnect();
    await prod.$disconnect();
  });