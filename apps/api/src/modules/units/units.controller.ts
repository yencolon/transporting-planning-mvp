import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiEnvelopeResponse } from '../../infrastructure/http/api-envelope.decorator';
import { ListUnits } from './application/list-units';
import { UnitResponse } from './unit.response';

@ApiTags('units')
@Controller('units')
export class UnitsController {
  constructor(private readonly listUnits: ListUnits) {}

  @Get()
  @ApiEnvelopeResponse(UnitResponse, { status: 200, isArray: true })
  list(): Promise<UnitResponse[]> {
    return this.listUnits.execute();
  }
}
