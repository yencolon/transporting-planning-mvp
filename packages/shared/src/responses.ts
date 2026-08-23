/**
 * Response contract. The API's decorated Swagger classes declare `implements`
 * against these, so a change on either side is a compile error rather than
 * something the frontend discovers at runtime.
 *
 * Dates cross the wire as ISO strings.
 */
export interface RoutePointDto {
  sequence: number;
  lat: number;
  lng: number;
  /** Always present; null when the point has no label. */
  name: string | null;
}

export interface RouteDto {
  id: string;
  name: string;
  points: RoutePointDto[];
}

export interface RouteSummaryDto {
  id: string;
  name: string;
  pointCount: number;
}

export interface DutyDto {
  id: string;
  routeId: string;
  unitId: string;
  startAt: string;
  endAt: string;
}

export interface RouteDetailDto extends RouteDto {
  duties: DutyDto[];
}

export interface UnitDto {
  id: string;
  name: string;
}

/** Every successful response body. */
export interface ApiEnvelope<T> {
  data: T;
}

export interface ApiErrorIssueDto {
  path: string;
  message: string;
}

/** Every failing response body. Switch on `code`, not on the status. */
export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    issues?: ApiErrorIssueDto[];
  };
}
