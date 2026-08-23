import { Controller, Get } from '@nestjs/common';
import { ListUnits } from './application/list-units';

@Controller('units')
export class UnitsController {
  constructor(private readonly listUnits: ListUnits) {}

  @Get()
  list() {
    return this.listUnits.execute();
  }
}
