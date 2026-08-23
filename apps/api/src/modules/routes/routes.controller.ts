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
} from '@nestjs/common';
import { ZodValidationPipe } from '../../infrastructure/http/zod-validation.pipe';
import { toDutyResponse } from '../duties/duty.response';
import { CreateRoute } from './application/create-route';
import { DeleteRoute } from './application/delete-route';
import { GetRouteDetail } from './application/get-route-detail';
import { ListRoutes } from './application/list-routes';
import { UpdateRoute } from './application/update-route';
import {
  CreateRouteBody,
  UpdateRouteBody,
  createRouteSchema,
  updateRouteSchema,
} from './dto/route.schema';

@Controller('routes')
export class RoutesController {
  constructor(
    private readonly createRoute: CreateRoute,
    private readonly updateRoute: UpdateRoute,
    private readonly listRoutes: ListRoutes,
    private readonly getRouteDetail: GetRouteDetail,
    private readonly deleteRoute: DeleteRoute,
  ) {}

  @Post()
  create(
    @Body(new ZodValidationPipe(createRouteSchema)) body: CreateRouteBody,
  ) {
    return this.createRoute.execute(body);
  }

  @Get()
  list() {
    return this.listRoutes.execute();
  }

  @Get(':id')
  async detail(@Param('id') id: string) {
    const { route, duties } = await this.getRouteDetail.execute(id);
    return { ...route, duties: duties.map(toDutyResponse) };
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateRouteSchema)) body: UpdateRouteBody,
  ) {
    return this.updateRoute.execute(id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.deleteRoute.execute(id);
  }
}
