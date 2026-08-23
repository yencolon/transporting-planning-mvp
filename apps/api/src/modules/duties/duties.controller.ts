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
import { ApiBody, ApiNoContentResponse, ApiTags } from '@nestjs/swagger';
import {
  AssignDutyBody,
  RescheduleDutyBody,
  assignDutySchema,
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
import { RescheduleDuty } from './application/reschedule-duty';
import { DutyResponse, toDutyResponse } from './duty.response';

@ApiTags('duties')
@Controller('duties')
export class DutiesController {
  constructor(
    private readonly assignDuty: AssignDuty,
    private readonly rescheduleDuty: RescheduleDuty,
    private readonly deleteDuty: DeleteDuty,
  ) {}

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
