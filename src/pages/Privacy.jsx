import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import { PRIVACY, SECTIONS } from '../content/privacyPolicy.js';
import './Privacy.css';

// Turn emails and web addresses in the text into links
function Linked({ text }) {
  const parts = String(text).split(/(\S+@\S+\.\w+|https?:\/\/[^\s]+?)(?=[\s.,)]*(?:\s|$))/g);
  return parts.map((part, i) => {
    if (/^\S+@\S+\.\w+$/.test(part)) return <a key={i} href={`mailto:${part}`}>{part}</a>;
    if (/^https?:\/\//.test(part)) return <a key={i} href={part} target="_blank" rel="noreferrer">{part}</a>;
    return part;
  });
}

function Block({ block }) {
  if (typeof block === 'string') return <p><Linked text={block} /></p>;
  if (block.sub) return <h3>{block.sub}</h3>;
  if (block.list) return <ul>{block.list.map((item) => <li key={item}><Linked text={item} /></li>)}</ul>;
  if (block.facts) {
    return (
      <dl className="legal__facts">
        {block.facts.map(([label, value]) => (
          <div key={label + value}>
            {label && <dt>{label}</dt>}
            <dd><Linked text={value} /></dd>
          </div>
        ))}
      </dl>
    );
  }
  return null;
}

// /privacy — the Workard Privacy Policy (text lives in content/privacyPolicy.js)
export default function Privacy() {
  return (
    <>
      <Navbar />
      <main className="legal">
        <div className="container legal__wrap">
          <header className="legal__head">
            <p className="legal__eyebrow">Legal</p>
            <h1>Privacy Policy</h1>
            <p className="legal__dates">Effective {PRIVACY.effective} · Last updated {PRIVACY.lastUpdated}</p>
          </header>

          <div className="legal__layout">
            <nav className="legal__toc" aria-label="Sections">
              <p>On this page</p>
              <ol>
                {SECTIONS.map((s, i) => (
                  <li key={s.heading}><a href={`#s${i + 1}`}>{s.heading.replace(/^\d+\.\s*/, '')}</a></li>
                ))}
              </ol>
            </nav>
            <article className="legal__body">
              {SECTIONS.map((s, i) => (
                <section key={s.heading} id={`s${i + 1}`}>
                  <h2>{s.heading}</h2>
                  {s.blocks.map((b, j) => <Block key={j} block={b} />)}
                </section>
              ))}
            </article>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
