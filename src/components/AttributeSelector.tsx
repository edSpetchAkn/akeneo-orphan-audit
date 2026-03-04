/**
 * AttributeSelector component.
 *
 * Renders a dropdown of asset collection attributes that are linked to
 * the currently selected asset family. The list is filtered client-side
 * from the full set of pim_catalog_asset_collection attributes.
 */

import { ANY_ATTRIBUTE_CODE } from '../audit/auditTypes';
import { styles } from './styles';

/** Props for the AttributeSelector component. */
interface AttributeSelectorProps {
  /** All pim_catalog_asset_collection attributes fetched from the PIM. */
  attributes: Attribute[];
  /** The currently selected asset family code — used to filter the attribute list. */
  selectedFamilyCode: string;
  /** The currently selected attribute code, or empty string if none. */
  value: string;
  /** Called with the new attribute code when the user changes the selection. */
  onChange: (code: string) => void;
  /** When true, the select element is rendered as disabled. */
  disabled?: boolean;
  /** When true, the dropdown shows a loading placeholder while attributes are fetched. */
  loading?: boolean;
  /** Error message to display below the dropdown if attribute loading failed. */
  error?: string | null;
}

/**
 * Dropdown for selecting the asset collection attribute to audit.
 *
 * Only attributes whose `referenceDataName` matches `selectedFamilyCode`
 * are displayed. If no family is selected, the dropdown is disabled and
 * shows a prompt to select a family first.
 *
 * @param props - See `AttributeSelectorProps`.
 * @returns     A labelled select element for attribute selection.
 */
export function AttributeSelector({
  attributes,
  selectedFamilyCode,
  value,
  onChange,
  disabled = false,
  loading = false,
  error = null,
}: AttributeSelectorProps): JSX.Element {
  // Filter to attributes linked to the currently selected family.
  const filteredAttributes = attributes.filter(
    (attr) => attr.referenceDataName === selectedFamilyCode,
  );

  const isDisabled = disabled || !selectedFamilyCode || loading;

  /**
   * Returns the display label for an attribute.
   *
   * @param attr - The attribute object.
   * @returns    A display string.
   */
  function getAttributeLabel(attr: Attribute): string {
    const labels = Object.values(attr.labels ?? {});
    return labels[0] ?? attr.code;
  }

  return (
    <div style={styles.fieldGroup}>
      <label htmlFor="attribute-selector" style={styles.label}>
        Asset Collection Attribute
      </label>
      <select
        id="attribute-selector"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={isDisabled}
        style={isDisabled ? { ...styles.select, ...styles.selectDisabled } : styles.select}
        aria-label="Select an asset collection attribute"
      >
        {!selectedFamilyCode ? (
          <option value="">— Select a family first —</option>
        ) : loading ? (
          <option value="">Loading attributes…</option>
        ) : filteredAttributes.length === 0 ? (
          <option value="">— No linked attributes found —</option>
        ) : (
          <>
            <option value="">— Select an attribute —</option>
            <option value={ANY_ATTRIBUTE_CODE}>Any (all linked attributes)</option>
            {filteredAttributes.map((attr) => (
              <option key={attr.code} value={attr.code}>
                {getAttributeLabel(attr)} ({attr.code})
              </option>
            ))}
          </>
        )}
      </select>
      {selectedFamilyCode && !loading && filteredAttributes.length === 0 && !error && (
        <span style={styles.helperText}>
          No pim_catalog_asset_collection attributes are linked to this family.
        </span>
      )}
      {error && (
        <span style={{ ...styles.helperText, color: '#CB1119' }}>{error}</span>
      )}
    </div>
  );
}
