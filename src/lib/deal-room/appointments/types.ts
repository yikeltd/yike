/**
 * Yike Transaction Workspace Engine — Appointment & Scheduling Engine Domain Types
 * First-class business milestone contracts for viewings, inspections, test drives, and meetings.
 */

import type { BaseEntity, ParticipantRole } from "../types";

export type AppointmentType =
  | "property_viewing"
  | "vehicle_inspection"
  | "test_drive"
  | "virtual_meeting"
  | "office_meeting"
  | "site_visit"
  | "document_signing"
  | "custom";

export type AppointmentStatus =
  | "draft"
  | "requested"
  | "pending_confirmation"
  | "confirmed"
  | "rescheduled"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "no_show"
  | "expired";

export interface AppointmentLocation {
  type: "physical" | "virtual";
  address?: string;
  city?: string;
  state?: string;
  mapUrl?: string;
  meetingLink?: string;
  latitude?: number;
  longitude?: number;
}

export interface AppointmentParticipant {
  userId: string;
  role: ParticipantRole;
  confirmationStatus: "pending" | "confirmed" | "declined";
  arrivedAt?: string;
}

export interface RescheduleRecord {
  rescheduledBy: string;
  previousStartTime: string;
  previousEndTime: string;
  newStartTime: string;
  newEndTime: string;
  reason?: string;
  rescheduledAt: string;
}

export interface AppointmentAggregate extends BaseEntity {
  workspaceId: string;
  listingId: string;
  negotiationId?: string;
  type: AppointmentType;
  appointmentStatus: AppointmentStatus;
  location: AppointmentLocation;
  startTime: string;
  endTime: string;
  timezone: string;
  participants: AppointmentParticipant[];
  rescheduleHistory: RescheduleRecord[];
  notes?: string;
  metadata?: Record<string, unknown>;
}
