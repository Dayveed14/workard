import Badge from './Badge.jsx';
import Logo from './Logo.jsx';
import { formatDate, formatDateTime, formatMoney, textOn } from '../utils/format.js';
import './InvoiceDocument.css';

// The invoice as the customer sees it. Used inside the app AND on the public link,
// and it's what prints (Print → Save as PDF).
export default function InvoiceDocument({ invoice }) {
  const { business } = invoice;
  const hasBank = business?.bankName || business?.accountNumber;
  const brand = business?.brandColor;
  const hasSignature = business?.signatureUrl || business?.signatoryName;
  const accepted = invoice.acceptance;

  return (
    <article className={`invoice-doc ${brand ? 'invoice-doc--branded' : ''}`} style={brand ? { '--brand': brand, '--brand-text': textOn(brand) } : undefined}>
      <header className="invoice-doc__top">
        <div className="invoice-doc__brand">
          {business?.logoUrl && <img className="invoice-doc__logo" src={business.logoUrl} alt={`${business.name} logo`} />}
          <h2 className="invoice-doc__business">{business?.name}</h2>
        </div>
        <div className="invoice-doc__heading">
          <span className="invoice-doc__label">Invoice</span>
          <strong className="invoice-doc__number">{invoice.invoice_number}</strong>
          <Badge status={invoice.display_status} />
        </div>
      </header>

      <section className="invoice-doc__parties">
        <div>
          <span className="invoice-doc__label">Billed to</span>
          <strong>{invoice.customer_name}</strong>
          {invoice.customer_contact && <span>Attn: {invoice.customer_contact}</span>}
          {invoice.customer_address && <span>{invoice.customer_address}</span>}
          {invoice.customer_email && <span>{invoice.customer_email}</span>}
          {invoice.customer_phone && <span>{invoice.customer_phone}</span>}
        </div>
        <dl>
          <dt>Issue date</dt>
          <dd>{formatDate(invoice.issue_date)}</dd>
          <dt>Due date</dt>
          <dd>{formatDate(invoice.due_date)}</dd>
          <dt>Amount due</dt>
          <dd className="invoice-doc__due">{formatMoney(invoice.status === 'void' ? 0 : invoice.balance_kobo)}</dd>
        </dl>
      </section>

      <table className="invoice-doc__items">
        <thead>
          <tr>
            <th>Description</th>
            <th>Qty</th>
            <th>Unit price</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((item, i) => (
            <tr key={item.id || i}>
              <td>{item.description}</td>
              <td>{Number(item.quantity)}</td>
              <td>{formatMoney(item.unit_price_kobo)}</td>
              <td>{formatMoney(item.line_total_kobo)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <section className="invoice-doc__bottom">
        <div className="invoice-doc__pay">
          {hasBank && (
            <>
              <span className="invoice-doc__label">Pay to</span>
              <strong>{business.accountName || business.name}</strong>
              <span>{business.bankName}</span>
              <span className="invoice-doc__acct">{business.accountNumber}</span>
            </>
          )}
          {invoice.notes && <p className="invoice-doc__notes">{invoice.notes}</p>}
        </div>

        <dl className="invoice-doc__totals">
          <dt>Subtotal</dt>
          <dd>{formatMoney(invoice.subtotal_kobo)}</dd>
          {Number(invoice.discount_kobo) > 0 && (
            <>
              <dt>Discount</dt>
              <dd>−{formatMoney(invoice.discount_kobo)}</dd>
            </>
          )}
          {Number(invoice.tax_kobo) > 0 && (
            <>
              <dt>Tax ({Number(invoice.tax_rate)}%)</dt>
              <dd>{formatMoney(invoice.tax_kobo)}</dd>
            </>
          )}
          <dt className="invoice-doc__total">Total</dt>
          <dd className="invoice-doc__total">{formatMoney(invoice.total_kobo)}</dd>
          {Number(invoice.amount_paid_kobo) > 0 && (
            <>
              <dt>Paid</dt>
              <dd>−{formatMoney(invoice.amount_paid_kobo)}</dd>
              <dt className="invoice-doc__total">Balance</dt>
              <dd className="invoice-doc__total">{formatMoney(invoice.balance_kobo)}</dd>
            </>
          )}
        </dl>
      </section>

      {(hasSignature || accepted) && (
        <section className="invoice-doc__signs">
          {hasSignature ? (
            <div className="invoice-doc__sign">
              <div className="invoice-doc__sign-img">{business.signatureUrl && <img src={business.signatureUrl} alt="Signature" />}</div>
              <strong>{business.signatoryName || business.name}</strong>
              <span>{business.signatoryTitle || 'Authorised signature'}</span>
            </div>
          ) : <span />}
          {accepted && (
            <div className="invoice-doc__sign invoice-doc__sign--customer">
              <div className="invoice-doc__sign-img"><img src={accepted.signature} alt={`Signed by ${accepted.name}`} /></div>
              <strong>Accepted by {accepted.name}</strong>
              <span>{formatDateTime(accepted.acceptedAt)}</span>
              {accepted.note && <p className="invoice-doc__sign-note">“{accepted.note}”</p>}
            </div>
          )}
        </section>
      )}

      {business?.footerNote && <p className="invoice-doc__footer">{business.footerNote}</p>}
      <p className="invoice-doc__powered">
        Sent with <Logo size={12} />
      </p>
    </article>
  );
}
