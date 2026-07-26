/**
 * `SoftSandbox` — "soft" isolation: try/catch + an optional timeout
 * (`Promise.race`) + a per-name circuit breaker, all in the same process.
 * This is deliberately not a worker/VM sandbox — YIP plugins are reviewed
 * TypeScript modules, not untrusted code (see YIP_PLUGIN_ARCHITECTURE.md's
 * "Security / permissions" section). The goal here is fault containment:
 * one misbehaving capability call should never take down the request (or
 * the runtime) that invoked it.
 *
 * By default `run()` never throws — failures are swallowed into a `Result`
 * so callers can render an honest "unavailable" state instead of a crash.
 * Pass `swallow: false` when the caller genuinely wants the error to
 * propagate (e.g. a script explicitly testing sandboxed behavior).
 */
import { err, ok } from "../shared/types";
import type { Result, YipErrorInfo } from "../shared/types";
import type { SoftSandboxPolicy } from "./types";

type CircuitState = {
  errorCount: number;
  openUntil?: number;
};

export type SoftSandboxRunOptions = SoftSandboxPolicy & { swallow?: boolean };

const DEFAULT_POLICY: Required<SoftSandboxPolicy> = {
  timeoutMs: 5000,
  maxErrorsBeforeOpenCircuit: 5,
  circuitCooldownMs: 30_000,
};

export class SoftSandbox {
  private readonly circuits = new Map<string, CircuitState>();
  private readonly defaultPolicy: Required<SoftSandboxPolicy>;

  constructor(policy?: SoftSandboxPolicy) {
    this.defaultPolicy = { ...DEFAULT_POLICY, ...policy };
  }

  /** Runs `fn` under the soft sandbox. Resolves to a `Result` — never rejects unless `swallow: false`. */
  async run<T>(name: string, fn: () => T | Promise<T>, options?: SoftSandboxRunOptions): Promise<Result<T>> {
    const swallow = options?.swallow ?? true;
    const policy: Required<SoftSandboxPolicy> = { ...this.defaultPolicy, ...options };
    const circuit = this.circuitFor(name);

    if (this.isCircuitOpen(name)) {
      const info: YipErrorInfo = {
        code: "circuit_open",
        message: `Sandboxed call "${name}" is blocked — circuit is open until its cooldown elapses.`,
        details: { name },
      };
      if (!swallow) throw new Error(info.message);
      return err(info);
    }

    try {
      const value = await this.withTimeout(fn, policy.timeoutMs, name);
      circuit.errorCount = 0;
      return ok(value);
    } catch (error) {
      circuit.errorCount += 1;
      if (circuit.errorCount >= policy.maxErrorsBeforeOpenCircuit) {
        circuit.openUntil = Date.now() + policy.circuitCooldownMs;
      }
      const info: YipErrorInfo = {
        code: "sandbox_error",
        message: error instanceof Error ? error.message : String(error),
        details: { name },
      };
      if (!swallow) throw error;
      return err(info);
    }
  }

  isCircuitOpen(name: string): boolean {
    const circuit = this.circuits.get(name);
    if (!circuit?.openUntil) return false;
    if (Date.now() >= circuit.openUntil) {
      circuit.openUntil = undefined;
      circuit.errorCount = 0;
      return false;
    }
    return true;
  }

  circuitState(name: string): { errorCount: number; open: boolean } {
    const circuit = this.circuits.get(name);
    return { errorCount: circuit?.errorCount ?? 0, open: this.isCircuitOpen(name) };
  }

  reset(name?: string): void {
    if (name) {
      this.circuits.delete(name);
      return;
    }
    this.circuits.clear();
  }

  private circuitFor(name: string): CircuitState {
    let circuit = this.circuits.get(name);
    if (!circuit) {
      circuit = { errorCount: 0 };
      this.circuits.set(name, circuit);
    }
    return circuit;
  }

  private withTimeout<T>(fn: () => T | Promise<T>, timeoutMs: number, name: string): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      let settled = false;
      const timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        reject(new Error(`Sandboxed call "${name}" exceeded ${timeoutMs}ms.`));
      }, timeoutMs);
      // Node's timer would otherwise keep short-lived test/CLI processes alive.
      if (typeof timer.unref === "function") timer.unref();

      Promise.resolve()
        .then(fn)
        .then((value) => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          resolve(value);
        })
        .catch((error: unknown) => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          reject(error);
        });
    });
  }
}
