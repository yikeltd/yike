/**
 * `CapabilityLogger` — scoped console logging (`[yip:runtime:<id>]`),
 * matching the prefix convention `PluginHost` already uses for
 * `ctx.log(...)`. No log aggregation/transport here — that's an
 * application-level concern (or a future capability of its own).
 */
export type LogLevel = "debug" | "info" | "warn" | "error";

export class CapabilityLogger {
  constructor(private readonly scope: string) {}

  log(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
    const prefix = `[yip:runtime:${this.scope}]`;
    // eslint-disable-next-line no-console -- intentional scoped runtime logging, mirrors PluginHost's ctx.log
    console[level === "debug" ? "log" : level](prefix, message, meta ?? "");
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    this.log("debug", message, meta);
  }

  info(message: string, meta?: Record<string, unknown>): void {
    this.log("info", message, meta);
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    this.log("warn", message, meta);
  }

  error(message: string, meta?: Record<string, unknown>): void {
    this.log("error", message, meta);
  }

  scoped(childScope: string): CapabilityLogger {
    return new CapabilityLogger(`${this.scope}:${childScope}`);
  }
}
