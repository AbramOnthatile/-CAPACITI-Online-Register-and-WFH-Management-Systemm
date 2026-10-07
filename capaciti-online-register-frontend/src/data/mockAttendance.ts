import type { AttendanceRecord } from "../types/attendance";

export const attendanceRecords: AttendanceRecord[] = [
  { id: "att-1", candidateId: "cand-101", date: "2026-10-04", workMode: "ONSITE", status: "PRESENT", checkInTime: "08:52", checkOutTime: "16:05", locationVerified: true },
  { id: "att-2", candidateId: "cand-102", date: "2026-10-04", workMode: "WFH", status: "PRESENT", checkInTime: "08:59", checkOutTime: "16:01", locationVerified: true },
  { id: "att-3", candidateId: "cand-103", date: "2026-10-04", workMode: "ONSITE", status: "LATE", checkInTime: "09:14", checkOutTime: "16:10", locationVerified: true },
  { id: "att-4", candidateId: "cand-104", date: "2026-10-04", workMode: "ONSITE", status: "ABSENT", locationVerified: false },
  { id: "att-5", candidateId: "cand-105", date: "2026-10-04", workMode: "WFH", status: "PARTIAL_DAY", checkInTime: "09:01", checkOutTime: "13:30", locationVerified: true },
];

export const defaultAttendanceState = {
  checkedIn: false,
  checkInTime: null,
  checkOutTime: null,
  workMode: null,
  breaks: { tea1: {}, lunch: {}, tea2: {} },
};
