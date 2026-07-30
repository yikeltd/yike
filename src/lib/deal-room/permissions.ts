/**
 * Yike Deal Room Platform — Granular Permissions & Access Control Engine
 */

import type { ParticipantRole } from "./types";

export type DealAction =
  | "read_timeline"
  | "send_message"
  | "make_offer"
  | "accept_offer"
  | "request_inspection"
  | "upload_document"
  | "verify_document"
  | "start_voice_call"
  | "start_video_call"
  | "invite_participant"
  | "cancel_deal"
  | "complete_deal"
  | "moderate_room";

const ROLE_PERMISSIONS: Record<ParticipantRole, Set<DealAction>> = {
  buyer: new Set([
    "read_timeline",
    "send_message",
    "make_offer",
    "request_inspection",
    "upload_document",
    "start_voice_call",
    "start_video_call",
    "cancel_deal",
  ]),
  seller: new Set([
    "read_timeline",
    "send_message",
    "make_offer",
    "accept_offer",
    "upload_document",
    "start_voice_call",
    "start_video_call",
    "invite_participant",
    "cancel_deal",
    "complete_deal",
  ]),
  agent: new Set([
    "read_timeline",
    "send_message",
    "make_offer",
    "accept_offer",
    "upload_document",
    "start_voice_call",
    "start_video_call",
    "invite_participant",
    "cancel_deal",
    "complete_deal",
  ]),
  agency_manager: new Set([
    "read_timeline",
    "send_message",
    "make_offer",
    "accept_offer",
    "upload_document",
    "verify_document",
    "start_voice_call",
    "start_video_call",
    "invite_participant",
    "cancel_deal",
    "complete_deal",
    "moderate_room",
  ]),
  enterprise_staff: new Set([
    "read_timeline",
    "send_message",
    "upload_document",
    "start_voice_call",
    "start_video_call",
    "invite_participant",
  ]),
  inspector: new Set([
    "read_timeline",
    "send_message",
    "upload_document",
    "verify_document",
  ]),
  administrator: new Set([
    "read_timeline",
    "send_message",
    "make_offer",
    "accept_offer",
    "request_inspection",
    "upload_document",
    "verify_document",
    "start_voice_call",
    "start_video_call",
    "invite_participant",
    "cancel_deal",
    "complete_deal",
    "moderate_room",
  ]),
  moderator: new Set(["read_timeline", "moderate_room", "cancel_deal"]),
};

export function hasPermission(role: ParticipantRole, action: DealAction): boolean {
  const allowed = ROLE_PERMISSIONS[role];
  return allowed ? allowed.has(action) : false;
}
