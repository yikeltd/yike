/**
 * YIP domain events — discriminated union. Applications publish these when
 * something marketplace-relevant happens; capabilities (or future learning
 * pipelines) subscribe without the publisher knowing who's listening.
 */
import type { Actor, MarketplaceDomain } from "../shared/types";

export type BaseEvent = {
  /** ISO-8601 timestamp; set by the publisher or defaulted by the bus. */
  occurredAt: string;
  actor?: Actor;
};

export type ListingCreatedEvent = BaseEvent & {
  type: "listing.created";
  payload: {
    listingId: string;
    domain: MarketplaceDomain;
    categoryId: string;
  };
};

export type ListingUpdatedEvent = BaseEvent & {
  type: "listing.updated";
  payload: {
    listingId: string;
    domain: MarketplaceDomain;
    changedFields: string[];
  };
};

export type ListingPublishedEvent = BaseEvent & {
  type: "listing.published";
  payload: {
    listingId: string;
    domain: MarketplaceDomain;
  };
};

export type PhotoUploadedEvent = BaseEvent & {
  type: "photo.uploaded";
  payload: {
    listingId: string;
    photoId: string;
    position: number;
  };
};

export type PhotoRemovedEvent = BaseEvent & {
  type: "photo.removed";
  payload: {
    listingId: string;
    photoId: string;
  };
};

export type PriceChangedEvent = BaseEvent & {
  type: "price.changed";
  payload: {
    listingId: string;
    previousPrice?: number;
    newPrice: number;
    currency: "NGN" | (string & {});
  };
};

export type CategorySelectedEvent = BaseEvent & {
  type: "category.selected";
  payload: {
    domain: MarketplaceDomain;
    categoryId: string;
  };
};

export type YipEvent =
  | ListingCreatedEvent
  | ListingUpdatedEvent
  | ListingPublishedEvent
  | PhotoUploadedEvent
  | PhotoRemovedEvent
  | PriceChangedEvent
  | CategorySelectedEvent;

export type YipEventType = YipEvent["type"];

export type EventOfType<T extends YipEventType> = Extract<YipEvent, { type: T }>;

export type EventHandler<T extends YipEventType = YipEventType> = (event: EventOfType<T>) => void;

export type Unsubscribe = () => void;
