import { LogOut } from 'lucide-react';
import Modal from './Modal';

// Asks before ending the session; the token is only cleared on confirm.
const SignOutDialog = ({ onCancel, onConfirm }) => (
  <Modal
    title="Sign out?"
    description="You will need to sign in again to use the portal."
    onClose={onCancel}
    footer={(
      <>
        <button type="button" onClick={onCancel} className="btn btn-secondary">Cancel</button>
        <button type="button" onClick={onConfirm} className="btn btn-danger" autoFocus>
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </>
    )}
  />
);

export default SignOutDialog;
