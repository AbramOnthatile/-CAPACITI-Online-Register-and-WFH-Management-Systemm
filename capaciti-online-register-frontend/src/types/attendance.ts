export type AttendanceStatus = "PRESENT" | "LATE" | "PARTIAL_DAY" | "ABSENT";
export type WorkMode = "ONSITE" | "WFH";

export interface AttendanceRecord {
  id: string;
  candidateId: string;
  date: string;
  workMode: WorkMode;
  status: AttendanceStatus;
  checkInTime?: string;
  checkOutTime?: string;
  locationVerified: boolean;
  tea1Start?: string;
  tea1End?: string;
  lunchStart?: string;
  lunchEnd?: string;
  tea2Start?: string;
  tea2End?: string;
  breakFlags?: string[];
}