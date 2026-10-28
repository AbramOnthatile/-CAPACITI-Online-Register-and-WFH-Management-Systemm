import { WfhStatus, type WfhRequest } from '../api/types';
import { getSastDateValue } from './time';

export const weeklyWfhLimit = 2;

const dateString = (value: Date) => value.toISOString().slice(0, 10);

function* businessDays(startDate: string, endDate: string) {
  const day = new Date(`${startDate}T00:00:00.000Z`);
  const end = new Date(`${endDate}T00:00:00.000Z`);
  while (day <= end) {
    const weekday = day.getUTCDay();
    if (weekday !== 0 && weekday !== 6) yield dateString(day);
    day.setUTCDate(day.getUTCDate() + 1);
  }
}

const weekStart = (date: string) => {
  const day = new Date(`${date}T00:00:00.000Z`);
  const daysSinceMonday = (day.getUTCDay() + 6) % 7;
  day.setUTCDate(day.getUTCDate() - daysSinceMonday);
  return dateString(day);
};

export function getCurrentWeekStart(serverTime?: string | null): string | null {
  const today = serverTime ? getSastDateValue(serverTime) : null;
  return today ? weekStart(today) : null;
}

export function countWfhDaysForWeek(requests: WfhRequest[], week: string) {
  const reservedDays = new Set<string>();
  requests
    .filter((request) => request.status === WfhStatus.PENDING || request.status === WfhStatus.APPROVED)
    .forEach((request) => {
      for (const day of businessDays(request.startDate, request.endDate)) {
        if (weekStart(day) === week) reservedDays.add(day);
      }
    });
  return reservedDays.size;
}

export function validateWfhAllowance(
  requests: WfhRequest[],
  newRequest: Pick<WfhRequest, 'startDate' | 'endDate'>,
) {
  const reservedByWeek = new Map<string, Set<string>>();
  requests
    .filter((request) => request.status === WfhStatus.PENDING || request.status === WfhStatus.APPROVED)
    .forEach((request) => {
      for (const day of businessDays(request.startDate, request.endDate)) {
        const week = weekStart(day);
        const reservedDays = reservedByWeek.get(week) ?? new Set<string>();
        reservedDays.add(day);
        reservedByWeek.set(week, reservedDays);
      }
    });

  const requestedDays = [...businessDays(newRequest.startDate, newRequest.endDate)];
  if (!requestedDays.length) throw new Error('Choose at least one weekday for your WFH request.');
  for (const day of requestedDays) {
    const week = weekStart(day);
    const reservedDays = reservedByWeek.get(week) ?? new Set<string>();
    if (reservedDays.has(day)) throw new Error(`A WFH request already exists for ${day}.`);
    reservedDays.add(day);
    reservedByWeek.set(week, reservedDays);
    if (reservedDays.size > weeklyWfhLimit) {
      throw new Error(`The WFH allowance is limited to ${weeklyWfhLimit} weekdays per week.`);
    }
  }
}
