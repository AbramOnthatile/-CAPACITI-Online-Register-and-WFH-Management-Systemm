import { useState } from 'react';
import { Megaphone, Send } from 'lucide-react';
import Card from '../../components/common/Card';
import { useApp } from '../../context/AppContext';

const Announcements = () => {
  const { createAnnouncement } = useApp();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [sending, setSending] = useState(false);

  const submitAnnouncement = async (event) => {
    event.preventDefault();
    const cleanTitle = title.trim();
    const cleanMessage = message.trim();
    if (!cleanTitle || !cleanMessage) {
      setError('Enter both a title and announcement message.');
      return;
    }

    setError('');
    setFeedback('');
    setSending(true);
    try {
      const recipientCount = await createAnnouncement({ title: cleanTitle, message: cleanMessage });
      setTitle('');
      setMessage('');
      setFeedback(`Announcement sent to ${recipientCount} active candidate${recipientCount === 1 ? '' : 's'}.`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The announcement could not be sent.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#6115D0]">Candidate Communications</span>
          <span className="text-slate-300">·</span>
          <span className="text-xs font-medium text-slate-500">Notifications</span>
        </div>
        <h2 className="mt-1 text-2xl font-black text-[#1D2951] sm:text-3xl">Announcements</h2>
        <p className="mt-1 text-xs text-slate-500">Send an update that appears only in active candidates' notifications.</p>
      </div>

      {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">{error}</p>}
      {feedback && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">{feedback}</p>}

      <Card title="New announcement" subtitle="All active candidates will receive this in their Notifications page.">
        <form onSubmit={(event) => void submitAnnouncement(event)} className="space-y-4">
          <label className="block text-xs font-bold text-slate-700">
            Title
            <input
              required
              maxLength={120}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="input mt-1 text-xs"
              placeholder="Announcement title"
              disabled={sending}
            />
          </label>
          <label className="block text-xs font-bold text-slate-700">
            Message
            <textarea
              required
              rows="5"
              maxLength={2000}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              className="input mt-1 text-xs"
              placeholder="Share an important update with candidates."
              disabled={sending}
            />
          </label>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={sending}
              className="flex items-center gap-2 rounded-xl bg-[#6115D0] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#4F11AA] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {sending ? <Megaphone className="h-3.5 w-3.5" /> : <Send className="h-3.5 w-3.5" />}
              {sending ? 'Sending...' : 'Send Announcement'}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default Announcements;
