// A labelled form field with an error message underneath.
//   <Field label="Email" name="email" error={errors.email}>
//     <input id="email" className="field__input" ... />
//   </Field>
export default function Field({ label, name, error, optional, hint, children, className = '' }) {
  return (
    <div className={`field ${error ? 'field--error' : ''} ${className}`}>
      {label && (
        <label className="field__label" htmlFor={name}>
          {label} {optional && <span className="field__optional">Optional</span>}
        </label>
      )}
      {children}
      {hint && !error && <span className="field__hint">{hint}</span>}
      {error && (
        <span id={`${name}-error`} className="field__error">
          {error}
        </span>
      )}
    </div>
  );
}
