import { useState } from 'react';
import { formatMoney, formatMoneyShort, monthLabel } from '../utils/format.js';
import './TrendChart.css';

// Money in vs money out, month by month (grouped bars).
// Colours checked for colour-blind readers: blue = in, orange = out.
// Hover a month for exact figures; "Show as table" gives the numbers without colour.
export default function TrendChart({ trend }) {
  const [hover, setHover] = useState(null);
  const [asTable, setAsTable] = useState(false);
  const max = Math.max(1, ...trend.flatMap((t) => [t.incomeKobo, t.expensesKobo]));

  return (
    <div className="trend">
      <div className="trend__top">
        <div className="trend__legend" aria-hidden="true">
          <span><i className="trend__swatch trend__swatch--in" /> Money in</span>
          <span><i className="trend__swatch trend__swatch--out" /> Money out</span>
        </div>
        <button type="button" className="link-btn" onClick={() => setAsTable((v) => !v)}>
          {asTable ? 'Show as chart' : 'Show as table'}
        </button>
      </div>

      {asTable ? (
        <table className="table">
          <thead><tr><th>Month</th><th>Money in</th><th>Money out</th><th>Profit</th></tr></thead>
          <tbody>
            {trend.map((t) => (
              <tr key={t.month}>
                <td>{monthLabel(t.month)}</td>
                <td>{formatMoney(t.incomeKobo)}</td>
                <td>{formatMoney(t.expensesKobo)}</td>
                <td><strong>{formatMoney(t.profitKobo)}</strong></td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="trend__plot" role="img" aria-label="Money in and out for the last six months. Use Show as table for exact figures.">
          <div className="trend__grid" aria-hidden="true">
            <span>{formatMoneyShort(max)}</span>
            <span>{formatMoneyShort(max / 2)}</span>
            <span>₦0</span>
          </div>
          <div className="trend__months">
            {trend.map((t) => (
              <div
                key={t.month}
                className={`trend__month ${hover === t.month ? 'is-hover' : ''}`}
                onMouseEnter={() => setHover(t.month)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(t.month)}
                onBlur={() => setHover(null)}
                tabIndex={0}
              >
                <div className="trend__bars">
                  <i className="trend__bar trend__bar--in" style={{ height: `${(t.incomeKobo / max) * 100}%` }} />
                  <i className="trend__bar trend__bar--out" style={{ height: `${(t.expensesKobo / max) * 100}%` }} />
                </div>
                <span className="trend__label">{monthLabel(t.month, true)}</span>
                {hover === t.month && (
                  <div className="trend__tip" role="tooltip">
                    <strong>{monthLabel(t.month)}</strong>
                    <span><i className="trend__swatch trend__swatch--in" /> In {formatMoney(t.incomeKobo)}</span>
                    <span><i className="trend__swatch trend__swatch--out" /> Out {formatMoney(t.expensesKobo)}</span>
                    <span>Profit <b>{formatMoney(t.profitKobo)}</b></span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
