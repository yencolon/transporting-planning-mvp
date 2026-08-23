import { ApiProperty } from '@nestjs/swagger';

export class UnitResponse {
  @ApiProperty({ example: '8771e27d-2e90-4fe1-8e30-73a942952168' })
  id!: string;

  @ApiProperty({ example: 'BUS-014' })
  name!: string;
}
