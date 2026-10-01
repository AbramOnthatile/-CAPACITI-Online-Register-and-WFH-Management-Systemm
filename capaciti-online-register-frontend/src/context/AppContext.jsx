import { createContext, useContext, useMemo, useState } from 'react';
import { mockUsers } from '../data/mockUsers';
import { attendanceRecords, defaultAttendanceState } from '../data/mockAttendance';
import { wfhRequests } from '../data/mockWFH';
import { progressEntries } from '../data/mockProgress';
import { notifications } from '../data/mockNotifications';
import { escalations } from '../data/mockEscalations';
import { auditLogs } from '../data/mockAuditLogs';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [users, setUsers] = useState(mockUsers);
  const [attendance, setAttendance] = useState(attendanceRecords);
  const [wfh, setWfh] = useState(wfhRequests);
  const [progress, setProgress] = useState(progressEntries);
  const [notificationList, setNotificationList] = useState(notifications);
  const [escalationList, setEscalationList] = useState(escalations);
  const [audit, setAudit] = useState(auditLogs);
  const [attendanceState, setAttendanceState] = useState(defaultAttendanceState);

  const addAuditEntry = (entry) => {
    setAudit((current) => [
      {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        user: entry.user,
        action: entry.action,
        module: entry.module,
        description: entry.description,
      },
      ...current,
    ]);
  };

  const markNotificationRead = (id) => {
    setNotificationList((current) =>
      current.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const upsertAttendanceState = (next) => setAttendanceState(next);

  const updateWFHRequest = (id, updates) => {
    setWfh((current) =>
      current.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const addWFHRequest = (request) => {
    setWfh((current) => [request, ...current]);
    addAuditEntry({
      user: request.candidate,
      action: 'Submitted WFH Request',
      module: 'WFH',
      description: `${request.candidate} submitted a WFH request for ${request.date}.`,
    });
  };

  const addProgressEntry = (entry) => {
    setProgress((current) => [entry, ...current]);
    addAuditEntry({
      user: entry.candidate,
      action: 'Progress Update',
      module: 'Progress',
      description: `${entry.candidate} submitted daily progress.`,
    });
  };

  const updateUser = (id, updates) => {
    setUsers((current) => current.map((user) => (user.id === id ? { ...user, ...updates } : user)));
  };

  const value = useMemo(
    () => ({
      users,
      attendance,
      setAttendance,
      wfh,
      setWfh,
      progress,
      setProgress,
      notificationList,
      setNotificationList,
      escalations: escalationList,
      setEscalationList,
      audit: audit ?? [],
      auditLogs: audit ?? [],
      setAudit,
      attendanceState,
      setAttendanceState: upsertAttendanceState,
      addAuditEntry,
      markNotificationRead,
      updateWFHRequest,
      addWFHRequest,
      addProgressEntry,
      updateUser,
    }),
    [users, attendance, wfh, progress, notificationList, escalationList, audit, attendanceState]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};
