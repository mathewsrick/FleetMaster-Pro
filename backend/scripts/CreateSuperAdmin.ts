#!/usr/bin/env tsx
/**
 * Script para crear SuperAdmin manualmente
 * 
 * Uso:
 *   tsx backend/scripts/CreateSuperAdmin.ts <username> <email> <password>
 * 
 * Ejemplo:
 *   tsx backend/scripts/CreateSuperAdmin.ts admin admin@fleetmaster.pro MySecurePass123!
 */

import 'dotenv/config';
import { prisma } from '../src/shared/db';
import bcrypt from 'bcryptjs';

const createSuperAdmin = async () => {
  const args = process.argv.slice(2);

  if (args.length < 3) {
    console.error('❌ Error: Faltan argumentos');
    console.log('\n📖 Uso:');
    console.log('  tsx backend/scripts/CreateSuperAdmin.ts <username> <email> <password>');
    console.log('\n📝 Ejemplo:');
    console.log('  tsx backend/scripts/CreateSuperAdmin.ts admin admin@company.com MySecurePass123!\n');
    process.exit(1);
  }

  const [username, email, password] = args;

  // Validaciones
  if (username.length < 3) {
    console.error('❌ El username debe tener al menos 3 caracteres');
    process.exit(1);
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    console.error('❌ Email inválido');
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('❌ La contraseña debe tener al menos 8 caracteres');
    process.exit(1);
  }

  try {
    console.log('🔍 Verificando si el usuario ya existe...');
    
    const existingByUsername = await prisma.user.findUnique({
      where: { username }
    });

    if (existingByUsername) {
      console.error(`❌ Ya existe un usuario con el username: ${username}`);
      process.exit(1);
    }

    const existingByEmail = await prisma.user.findUnique({
      where: { email }
    });

    if (existingByEmail) {
      console.error(`❌ Ya existe un usuario con el email: ${email}`);
      process.exit(1);
    }

    console.log('🔐 Hasheando contraseña...');
    const hashedPassword = await bcrypt.hash(password, 12);

    console.log('💾 Creando SuperAdmin...');
    const newAdmin = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        role: 'SUPERADMIN',
        isConfirmed: true,
        createdAt: new Date()
      }
    });

    console.log('\n✅ SuperAdmin creado exitosamente!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`👤 Username: ${newAdmin.username}`);
    console.log(`📧 Email: ${newAdmin.email}`);
    console.log(`🎖️  Role: ${newAdmin.role}`);
    console.log(`🆔 ID: ${newAdmin.id}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('⚠️  IMPORTANTE:');
    console.log('  - Guarda las credenciales en un lugar seguro');
    console.log('  - No compartas la contraseña por canales inseguros');
    console.log('  - Considera cambiar la contraseña después del primer login\n');

  } catch (error: any) {
    console.error('❌ Error al crear SuperAdmin:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
};

createSuperAdmin();
