import { ConsumerShell } from "@/components/layout/consumer-shell";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ConsumerShell>{children}</ConsumerShell>;
}
