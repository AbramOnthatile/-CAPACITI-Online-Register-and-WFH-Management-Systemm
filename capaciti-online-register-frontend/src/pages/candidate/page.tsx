"use client";

import { useEffect, useState } from "react";
import { useAttendanceStore } from "@/hooks/useAttendanceStore";
import { User } from "@/types/user";

const BREAKS = [
  { key: "tea1", label: "Tea Break 1", window: "10:30 – 10:45" },
  { key: "lunch", label: "Lunch", window: "12:00 – 13:00" },
  { key: "tea2", label: "Tea Break 2", window: "14:30 – 14:45" },
] as const;

export default function CandidateDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const { getTodayRecord, clockIn, clockOut, startBreak, endBreak } = useAttendanceStore();

  useEffect(() => {
    const stored = localStorage.getItem("currentUser");
    if (stored) setUser(JSON.parse(stored));
  }, []);

  if (!user) return <p className="p-8">Loading…</p>;

  const today = getTodayRecord(user.id);

  return (
    <main className="min-h-screen bg-pink/30 p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-navy">Hi, {user.fullName.split(" ")[0]}</h1>
        <p className="text-gray-600 text-sm">
          {today ? `Status: ${today.status}` : "Not checked in yet today"}
        </p>
      </header>

      {!today ? (
        <div className="flex gap-3 mb-8">
          <button
            onClick={() => clockIn(user.id, "ONSITE")}
            className="bg-navy text-white px-4 py-2 rounded-md font-medium"
          >
            Check In — Onsite
          </button>
          <button
            onClick={() => clockIn(user.id, "WFH")}
            className="bg-purple text-white px-4 py-2 rounded-md font-medium"
          >
            Check In — Remote
          </button>
        </div>
      ) : !today.checkOutTime ? (
        <button
          onClick={() => clockOut(user.id)}
          className="bg-salmon text-white px-4 py-2 rounded-md font-medium mb-8"
        >
          Check Out
        </button>
      ) : (
        <p className="mb-8 text-sm text-gray-600">
          Checked out at {today.checkOutTime}
        </p>
      )}

      {today && (
        <section>
          <h2 className="font-semibold text-navy mb-3">Breaks</h2>
          <div className="grid gap-3">
            {BREAKS.map((b) => {
              const start = today[`${b.key}Start` as keyof typeof today] as string | undefined;
              const end = today[`${b.key}End` as keyof typeof today] as string | undefined;
              return (
                <div key={b.key} className="bg-white rounded-md p-4 flex items-center justify-between shadow-sm">
                  <div>
                    <p className="font-medium text-navy">{b.label}</p>
                    <p className="text-xs text-gray-500">{b.window}</p>
                  </div>
                  {!start ? (
                    <button
                      onClick={() => startBreak(user.id, b.key)}
                      className="text-sm bg-purple text-white px-3 py-1.5 rounded-md"
                    >
                      Start
                    </button>
                  ) : !end ? (
                    <button
                      onClick={() => endBreak(user.id, b.key)}
                      className="text-sm bg-salmon text-white px-3 py-1.5 rounded-md"
                    >
                      End
                    </button>
                  ) : (
                    <span className="text-xs text-gray-500">{start} – {end}</span>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}