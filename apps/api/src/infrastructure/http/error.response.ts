import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApiErrorIssue {
  @ApiProperty({ example: 'points.0.lat' })
  path!: string;

  @ApiProperty({ example: 'Invalid input: expected number, received string' })
  message!: string;
}

export class ApiError {
  @ApiProperty({
    example: 'OverlappingDutyError',
    description:
      'Stable identifier for the failure. Two different errors can share a status code, so switch on this rather than on the status.',
  })
  code!: string;

  @ApiProperty({
    example:
      'Unit 8771e27d-2e90-4fe1-8e30-73a942952168 already has a duty overlapping that time window.',
  })
  message!: string;

  @ApiPropertyOptional({
    type: [ApiErrorIssue],
    description: 'Present only when the request body failed schema validation.',
  })
  issues?: ApiErrorIssue[];
}

/** The body every failing request returns. */
export class ErrorResponse {
  @ApiProperty({ type: ApiError })
  error!: ApiError;
}
