/**
 * PIM API pagination utilities.
 *
 * This module is the single location for all pagination logic.
 * Pagination must NOT be inlined in auditService.ts or any other module.
 *
 * Two pagination patterns exist in the Akeneo REST API:
 *
 * 1. **Page-number-based** — Products, Product Models, Attributes.
 *    The caller increments a `page` integer; the response includes
 *    `links.next` when more pages are available.
 *
 * 2. **Cursor-based (search_after)** — Assets.
 *    The `search_after` query parameter is extracted from `links.next.href`
 *    and passed as `paginationCursor` in the next request.
 *
 * `fetchAllPages` handles pattern 1. `fetchAllAssetPages` handles pattern 2.
 */

import { CONFIG } from '../config';

/**
 * Callback invoked after each page is successfully fetched.
 *
 * @param page         - The page number that was just fetched (1-indexed).
 * @param itemCount    - The number of items returned on this page.
 * @param runningTotal - The cumulative total of items fetched so far.
 */
export type OnPageFetchedCallback = (
  page: number,
  itemCount: number,
  runningTotal: number,
) => void;

/**
 * Fetches all pages from a **page-number-based** PIM API endpoint and returns
 * a flat array of all items.
 *
 * This is the primary pagination utility. Use it for: products, product models,
 * and attributes. For assets (cursor-based), use `fetchAllAssetPages`.
 *
 * @param lister       - A function that calls the SDK API with `{ page, limit }` params
 *                       and returns a `PaginatedList<T>`. The function must be a closure
 *                       that already has its non-pagination params bound (e.g. search filters).
 * @param limit        - Number of items to request per page (max 100 for Akeneo APIs).
 * @param resourceName - Human-readable label used in debug log output.
 * @param onPageFetched - Optional callback called after each page is fetched, for progress reporting.
 * @returns            A flat array of all items across all pages.
 */
export async function fetchAllPages<T>(
  lister: (params: { page: number; limit: number }) => Promise<PaginatedList<T>>,
  limit: number,
  resourceName: string,
  onPageFetched?: OnPageFetchedCallback,
): Promise<T[]> {
  const allItems: T[] = [];
  let page = 1;
  let hasNextPage = true;

  while (hasNextPage) {
    let response: PaginatedList<T>;

    try {
      response = await lister({ page, limit });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to fetch ${resourceName} (page ${page}): ${message}`);
    }

    const items = response.items ?? [];
    allItems.push(...items);

    if (CONFIG.DEBUG_MODE) {
      console.debug(
        `[PAGINATE] ${resourceName} page ${page} — ${items.length} items, total: ${allItems.length}`,
      );
    }

    onPageFetched?.(page, items.length, allItems.length);

    // Stop when the API indicates there is no next page, or when this page
    // returned fewer items than the limit (last page guard).
    hasNextPage = Boolean(response.links?.next) && items.length > 0;
    page++;
  }

  return allItems;
}

/**
 * Fetches all assets for a given asset family using the Akeneo asset API's
 * **cursor-based (search_after) pagination**.
 *
 * The Akeneo asset endpoint does not support page-number pagination. Instead,
 * the cursor value is extracted from `links.next.href`'s `search_after` query
 * parameter and passed back as `paginationCursor` on the next call.
 *
 * @param assetFamilyCode - Code of the asset family to paginate through.
 * @param resourceName    - Human-readable label used in debug log output.
 * @param onPageFetched   - Optional callback for progress reporting.
 * @returns               A flat array of all assets in the family.
 */
export async function fetchAllAssetPages(
  assetFamilyCode: string,
  resourceName: string,
  onPageFetched?: OnPageFetchedCallback,
): Promise<Asset[]> {
  const allItems: Asset[] = [];
  let paginationCursor: string | undefined;
  let page = 1;
  let hasNextPage = true;

  while (hasNextPage) {
    const params: AssetListParams = { assetFamilyCode };
    if (paginationCursor !== undefined) {
      params.paginationCursor = paginationCursor;
    }

    let response: PaginatedList<Asset>;

    try {
      response = await globalThis.PIM.api.asset_v1.list(params);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to fetch ${resourceName} (page ${page}): ${message}`);
    }

    const items = response.items ?? [];
    allItems.push(...items);

    if (CONFIG.DEBUG_MODE) {
      console.debug(
        `[PAGINATE] ${resourceName} page ${page} — ${items.length} items, total: ${allItems.length}`,
      );
    }

    onPageFetched?.(page, items.length, allItems.length);

    // Extract the search_after cursor from the next page link.
    const nextHref = response.links?.next?.href;
    if (nextHref && items.length > 0) {
      try {
        const url = new URL(nextHref);
        const cursor = url.searchParams.get('search_after');
        paginationCursor = cursor ?? undefined;
        hasNextPage = paginationCursor !== undefined;
      } catch {
        // If the href cannot be parsed as a URL, assume no more pages.
        hasNextPage = false;
      }
    } else {
      hasNextPage = false;
    }

    page++;
  }

  return allItems;
}
