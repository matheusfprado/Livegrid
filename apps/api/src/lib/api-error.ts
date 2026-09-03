export type ApiErrorCode =
  | "ROOM_NOT_FOUND"
  | "ROOM_ENDED"
  | "INVALID_ROOM_CODE"
  | "INVALID_TOKEN"
  | "ROOM_FULL"
  | "NOT_AUTHORIZED"
  | "DEVICE_PERMISSION_DENIED"
  | "MEDIA_ERROR"
  | "DATABASE_UNAVAILABLE"
  | "DATABASE_SCHEMA_MISSING"
  | "INTERNAL_ERROR";

export type ApiErrorResponse = {
  error: {
    code: ApiErrorCode;
    message: string;
  };
};
