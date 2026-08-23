import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ZodValidationPipe } from '../../infrastructure/http/zod-validation.pipe';
import { AssignDuty } from './application/assign-duty';
import { DeleteDuty } from './application/delete-duty';
import { RescheduleDuty } from './application/reschedule-duty';
import {
  AssignDutyBody,
  RescheduleDutyBody,
  assignDutySchema,
  rescheduleDutySchema,
} from './dto/duty.schema';
import { toDutyResponse } from './duty.response';

@Controller('duties')
export class DutiesController {
  constructor(
    private readonly assignDuty: AssignDuty,
    private readonly rescheduleDuty: RescheduleDuty,
    private readonly deleteDuty: DeleteDuty,
  ) {}

  @Post()
  async assign(
    @Body(new ZodValidationPipe(assignDutySchema)) body: AssignDutyBody,
  ) {
    return toDutyResponse(await this.assignDuty.execute(body));
  }

  @Patch(':id')
  async reschedule(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(rescheduleDutySchema)) body: RescheduleDutyBody,
  ) {
    return toDutyResponse(await this.rescheduleDuty.execute(id, body));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.deleteDuty.execute(id);
  }
}
