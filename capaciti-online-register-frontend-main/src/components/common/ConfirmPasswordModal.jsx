import { useState } from 'react';
import { Eye, EyeOff, ShieldCheck } from 'lucide-react';
import Modal from './Modal';
import Alert from './Alert';
import { getUserErrorMessage } from '../../api/client';

// Asks for the signed-in user's password before a critical change. `onConfirm(password)`
// does the change; a wrong password keeps the dialog open with the server's message.
const ConfirmPasswordModal = ({ title = 'Confirm with your password', action, onConfirm, onClose }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    if (!password) {
      setError('Enter your password to continue.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onConfirm(password);
    } catch (requestError) {
      setError(getUserErrorMessage(requestError, 'The change could not be saved.'));
      setPassword('');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      as="form"
      onSubmit={(event) => void submit(event)}
      title={title}
      description={`${action} affects where every candidate can clock in, so we need to check it's you.`}
      onClose={onClose}
      closeDisabled={saving}
      footer={(
        <>
          <button type="button" onClick={onClose} disabled={saving} className="btn btn-secondary">Cancel</button>
          <button type="submit" disabled={saving} className="btn btn-primary"><ShieldCheck className="h-4 w-4" />{saving ? 'Checking...' : 'Confirm change'}</button>
        </>
      )}
    >
      <div className="space-y-3">
        <Alert>{error}</Alert>
        <label className="field">
          <span className="field-label">Your password</span>
          <span className="relative block">
            <input
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              autoFocus
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="input pr-10"
            />
            <button type="button" onClick={() => setShowPassword((shown) => !shown)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" aria-label={showPassword ? 'Hide password' : 'Show password'}>
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </span>
        </label>
      </div>
    </Modal>
  );
};

export default ConfirmPasswordModal;
