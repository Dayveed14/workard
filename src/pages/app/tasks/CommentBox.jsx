import { useRef, useState } from 'react';
import { AtSign, Send } from 'lucide-react';
import Avatar from '../../../components/Avatar.jsx';

// The comment box on a task, with @mentions.
// Type "@" (or press the @ button) and pick a person: only the people you tag get a
// notification; everyone on the task still sees the comment.
// `people` = [{ userId, name }] — the task's assignees (with a log-in) and whoever set it.
export default function CommentBox({ people, busy, onPost }) {
  const [text, setText] = useState('');
  const [tagged, setTagged] = useState([]); // [{ userId, name }]
  const [query, setQuery] = useState(null); // the text typed after "@", or null when the list is closed
  const [active, setActive] = useState(0);
  const box = useRef(null);

  const matches = query === null ? [] : people.filter((p) => p.name.toLowerCase().includes(query.toLowerCase())).slice(0, 6);

  // Is the caret right after "@something"? Then show the list.
  const lookForMention = (value, caret) => {
    const found = /(^|\s)@([^\s@]{0,30})$/.exec(value.slice(0, caret));
    setQuery(found ? found[2] : null);
    setActive(0);
  };

  const change = (e) => {
    setText(e.target.value);
    lookForMention(e.target.value, e.target.selectionStart);
  };

  const pick = (person) => {
    const el = box.current;
    const caret = el.selectionStart;
    const before = text.slice(0, caret).replace(/@([^\s@]{0,30})$/, `@${person.name} `);
    const next = before + text.slice(caret);
    setText(next);
    setTagged((t) => (t.some((p) => p.userId === person.userId) ? t : [...t, person]));
    setQuery(null);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(before.length, before.length);
    });
  };

  // The @ button: adds "@" where the caret is and opens the list
  const startTag = () => {
    const el = box.current;
    const caret = el.selectionStart ?? text.length;
    const needsSpace = caret > 0 && !/\s$/.test(text.slice(0, caret));
    const before = `${text.slice(0, caret)}${needsSpace ? ' ' : ''}@`;
    setText(before + text.slice(caret));
    setQuery('');
    setActive(0);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(before.length, before.length);
    });
  };

  const keyDown = (e) => {
    if (!matches.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => (a + 1) % matches.length); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => (a - 1 + matches.length) % matches.length); }
    else if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); pick(matches[active]); }
    else if (e.key === 'Escape') setQuery(null);
  };

  const submit = async (e) => {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    // Only people whose "@Name" is still in the text (they may have been deleted while typing)
    const mentionUserIds = tagged.filter((p) => body.includes(`@${p.name}`)).map((p) => p.userId);
    if (await onPost({ body, mentionUserIds })) {
      setText('');
      setTagged([]);
      setQuery(null);
    }
  };

  const stillTagged = tagged.filter((p) => text.includes(`@${p.name}`));

  return (
    <form className="task-detail__add task-detail__add--comment comment-box" onSubmit={submit}>
      <div className="comment-box__field">
        <textarea
          ref={box}
          className="field__input"
          rows={2}
          placeholder={people.length ? 'Write a comment — type @ to tag someone' : 'Write a comment'}
          value={text}
          onChange={change}
          onKeyDown={keyDown}
          onClick={(e) => lookForMention(text, e.target.selectionStart)}
          onBlur={() => setTimeout(() => setQuery(null), 150)}
          aria-label="Comment"
        />
        {matches.length > 0 && (
          <ul className="comment-box__list" role="listbox" aria-label="People to tag">
            {matches.map((p, i) => (
              <li key={p.userId} role="option" aria-selected={i === active}>
                <button type="button" className={i === active ? 'is-active' : ''} onMouseDown={(ev) => ev.preventDefault()} onClick={() => pick(p)}>
                  <Avatar name={p.name} size={24} /> {p.name}
                </button>
              </li>
            ))}
          </ul>
        )}
        {stillTagged.length > 0 && (
          <small className="comment-box__who">Only {stillTagged.map((p) => p.name.split(' ')[0]).join(', ')} will be notified</small>
        )}
      </div>
      {people.length > 0 && (
        <button type="button" className="icon-btn comment-box__at" onClick={startTag} aria-label="Tag someone" title="Tag someone"><AtSign size={18} /></button>
      )}
      <button type="submit" className="btn btn--primary btn--sm" disabled={!text.trim() || busy}><Send size={16} /> Post</button>
    </form>
  );
}

// A comment's text with the tagged names highlighted
export function CommentText({ comment, people }) {
  const names = new Set();
  for (const m of comment.mentions || []) {
    names.add(m.name);
    const match = people.find((p) => p.userId === m.user_id);
    if (match) names.add(match.name);
  }
  const list = [...names].filter(Boolean).sort((a, b) => b.length - a.length);
  if (!list.length) return comment.body;
  const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = comment.body.split(new RegExp(`(@(?:${list.map(escape).join('|')}))`, 'g'));
  return parts.map((part, i) => (i % 2 ? <mark key={i} className="comment-box__tag">{part}</mark> : part));
}
