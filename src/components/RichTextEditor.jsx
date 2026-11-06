import { useEffect, useRef } from 'react';
import { Bold, Heading2, Heading3, Italic, Link2, List, ListOrdered, Quote, Underline } from 'lucide-react';
import './RichTextEditor.css';

// A simple document editor: headings, bold / italic / underline, lists, quotes, links.
// The server cleans the HTML again before saving (utils/cleanHtml.js), so only these survive.
const TOOLS = [
  { cmd: 'formatBlock', arg: 'H2', icon: Heading2, label: 'Heading' },
  { cmd: 'formatBlock', arg: 'H3', icon: Heading3, label: 'Sub-heading' },
  { cmd: 'bold', icon: Bold, label: 'Bold' },
  { cmd: 'italic', icon: Italic, label: 'Italic' },
  { cmd: 'underline', icon: Underline, label: 'Underline' },
  { cmd: 'insertUnorderedList', icon: List, label: 'Bullet list' },
  { cmd: 'insertOrderedList', icon: ListOrdered, label: 'Numbered list' },
  { cmd: 'formatBlock', arg: 'BLOCKQUOTE', icon: Quote, label: 'Quote' },
];

export default function RichTextEditor({ value, onChange, placeholder = 'Start writing…' }) {
  const box = useRef(null);

  // Set the starting content once (React shouldn't re-render inside a contentEditable)
  useEffect(() => {
    if (box.current && box.current.innerHTML !== value) box.current.innerHTML = value || '';
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const run = (cmd, arg) => {
    box.current.focus();
    document.execCommand(cmd, false, arg);
    onChange(box.current.innerHTML);
  };

  const addLink = () => {
    const url = window.prompt('Link address (https://…)');
    if (url && /^(https?:|mailto:|tel:)/i.test(url)) run('createLink', url);
  };

  return (
    <div className="rte">
      <div className="rte__toolbar" role="toolbar" aria-label="Formatting">
        {TOOLS.map((t) => (
          <button key={t.label} type="button" title={t.label} aria-label={t.label} onMouseDown={(e) => { e.preventDefault(); run(t.cmd, t.arg); }}>
            <t.icon size={16} />
          </button>
        ))}
        <button type="button" title="Link" aria-label="Link" onMouseDown={(e) => { e.preventDefault(); addLink(); }}><Link2 size={16} /></button>
        <button type="button" className="rte__plain" title="Normal text" onMouseDown={(e) => { e.preventDefault(); run('formatBlock', 'P'); }}>Normal</button>
      </div>
      <div
        ref={box}
        className="rte__area doc-body"
        contentEditable
        role="textbox"
        aria-multiline="true"
        data-placeholder={placeholder}
        onInput={() => onChange(box.current.innerHTML)}
        suppressContentEditableWarning
      />
    </div>
  );
}
