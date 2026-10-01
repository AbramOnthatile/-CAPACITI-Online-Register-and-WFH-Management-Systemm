import { AttendanceRecord } from "@/types/attendance";

export const mockAttendance: AttendanceRecord[] = [
  {
    id: "a1",
    candidateId: "u1",
    date: "2026-09-30",
    workMode: "ONSITE",
    status: "PRESENT",
    checkInTime: "08:57",
    checkOutTime: "16:04",
    locationVerified: true,
  },
];