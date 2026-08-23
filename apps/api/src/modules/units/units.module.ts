import { Module } from '@nestjs/common';
import { PersistenceModule } from '../../infrastructure/persistence.module';
import { ListUnits } from './application/list-units';
import { UnitsController } from './units.controller';

@Module({
  imports: [PersistenceModule],
  controllers: [UnitsController],
  providers: [ListUnits],
  exports: [ListUnits],
})
export class UnitsModule {}
