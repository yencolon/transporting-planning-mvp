import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { Unit } from '../domain/unit';
import { UnitRepository } from '../domain/unit.repository';

@Injectable()
export class PrismaUnitRepository implements UnitRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<Unit | null> {
    return this.prisma.unit.findUnique({ where: { id } });
  }

  list(): Promise<Unit[]> {
    return this.prisma.unit.findMany({ orderBy: { name: 'asc' } });
  }
}
