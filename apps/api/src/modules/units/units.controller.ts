import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { ApiBody, ApiNoContentResponse, ApiTags } from '@nestjs/swagger';
import { CreateUnitBody, createUnitSchema } from '@repo/shared';
import {
  ApiEnvelopeResponse,
  ApiErrorResponse,
} from '../../infrastructure/http/api-envelope.decorator';
import { toBodySchema } from '../../infrastructure/http/zod-json-schema';
import { ZodValidationPipe } from '../../infrastructure/http/zod-validation.pipe';
import { CreateUnit } from './application/create-unit';
import { DeleteUnit } from './application/delete-unit';
import { ListUnits } from './application/list-units';
import { UnitResponse } from './unit.response';

@ApiTags('units')
@Controller('units')
export class UnitsController {
  constructor(
    private readonly listUnits: ListUnits,
    private readonly createUnit: CreateUnit,
    private readonly deleteUnit: DeleteUnit,
  ) {}

  @Get()
  @ApiEnvelopeResponse(UnitResponse, { status: 200, isArray: true })
  list(): Promise<UnitResponse[]> {
    return this.listUnits.execute();
  }

  @Post()
  @ApiBody({ schema: toBodySchema(createUnitSchema) })
  @ApiEnvelopeResponse(UnitResponse, { status: 201 })
  @ApiErrorResponse(400, 'Invalid unit or request body')
  @ApiErrorResponse(409, 'A unit with that name already exists')
  create(
    @Body(new ZodValidationPipe(createUnitSchema)) body: CreateUnitBody,
  ): Promise<UnitResponse> {
    return this.createUnit.execute(body.name);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: 'Deleted; no body' })
  @ApiErrorResponse(404, 'Unit not found')
  @ApiErrorResponse(409, 'Unit still has duties')
  remove(@Param('id') id: string): Promise<void> {
    return this.deleteUnit.execute(id);
  }
}
