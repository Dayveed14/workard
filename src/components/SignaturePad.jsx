import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Eraser } from 'lucide-react';
import './SignaturePad.css';

// Sign with a finger, pen or mouse.
//   const pad = useRef();  <SignaturePad ref={pad} onChange={setHasSignature} />
//   pad.current.toDataUrl()  → 'data:image/png;base64,…' (null if empty)
//   pad.current.toBlob()     → Promise<Blob> (for uploading)
const SignaturePad = forwardRef(function SignaturePad({ onChange, height = 160 }, ref) {
  const canvas = useRef(null);
  const drawing = useRef(false);
  const [empty, setEmpty] = useState(true);

  // Sharp lines on high-density (phone) screens
  useEffect(() => {
    const c = canvas.current;
    const ratio = window.devicePixelRatio || 1;
    c.width = c.offsetWidth * ratio;
    c.height = height * ratio;
    const ctx = c.getContext('2d');
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0f172a';
  }, [height]);

  const point = (e) => {
    const rect = canvas.current.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const start = (e) => {
    e.preventDefault();
    canvas.current.setPointerCapture(e.pointerId);
    drawing.current = true;
    const ctx = canvas.current.getContext('2d');
    const { x, y } = point(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 0.1, y + 0.1); // a dot for a single tap
    ctx.stroke();
  };

  const move = (e) => {
    if (!drawing.current) return;
    const { x, y } = point(e);
    const ctx = canvas.current.getContext('2d');
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const end = () => {
    if (!drawing.current) return;
    drawing.current = false;
    if (empty) {
      setEmpty(false);
      onChange?.(true);
    }
  };

  const clear = () => {
    const c = canvas.current;
    c.getContext('2d').clearRect(0, 0, c.width, c.height);
    setEmpty(true);
    onChange?.(false);
  };

  useImperativeHandle(ref, () => ({
    clear,
    isEmpty: () => empty,
    toDataUrl: () => (empty ? null : canvas.current.toDataURL('image/png')),
    toBlob: () => new Promise((resolve) => canvas.current.toBlob(resolve, 'image/png')),
  }));

  return (
    <div className="sigpad">
      <canvas
        ref={canvas}
        className="sigpad__canvas"
        style={{ height }}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerLeave={end}
        aria-label="Signature box: draw your signature"
        role="img"
      />
      {empty && <span className="sigpad__hint">Sign here</span>}
      <button type="button" className="sigpad__clear" onClick={clear} disabled={empty}>
        <Eraser size={14} /> Clear
      </button>
    </div>
  );
});

export default SignaturePad;
