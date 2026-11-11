import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import './Modal.css';

export default function Modal({ title, onClose, children, footer, size = 'md' }) {
  const overlayRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  // Phones: keep the window inside the part of the screen you can actually see.
  // On iPhone the keyboard and Safari's toolbars cover the bottom of the screen, so the
  // footer (Send / Save) would end up hidden behind them. visualViewport tells us the
  // visible area; we size the dark backdrop to it, and the panel follows.
  useEffect(() => {
    const view = window.visualViewport;
    if (!view) return undefined;
    const fit = () => {
      const el = overlayRef.current;
      if (!el) return;
      el.style.top = `${view.offsetTop}px`;
      el.style.height = `${view.height}px`;
    };
    fit();
    view.addEventListener('resize', fit);
    view.addEventListener('scroll', fit);
    return () => {
      view.removeEventListener('resize', fit);
      view.removeEventListener('scroll', fit);
    };
  }, []);

  return (
    <div ref={overlayRef} className="modal" role="dialog" aria-modal="true" aria-label={title} onMouseDown={onClose}>
      <div className={`modal__panel modal__panel--${size}`} onMouseDown={(e) => e.stopPropagation()}>
        <header className="modal__header">
          <h2>{title}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </header>
        <div className="modal__body">{children}</div>
        {footer && <footer className="modal__footer">{footer}</footer>}
      </div>
    </div>
  );
}
