/**
 * FamilySelector component.
 *
 * Renders a dropdown populated with all asset families fetched from the PIM.
 * The selected value is controlled externally via `value` and `onChange`.
 */

import { styles } from './styles';

/** Props for the FamilySelector component. */
interface FamilySelectorProps {
  /** The list of asset families to display. May be empty while loading. */
  families: AssetFamily[];
  /** The currently selected asset family code, or empty string if none. */
  value: string;
  /** Called with the new family code when the user changes the selection. */
  onChange: (code: string) => void;
  /** When true, the select element is rendered as disabled. */
  disabled?: boolean;
}

/**
 * Dropdown for selecting an asset family.
 *
 * Displays a placeholder option when no family is selected. The label shown
 * for each family uses the first available label from the `labels` map,
 * falling back to the family code if no labels are present.
 *
 * @param props - See `FamilySelectorProps`.
 * @returns     A labelled select element for asset family selection.
 */
export function FamilySelector({
  families,
  value,
  onChange,
  disabled = false,
}: FamilySelectorProps): JSX.Element {
  /**
   * Returns the display label for a family, using the first available locale.
   *
   * @param family - The asset family object.
   * @returns      A display string.
   */
  function getFamilyLabel(family: AssetFamily): string {
    const labels = Object.values(family.labels ?? {});
    return labels[0] ?? family.code;
  }

  return (
    <div style={styles.fieldGroup}>
      <label htmlFor="family-selector" style={styles.label}>
        Asset Family
      </label>
      <select
        id="family-selector"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        style={disabled ? { ...styles.select, ...styles.selectDisabled } : styles.select}
        aria-label="Select an asset family"
      >
        <option value="">— Select an asset family —</option>
        {families.map((family) => (
          <option key={family.code} value={family.code}>
            {getFamilyLabel(family)} ({family.code})
          </option>
        ))}
      </select>
      {families.length === 0 && !disabled && (
        <span style={styles.helperText}>No asset families found in this PIM instance.</span>
      )}
    </div>
  );
}
