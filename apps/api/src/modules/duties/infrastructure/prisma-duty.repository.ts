import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { Duty } from '../domain/duty';
import {
  DutyChanges,
  DutyRepository,
  NewDuty,
} from '../domain/duty.repository';
import { OverlappingDutyError } from '../domain/errors';
import { TimeWindow } from '../domain/time-window';

type DutyRow = {
  id: string;
  routeId: string;
  unitId: string;
  startAt: Date;
  endAt: Date;
};

const EXCLUSION_VIOLATION = '23P01';

@Injectable()
export class PrismaDutyRepository implements DutyRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(duty: NewDuty): Promise<Duty> {
    const created = await this.guardOverlap(duty.unitId, () =>
      this.prisma.duty.create({
        data: {
          routeId: duty.routeId,
          unitId: duty.unitId,
          startAt: duty.window.startAt,
          endAt: duty.window.endAt,
        },
      }),
    );
    return this.toDomain(created);
  }

  async update(id: string, changes: DutyChanges): Promise<Duty> {
    const updated = await this.guardOverlap(changes.unitId, () =>
      this.prisma.duty.update({
        where: { id },
        data: {
          unitId: changes.unitId,
          startAt: changes.window?.startAt,
          endAt: changes.window?.endAt,
        },
      }),
    );
    return this.toDomain(updated);
  }

  async findById(id: string): Promise<Duty | null> {
    const row = await this.prisma.duty.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findByRouteId(routeId: string): Promise<Duty[]> {
    const rows = await this.prisma.duty.findMany({
      where: { routeId },
      orderBy: { startAt: 'asc' },
    });
    return rows.map((row) => this.toDomain(row));
  }

  async findByUnitId(unitId: string): Promise<Duty[]> {
    const rows = await this.prisma.duty.findMany({
      where: { unitId },
      orderBy: { startAt: 'asc' },
    });
    return rows.map((row) => this.toDomain(row));
  }

  async findOverlapping(
    unitId: string,
    window: TimeWindow,
    excludeDutyId?: string,
  ): Promise<Duty | null> {
    const row = await this.prisma.duty.findFirst({
      where: {
        unitId,
        startAt: { lt: window.endAt },
        endAt: { gt: window.startAt },
        ...(excludeDutyId ? { id: { not: excludeDutyId } } : {}),
      },
    });
    return row ? this.toDomain(row) : null;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.duty.delete({ where: { id } });
  }

  /**
   * The database enforces the same rule as AssignDuty. If two concurrent writes
   * race past the application check, translate the constraint violation into the
   * domain error so callers only ever see one failure mode.
   */
  private async guardOverlap<T>(
    unitId: string | undefined,
    write: () => Promise<T>,
  ): Promise<T> {
    try {
      return await write();
    } catch (error) {
      if (isExclusionViolation(error)) {
        throw new OverlappingDutyError(unitId ?? 'unknown');
      }
      throw error;
    }
  }

  private toDomain(row: DutyRow): Duty {
    return {
      id: row.id,
      routeId: row.routeId,
      unitId: row.unitId,
      window: TimeWindow.create(row.startAt, row.endAt),
    };
  }
}

function isExclusionViolation(error: unknown): boolean {
  if ((error as { code?: unknown })?.code === EXCLUSION_VIOLATION) {
    return true;
  }
  return (
    error instanceof Error &&
    error.message.includes('Duty_unit_window_no_overlap')
  );
}
