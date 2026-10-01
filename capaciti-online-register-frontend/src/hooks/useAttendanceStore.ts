"use client";

import { useState } from "react";
import { mockAttendance } from "@/data/mockAttendance";
import { AttendanceRecord, WorkMode } from "@/types/attendance";

const START_TIME = "09:00";
const END_TIME = "16:00";

export function useAttendanceStore() {
  const [records, setRecords] = useState<AttendanceRecord[]>(mockAttendance);

  function todayStr() {
    return new Date().toISOString().slice(0, 10);
  }
  function nowStr() {
    return new Date().toTimeString().slice(0, 5);
  }

  function getTodayRecord(candidateId: string) {
    return records.find((r) => r.candidateId === candidateId && r.date === todayStr());
  }

  function clockIn(candidateId: string, workMode: WorkMode) {
    if (getTodayRecord(candidateId)) return;
    const now = nowStr();
    const status = now > START_TIME ? "LATE" : "PRESENT";

    setRecords((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        candidateId,
        date: todayStr(),
        workMode,
        status,
        checkInTime: now,
        locationVerified: true,
        breakFlags: [],
      },
    ]);
  }

  function clockOut(candidateId: string) {
    setRecords((prev) =>
      prev.map((r) => {
        if (r.candidateId !== candidateId || r.date !== todayStr()) return r;
        const now = nowStr();
        const status = now < END_TIME ? "PARTIAL_DAY" : r.status;
        return { ...r, checkOutTime: now, status };
      })
    );
  }

  function startBreak(candidateId: string, breakKey: "tea1" | "lunch" | "tea2") {
    setRecords((prev) =>
      prev.map((r) => {
        if (r.candidateId !== candidateId || r.date !== todayStr()) return r;
        return { ...r, [`${breakKey}Start`]: nowStr() };
      })
    );
  }

  function endBreak(candidateId: string, breakKey: "tea1" | "lunch" | "tea2") {
    setRecords((prev) =>
      prev.map((r) => {
        if (r.candidateId !== candidateId || r.date !== todayStr()) return r;
        return { ...r, [`${breakKey}End`]: nowStr() };
      })
    );
  }

  return { records, getTodayRecord, clockIn, clockOut, startBreak, endBreak };
}