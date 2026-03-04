/**
 * useAssetCollectionAttrs hook.
 *
 * Fetches and caches all `pim_catalog_asset_collection` attributes from the PIM
 * on mount. Pagination is handled via the `fetchAllPages` utility.
 *
 * The resulting list is used by `AttributeSelector` to populate the dropdown,
 * filtered to only show attributes linked to the selected asset family.
 */

import { useEffect, useState } from 'react';
import { CONFIG } from '../config';
import { fetchAllPages } from '../audit/pimApiHelpers';

/** Return type of the `useAssetCollectionAttrs` hook. */
export interface UseAssetCollectionAttrsReturn {
  /**
   * All attributes of type `pim_catalog_asset_collection` in the PIM.
   * Empty array while loading or on error.
   */
  attributes: Attribute[];
  /** True while the initial fetch is in progress. */
  isLoading: boolean;
  /** A human-readable error message if the fetch failed, otherwise null. */
  error: string | null;
}

/**
 * Fetches and caches all asset collection attributes from the PIM on mount.
 *
 * All pages of attributes are fetched using `fetchAllPages`. The result is
 * filtered to include only attributes of type `pim_catalog_asset_collection`.
 * Filtering is performed client-side to avoid relying on the attribute list
 * search API's type filter, which may vary between PIM versions.
 *
 * @returns `{ attributes, isLoading, error }`
 */
export function useAssetCollectionAttrs(): UseAssetCollectionAttrsReturn {
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchAttributes(): Promise<void> {
      setIsLoading(true);
      setError(null);

      try {
        const allAttributes = await fetchAllPages<Attribute>(
          ({ page, limit }) => globalThis.PIM.api.attribute_v1.list({ page, limit }),
          CONFIG.PRODUCTS_PAGE_SIZE,
          'attributes',
        );

        if (!cancelled) {
          // Filter to only the asset collection type and sort by code.
          const assetCollectionAttrs = allAttributes
            .filter((attr) => attr.type === CONFIG.ASSET_COLLECTION_ATTR_TYPE)
            .sort((a, b) => a.code.localeCompare(b.code));

          setAttributes(assetCollectionAttrs);
        }
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : String(err);
          setError(`Failed to load attributes: ${message}`);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void fetchAttributes();

    return () => {
      cancelled = true;
    };
  }, []);

  return { attributes, isLoading, error };
}
