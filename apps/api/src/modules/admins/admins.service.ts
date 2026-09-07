import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  ADMIN_ROLE,
  Admin,
  AdminDocument,
  PublicAdmin,
} from './schemas/admin.schema';

interface CreateAdminInput {
  name: string;
  email: string;
  passwordHash: string;
}

export function normalizeAdminEmail(email: string): string {
  return email.trim().toLowerCase();
}

@Injectable()
export class AdminsService {
  constructor(
    @InjectModel(Admin.name)
    private readonly adminModel: Model<Admin>,
  ) {}

  async createAdmin(input: CreateAdminInput): Promise<AdminDocument> {
    return this.adminModel.create({
      name: input.name.trim(),
      email: normalizeAdminEmail(input.email),
      passwordHash: input.passwordHash,
      role: ADMIN_ROLE,
    });
  }

  async findByEmailWithPassword(
    email: string,
  ): Promise<AdminDocument | null> {
    return this.adminModel
      .findOne({ email: normalizeAdminEmail(email) })
      .select('+passwordHash')
      .exec();
  }

  async findActiveById(
    id: string | Types.ObjectId,
  ): Promise<AdminDocument | null> {
    const objectId = this.toObjectId(id);

    if (!objectId) {
      return null;
    }

    return this.adminModel
      .findOne({
        _id: objectId,
        isActive: true,
      })
      .exec();
  }

  async markLastLogin(id: string | Types.ObjectId): Promise<void> {
    const objectId = this.toObjectId(id);

    if (!objectId) {
      return;
    }

    await this.adminModel
      .updateOne(
        { _id: objectId },
        {
          $set: {
            lastLoginAt: new Date(),
          },
        },
      )
      .exec();
  }

  toPublicAdmin(admin: AdminDocument): PublicAdmin {
    return {
      id: admin._id.toString(),
      name: admin.name,
      email: admin.email,
      role: admin.role,
    };
  }

  private toObjectId(id: string | Types.ObjectId): Types.ObjectId | null {
    if (id instanceof Types.ObjectId) {
      return id;
    }

    if (!Types.ObjectId.isValid(id)) {
      return null;
    }

    return new Types.ObjectId(id);
  }
}
