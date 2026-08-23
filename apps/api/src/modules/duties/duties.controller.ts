import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBody,
  ApiNoContentResponse,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import {
  AssignDutyBody,
  ListUnitDutiesQuery,
  RescheduleDutyBody,
  assignDutySchema,
  listUnitDutiesSchema,
  rescheduleDutySchema,
} from '@repo/shared';
import {
  ApiEnvelopeResponse,
  ApiErrorResponse,
} from '../../infrastructure/http/api-envelope.decorator';
import { toBodySchema } from '../../infrastructure/http/zod-json-schema';
import { ZodValidationPipe } from '../../infrastructure/http/zod-validation.pipe';
import { AssignDuty } from './application/assign-duty';
import { DeleteDuty } from './application/delete-duty';
import { ListUnitDuties } from './application/list-unit-duties';
import { RescheduleDuty } from './application/reschedule-duty';
import { DutyResponse, toDutyResponse } from './duty.response';

@ApiTags('duties')
@Controller('duties')
export class DutiesController {
  constructor(
    private readonly assignDuty: AssignDuty,
    private readonly rescheduleDuty: RescheduleDuty,
    private readonly deleteDuty: DeleteDuty,
    private readonly listUnitDuties: ListUnitDuties,
  ) {}

  @Get()
  @ApiQuery({ name: 'unitId', required: true })
  @ApiQuery({ name: 'from', required: false, schema: { format: 'date-time' } })
  @ApiQuery({ name: 'to', required: false, schema: { format: 'date-time' } })
  @ApiEnvelopeResponse(DutyResponse, { status: 200, isArray: true })
  @ApiErrorResponse(400, 'Invalid query')
  async list(
    @Query(new ZodValidationPipe(listUnitDutiesSchema))
    query: ListUnitDutiesQuery,
  ): Promise<DutyResponse[]> {
    const duties = await this.listUnitDuties.execute(query);
    return duties.map(toDutyResponse);
  }

  @Post()
  @ApiBody({ schema: toBodySchema(assignDutySchema) })
  @ApiEnvelopeResponse(DutyResponse, { status: 201 })
  @ApiErrorResponse(400, 'Invalid time window or request body')
  @ApiErrorResponse(404, 'Route or unit not found')
  @ApiErrorResponse(409, 'Unit already has an overlapping duty')
  async assign(
    @Body(new ZodValidationPipe(assignDutySchema)) body: AssignDutyBody,
  ): Promise<DutyResponse> {
    return toDutyResponse(await this.assignDuty.execute(body));
  }

  @Patch(':id')
  @ApiBody({ schema: toBodySchema(rescheduleDutySchema) })
  @ApiEnvelopeResponse(DutyResponse, { status: 200 })
  @ApiErrorResponse(400, 'Invalid time window or request body')
  @ApiErrorResponse(404, 'Duty or unit not found')
  @ApiErrorResponse(409, 'Unit already has an overlapping duty')
  async reschedule(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(rescheduleDutySchema)) body: RescheduleDutyBody,
  ): Promise<DutyResponse> {
    return toDutyResponse(await this.rescheduleDuty.execute(id, body));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: 'Deleted; no body' })
  @ApiErrorResponse(404, 'Duty not found')
  remove(@Param('id') id: string): Promise<void> {
    return this.deleteDuty.execute(id);
  }
}
