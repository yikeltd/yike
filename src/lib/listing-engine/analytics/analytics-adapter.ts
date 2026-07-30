import type { AnalyticsEventName, AnalyticsPayload } from "./tracker";

export interface AnalyticsProvider {
  name: string;
  trackEvent(eventName: AnalyticsEventName, payload: AnalyticsPayload): void;
}

export class ConsoleAnalyticsProvider implements AnalyticsProvider {
  name = "Console";
  trackEvent(eventName: AnalyticsEventName, payload: AnalyticsPayload): void {
    if (process.env.NODE_ENV !== "production") {
      console.log(`[Analytics:Console] ${eventName}`, payload);
    }
  }
}

export class GoogleAnalyticsProvider implements AnalyticsProvider {
  name = "GoogleAnalytics";
  trackEvent(eventName: AnalyticsEventName, payload: AnalyticsPayload): void {
    if (typeof window !== "undefined" && (window as unknown as { dataLayer?: unknown[] }).dataLayer) {
      (window as unknown as { dataLayer: unknown[] }).dataLayer.push({
        event: `engine_${eventName}`,
        ...payload,
      });
    }
  }
}

export class CompositeAnalyticsProvider implements AnalyticsProvider {
  name = "Composite";
  private providers: AnalyticsProvider[] = [];

  constructor(initialProviders: AnalyticsProvider[] = []) {
    this.providers = initialProviders;
  }

  addProvider(provider: AnalyticsProvider): void {
    this.providers.push(provider);
  }

  trackEvent(eventName: AnalyticsEventName, payload: AnalyticsPayload): void {
    for (const provider of this.providers) {
      try {
        provider.trackEvent(eventName, payload);
      } catch (err) {
        console.warn(`[Analytics:${provider.name}] Error tracking event:`, err);
      }
    }
  }
}

export const activeAnalyticsProvider = new CompositeAnalyticsProvider([
  new ConsoleAnalyticsProvider(),
  new GoogleAnalyticsProvider(),
]);

export function registerAnalyticsProvider(provider: AnalyticsProvider): void {
  activeAnalyticsProvider.addProvider(provider);
}
