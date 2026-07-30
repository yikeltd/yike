"use client";

import { useState } from "react";
import type { AppointmentAggregate, AppointmentType } from "@/lib/deal-room/appointments/types";
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  Video,
  UserCheck,
  Building2,
  Car,
  FileCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  appointment: AppointmentAggregate;
  currentUserId: string;
  onConfirm?: () => void;
  onReschedule?: () => void;
  onCancel?: () => void;
};

export function AppointmentCard({ appointment, currentUserId, onConfirm, onReschedule, onCancel }: Props) {
  const [isExpanding, setIsExpanding] = useState(false);

  const getIcon = (type: AppointmentType) => {
    switch (type) {
      case "property_viewing":
      case "site_visit":
        return <Building2 className="h-5 w-5 text-blue-600" />;
      case "vehicle_inspection":
      case "test_drive":
        return <Car className="h-5 w-5 text-amber-600" />;
      case "virtual_meeting":
        return <Video className="h-5 w-5 text-purple-600" />;
      case "document_signing":
        return <FileCheck className="h-5 w-5 text-emerald-600" />;
      default:
        return <Calendar className="h-5 w-5 text-blue-600" />;
    }
  };

  const formattedDate = new Date(appointment.startTime).toLocaleDateString("en-NG", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const formattedTime = `${new Date(appointment.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - ${new Date(appointment.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;

  return (
    <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-5 shadow-lg select-none space-y-3">
      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-50 border border-slate-200">
            {getIcon(appointment.type)}
          </div>
          <div>
            <h4 className="text-xs font-black uppercase text-[#031B4E]">
              {appointment.type.replace("_", " ")}
            </h4>
            <span className="text-[10px] font-bold text-slate-400">
              ID #{appointment.id.slice(-6)}
            </span>
          </div>
        </div>

        <span
          className={cn(
            "rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase",
            appointment.appointmentStatus === "confirmed"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : appointment.appointmentStatus === "rescheduled"
              ? "bg-amber-50 text-amber-700 border border-amber-200"
              : "bg-blue-50 text-blue-700 border border-blue-200"
          )}
        >
          {appointment.appointmentStatus}
        </span>
      </div>

      {/* SCHEDULED TIME & LOCATION */}
      <div className="space-y-2 text-xs">
        <div className="flex items-center gap-2 text-[#031B4E] font-bold">
          <Calendar className="h-4 w-4 text-[#F59E0B]" />
          <span>{formattedDate}</span>
        </div>

        <div className="flex items-center gap-2 text-slate-600 font-medium">
          <Clock className="h-4 w-4 text-slate-400" />
          <span>{formattedTime} ({appointment.timezone})</span>
        </div>

        <div className="flex items-start gap-2 text-slate-600 font-medium pt-1">
          <MapPin className="h-4 w-4 text-slate-400 flex-shrink-0 mt-0.5" />
          <span>
            {appointment.location.type === "virtual"
              ? appointment.location.meetingLink || "Virtual Workspace Room"
              : appointment.location.address || "Location Pending Confirmation"}
          </span>
        </div>
      </div>

      {/* PARTICIPANTS */}
      <div className="rounded-2xl bg-slate-50 p-2.5 border border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-600">
        <div className="flex items-center gap-1.5">
          <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
          <span>{appointment.participants.length} Participants</span>
        </div>
        <span className="text-[10px] text-slate-400">
          {appointment.rescheduleHistory.length > 0 && `Rescheduled ${appointment.rescheduleHistory.length}x`}
        </span>
      </div>

      {/* ACTIONS */}
      {appointment.appointmentStatus !== "completed" && appointment.appointmentStatus !== "cancelled" && (
        <div className="flex items-center gap-2 pt-1">
          {appointment.appointmentStatus === "requested" && (
            <button
              type="button"
              onClick={onConfirm}
              className="pressable flex-1 rounded-2xl bg-[#031B4E] py-2 text-xs font-black text-white shadow-2xs hover:bg-[#07142B] min-h-[38px]"
            >
              Confirm Appointment
            </button>
          )}

          <button
            type="button"
            onClick={onReschedule}
            className="pressable flex-1 rounded-2xl border border-slate-200 bg-white py-2 text-xs font-bold text-[#031B4E] hover:bg-slate-50 min-h-[38px]"
          >
            Reschedule
          </button>
        </div>
      )}
    </div>
  );
}
