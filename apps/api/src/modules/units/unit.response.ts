import { ApiProperty } from '@nestjs/swagger';
import { UnitDto } from '@repo/shared';

export class UnitResponse implements UnitDto {
  @ApiProperty({ example: '8771e27d-2e90-4fe1-8e30-73a942952168' })
  id!: string;

  @ApiProperty({ example: 'BUS-014' })
  name!: string;
}
