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
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ErrorResponse } from '../../infrastructure/http/error.response';
import { toBodySchema } from '../../infrastructure/http/zod-json-schema';
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
  @ApiCreatedResponse({ type: DutyResponse })
  @ApiBadRequestResponse({
    description: 'Invalid time window or request body',
    type: ErrorResponse,
  })
  @ApiNotFoundResponse({
    description: 'Route or unit not found',
    type: ErrorResponse,
  })
  @ApiConflictResponse({
    description: 'Unit already has an overlapping duty',
    type: ErrorResponse,
  })
  async assign(
    @Body(new ZodValidationPipe(assignDutySchema)) body: AssignDutyBody,
  ): Promise<DutyResponse> {
    return toDutyResponse(await this.assignDuty.execute(body));
  }

  @Patch(':id')
  @ApiBody({ schema: toBodySchema(rescheduleDutySchema) })
  @ApiOkResponse({ type: DutyResponse })
  @ApiBadRequestResponse({
    description: 'Invalid time window or request body',
    type: ErrorResponse,
  })
  @ApiNotFoundResponse({
    description: 'Duty or unit not found',
    type: ErrorResponse,
  })
  @ApiConflictResponse({
    description: 'Unit already has an overlapping duty',
    type: ErrorResponse,
  })
  async reschedule(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(rescheduleDutySchema)) body: RescheduleDutyBody,
  ): Promise<DutyResponse> {
    return toDutyResponse(await this.rescheduleDuty.execute(id, body));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  @ApiNotFoundResponse({ description: 'Duty not found', type: ErrorResponse })
  remove(@Param('id') id: string): Promise<void> {
    return this.deleteDuty.execute(id);
  }
}
