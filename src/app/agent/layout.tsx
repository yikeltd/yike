import { ConsumerShell } from "@/components/layout/consumer-shell";

export default function AgentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ConsumerShell>{children}</ConsumerShell>;
}
