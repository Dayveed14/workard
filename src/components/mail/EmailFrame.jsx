import { useMemo, useState } from 'react';
import { ImageOff } from 'lucide-react';

// Shows a RECEIVED email safely. The HTML is already cleaned by the server; on top of that it is
// put in a sandboxed frame: no scripts, can't reach Workard or your cookies, and pictures from
// the internet stay off until you ask (they're often used to track when you opened an email).
// (A fully sandboxed frame can't tell us its height, so it has a fixed height and scrolls.)
export default function EmailFrame({ html, text }) {
  const [showImages, setShowImages] = useState(false);
  const hasRemoteImages = /<img[^>]+src=["']?https?:/i.test(html || '');

  const doc = useMemo(() => {
    const csp = `default-src 'none'; style-src 'unsafe-inline'; img-src ${showImages ? 'https: http: data:' : 'data:'}; font-src data:;`;
    const body = html || `<pre style="white-space:pre-wrap;font:inherit">${String(text || '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c])}</pre>`;
    return `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${csp}"><base target="_blank">
<style>body{margin:0;font:15px/1.5 -apple-system,Segoe UI,Roboto,sans-serif;color:#1f2937;word-wrap:break-word}img{max-width:100%;height:auto}table{max-width:100%}blockquote{margin:8px 0;padding-left:10px;border-left:3px solid #d1d5db;color:#6b7280}</style>
</head><body>${body}</body></html>`;
  }, [html, text, showImages]);

  return (
    <div className="email-frame">
      {hasRemoteImages && !showImages && (
        <button type="button" className="link-btn email-frame__images" onClick={() => setShowImages(true)}>
          <ImageOff size={14} /> Pictures are hidden — show them
        </button>
      )}
      <iframe
        title="Email"
        sandbox="allow-popups allow-popups-to-escape-sandbox"
        srcDoc={doc}
      />
    </div>
  );
}
