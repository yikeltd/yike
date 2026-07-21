export type BuyerWorkspaceSectionId =
  | "saved_listings"
  | "collections"
  | "recently_viewed"
  | "viewing_history"
  | "compared_listings"
  | "saved_searches"
  | "price_alerts"
  | "following_vendors"
  | "conversations_history"
  | "inspection_requests"
  | "financing_progress"
  | "insurance_quotes"
  | "recommendations"
  | "trust_center"
  | "profile_completion"
  | "referral_status"
  | "reward_history"
  | "notification_center";

export type BuyerWorkspaceSectionGroup =
  | "your_items"
  | "alerts"
  | "sellers"
  | "services"
  | "for_you"
  | "account";

export type BuyerWorkspaceManifestSection = {
  id: BuyerWorkspaceSectionId;
  title: string;
  subtitle: string;
  group: BuyerWorkspaceSectionGroup;
  icon: string;
  href?: string;
  priority: number;
  count?: number;
  badge?: string;
};
