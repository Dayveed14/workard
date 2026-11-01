import Badge from './Badge.jsx';
import Logo from './Logo.jsx';
import { formatDate, formatMoney } from '../utils/format.js';
import './InvoiceDocument.css';

// The invoice as the customer sees it. Used inside the app AND on the public link,
// and it's what prints (Print → Save as PDF).
export default function InvoiceDocument({ invoice }) {
  const { business } = invoice;
  const hasBank = business?.bankName || business?.accountNumber;

  return (
    <article className="invoice-doc">
      <header className="invoice-doc__top">
        <div>
          <h2 className="invoice-doc__business">{business?.name}</h2>
          <span className="invoice-doc__label">Invoice</span>
          <strong className="invoice-doc__number">{invoice.invoice_number}</strong>
        </div>
        <div className="invoice-doc__status">
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

      {business?.footerNote && <p className="invoice-doc__footer">{business.footerNote}</p>}
      <p className="invoice-doc__powered">
        Sent with <Logo size={12} />
      </p>
    </article>
  );
}
