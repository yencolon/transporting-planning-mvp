import { Module } from '@nestjs/common';
import { DutyRepository } from '../modules/duties/domain/duty.repository';
import { PrismaDutyRepository } from '../modules/duties/infrastructure/prisma-duty.repository';
import { RouteRepository } from '../modules/routes/domain/route.repository';
import { PrismaRouteRepository } from '../modules/routes/infrastructure/prisma-route.repository';
import { UnitRepository } from '../modules/units/domain/unit.repository';
import { PrismaUnitRepository } from '../modules/units/infrastructure/prisma-unit.repository';
import { PrismaModule } from './prisma/prisma.module';

/**
 * The single place where domain ports are bound to an implementation.
 * Swapping the data layer means editing this file and nothing else.
 */
@Module({
  imports: [PrismaModule],
  providers: [
    { provide: RouteRepository, useClass: PrismaRouteRepository },
    { provide: DutyRepository, useClass: PrismaDutyRepository },
    { provide: UnitRepository, useClass: PrismaUnitRepository },
  ],
  exports: [RouteRepository, DutyRepository, UnitRepository],
})
export class PersistenceModule {}
