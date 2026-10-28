import { useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock3, MessageSquare, ShieldAlert, Check, TicketCheck, Paperclip } from 'lucide-react';
import { TicketStatus, TicketType } from '../../api/types';
import { useApp } from '../../context/AppContext';
import { useFilesApi } from '../../api/hooks';
import StatusBadge from '../../components/common/StatusBadge';
import PageHeader from '../../components/common/PageHeader';
import EmptyState from '../../components/common/EmptyState';
import { getStatusMetadata } from '../../lib/status';
import { ErrorState, Skeleton } from '../../components/common/RequestState';
import { openSignedAttachment } from '../../lib/storageAttachment';
import { formatSastDateTime } from '../../lib/time';

const BlockersTickets = () => {
  const { tickets, ticketsLoading, ticketsError, resolveTicket } = useApp();
  const { getSignedUrl } = useFilesApi();
  const [resolutionNotes, setResolutionNotes] = useState({});
  const [resolvingId, setResolvingId] = useState('');
  const [error, setError] = useState('');
  const [attachmentError, setAttachmentError] = useState('');

  const handleResolve = async (ticketId) => {
    setError('');
    setResolvingId(ticketId);
    try {
      await resolveTicket(ticketId, { resolutionNote: resolutionNotes[ticketId]?.trim() ?? '' });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The ticket could not be resolved.');
    } finally {
      setResolvingId('');
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
    <div className="page">
      <PageHeader eyebrow="Support & blocker oversight" eyebrowClassName="text-salmon" title="Blockers & tickets" description="Support tickets submitted by candidates and their resolution status." actions={<StatusBadge status={TicketStatus.OPEN}>Demo</StatusBadge>} />

      <ErrorState message={error || ticketsError?.message} />
      <ErrorState message={attachmentError} />
      {ticketsLoading && <Skeleton label="Loading support tickets" />}

      <ul className="list">
        {tickets.map((ticket) => {
          const resolved = ticket.status === TicketStatus.RESOLVED;
          return (
            <li key={ticket.id} className={`surface ${resolved ? 'opacity-80' : 'border-salmon/30'}`}>
              <div className="card-header items-start">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-salmon/10 text-salmon">
                    {ticket.type === TicketType.BLOCKER ? <AlertTriangle className="h-5 w-5" /> : <ShieldAlert className="h-5 w-5" />}
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-navy">{ticket.title}</h3>
                    <p className="text-xs text-slate-500">{ticket.userName} · {getStatusMetadata(ticket.type).label}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <StatusBadge status={ticket.status} />
                  {ticket.isProlonged && <span className="pill border-amber-500/20 bg-amber-500/10 text-amber-700"><Clock3 className="h-3 w-3" />Prolonged</span>}
                </div>
              </div>
              <div className="card-body space-y-4">
                <div className="space-y-2">
                  <p className="text-sm leading-relaxed text-slate-700">{ticket.description}</p>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                    <StatusBadge status={ticket.type} />
                    <span>Created {formatSastDateTime(ticket.createdAt)}</span>
                  </div>
                  {ticket.attachmentUrl && <a href="#" onClick={(event) => void viewAttachment(event, ticket.attachmentUrl)} className="link text-xs"><Paperclip className="h-3.5 w-3.5" />View attachment</a>}
                </div>
                {!resolved ? (
                  <div className="space-y-3 border-t border-slate-100 pt-4">
                    <label className="field">
                      <span className="field-label">Resolution note</span>
                      <textarea rows="2" className="input" value={resolutionNotes[ticket.id] ?? ''} onChange={(event) => setResolutionNotes((current) => ({ ...current, [ticket.id]: event.target.value }))} />
                    </label>
                    <div className="flex justify-end">
                      <button type="button" disabled={resolvingId === ticket.id} onClick={() => void handleResolve(ticket.id)} className="btn btn-success w-full sm:w-auto">
                        <Check className="h-4 w-4" />{resolvingId === ticket.id ? 'Resolving...' : 'Resolve ticket'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5 border-t border-slate-100 pt-4 text-sm sm:flex-row sm:items-center sm:justify-between">
                    <span className="flex items-center gap-1.5 font-semibold text-emerald-700"><CheckCircle2 className="h-4 w-4" />Resolved by {ticket.resolvedByName || 'support'}</span>
                    {ticket.resolutionNote && <span className="flex items-center gap-1.5 text-slate-500"><MessageSquare className="h-4 w-4" />{ticket.resolutionNote}</span>}
                  </div>
                )}
              </div>
            </li>
          );
        })}
        {!ticketsLoading && !tickets.length && <li><EmptyState icon={TicketCheck} title="No tickets" description="There are no support tickets to display." className="bg-white" /></li>}
      </ul>
    </div>
  );
};

export default BlockersTickets;
