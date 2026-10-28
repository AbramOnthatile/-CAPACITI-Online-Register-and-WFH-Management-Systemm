import { tasksFrom, taskStatusLabel } from '../../../lib/promptTasks';

const statusTone = {
  DONE: 'bg-emerald-50 text-emerald-700',
  ON_TRACK: 'bg-sky-50 text-sky-700',
  DELAYED: 'bg-amber-50 text-amber-800',
  BLOCKED: 'bg-rose-50 text-rose-700',
};

const fieldLabels = {
  progressStatus: 'Overall',
  blockerNote: 'Blocker note',
  note: 'Notes',
  standupConfirmed: 'Stand-up confirmed',
  powerStatus: 'Power',
  ispStatus: 'Internet',
  workLink: 'Work link',
};

const labelFor = (key) => fieldLabels[key] ?? key.replace(/[A-Z]/g, (letter) => ` ${letter}`).replaceAll('_', ' ');
const valueFor = (value) => {
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) return value.join(', ');
  return taskStatusLabel[value] ?? String(value);
};

// A submitted check-in: the task list with statuses, then any other answers.
const CheckInResponse = ({ response, size = 'xs' }) => {
  const tasks = tasksFrom(response);
  const text = size === 'xs' ? 'text-xs' : 'text-[10px]';
  const others = Object.entries(response ?? {}).filter(([key]) => key !== 'tasks' && key !== 'deliverables');

  return (
    <div className="space-y-2.5">
      {tasks.length > 0 && (
        <ul className="space-y-1.5">
          {tasks.map((task) => (
            <li key={task.title} className={`flex items-start justify-between gap-3 ${text}`}>
              <span className="min-w-0 break-words text-slate-700">
                {task.title}
                {task.added && <span className="ml-1.5 rounded bg-violet-50 px-1.5 py-0.5 text-[10px] font-semibold text-[#6115D0]">Added</span>}
              </span>
              {task.status && <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${statusTone[task.status] ?? 'bg-slate-100 text-slate-600'}`}>{taskStatusLabel[task.status] ?? task.status}</span>}
            </li>
          ))}
        </ul>
      )}
      {others.length > 0 && (
        <dl className="space-y-1.5">
          {others.map(([key, value]) => (
            <div key={key} className={`grid grid-cols-[minmax(7rem,auto)_1fr] gap-2 ${text}`}>
              <dt className="font-semibold capitalize text-slate-500">{labelFor(key)}</dt>
              <dd className="whitespace-pre-wrap break-words text-slate-700">{valueFor(value)}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
};

export default CheckInResponse;
