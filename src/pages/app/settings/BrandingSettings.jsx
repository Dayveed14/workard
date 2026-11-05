import { useEffect, useRef, useState } from 'react';
import { ImagePlus, PenLine, Trash2, Upload } from 'lucide-react';
import Field from '../../../components/Field.jsx';
import SignaturePad from '../../../components/SignaturePad.jsx';
import InvoiceDocument from '../../../components/InvoiceDocument.jsx';
import { api } from '../../../api/client.js';
import { useApi } from '../../../hooks/useApi.js';
import { useAuth } from '../../../context/AuthContext.jsx';
import { useToast } from '../../../context/ToastContext.jsx';
import { todayString } from '../../../utils/format.js';
import './BrandingSettings.css';

// A few safe starting colours; any colour can be picked with the colour box
const SWATCHES = ['#0f172a', '#1d4ed8', '#047857', '#7c3aed', '#be123c', '#c2410c'];

// A made-up invoice for the preview
const sample = (business) => ({
  invoice_number: 'INV-0042',
  display_status: 'sent',
  issue_date: todayString(),
  due_date: todayString(),
  customer_name: 'Zenith Foods Ltd',
  customer_address: '12 Adetokunbo Ademola Cres, Wuse 2, Abuja',
  items: [
    { description: 'Cold-room rental (November)', quantity: 2, unit_price_kobo: 15000000, line_total_kobo: 30000000 },
    { description: 'Delivery', quantity: 1, unit_price_kobo: 1250000, line_total_kobo: 1250000 },
  ],
  subtotal_kobo: 31250000, discount_kobo: 0, tax_rate: 0, tax_kobo: 0, total_kobo: 31250000,
  amount_paid_kobo: 0, balance_kobo: 31250000,
  business,
});

// Logo, brand colour and signature on every invoice
export default function BrandingSettings() {
  const toast = useToast();
  const { organization } = useAuth();
  const { data: brand, setData } = useApi('/api/invoices/branding');
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const pad = useRef(null);

  useEffect(() => {
    if (brand && !form) {
      setForm({ brandColor: brand.brandColor || '', signatoryName: brand.signatoryName || '', signatoryTitle: brand.signatoryTitle || '' });
    }
  }, [brand, form]);

  if (!brand || !form) return <div className="page-loader"><span className="page-loader__spinner" /></div>;

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      setData(await api('/api/invoices/branding', { method: 'PUT', body: form }));
      toast.success('Invoice look saved');
    } catch (err) {
      toast.error(err.errors?.brandColor || err.message);
    } finally {
      setBusy(false);
    }
  };

  const upload = async (kind, file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file, `${kind}.png`);
    setBusy(true);
    try {
      setData(await api(`/api/invoices/branding/${kind}`, { method: 'POST', formData }));
      toast.success(kind === 'logo' ? 'Logo added' : 'Signature saved');
      setDrawing(false);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (kind) => {
    try {
      setData(await api(`/api/invoices/branding/${kind}`, { method: 'DELETE' }));
    } catch (err) {
      toast.error(err.message);
    }
  };

  const preview = {
    name: organization?.name,
    ...brand,
    brandColor: form.brandColor || null,
    signatoryName: form.signatoryName,
    signatoryTitle: form.signatoryTitle,
  };

  return (
    <div className="branding">
      <form className="card card__body form form--flush" onSubmit={save}>
        <h2 className="settings__title">Invoice look</h2>
        <p className="muted settings__hint">Your logo, colour and signature appear on every invoice — in the app, on the customer’s link and when printed.</p>

        {/* Logo */}
        <div className="field">
          <span className="field__label">Logo</span>
          <div className="branding__logo">
            <div className="branding__logo-box">
              {brand.logoUrl ? <img src={brand.logoUrl} alt="Your logo" /> : <ImagePlus size={22} />}
            </div>
            <label className="btn btn--outline btn--sm">
              <Upload size={15} /> {brand.logoUrl ? 'Change' : 'Upload logo'}
              <input type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(e) => upload('logo', e.target.files[0])} />
            </label>
            {brand.logoUrl && (
              <button type="button" className="icon-btn" onClick={() => remove('logo')} aria-label="Remove logo"><Trash2 size={16} /></button>
            )}
          </div>
          <span className="field__hint">PNG with a clear background looks best. Up to 5 MB.</span>
        </div>

        {/* Colour */}
        <div className="field">
          <span className="field__label">Brand colour</span>
          <div className="branding__colours">
            <button type="button" className={`branding__swatch branding__swatch--none ${!form.brandColor ? 'is-on' : ''}`} onClick={() => setForm((f) => ({ ...f, brandColor: '' }))} aria-label="No colour (plain)">
              Aa
            </button>
            {SWATCHES.map((c) => (
              <button
                key={c}
                type="button"
                className={`branding__swatch ${form.brandColor.toLowerCase() === c ? 'is-on' : ''}`}
                style={{ background: c }}
                onClick={() => setForm((f) => ({ ...f, brandColor: c }))}
                aria-label={`Use ${c}`}
              />
            ))}
            <label className="branding__picker" title="Pick any colour">
              <input type="color" value={form.brandColor || '#1d4ed8'} onChange={(e) => setForm((f) => ({ ...f, brandColor: e.target.value }))} />
              <span>{form.brandColor || 'Plain'}</span>
            </label>
          </div>
        </div>

        {/* Signature */}
        <div className="field">
          <span className="field__label">Signature</span>
          {drawing ? (
            <div className="branding__draw">
              <SignaturePad ref={pad} onChange={setHasDrawn} height={140} />
              <div className="row-actions">
                <button type="button" className="btn btn--ghost btn--sm" onClick={() => setDrawing(false)}>Cancel</button>
                <button type="button" className="btn btn--primary btn--sm" disabled={!hasDrawn || busy} onClick={async () => upload('signature', await pad.current.toBlob())}>
                  Use this signature
                </button>
              </div>
            </div>
          ) : (
            <div className="branding__logo">
              <div className="branding__sig-box">
                {brand.signatureUrl ? <img src={brand.signatureUrl} alt="Your signature" /> : <span className="muted">No signature yet</span>}
              </div>
              <button type="button" className="btn btn--outline btn--sm" onClick={() => { setHasDrawn(false); setDrawing(true); }}>
                <PenLine size={15} /> Draw
              </button>
              <label className="btn btn--outline btn--sm">
                <Upload size={15} /> Upload
                <input type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(e) => upload('signature', e.target.files[0])} />
              </label>
              {brand.signatureUrl && (
                <button type="button" className="icon-btn" onClick={() => remove('signature')} aria-label="Remove signature"><Trash2 size={16} /></button>
              )}
            </div>
          )}
        </div>

        <div className="form__row">
          <Field label="Signed by" name="signatoryName" optional>
            <input id="signatoryName" name="signatoryName" className="field__input" placeholder="e.g. Ada Okafor" value={form.signatoryName} onChange={onChange} />
          </Field>
          <Field label="Title" name="signatoryTitle" optional>
            <input id="signatoryTitle" name="signatoryTitle" className="field__input" placeholder="e.g. Managing Director" value={form.signatoryTitle} onChange={onChange} />
          </Field>
        </div>

        <div>
          <button type="submit" className="btn btn--primary" disabled={busy}>Save</button>
        </div>
      </form>

      <section className="branding__preview" aria-label="Preview">
        <span className="branding__preview-label">Preview</span>
        <div className="branding__preview-doc">
          <InvoiceDocument invoice={sample(preview)} />
        </div>
      </section>
    </div>
  );
}
