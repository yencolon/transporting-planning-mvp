import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { DutyRepository } from '../src/modules/duties/domain/duty.repository';
import { OverlappingDutyError } from '../src/modules/duties/domain/errors';
import { TimeWindow } from '../src/modules/duties/domain/time-window';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service';

const at = (hour: string) => new Date(`2027-01-15T${hour}:00:00Z`);

describe('Duty overlap constraint (database)', () => {
  let app: TestingModule;
  let prisma: PrismaService;
  let duties: DutyRepository;
  let routeId: string;
  let unitId: string;

  beforeAll(async () => {
    app = await Test.createTestingModule({ imports: [AppModule] }).compile();
    await app.init();

    prisma = app.get(PrismaService);
    duties = app.get(DutyRepository);

    const route = await prisma.route.create({
      data: { name: `overlap-spec-${Date.now()}` },
    });
    const unit = await prisma.unit.create({
      data: { name: `overlap-spec-${Date.now()}` },
    });
    routeId = route.id;
    unitId = unit.id;
  });

  afterAll(async () => {
    await prisma.duty.deleteMany({ where: { routeId } });
    await prisma.route.delete({ where: { id: routeId } });
    await prisma.unit.delete({ where: { id: unitId } });
    await app.close();
  });

  it('rejects an overlapping write that bypasses the use case', async () => {
    await duties.create({
      routeId,
      unitId,
      window: TimeWindow.create(at('06'), at('08')),
    });

    await expect(
      duties.create({
        routeId,
        unitId,
        window: TimeWindow.create(at('07'), at('09')),
      }),
    ).rejects.toBeInstanceOf(OverlappingDutyError);
  });

  it('allows a back-to-back window', async () => {
    const duty = await duties.create({
      routeId,
      unitId,
      window: TimeWindow.create(at('08'), at('10')),
    });

    expect(duty.window.startAt).toEqual(at('08'));
  });
});
