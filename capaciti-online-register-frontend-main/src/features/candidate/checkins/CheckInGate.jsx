import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { PromptStage, PromptStatus } from '../../../api/types';
import { useApp } from '../../../context/AppContext';

// Lets clock-out and sign-out show the end-of-day form first and wait for the outcome:
// 'submitted', 'skipped' (sign-out only), 'cancelled', or 'none' when there is nothing to fill in.
const CheckInGateContext = createContext({
  gate: null,
  requestEod: async () => 'none',
  finishEod: () => {},
});

const isOpen = (prompt) => prompt && [PromptStatus.ACTIVE, PromptStatus.SCHEDULED].includes(prompt.status);

export const CheckInGateProvider = ({ children }) => {
  const { prompts, attendanceToday } = useApp();
  const [gate, setGate] = useState(null);

  const requestEod = useCallback((reason) => {
    const eod = prompts.find((prompt) => prompt.stage === PromptStage.EOD_WRAP_UP);
    const clockedIn = Boolean(attendanceToday?.clockInAt) && !attendanceToday?.clockOutAt;
    if (!isOpen(eod) || !clockedIn) return Promise.resolve('none');
    return new Promise((resolve) => setGate({ reason, prompt: eod, resolve }));
  }, [prompts, attendanceToday]);

  const finishEod = useCallback((outcome) => {
    setGate((current) => {
      current?.resolve(outcome);
      return null;
    });
  }, []);

  const value = useMemo(() => ({ gate, requestEod, finishEod }), [gate, requestEod, finishEod]);
  return <CheckInGateContext.Provider value={value}>{children}</CheckInGateContext.Provider>;
};

export const useCheckInGate = () => useContext(CheckInGateContext);
