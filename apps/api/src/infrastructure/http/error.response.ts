import { ApiProperty } from '@nestjs/swagger';

/** The body DomainExceptionFilter returns for every domain failure. */
export class ErrorResponse {
  @ApiProperty({ example: 409 })
  statusCode!: number;

  @ApiProperty({ example: 'OverlappingDutyError' })
  error!: string;

  @ApiProperty({
    example:
      'Unit 8771e27d-2e90-4fe1-8e30-73a942952168 already has a duty overlapping that time window.',
  })
  message!: string;
}
