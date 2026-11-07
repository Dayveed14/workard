import { useEffect, useRef } from 'react';
import { Bold, Heading2, Heading3, ImagePlus, Italic, Link2, List, ListOrdered, Quote, Underline } from 'lucide-react';
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

// onImage (optional, e.g. the blog): async (file) => url — adds an "insert picture" button
export default function RichTextEditor({ value, onChange, placeholder = 'Start writing…', onImage }) {
  const box = useRef(null);
  const picker = useRef(null);
  const saved = useRef(null); // where the cursor was before the file picker opened

  const pickImage = () => {
    const sel = window.getSelection();
    saved.current = sel.rangeCount && box.current.contains(sel.anchorNode) ? sel.getRangeAt(0) : null;
    picker.current.click();
  };

  const onFile = async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    const url = await onImage(file);
    if (!url) return;
    box.current.focus();
    if (saved.current) {
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(saved.current);
    }
    run('insertImage', url);
  };

  // Set the starting content once (React shouldn't re-render inside a contentEditable)
  useEffect(() => {
    // New lines become <p> (not <div>), so paragraphs survive the server's clean-up
    try {
      document.execCommand('defaultParagraphSeparator', false, 'p');
    } catch {
      /* older browsers: the server turns <div> into <p> anyway */
    }
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
        {onImage && (
          <>
            <button type="button" title="Picture" aria-label="Insert picture" onMouseDown={(e) => { e.preventDefault(); pickImage(); }}><ImagePlus size={16} /></button>
            <input ref={picker} type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden onChange={onFile} />
          </>
        )}
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
