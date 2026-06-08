/** Safe edge middleware logging — never log cookies, headers, or tokens. */
export function logMiddlewareFailure(
  phase: "session" | "handler",
  pathname: string,
  error: unknown
) {
  const err = error instanceof Error ? error : new Error(String(error));
  console.error("[yike:middleware]", {
    phase,
    pathname,
    name: err.name,
    message: err.message.slice(0, 200),
  });
}
