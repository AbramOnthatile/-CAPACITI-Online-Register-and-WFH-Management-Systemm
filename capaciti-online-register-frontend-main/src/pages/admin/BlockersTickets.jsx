import { useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock3, MessageSquare, ShieldAlert, Check } from 'lucide-react';
import { TicketStatus, TicketType } from '../../api/types';
import { useApp } from '../../context/AppContext';
import Card from '../../components/common/Card';
import StatusBadge from '../../components/common/StatusBadge';
import { getStatusMetadata } from '../../lib/status';

const BlockersTickets = () => {
  const { tickets, ticketsLoading, ticketsError, resolveTicket } = useApp();
  const [resolutionNotes, setResolutionNotes] = useState({});
  const [resolvingId, setResolvingId] = useState('');
  const [error, setError] = useState('');

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

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#F25251]">Support &amp; Blocker Oversight</span>
          <span className="text-slate-300">·</span>
          <span className="text-xs text-slate-500 font-medium">Administrative Intervention</span>
        </div>
        <h2 className="mt-1 text-2xl font-black text-[#1D2951] sm:text-3xl">Blockers &amp; Tickets</h2>
        <p className="mt-0.5 text-xs text-slate-600 sm:text-sm">Support tickets submitted by candidates and their resolution status.</p>
      </div>

      {(ticketsError || error) && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">{error || ticketsError?.message}</p>}
      {ticketsLoading && <p className="text-xs text-slate-500">Loading support tickets...</p>}

      <div className="space-y-3">
        {tickets.map((ticket) => (
          <article key={ticket.id} className={`rounded-2xl border p-5 transition-all ${ticket.status === TicketStatus.RESOLVED ? 'border-slate-200 bg-white opacity-80' : 'border-[#F25251]/30 bg-white shadow-sm hover:border-[#F25251]/60'}`}>
            <div className="flex flex-col gap-3 border-b border-slate-100 pb-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F25251]/10 text-[#F25251]">
                  {ticket.type === TicketType.BLOCKER ? <AlertTriangle className="h-5 w-5" /> : <ShieldAlert className="h-5 w-5" />}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#1D2951]">{ticket.title}</h3>
                  <p className="text-xs font-medium text-slate-500">{ticket.userName} · {getStatusMetadata(ticket.type).label}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={ticket.status} />
                {ticket.isProlonged && <span className="flex items-center gap-1 text-xs font-semibold text-amber-700"><Clock3 className="h-3.5 w-3.5" /> Prolonged</span>}
              </div>
            </div>
            <div className="my-3 space-y-2 text-xs leading-relaxed text-slate-700">
              <p>{ticket.description}</p>
              <p className="flex items-center gap-2 text-slate-400"><StatusBadge status={ticket.workMode} />{Math.max(0, Math.floor((Date.now() - Date.parse(ticket.createdAt)) / 60000))} minutes old</p>
              {ticket.attachmentUrl && <a href={ticket.attachmentUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-[#6115D0] hover:underline">View attachment</a>}
            </div>
            {ticket.status === TicketStatus.OPEN ? (
              <div className="space-y-3 border-t border-slate-100 pt-3">
                <label className="block text-xs font-bold text-slate-600">
                  Resolution note
                  <textarea rows="2" className="input mt-1.5 text-xs" value={resolutionNotes[ticket.id] ?? ''} onChange={(event) => setResolutionNotes((current) => ({ ...current, [ticket.id]: event.target.value }))} />
                </label>
                <div className="flex justify-end">
                  <button type="button" disabled={resolvingId === ticket.id} onClick={() => void handleResolve(ticket.id)} className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-emerald-700 disabled:opacity-60">
                    <Check className="h-3.5 w-3.5" /><span>{resolvingId === ticket.id ? 'Resolving...' : 'Resolve Ticket'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
                <span className="flex items-center gap-1.5 font-semibold text-emerald-700"><CheckCircle2 className="h-4 w-4" />Resolved by {ticket.resolvedByName || 'support'}</span>
                {ticket.resolutionNote && <span className="flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5" />{ticket.resolutionNote}</span>}
              </div>
            )}
          </article>
        ))}
        {!ticketsLoading && !tickets.length && <Card title="No tickets"><p className="text-xs text-slate-500">There are no support tickets to display.</p></Card>}
      </div>

    </div>
  );
};

export default BlockersTickets;
