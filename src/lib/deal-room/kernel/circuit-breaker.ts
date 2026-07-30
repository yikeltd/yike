/**
 * Yike BTOS — Provider Circuit Breaker Engine (Milestone 8)
 * Protects platform against third-party API outages (Paystack, SafeHaven, Gemini, Agora).
 */

export type CircuitState = "closed" | "open" | "half_open";

export class CircuitBreaker {
  private failureThreshold: number;
  private recoveryTimeoutMs: number;
  private state: CircuitState = "closed";
  private failureCount = 0;
  private nextAttemptTimestamp = 0;

  constructor(failureThreshold = 5, recoveryTimeoutMs = 30000) {
    this.failureThreshold = failureThreshold;
    this.recoveryTimeoutMs = recoveryTimeoutMs;
  }

  public getState(): CircuitState {
    if (this.state === "open" && Date.now() >= this.nextAttemptTimestamp) {
      this.state = "half_open";
    }
    return this.state;
  }

  public async execute<T>(operation: () => Promise<T>, fallback?: () => T): Promise<T> {
    const currentState = this.getState();

    if (currentState === "open") {
      if (fallback) return fallback();
      throw new Error("CircuitBreaker Exception: Circuit is OPEN due to provider outage");
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (err) {
      this.onFailure();
      if (fallback) return fallback();
      throw err;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;
    this.state = "closed";
  }

  private onFailure(): void {
    this.failureCount += 1;
    if (this.failureCount >= this.failureThreshold) {
      this.state = "open";
      this.nextAttemptTimestamp = Date.now() + this.recoveryTimeoutMs;
    }
  }

  public reset(): void {
    this.failureCount = 0;
    this.state = "closed";
  }
}
