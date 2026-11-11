import { useEffect, useRef, useState } from 'react';
import { Building2, User, X } from 'lucide-react';
import { api } from '../../api/client.js';

const isEmail = (text) => /^[^\s@<>,;]+@[^\s@<>,;]+\.[^\s@<>,;]+$/.test(text.trim());

// One "To" / "Cc" / "Bcc" box: chips for each person, suggestions (staff + customers you can see)
// as you type, and any typed address is accepted when you press Enter, comma or leave the box.
// value = [{ email, name }]
export default function RecipientInput({ label, value, onChange, autoFocus = false }) {
  const [text, setText] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [active, setActive] = useState(0);
  const input = useRef(null);

  // Ask the server for matches 250 ms after typing stops (not on every key)
  useEffect(() => {
    const query = text.trim();
    if (query.length < 2) {
      setSuggestions([]);
      return undefined;
    }
    const timer = setTimeout(() => {
      api(`/api/mail/contacts?search=${encodeURIComponent(query)}`)
        .then((list) => {
          setSuggestions(list.filter((s) => !value.some((v) => v.email === s.email)));
          setActive(0);
        })
        .catch(() => setSuggestions([]));
    }, 250);
    return () => clearTimeout(timer);
  }, [text, value]);

  const add = (person) => {
    const email = person.email.trim().toLowerCase();
    if (!value.some((v) => v.email === email)) onChange([...value, { email, name: person.name || null }]);
    setText('');
    setSuggestions([]);
    input.current?.focus();
  };

  // Typed addresses: "a@x.com, b@y.com" pasted at once works too
  const addTyped = () => {
    const parts = text.split(/[,;\s]+/).filter(Boolean);
    const good = parts.filter(isEmail);
    if (!good.length) return false;
    const next = [...value];
    for (const email of good.map((e) => e.toLowerCase())) if (!next.some((v) => v.email === email)) next.push({ email, name: null });
    onChange(next);
    setText(parts.filter((p) => !isEmail(p)).join(' '));
    setSuggestions([]);
    return true;
  };

  const keyDown = (e) => {
    if (suggestions.length && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      e.preventDefault();
      setActive((a) => (a + (e.key === 'ArrowDown' ? 1 : -1) + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter' || e.key === ',' || e.key === ';' || e.key === 'Tab') {
      if (suggestions.length && e.key !== ',' && e.key !== ';') {
        e.preventDefault();
        add(suggestions[active]);
      } else if (text.trim() && addTyped()) {
        e.preventDefault();
      }
    } else if (e.key === 'Backspace' && !text && value.length) {
      onChange(value.slice(0, -1)); // backspace in an empty box removes the last person
    } else if (e.key === 'Escape') {
      setSuggestions([]);
    }
  };

  return (
    <div className="rcpt" onClick={() => input.current?.focus()}>
      <span className="rcpt__label">{label}</span>
      <div className="rcpt__box">
        {value.map((v) => (
          <span key={v.email} className="rcpt__chip" title={v.email}>
            {v.name || v.email}
            <button type="button" aria-label={`Remove ${v.email}`} onClick={(e) => { e.stopPropagation(); onChange(value.filter((x) => x.email !== v.email)); }}>
              <X size={12} />
            </button>
          </span>
        ))}
        <input
          ref={input}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={keyDown}
          onBlur={() => setTimeout(() => { if (text.trim()) addTyped(); setSuggestions([]); }, 150)}
          aria-label={label}
          autoFocus={autoFocus}
          placeholder={value.length ? '' : 'Name or email address'}
        />
      </div>
      {suggestions.length > 0 && (
        <ul className="rcpt__list" role="listbox">
          {suggestions.map((s, i) => (
            <li key={`${s.type}-${s.id}`} role="option" aria-selected={i === active}>
              <button type="button" className={i === active ? 'is-active' : ''} onMouseDown={(e) => e.preventDefault()} onClick={() => add(s)}>
                {s.type === 'customer' ? <Building2 size={15} /> : <User size={15} />}
                <span>
                  <strong>{s.name}</strong>
                  <small>{s.email}{s.type === 'customer' && s.company && s.company !== s.name ? ` · ${s.company}` : ''}{s.type === 'staff' ? ' · staff' : ''}</small>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
