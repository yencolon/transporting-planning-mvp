import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ListUnits } from './application/list-units';
import { UnitResponse } from './unit.response';

@ApiTags('units')
@Controller('units')
export class UnitsController {
  constructor(private readonly listUnits: ListUnits) {}

  @Get()
  @ApiOkResponse({ type: [UnitResponse] })
  list(): Promise<UnitResponse[]> {
    return this.listUnits.execute();
  }
}
