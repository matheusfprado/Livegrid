export function isDatabaseUnavailableError(error: unknown) {
  if (error instanceof Error && error.message.includes("Can't reach database server")) {
    return true;
  }

  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error.code === "P1000" || error.code === "P1001" || error.code === "P1002")
  );
}

export function isDatabaseSchemaMissingError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error.code === "P2021" || error.code === "P2022")
  );
}
