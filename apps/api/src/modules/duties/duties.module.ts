import { Module } from '@nestjs/common';
import { PersistenceModule } from '../../infrastructure/persistence.module';
import { AssignDuty } from './application/assign-duty';
import { DeleteDuty } from './application/delete-duty';
import { RescheduleDuty } from './application/reschedule-duty';

const useCases = [AssignDuty, RescheduleDuty, DeleteDuty];

@Module({
  imports: [PersistenceModule],
  providers: useCases,
  exports: useCases,
})
export class DutiesModule {}
