/**
 * Yike Transaction Workspace Engine — Unified Search & Indexing Engine
 * Prepares searchable resource index across workspace messages, offers, documents, & inspections.
 */

import type { BaseEntity } from "./types";

export type SearchableResourceType =
  | "message"
  | "offer"
  | "document"
  | "inspection"
  | "timeline_event"
  | "comment";

export interface SearchIndexEntry extends BaseEntity {
  workspaceId: string;
  resourceType: SearchableResourceType;
  resourceId: string;
  title: string;
  content: string;
  tags: string[];
  indexedAt: string;
}

class WorkspaceSearchIndex {
  private index: Map<string, SearchIndexEntry> = new Map();

  indexResource(
    workspaceId: string,
    resourceType: SearchableResourceType,
    resourceId: string,
    title: string,
    content: string,
    tags: string[] = [],
    actorId: string
  ): SearchIndexEntry {
    const now = new Date().toISOString();
    const entryId = `idx_${resourceType}_${resourceId}`;
    const entry: SearchIndexEntry = {
      id: entryId,
      workspaceId,
      resourceType,
      resourceId,
      title,
      content,
      tags,
      indexedAt: now,
      createdBy: actorId,
      createdAt: now,
      updatedAt: now,
      version: 1,
      status: "active",
    };

    this.index.set(entryId, entry);
    return entry;
  }

  search(workspaceId: string, query: string): SearchIndexEntry[] {
    const q = query.toLowerCase();
    return Array.from(this.index.values()).filter(
      (entry) =>
        entry.workspaceId === workspaceId &&
        entry.status === "active" &&
        (entry.title.toLowerCase().includes(q) ||
          entry.content.toLowerCase().includes(q) ||
          entry.tags.some((t) => t.toLowerCase().includes(q)))
    );
  }
}

export const workspaceSearchIndex = new WorkspaceSearchIndex();
