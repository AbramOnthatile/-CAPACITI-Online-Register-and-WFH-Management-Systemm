import { attendanceRecords } from '../data/mockAttendance';

export const getAttendanceHistory = async () => attendanceRecords;

export const getTodayAttendance = async () => ({
  currentStatus: 'Working',
  totalMinutes: 420,
  records: attendanceRecords,
});

export const updateAttendanceState = async (nextState) => nextState;
