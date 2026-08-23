import { Module } from '@nestjs/common';
import { PersistenceModule } from '../../infrastructure/persistence.module';
import { CreateUnit } from './application/create-unit';
import { DeleteUnit } from './application/delete-unit';
import { ListUnits } from './application/list-units';
import { UnitsController } from './units.controller';

const useCases = [ListUnits, CreateUnit, DeleteUnit];

@Module({
  imports: [PersistenceModule],
  controllers: [UnitsController],
  providers: useCases,
  exports: useCases,
})
export class UnitsModule {}
