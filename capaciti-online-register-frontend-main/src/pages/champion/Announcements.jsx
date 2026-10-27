import { useState } from 'react';
import { Send } from 'lucide-react';
import Card from '../../components/common/Card';
import PageHeader from '../../components/common/PageHeader';
import Alert from '../../components/common/Alert';
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
    <div className="page-narrow">
      <PageHeader eyebrow="Candidate communications" title="Announcements" description="Send an update that appears in active candidates' notifications." />

      <Alert>{error}</Alert>
      <Alert tone="success">{feedback}</Alert>

      <Card title="New announcement" subtitle="All active candidates will receive this in their Notifications page.">
        <form onSubmit={(event) => void submitAnnouncement(event)} className="space-y-4">
          <label className="field">
            <span className="field-label">Title</span>
            <input required maxLength={120} value={title} onChange={(event) => setTitle(event.target.value)} className="input" placeholder="Announcement title" disabled={sending} />
          </label>
          <label className="field">
            <span className="field-label">Message</span>
            <textarea required rows="5" maxLength={2000} value={message} onChange={(event) => setMessage(event.target.value)} className="input" placeholder="Share an important update with candidates." disabled={sending} />
          </label>
          <div className="flex justify-end border-t border-slate-100 pt-4">
            <button type="submit" disabled={sending} className="btn btn-primary w-full sm:w-auto">
              <Send className="h-4 w-4" />
              {sending ? 'Sending...' : 'Send announcement'}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default Announcements;
