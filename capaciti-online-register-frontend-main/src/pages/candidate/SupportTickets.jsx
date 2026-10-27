import { useState } from 'react';
import { Send, LifeBuoy, Paperclip } from 'lucide-react';
import { TicketStatus, TicketType, WorkMode } from '../../api/types';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/common/Card';
import StatusBadge from '../../components/common/StatusBadge';
import PageHeader from '../../components/common/PageHeader';
import Alert from '../../components/common/Alert';
import EmptyState from '../../components/common/EmptyState';

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
    <div className="page-narrow">
      <PageHeader eyebrow="Blockers & IT assistance" title="Support" description="Tell us what is blocking your work. The admin team will review and resolve your ticket." />

      <Alert>{ticketsError?.message}</Alert>
      <Alert>{error}</Alert>
      <Alert tone="success">{saved}</Alert>

      <Card title="New ticket">
        <form onSubmit={(event) => void submitTicket(event)} className="space-y-4">
          <fieldset>
            <legend className="field-label mb-1.5">Ticket type</legend>
            <div className="segmented" role="group">
              <button type="button" aria-pressed={form.type === TicketType.BLOCKER} onClick={() => setForm({ ...form, type: TicketType.BLOCKER })} className="segmented-item">Work blocker</button>
              <button type="button" aria-pressed={form.type === TicketType.IT_ISSUE} onClick={() => setForm({ ...form, type: TicketType.IT_ISSUE })} className="segmented-item">IT issue</button>
            </div>
          </fieldset>
          <label className="field">
            <span className="field-label">Title</span>
            <input required maxLength={120} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className="input" placeholder="Briefly describe the issue" />
          </label>
          <label className="field">
            <span className="field-label">Description</span>
            <textarea required rows="4" maxLength={2000} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="input" placeholder="Include what you were trying to do and what happened." />
          </label>
          <label className="field">
            <span className="field-label">Attachment link <span className="font-normal text-slate-400">(optional)</span></span>
            <span className="relative block">
              <Paperclip className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input type="url" inputMode="url" value={form.attachmentUrl} onChange={(event) => setForm({ ...form, attachmentUrl: event.target.value })} className="input pl-10" placeholder="https://..." />
            </span>
          </label>
          <div className="flex justify-end border-t border-slate-100 pt-4">
            <button type="submit" disabled={saving} className="btn btn-primary w-full sm:w-auto">
              <Send className="h-4 w-4" />{saving ? 'Submitting...' : 'Submit ticket'}
            </button>
          </div>
        </form>
      </Card>

      <Card title="My tickets" subtitle={ticketsLoading ? 'Loading tickets...' : `${ownTickets.length} ticket${ownTickets.length === 1 ? '' : 's'}`}>
        {ownTickets.length ? (
          <ul className="list">
            {ownTickets.map((ticket) => (
              <li key={ticket.id} className="rounded-xl border border-slate-100 p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-bold text-navy">{ticket.title}</h3>
                  <StatusBadge status={ticket.status} />
                </div>
                <p className="mt-1 text-xs text-slate-500">{ticket.type === TicketType.BLOCKER ? 'Work blocker' : 'IT issue'} · {new Intl.DateTimeFormat('en-ZA', { timeZone: 'Africa/Johannesburg', dateStyle: 'medium', timeStyle: 'short' }).format(new Date(ticket.createdAt))}</p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{ticket.description}</p>
                {ticket.attachmentUrl && <a href={ticket.attachmentUrl} target="_blank" rel="noreferrer" className="link mt-2 text-xs"><Paperclip className="h-3.5 w-3.5" />View attachment</a>}
                {ticket.status === TicketStatus.RESOLVED && ticket.resolutionNote && <Alert tone="success" className="mt-3"><strong>Resolution:</strong> {ticket.resolutionNote}</Alert>}
              </li>
            ))}
          </ul>
        ) : !ticketsLoading && <EmptyState icon={LifeBuoy} title="No tickets yet" description="You have not submitted any support tickets." />}
      </Card>
    </div>
  );
};

export default SupportTickets;
