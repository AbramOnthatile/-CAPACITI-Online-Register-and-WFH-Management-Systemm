import { useState } from 'react';
import { Send, LifeBuoy, Paperclip } from 'lucide-react';
import { TicketStatus, TicketType, WorkMode } from '../../api/types';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/common/Card';
import StatusBadge from '../../components/common/StatusBadge';

const initialForm = {
  type: TicketType.BLOCKER,
  title: '',
  description: '',
  attachmentUrl: '',
};

const SupportTickets = () => {
  const { user } = useAuth();
  const { tickets, ticketsLoading, ticketsError, createTicket } = useApp();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');
  const [saving, setSaving] = useState(false);
  const ownTickets = tickets.filter((ticket) => ticket.userId === user?.id);

  const submitTicket = async (event) => {
    event.preventDefault();
    const title = form.title.trim();
    const description = form.description.trim();
    if (!title || !description) {
      setError('Enter a title and describe the issue.');
      return;
    }
    if (form.attachmentUrl && !/^https?:\/\/\S+$/i.test(form.attachmentUrl.trim())) {
      setError('Enter a valid http or https attachment link.');
      return;
    }

    setError('');
    setSaved('');
    setSaving(true);
    try {
      await createTicket({
        type: form.type,
        workMode: user?.defaultMode ?? WorkMode.ON_SITE,
        title,
        description,
        attachmentUrl: form.attachmentUrl.trim() || null,
      });
      setForm(initialForm);
      setSaved('Your support ticket has been submitted.');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'The support ticket could not be submitted.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#6115D0]">Admin Support</span>
          <span className="text-slate-300">·</span>
          <span className="text-xs font-medium text-slate-500">Blockers &amp; IT assistance</span>
        </div>
        <h2 className="mt-1 text-2xl font-black text-[#1D2951] sm:text-3xl">Support Tickets</h2>
      </div>

      {ticketsError && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">{ticketsError.message}</p>}
      {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">{error}</p>}
      {saved && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">{saved}</p>}

      <Card title="Create a support ticket" subtitle="Describe what is blocking your work. The admin team will review and resolve your ticket.">
        <form onSubmit={(event) => void submitTicket(event)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-xs font-bold text-slate-700">
              Ticket type
              <select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })} className="input mt-1 text-xs">
                <option value={TicketType.BLOCKER}>Work blocker</option>
                <option value={TicketType.IT_ISSUE}>IT issue</option>
              </select>
            </label>
            <label className="block text-xs font-bold text-slate-700">
              Title
              <input required maxLength={120} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className="input mt-1 text-xs" placeholder="Briefly describe the issue" />
            </label>
          </div>
          <label className="block text-xs font-bold text-slate-700">
            Description
            <textarea required rows="4" maxLength={2000} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="input mt-1 text-xs" placeholder="Include what you were trying to do and what happened." />
          </label>
          <label className="block text-xs font-bold text-slate-700">
            Attachment link (optional)
            <span className="relative mt-1 block">
              <Paperclip className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input type="url" value={form.attachmentUrl} onChange={(event) => setForm({ ...form, attachmentUrl: event.target.value })} className="input pl-9 text-xs" placeholder="https://..." />
            </span>
          </label>
          <div className="flex justify-end">
            <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-xl bg-[#6115D0] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#4F11AA] disabled:opacity-60">
              <Send className="h-3.5 w-3.5" />{saving ? 'Submitting...' : 'Submit Ticket'}
            </button>
          </div>
        </form>
      </Card>

      <Card title="My tickets" subtitle={ticketsLoading ? 'Loading tickets...' : `${ownTickets.length} ticket${ownTickets.length === 1 ? '' : 's'}`}>
        <div className="space-y-3">
          {ownTickets.map((ticket) => (
            <article key={ticket.id} className="rounded-xl border border-slate-100 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-[#1D2951]">{ticket.title}</h3>
                <StatusBadge status={ticket.status} />
              </div>
              <p className="mt-1 text-[11px] text-slate-500">{ticket.type === TicketType.BLOCKER ? 'Work blocker' : 'IT issue'} · {new Intl.DateTimeFormat('en-ZA', { timeZone: 'Africa/Johannesburg', dateStyle: 'medium', timeStyle: 'short' }).format(new Date(ticket.createdAt))}</p>
              <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-slate-700">{ticket.description}</p>
              {ticket.attachmentUrl && <a href={ticket.attachmentUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#6115D0] hover:underline"><Paperclip className="h-3 w-3" />View attachment</a>}
              {ticket.status === TicketStatus.RESOLVED && ticket.resolutionNote && <p className="mt-3 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-800"><strong>Resolution:</strong> {ticket.resolutionNote}</p>}
            </article>
          ))}
          {!ticketsLoading && !ownTickets.length && <div className="flex flex-col items-center py-8 text-center text-slate-500"><LifeBuoy className="h-6 w-6 text-slate-300" /><p className="mt-2 text-xs">You have not submitted any tickets.</p></div>}
        </div>
      </Card>
    </div>
  );
};

export default SupportTickets;
