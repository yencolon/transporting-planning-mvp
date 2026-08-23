import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { DuplicateUnitError } from '../domain/errors';
import { Unit } from '../domain/unit';
import { UnitRepository } from '../domain/unit.repository';

const UNIQUE_VIOLATION = 'P2002';

@Injectable()
export class PrismaUnitRepository implements UnitRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * The unique index enforces the same rule as CreateUnit. If two concurrent
   * requests race past the application check, translate the violation into the
   * domain error so callers only ever see one failure mode.
   */
  async create(name: string): Promise<Unit> {
    try {
      return await this.prisma.unit.create({ data: { name } });
    } catch (error) {
      if ((error as { code?: unknown })?.code === UNIQUE_VIOLATION) {
        throw new DuplicateUnitError(name);
      }
      throw error;
    }
  }

  findById(id: string): Promise<Unit | null> {
    return this.prisma.unit.findUnique({ where: { id } });
  }

  findByName(name: string): Promise<Unit | null> {
    return this.prisma.unit.findUnique({ where: { name } });
  }

  list(): Promise<Unit[]> {
    return this.prisma.unit.findMany({ orderBy: { name: 'asc' } });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.unit.delete({ where: { id } });
  }
}
