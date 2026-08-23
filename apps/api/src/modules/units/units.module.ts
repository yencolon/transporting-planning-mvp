import { Module } from '@nestjs/common';
import { PersistenceModule } from '../../infrastructure/persistence.module';
import { ListUnits } from './application/list-units';

@Module({
  imports: [PersistenceModule],
  providers: [ListUnits],
  exports: [ListUnits],
})
export class UnitsModule {}
