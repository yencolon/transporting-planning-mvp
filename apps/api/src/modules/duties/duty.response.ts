import { ApiProperty } from '@nestjs/swagger';
import { DutyDto } from '@repo/shared';
import { Duty } from './domain/duty';

export class DutyResponse implements DutyDto {
  @ApiProperty({ example: '9deb812f-220e-4837-8189-e2ff85b9c7d4' })
  id!: string;

  @ApiProperty({ example: '5990298d-ded6-4c71-bafc-9bc9665db672' })
  routeId!: string;

  @ApiProperty({ example: '8771e27d-2e90-4fe1-8e30-73a942952168' })
  unitId!: string;

  @ApiProperty({ format: 'date-time', example: '2026-08-24T06:00:00.000Z' })
  startAt!: string;

  @ApiProperty({ format: 'date-time', example: '2026-08-24T08:00:00.000Z' })
  endAt!: string;
}

/** The window is flattened and serialised at the HTTP boundary; the domain keeps it as a value object. */
export function toDutyResponse(duty: Duty): DutyResponse {
  return {
    id: duty.id,
    routeId: duty.routeId,
    unitId: duty.unitId,
    startAt: duty.window.startAt.toISOString(),
    endAt: duty.window.endAt.toISOString(),
  };
}
