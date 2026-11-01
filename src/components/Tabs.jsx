import './Tabs.css';

// tabs = [{ id: 'overview', label: 'Overview', count: 3 }]
export default function Tabs({ tabs, active, onChange }) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={active === t.id}
          className={`tabs__tab ${active === t.id ? 'is-active' : ''}`}
          onClick={() => onChange(t.id)}
        >
          {t.label}
          {t.count ? <span className="tabs__count">{t.count}</span> : null}
        </button>
      ))}
    </div>
  );
}
