import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { AssignDuty } from '../src/modules/duties/application/assign-duty';
import { OverlappingDutyError } from '../src/modules/duties/domain/errors';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service';

const at = (hour: string) => new Date(`2027-05-10T${hour}:00:00Z`);

describe('Concurrent duty assignment', () => {
  let app: TestingModule;
  let prisma: PrismaService;
  let assignDuty: AssignDuty;
  let routeId: string;
  let unitId: string;

  beforeAll(async () => {
    app = await Test.createTestingModule({ imports: [AppModule] }).compile();
    await app.init();
    prisma = app.get(PrismaService);
    assignDuty = app.get(AssignDuty);
  });

  beforeEach(async () => {
    const route = await prisma.route.create({
      data: { name: `concurrency-${Date.now()}-${Math.random()}` },
    });
    const unit = await prisma.unit.create({
      data: { name: `concurrency-${Date.now()}-${Math.random()}` },
    });
    routeId = route.id;
    unitId = unit.id;
  });

  afterEach(async () => {
    await prisma.duty.deleteMany({ where: { routeId } });
    await prisma.route.delete({ where: { id: routeId } });
    await prisma.unit.delete({ where: { id: unitId } });
  });

  afterAll(async () => {
    await app.close();
  });

  it('lets exactly one of two simultaneous identical assignments through', async () => {
    const results = await Promise.allSettled([
      assignDuty.execute({ routeId, unitId, startAt: at('06'), endAt: at('08') }),
      assignDuty.execute({ routeId, unitId, startAt: at('06'), endAt: at('08') }),
    ]);

    const accepted = results.filter((r) => r.status === 'fulfilled');
    const refused = results.filter((r) => r.status === 'rejected');

    expect(accepted).toHaveLength(1);
    expect(refused).toHaveLength(1);
    expect((refused[0] as PromiseRejectedResult).reason).toBeInstanceOf(
      OverlappingDutyError,
    );
    expect(await prisma.duty.count({ where: { unitId } })).toBe(1);
  });

  it('keeps a single duty when five mutually overlapping assignments race', async () => {
    // Every window ends at 13:00, so all five cover 12:00-13:00 and no two can coexist.
    const results = await Promise.allSettled(
      Array.from({ length: 5 }, (_, index) =>
        assignDuty.execute({
          routeId,
          unitId,
          startAt: at(String(6 + index).padStart(2, '0')),
          endAt: at('13'),
        }),
      ),
    );

    const refused = results.filter((r) => r.status === 'rejected');
    expect(
      refused.every(
        (r) => (r as PromiseRejectedResult).reason instanceof OverlappingDutyError,
      ),
    ).toBe(true);
    expect(await prisma.duty.count({ where: { unitId } })).toBe(1);
  });

  it('allows simultaneous assignments that do not overlap', async () => {
    const results = await Promise.allSettled([
      assignDuty.execute({ routeId, unitId, startAt: at('06'), endAt: at('08') }),
      assignDuty.execute({ routeId, unitId, startAt: at('08'), endAt: at('10') }),
      assignDuty.execute({ routeId, unitId, startAt: at('10'), endAt: at('12') }),
    ]);

    expect(results.every((r) => r.status === 'fulfilled')).toBe(true);
    expect(await prisma.duty.count({ where: { unitId } })).toBe(3);
  });
});
