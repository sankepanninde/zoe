/**
 * Migración de datos viejos: Availability → AvailabilityService
 *
 * Lógica (según spec):
 *   - available = true  → se ignora (queda PENDIENTE por defecto)
 *   - available = false → crear AvailabilityService NO_DISPONIBLE
 *                         por cada Service de ese día en esa iglesia
 *
 * Uso:
 *   pnpm tsx src/scripts/migrate-availability.ts --dry-run
 *   pnpm tsx src/scripts/migrate-availability.ts
 *   pnpm tsx src/scripts/migrate-availability.ts --rollback
 *   pnpm tsx src/scripts/migrate-availability.ts --rollback <log-file>
 */
import { PrismaClient } from '@prisma/client';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const prisma = new PrismaClient();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOGS_DIR = path.resolve(__dirname, '..', '..', 'scripts-logs');

interface MigrationLog {
  timestamp: string;
  createdIds: string[];
  totalAvailabilitiesProcessed: number;
  totalServicesSkipped: number;
  totalCreated: number;
}

// ===========================================
// HELPERS
// ===========================================

async function ensureLogsDir() {
  await fs.mkdir(LOGS_DIR, { recursive: true });
}

async function saveLog(log: MigrationLog): Promise<string> {
  await ensureLogsDir();
  const file = path.join(
    LOGS_DIR,
    `migration-availability-${log.timestamp.replace(/[:.]/g, '-')}.json`
  );
  await fs.writeFile(file, JSON.stringify(log, null, 2), 'utf-8');
  return file;
}

async function findLatestLog(): Promise<string | null> {
  try {
    const files = (await fs.readdir(LOGS_DIR))
      .filter((f) => f.startsWith('migration-availability-') && f.endsWith('.json'))
      .sort()
      .reverse();
    return files.length > 0 ? path.join(LOGS_DIR, files[0]) : null;
  } catch {
    return null;
  }
}

// ===========================================
// MIGRACIÓN
// ===========================================

async function runMigration(dryRun: boolean) {
  console.log(`\n🚀 Migración Availability → AvailabilityService`);
  console.log(`   Modo: ${dryRun ? 'DRY-RUN (no toca la DB)' : 'REAL'}\n`);

  const oldRows = await prisma.availability.findMany({
    where: { available: false },
    select: {
      id: true,
      userId: true,
      date: true,
      reason: true,
      user: { select: { churchId: true, firstName: true, lastName: true } },
    },
    orderBy: { date: 'asc' },
  });

  console.log(`📦 Filas viejas con available=false: ${oldRows.length}`);

  const log: MigrationLog = {
    timestamp: new Date().toISOString(),
    createdIds: [],
    totalAvailabilitiesProcessed: oldRows.length,
    totalServicesSkipped: 0,
    totalCreated: 0,
  };

  for (const row of oldRows) {
    const dayKey = row.date.toISOString().slice(0, 10);
    const dayStart = new Date(`${dayKey}T00:00:00.000Z`);
    const dayEnd = new Date(`${dayKey}T23:59:59.999Z`);

    const services = await prisma.service.findMany({
      where: {
        churchId: row.user.churchId,
        date: { gte: dayStart, lte: dayEnd },
      },
      select: { id: true },
    });

    if (services.length === 0) {
      console.log(
        `  ⚠ ${row.user.firstName} ${row.user.lastName} — ${dayKey}: sin servicios, se salta`
      );
      log.totalServicesSkipped += services.length;
      continue;
    }

    console.log(
      `  → ${row.user.firstName} ${row.user.lastName} — ${dayKey}: ${services.length} servicio(s)`
    );

    for (const svc of services) {
      const existing = await prisma.availabilityService.findUnique({
        where: { userId_serviceId: { userId: row.userId, serviceId: svc.id } },
      });

      if (existing) {
        console.log(`      · ya existe (${existing.estado}), se salta`);
        log.totalServicesSkipped++;
        continue;
      }

      if (!dryRun) {
        const created = await prisma.availabilityService.create({
          data: {
            userId: row.userId,
            serviceId: svc.id,
            estado: 'NO_DISPONIBLE',
          },
          select: { id: true },
        });
        log.createdIds.push(created.id);
      }
      log.totalCreated++;
    }
  }

  console.log(`\n✅ Resumen:`);
  console.log(`   Filas viejas procesadas: ${log.totalAvailabilitiesProcessed}`);
  console.log(`   Servicios creados:       ${log.totalCreated}`);
  console.log(`   Servicios saltados:      ${log.totalServicesSkipped}`);

  if (dryRun) {
    console.log(`\n🧪 DRY-RUN: no se escribió nada en la DB.\n`);
    return;
  }

  if (log.createdIds.length === 0) {
    console.log(`\n✋ Nada que guardar en el log.\n`);
    return;
  }

  const file = await saveLog(log);
  console.log(`\n💾 Log guardado en: ${file}`);
  console.log(`   Para revertir:\n     pnpm tsx src/scripts/migrate-availability.ts --rollback\n`);
}

// ===========================================
// ROLLBACK
// ===========================================

async function runRollback(logFile?: string) {
  console.log(`\n⏪ Rollback de migración Availability`);

  const file = logFile ? path.resolve(logFile) : await findLatestLog();
  if (!file) {
    console.error(`\n❌ No se encontró ningún log de migración.`);
    process.exit(1);
  }

  console.log(`   Log: ${file}\n`);

  const raw = await fs.readFile(file, 'utf-8');
  const log: MigrationLog = JSON.parse(raw);

  if (log.createdIds.length === 0) {
    console.log(`✋ El log no tiene IDs creados, nada que revertir.\n`);
    return;
  }

  const result = await prisma.availabilityService.deleteMany({
    where: { id: { in: log.createdIds } },
  });

  console.log(`✅ Rollback completado:`);
  console.log(`   IDs en el log:  ${log.createdIds.length}`);
  console.log(`   Filas borradas: ${result.count}\n`);
}

// ===========================================
// MAIN
// ===========================================

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const rollbackIdx = args.indexOf('--rollback');

  try {
    if (rollbackIdx !== -1) {
      const explicit = args[rollbackIdx + 1];
      await runRollback(explicit && !explicit.startsWith('--') ? explicit : undefined);
    } else {
      await runMigration(dryRun);
    }
  } catch (err) {
    console.error('\n❌ Error:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();