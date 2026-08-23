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
import {
  RouteDetailResponse,
  RouteResponse,
  RouteSummaryResponse,
} from './route.response';

@ApiTags('routes')
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
  @ApiBody({ schema: toBodySchema(createRouteSchema) })
  @ApiCreatedResponse({ type: RouteResponse })
  @ApiBadRequestResponse({
    description: 'Invalid route or request body',
    type: ErrorResponse,
  })
  create(
    @Body(new ZodValidationPipe(createRouteSchema)) body: CreateRouteBody,
  ): Promise<RouteResponse> {
    return this.createRoute.execute(body);
  }

  @Get()
  @ApiOkResponse({ type: [RouteSummaryResponse] })
  list(): Promise<RouteSummaryResponse[]> {
    return this.listRoutes.execute();
  }

  @Get(':id')
  @ApiOkResponse({ type: RouteDetailResponse })
  @ApiNotFoundResponse({ description: 'Route not found', type: ErrorResponse })
  async detail(@Param('id') id: string): Promise<RouteDetailResponse> {
    const { route, duties } = await this.getRouteDetail.execute(id);
    return { ...route, duties: duties.map(toDutyResponse) };
  }

  @Patch(':id')
  @ApiBody({ schema: toBodySchema(updateRouteSchema) })
  @ApiOkResponse({ type: RouteResponse })
  @ApiBadRequestResponse({
    description: 'Invalid route or request body',
    type: ErrorResponse,
  })
  @ApiNotFoundResponse({ description: 'Route not found', type: ErrorResponse })
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateRouteSchema)) body: UpdateRouteBody,
  ): Promise<RouteResponse> {
    return this.updateRoute.execute(id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  @ApiNotFoundResponse({ description: 'Route not found', type: ErrorResponse })
  @ApiConflictResponse({
    description: 'Route still has duties',
    type: ErrorResponse,
  })
  remove(@Param('id') id: string): Promise<void> {
    return this.deleteRoute.execute(id);
  }
}
