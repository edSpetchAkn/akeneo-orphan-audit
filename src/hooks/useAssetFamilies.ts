/**
 * useAssetFamilies hook.
 *
 * Fetches all asset families from the PIM on mount and filters the list to only
 * those codes specified in the `allowed_asset_families` custom variable.
 *
 * The `allowed_asset_families` custom variable is REQUIRED. If it is not set
 * (or is empty), the hook returns an error and no families are shown. A PIM
 * administrator must configure it before the extension is usable.
 *
 * Custom variable example (set in the PIM extension configuration UI):
 *   { "allowed_asset_families": ["packshots", "user_guides", "tech_specs"] }
 */

import { useEffect, useState } from 'react';

/** Return type of the `useAssetFamilies` hook. */
export interface UseAssetFamiliesReturn {
  /** Permitted asset families. Empty array while loading or on error. */
  families: AssetFamily[];
  /** True while the initial fetch is in progress. */
  isLoading: boolean;
  /** A human-readable error message if the fetch failed or config is missing. */
  error: string | null;
}

/**
 * Reads the `allowed_asset_families` custom variable and returns the set of
 * permitted family codes, or `null` if the variable is absent or empty.
 *
 * Non-string entries in the array are silently ignored.
 *
 * @returns A `Set<string>` of permitted codes, or `null` if not configured.
 */
function getAllowedFamilyCodes(): Set<string> | null {
  const customVars = globalThis.PIM.custom_variables ?? {};
  const raw = customVars['allowed_asset_families'];

  if (!Array.isArray(raw) || raw.length === 0) {
    return null;
  }

  const codes = raw.filter((v): v is string => typeof v === 'string');
  return codes.length > 0 ? new Set(codes) : null;
}

/**
 * Fetches all asset families from the PIM on mount, then returns only those
 * whose code appears in the `allowed_asset_families` custom variable.
 *
 * If the custom variable is not configured, `error` is set and `families`
 * is returned as an empty array — no families are shown until an admin
 * configures the extension.
 *
 * @returns `{ families, isLoading, error }`
 */
export function useAssetFamilies(): UseAssetFamiliesReturn {
  const [families, setFamilies] = useState<AssetFamily[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchFamilies(): Promise<void> {
      setIsLoading(true);
      setError(null);

      const allowedCodes = getAllowedFamilyCodes();

      if (!allowedCodes) {
        if (!cancelled) {
          setError(
            'This extension requires the "allowed_asset_families" custom variable to be configured ' +
              'by a PIM administrator. Set it to an array of asset family codes, e.g. ' +
              '["packshots", "user_guides"].',
          );
          setFamilies([]);
          setIsLoading(false);
        }
        return;
      }

      try {
        const result = await globalThis.PIM.api.asset_family_v1.list();
        if (!cancelled) {
          // Keep only families whose code is in the allowed list, preserving
          // the admin-defined order where possible (alphabetical within that set).
          const filtered = [...result]
            .filter((f) => allowedCodes.has(f.code))
            .sort((a, b) => a.code.localeCompare(b.code));

          setFamilies(filtered);
        }
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : String(err);
          setError(`Failed to load asset families: ${message}`);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void fetchFamilies();

    return () => {
      cancelled = true;
    };
  }, []);

  return { families, isLoading, error };
}
