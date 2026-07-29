/**
 * FormGroup — Wrapper for a single form field with label.
 *
 * Props:
 *   label    - string, field label
 *   children - input/select/textarea element
 */
export default function FormGroup({ label, children }) {
  return (
    <div className="form-group">
      <label>{label}</label>
      {children}
    </div>
  )
}
