import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import './ConfirmModal.css';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  /**
   * When set, the customer has to type this exact text before the confirm
   * button enables. For actions that cannot be undone, a stray Enter on a
   * two-button dialog is not enough of a barrier.
   */
  verifyText?: string;
  onConfirm: () => void;
  onDismiss: () => void;
}

/**
 * Confirmation for an action that is easy to undo by accident and awkward to
 * undo deliberately. Generic on purpose: the same dialog covers deleting a
 * conversation and deleting the account.
 *
 * Portalled to document.body rather than using IonModal. Inside the modal the
 * panel was laid out inside Ionic's wrapper, which carries a transform, and a
 * transformed ancestor becomes the containing block for position:fixed. That
 * is what kept the card off centre no matter how the panel was styled.
 *
 * Focus starts on Cancel, not Confirm. For a destructive action the safe
 * choice should be the one a stray Enter key hits.
 */
const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancel',
  verifyText,
  onConfirm,
  onDismiss,
}) => {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const [typed, setTyped] = useState('');

  const needsVerify = typeof verifyText === 'string';
  const canConfirm = !needsVerify || typed.trim() === verifyText;

  // Cleared on close so a half-typed confirmation does not survive a reopen.
  useEffect(() => {
    if (!isOpen) setTyped('');
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    cancelRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      onDismiss();
    };

    document.addEventListener('keydown', handleKeyDown);

    // The page behind must not scroll under the dialog.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, onDismiss]);

  if (!isOpen) return null;

  return createPortal(
    <div className="trim-confirm" role="presentation">
      <div className="trim-confirm__scrim" onClick={onDismiss} aria-hidden="true" />

      <div
        className="trim-confirm__card"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="trim-confirm-title"
        aria-describedby="trim-confirm-message"
      >
        <h2 className="trim-confirm__title" id="trim-confirm-title">
          {title}
        </h2>

        <p className="trim-confirm__message" id="trim-confirm-message">
          {message}
        </p>

        {needsVerify ? (
          <div className="trim-confirm__verify">
            <label className="trim-confirm__verify-label" htmlFor="trim-confirm-verify">
              Type <strong>{verifyText}</strong> to confirm
            </label>
            <input
              id="trim-confirm-verify"
              className="trim-confirm__verify-input"
              type="text"
              value={typed}
              autoComplete="off"
              spellCheck={false}
              onChange={(event) => setTyped(event.target.value)}
            />
          </div>
        ) : null}

        <div className="trim-confirm__actions">
          <button
            ref={cancelRef}
            className="trim-confirm__cancel"
            type="button"
            onClick={onDismiss}
          >
            {cancelLabel}
          </button>

          <button
            className="trim-confirm__ok"
            type="button"
            disabled={!canConfirm}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default ConfirmModal;