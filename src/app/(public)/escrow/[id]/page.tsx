import type { Metadata } from "next";
import { EscrowWorkspaceExperience } from "@/components/escrow/escrow-workspace-experience";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Escrow Workspace #${id} | Yike`,
    description: `Dedicated Escrow Workspace for deal #${id} featuring visual milestone timeline, staged payments, document center, and escrow custody.`,
  };
}

export default async function EscrowDealPage({ params }: Props) {
  const { id } = await params;

  return (
    <main>
      <EscrowWorkspaceExperience dealId={id} />
    </main>
  );
}
