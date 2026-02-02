import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seeding...');

  // Crear usuario administrador por defecto
  const hashedPassword = await bcrypt.hash('admin123', 12);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@zazcreditos.com' },
    update: {},
    create: {
      email: 'admin@zazcreditos.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'ZAZ',
      role: UserRole.ADMIN,
      isActive: true,
    },
  });

  console.log('👤 Usuario administrador creado:', adminUser.email);

  // Crear usuario de prueba
  const testUser = await prisma.user.upsert({
    where: { email: 'user@test.com' },
    update: {},
    create: {
      email: 'user@test.com',
      password: await bcrypt.hash('user123', 12),
      firstName: 'Usuario',
      lastName: 'Test',
      role: UserRole.USER,
      isActive: true,
    },
  });

  console.log('👤 Usuario de prueba creado:', testUser.email);

  console.log('✅ Seeding completado!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async e => {
    console.error('❌ Error durante seeding:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
