import { useState } from 'react';
import Modal from './Modal.jsx';
import Field from './Field.jsx';

// Approve / reject with an optional note. Used for leave and flagged clock-ins.
//   onSubmit({ decision, note }) → Promise
export default function ReviewModal({ title, decision, summary, onSubmit, onClose }) {
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const approving = decision === 'approved';

  const submit = async () => {
    setBusy(true);
    try {
      await onSubmit({ decision, note });
      onClose();
    } catch {
      setBusy(false);
    }
  };

  return (
    <Modal
      title={title}
      size="sm"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className={`btn ${approving ? 'btn--success' : 'btn--danger'}`} onClick={submit} disabled={busy}>
            {approving ? 'Approve' : 'Reject'}
          </button>
        </>
      }
    >
      {summary && <p style={{ marginBottom: 16 }}>{summary}</p>}
      <Field label="Note" name="note" optional>
        <textarea
          id="note"
          className="field__input"
          placeholder={approving ? 'e.g. Was at a client site' : 'Reason for rejecting'}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={255}
        />
      </Field>
    </Modal>
  );
}
