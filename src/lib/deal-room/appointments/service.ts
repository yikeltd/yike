/**
 * Yike Transaction Workspace Engine — Appointment & Scheduling Service
 * Manages appointment lifecycles, rescheduling history, and stream integration.
 */

import type { ParticipantRole } from "../types";
import type {
  AppointmentAggregate,
  AppointmentLocation,
  AppointmentStatus,
  AppointmentType,
  RescheduleRecord,
} from "./types";
import { ConversationService } from "../conversation/service";
import { auditLogService } from "../audit";
import { dealRoomEvents } from "../events";
import { automationHooks } from "../hooks";
import { workspaceSearchIndex } from "../search";

class AppointmentRepository {
  private appointments: Map<string, AppointmentAggregate> = new Map();

  save(appointment: AppointmentAggregate): void {
    this.appointments.set(appointment.id, appointment);
  }

  getById(id: string): AppointmentAggregate | undefined {
    const app = this.appointments.get(id);
    return app && app.status === "active" ? app : undefined;
  }

  getByWorkspace(workspaceId: string): AppointmentAggregate[] {
    return Array.from(this.appointments.values())
      .filter((a) => a.workspaceId === workspaceId && a.status === "active")
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }
}

export const appointmentRepo = new AppointmentRepository();

export class AppointmentService {
  /**
   * Requests a new appointment inside the Transaction Workspace
   */
  static requestAppointment(
    workspaceId: string,
    listingId: string,
    type: AppointmentType,
    startTime: string,
    endTime: string,
    location: AppointmentLocation,
    actorId: string,
    actorRole: ParticipantRole,
    targetUserId: string,
    targetRole: ParticipantRole,
    negotiationId?: string,
    notes?: string
  ): AppointmentAggregate {
    const now = new Date().toISOString();
    const id = `app_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const appointment: AppointmentAggregate = {
      id,
      workspaceId,
      listingId,
      negotiationId,
      type,
      appointmentStatus: "requested",
      location,
      startTime,
      endTime,
      timezone: "WAT (UTC+1)",
      participants: [
        { userId: actorId, role: actorRole, confirmationStatus: "confirmed" },
        { userId: targetUserId, role: targetRole, confirmationStatus: "pending" },
      ],
      rescheduleHistory: [],
      notes,
      createdBy: actorId,
      createdAt: now,
      updatedAt: now,
      version: 1,
      status: "active",
    };

    appointmentRepo.save(appointment);

    // 1. Embed Inspection/Appointment Card into Conversation Stream
    ConversationService.embedCard(
      workspaceId,
      actorId,
      actorRole,
      "inspection_card",
      `Appointment Requested: ${type.replace("_", " ").toUpperCase()}`,
      {
        inspectionId: id,
        status: "requested",
        scheduledAt: `${new Date(startTime).toLocaleDateString()} at ${new Date(startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
        locationAddress: location.address || "Virtual Workspace",
      },
      true // Pinned
    );

    // 2. Audit Log & Search Index
    auditLogService.log(workspaceId, "entity_created", actorId, actorRole, "Appointment", id, undefined, { type, startTime });
    workspaceSearchIndex.indexResource(workspaceId, "inspection", id, `${type} Appointment`, notes || "", ["appointment", type], actorId);

    // 3. Timeline Event & Automation Hooks
    const evt = dealRoomEvents.createEvent(workspaceId, actorId, actorRole, "inspection_requested", "Appointment Requested", `${type} requested for ${startTime}`);
    void dealRoomEvents.publish(evt);
    void automationHooks.emit(evt);

    return appointment;
  }

  /**
   * Confirms a requested appointment
   */
  static confirmAppointment(appointmentId: string, actorId: string, actorRole: ParticipantRole): AppointmentAggregate {
    const app = appointmentRepo.getById(appointmentId);
    if (!app) throw new Error("Appointment not found.");

    const now = new Date().toISOString();
    const updatedParticipants = app.participants.map((p) =>
      p.userId === actorId ? { ...p, confirmationStatus: "confirmed" as const } : p
    );

    const updatedApp: AppointmentAggregate = {
      ...app,
      appointmentStatus: "confirmed",
      participants: updatedParticipants,
      updatedBy: actorId,
      updatedAt: now,
      version: app.version + 1,
    };

    appointmentRepo.save(updatedApp);

    ConversationService.appendSystemEvent(
      app.workspaceId,
      actorId,
      actorRole,
      `📅 Appointment Confirmed: ${app.type.replace("_", " ").toUpperCase()}`,
      `Confirmed for ${new Date(app.startTime).toLocaleString()}`
    );

    auditLogService.log(app.workspaceId, "entity_updated", actorId, actorRole, "Appointment", app.id, { status: app.appointmentStatus }, { status: "confirmed" });
    const evt = dealRoomEvents.createEvent(app.workspaceId, actorId, actorRole, "inspection_scheduled", "Appointment Confirmed", `${app.type} confirmed`);
    void dealRoomEvents.publish(evt);
    void automationHooks.emit(evt);

    return updatedApp;
  }

  /**
   * Reschedules an appointment with immutable history logging
   */
  static rescheduleAppointment(
    appointmentId: string,
    newStartTime: string,
    newEndTime: string,
    actorId: string,
    actorRole: ParticipantRole,
    reason?: string
  ): AppointmentAggregate {
    const app = appointmentRepo.getById(appointmentId);
    if (!app) throw new Error("Appointment not found.");

    const now = new Date().toISOString();
    const rescheduleEntry: RescheduleRecord = {
      rescheduledBy: actorId,
      previousStartTime: app.startTime,
      previousEndTime: app.endTime,
      newStartTime,
      newEndTime,
      reason,
      rescheduledAt: now,
    };

    const updatedApp: AppointmentAggregate = {
      ...app,
      startTime: newStartTime,
      endTime: newEndTime,
      appointmentStatus: "rescheduled",
      rescheduleHistory: [...app.rescheduleHistory, rescheduleEntry],
      updatedBy: actorId,
      updatedAt: now,
      version: app.version + 1,
    };

    appointmentRepo.save(updatedApp);

    ConversationService.appendSystemEvent(
      app.workspaceId,
      actorId,
      actorRole,
      `⏳ Appointment Rescheduled: ${app.type.replace("_", " ").toUpperCase()}`,
      `New time: ${new Date(newStartTime).toLocaleString()}${reason ? ` ("${reason}")` : ""}`
    );

    auditLogService.log(app.workspaceId, "entity_updated", actorId, actorRole, "Appointment", app.id, { startTime: app.startTime }, { startTime: newStartTime });
    const evt = dealRoomEvents.createEvent(app.workspaceId, actorId, actorRole, "custom_event", "Appointment Rescheduled", `Rescheduled to ${newStartTime}`);
    void dealRoomEvents.publish(evt);
    void automationHooks.emit(evt);

    return updatedApp;
  }
}
