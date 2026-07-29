/**
 * FormRow — Wrapper for a 2-column row of form fields.
 *
 * Props:
 *   children - FormGroup elements
 */
export default function FormRow({ children }) {
  return (
    <div className="form-row">
      {children}
    </div>
  )
}
