import { useRef, useState } from 'react';
import { Send, LifeBuoy, Paperclip } from 'lucide-react';
import { TicketStatus, TicketType } from '../../api/types';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useFilesApi } from '../../api/hooks';
import Card from '../../components/common/Card';
import StatusBadge from '../../components/common/StatusBadge';
import PageHeader from '../../components/common/PageHeader';
import Alert from '../../components/common/Alert';
import EmptyState from '../../components/common/EmptyState';
import { ErrorState, Skeleton } from '../../components/common/RequestState';
import { createDraftKey } from '../../lib/attendanceAction';
import { openSignedAttachment } from '../../lib/storageAttachment';
import { ApiError, canRetryError, getFieldError, getUserErrorMessage } from '../../api/client';
import { formatSastDateTime } from '../../lib/time';

const initialForm = {
  type: TicketType.BLOCKER,
  title: '',
  description: '',
  attachmentUrl: '',
};

const SupportTickets = () => {
  const { user } = useAuth();
  const { tickets, ticketsLoading, ticketsError, createTicket, refreshTickets } = useApp();
  const { getSignedUrl } = useFilesApi();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');
  const [saving, setSaving] = useState(false);
  const [qualityMessage, setQualityMessage] = useState('');
  const [attachmentError, setAttachmentError] = useState('');
  const draftKey = useRef(createDraftKey());
  const inFlight = useRef(false);
  const formRef = useRef(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [retryError, setRetryError] = useState(null);
  const ownTickets = tickets.filter((ticket) => ticket.userId === user?.id);

  const submitTicket = async (event) => {
    event.preventDefault();
    if (inFlight.current) return;
    const title = form.title.trim();
    const description = form.description.trim();
    if (!title || !description) {
      setError('Enter a title and describe the issue.');
      return;
    }
    if (form.attachmentUrl && !/^https:\/\/\S+$/i.test(form.attachmentUrl.trim())) {
      setError('Enter a valid https attachment link.');
      return;
    }

    setError('');
    setFieldErrors({});
    setSaved('');
    setQualityMessage('');
    inFlight.current = true;
    setSaving(true);
    try {
      const result = await createTicket({
        draftKey: draftKey.current,
        type: form.type,
        title,
        description,
        attachmentUrl: form.attachmentUrl.trim() || null,
      });
      if (result?.quality?.accepted === false) {
        setQualityMessage(result.quality.feedbackMessage || 'Please revise your ticket and try again.');
        return;
      }
      setForm(initialForm);
      draftKey.current = createDraftKey();
      setRetryError(null);
      setSaved('Your support ticket has been submitted.');
    } catch (submitError) {
      setError(getUserErrorMessage(submitError, 'The support ticket could not be submitted.'));
      setRetryError(submitError);
      if (submitError instanceof ApiError) setFieldErrors(submitError.fieldErrors);
    } finally {
      inFlight.current = false;
      setSaving(false);
    }
  };

  const viewAttachment = async (event, attachmentUrl) => {
    event.preventDefault();
    setAttachmentError('');
    try {
      await openSignedAttachment(attachmentUrl, getSignedUrl);
    } catch (caught) {
      setAttachmentError(caught instanceof Error ? caught.message : 'The attachment could not be opened.');
    }
  };

  return (
    <div className="page-narrow">
      <PageHeader eyebrow="Blockers & IT assistance" title="Support" description="Tell us what is blocking your work. The admin team will review and resolve your ticket." />

      <ErrorState message={ticketsError?.message} />
      {canRetryError(ticketsError) && <button type="button" className="btn btn-secondary btn-sm" onClick={() => void refreshTickets()}>Retry</button>}
      <Alert>{error}</Alert>
      <Alert tone="warning">{qualityMessage}</Alert>
      <ErrorState message={attachmentError} />
      <Alert tone="success">{saved}</Alert>

      <Card title="New ticket">
        <form ref={formRef} onSubmit={(event) => void submitTicket(event)} className="space-y-4">
          <fieldset>
            <legend className="field-label mb-1.5">Ticket type</legend>
            <div className="segmented" role="group">
              <button type="button" aria-pressed={form.type === TicketType.BLOCKER} onClick={() => setForm({ ...form, type: TicketType.BLOCKER })} className="segmented-item">Work blocker</button>
              <button type="button" aria-pressed={form.type === TicketType.IT_ISSUE} onClick={() => setForm({ ...form, type: TicketType.IT_ISSUE })} className="segmented-item">IT issue</button>
            </div>
            {getFieldError(fieldErrors, 'type') && <p role="alert" className="mt-1 text-xs text-rose-700">{getFieldError(fieldErrors, 'type')}</p>}
          </fieldset>
          <label className="field">
            <span className="field-label">Title</span>
            <input required maxLength={120} value={form.title} onChange={(event) => { setFieldErrors({}); setForm({ ...form, title: event.target.value }); }} className="input" placeholder="Briefly describe the issue" />
            {getFieldError(fieldErrors, 'title') && <span role="alert" className="text-xs text-rose-700">{getFieldError(fieldErrors, 'title')}</span>}
          </label>
          <label className="field">
            <span className="field-label">Description</span>
            <textarea required rows="4" maxLength={2000} value={form.description} onChange={(event) => { setFieldErrors({}); setForm({ ...form, description: event.target.value }); }} className="input" placeholder="Include what you were trying to do and what happened." />
            {getFieldError(fieldErrors, 'description') && <span role="alert" className="text-xs text-rose-700">{getFieldError(fieldErrors, 'description')}</span>}
          </label>
          <label className="field">
            <span className="field-label">Attachment link <span className="font-normal text-slate-400">(optional, HTTPS)</span></span>
            <span className="relative block">
              <Paperclip className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input type="url" inputMode="url" value={form.attachmentUrl} onChange={(event) => setForm({ ...form, attachmentUrl: event.target.value })} className="input pl-10" placeholder="https://..." />
            </span>
            {getFieldError(fieldErrors, 'attachmentUrl') && <span role="alert" className="text-xs text-rose-700">{getFieldError(fieldErrors, 'attachmentUrl')}</span>}
          </label>
          {canRetryError(retryError) && <button type="button" className="btn btn-secondary btn-sm" onClick={() => formRef.current?.requestSubmit()}>Retry</button>}
          <div className="flex justify-end border-t border-slate-100 pt-4">
            <button type="submit" disabled={saving} className="btn btn-primary w-full sm:w-auto">
              <Send className="h-4 w-4" />{saving ? 'Submitting...' : 'Submit ticket'}
            </button>
          </div>
        </form>
      </Card>

      <Card title="My tickets" subtitle={ticketsLoading ? 'Loading tickets...' : `${ownTickets.length} ticket${ownTickets.length === 1 ? '' : 's'}`}>
        {ticketsLoading ? <Skeleton label="Loading support tickets" /> : ownTickets.length ? (
          <ul className="list">
            {ownTickets.map((ticket) => (
              <li key={ticket.id} className="rounded-xl border border-slate-100 p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-bold text-navy">{ticket.title}</h3>
                  <StatusBadge status={ticket.status} />
                </div>
                <p className="mt-1 text-xs text-slate-500">{ticket.type === TicketType.BLOCKER ? 'Work blocker' : 'IT issue'} · {formatSastDateTime(ticket.createdAt)}</p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{ticket.description}</p>
                {ticket.attachmentUrl && <a href="#" onClick={(event) => void viewAttachment(event, ticket.attachmentUrl)} className="link mt-2 text-xs"><Paperclip className="h-3.5 w-3.5" />View attachment</a>}
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
