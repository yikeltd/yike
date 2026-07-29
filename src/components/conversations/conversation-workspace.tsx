"use client";

import { useEffect, useState } from "react";
import type { ConversationWorkspace as WorkspaceType } from "@/lib/conversations/types";
import { ChatExperience } from "./chat-experience";

export function ConversationWorkspace({
  conversationId,
  currentUserId,
}: {
  conversationId: string;
  currentUserId: string;
}) {
  const [workspace, setWorkspace] = useState<WorkspaceType | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const res = await fetch(`/api/conversations/${encodeURIComponent(conversationId)}`);
        const data = (await res.json()) as { workspace?: WorkspaceType };
        if (!cancelled && data.workspace) {
          setWorkspace(data.workspace);
        }
      } catch {
        /* fallback to sample data */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [conversationId]);

  return (
    <ChatExperience
      conversationId={conversationId}
      currentUserId={currentUserId}
      initialWorkspace={workspace}
    />
  );
}
