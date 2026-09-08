import { config as loadEnv } from 'dotenv';
import mongoose from 'mongoose';
import { hash } from 'argon2';
import {
  Admin,
  AdminSchema,
} from '../../modules/admins/schemas/admin.schema';
import {
  buildMongoUriFromParts,
  requireProductionConfigValue,
} from '../../config/env';
import { normalizeAdminEmail } from '../../modules/admins/admins.service';

loadEnv({ quiet: true });

const DEFAULT_ADMIN_NAME = 'Studio Admin';
const DEFAULT_ADMIN_EMAIL = 'admin@studio.local';
const DEFAULT_ADMIN_PASSWORD = 'change-this-password';

async function seedAdmin(): Promise<void> {
  const mongoUri =
    process.env.MONGODB_URI?.trim() ||
    buildMongoUriFromParts({
      host: process.env.MONGO_HOST,
      port: process.env.MONGO_PORT,
      database: process.env.MONGO_DATABASE,
      username: process.env.MONGO_APP_USERNAME,
      password: process.env.MONGO_APP_PASSWORD,
      authSource: process.env.MONGO_AUTH_SOURCE,
    });

  if (!mongoUri) {
    throw new Error(
      'MONGODB_URI or MONGO_* application database variables are required to seed the admin user.',
    );
  }

  const adminName =
    process.env.ADMIN_SEED_NAME?.trim() || DEFAULT_ADMIN_NAME;
  const adminEmail = normalizeAdminEmail(
    process.env.ADMIN_SEED_EMAIL || DEFAULT_ADMIN_EMAIL,
  );
  const adminPassword =
    process.env.ADMIN_SEED_PASSWORD || DEFAULT_ADMIN_PASSWORD;

  if (adminPassword.length < 8) {
    throw new Error('ADMIN_SEED_PASSWORD must be at least 8 characters.');
  }

  if (process.env.NODE_ENV === 'production') {
    requireProductionConfigValue(adminPassword, 'ADMIN_SEED_PASSWORD');
  }

  const connection = await mongoose.createConnection(mongoUri).asPromise();

  try {
    const AdminModel = connection.model<Admin>(Admin.name, AdminSchema);
    const existingAdmin = await AdminModel.findOne({ email: adminEmail })
      .select('_id')
      .exec();

    if (existingAdmin) {
      console.log('Admin already exists');
      return;
    }

    const passwordHash = await hash(adminPassword);

    await AdminModel.create({
      name: adminName,
      email: adminEmail,
      passwordHash,
      role: 'admin',
      isActive: true,
      lastLoginAt: null,
    });

    console.log('Admin created successfully');
  } finally {
    await connection.close();
  }
}

void seedAdmin().catch((error: unknown) => {
  const message =
    error instanceof Error ? error.message : 'Failed to seed admin user.';

  console.error(message);
  process.exitCode = 1;
});
