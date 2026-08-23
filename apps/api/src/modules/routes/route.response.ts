import { ApiProperty } from '@nestjs/swagger';
import {
  RouteDetailDto,
  RouteDto,
  RoutePointDto,
  RouteSummaryDto,
} from '@repo/shared';
import { DutyResponse } from '../duties/duty.response';

export class RoutePointResponse implements RoutePointDto {
  @ApiProperty({ example: 0 })
  sequence!: number;

  @ApiProperty({ example: 18.4861 })
  lat!: number;

  @ApiProperty({ example: -69.9312 })
  lng!: number;

  @ApiProperty({
    example: 'Parque Independencia',
    nullable: true,
    type: String,
    description: 'Always present; null when the point has no label.',
  })
  name!: string | null;
}

export class RouteResponse implements RouteDto {
  @ApiProperty({ example: '5990298d-ded6-4c71-bafc-9bc9665db672' })
  id!: string;

  @ApiProperty({ example: 'Centro - Norte' })
  name!: string;

  @ApiProperty({ type: [RoutePointResponse] })
  points!: RoutePointResponse[];
}

export class RouteDetailResponse
  extends RouteResponse
  implements RouteDetailDto
{
  @ApiProperty({ type: [DutyResponse] })
  duties!: DutyResponse[];
}

export class RouteSummaryResponse implements RouteSummaryDto {
  @ApiProperty({ example: '5990298d-ded6-4c71-bafc-9bc9665db672' })
  id!: string;

  @ApiProperty({ example: 'Centro - Norte' })
  name!: string;

  @ApiProperty({ example: 3 })
  pointCount!: number;
}
