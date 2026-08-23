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
import { ApiBody, ApiNoContentResponse, ApiTags } from '@nestjs/swagger';
import {
  CreateRouteBody,
  UpdateRouteBody,
  createRouteSchema,
  updateRouteSchema,
} from '@repo/shared';
import {
  ApiEnvelopeResponse,
  ApiErrorResponse,
} from '../../infrastructure/http/api-envelope.decorator';
import { toBodySchema } from '../../infrastructure/http/zod-json-schema';
import { ZodValidationPipe } from '../../infrastructure/http/zod-validation.pipe';
import { toDutyResponse } from '../duties/duty.response';
import { CreateRoute } from './application/create-route';
import { DeleteRoute } from './application/delete-route';
import { GetRouteDetail } from './application/get-route-detail';
import { ListRoutes } from './application/list-routes';
import { UpdateRoute } from './application/update-route';
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
  @ApiEnvelopeResponse(RouteResponse, { status: 201 })
  @ApiErrorResponse(400, 'Invalid route or request body')
  create(
    @Body(new ZodValidationPipe(createRouteSchema)) body: CreateRouteBody,
  ): Promise<RouteResponse> {
    return this.createRoute.execute(body);
  }

  @Get()
  @ApiEnvelopeResponse(RouteSummaryResponse, { status: 200, isArray: true })
  list(): Promise<RouteSummaryResponse[]> {
    return this.listRoutes.execute();
  }

  @Get(':id')
  @ApiEnvelopeResponse(RouteDetailResponse, { status: 200 })
  @ApiErrorResponse(404, 'Route not found')
  async detail(@Param('id') id: string): Promise<RouteDetailResponse> {
    const { route, duties } = await this.getRouteDetail.execute(id);
    return { ...route, duties: duties.map(toDutyResponse) };
  }

  @Patch(':id')
  @ApiBody({ schema: toBodySchema(updateRouteSchema) })
  @ApiEnvelopeResponse(RouteResponse, { status: 200 })
  @ApiErrorResponse(400, 'Invalid route or request body')
  @ApiErrorResponse(404, 'Route not found')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateRouteSchema)) body: UpdateRouteBody,
  ): Promise<RouteResponse> {
    return this.updateRoute.execute(id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: 'Deleted; no body' })
  @ApiErrorResponse(404, 'Route not found')
  @ApiErrorResponse(409, 'Route still has duties')
  remove(@Param('id') id: string): Promise<void> {
    return this.deleteRoute.execute(id);
  }
}
