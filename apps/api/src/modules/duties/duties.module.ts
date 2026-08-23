import { Module } from '@nestjs/common';
import { PersistenceModule } from '../../infrastructure/persistence.module';
import { AssignDuty } from './application/assign-duty';
import { DeleteDuty } from './application/delete-duty';
import { RescheduleDuty } from './application/reschedule-duty';
import { DutiesController } from './duties.controller';

const useCases = [AssignDuty, RescheduleDuty, DeleteDuty];

@Module({
  imports: [PersistenceModule],
  controllers: [DutiesController],
  providers: useCases,
  exports: useCases,
})
export class DutiesModule {}
