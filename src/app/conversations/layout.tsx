import { ConsumerMarketplaceShell } from "@/components/layout/consumer-marketplace-shell";

export default function ConversationsLayout({ children }: { children: React.ReactNode }) {
  return <ConsumerMarketplaceShell>{children}</ConsumerMarketplaceShell>;
}
