/**
 * Instance-agnostic configuration constants.
 *
 * All values that might vary between PIM instances are defined here.
 * No attribute codes, family codes, or locale codes should appear anywhere
 * else in the source code — always reference this module instead.
 *
 * Runtime overrides are read from Vite environment variables (`.env` file).
 */
export const CONFIG = {
  /**
   * Default locale code used for label display in the results table.
   * Falls back to the first available locale if the asset has no label
   * for this locale. Override via VITE_DEFAULT_LOCALE in your .env file.
   */
  DEFAULT_LOCALE: (import.meta.env.VITE_DEFAULT_LOCALE as string) || 'en_US',

  /**
   * When true, enables the in-app DebugPanel and verbose console.debug
   * output at each audit step and pagination page fetch.
   * Set VITE_DEBUG_MODE=true in .env to enable.
   */
  DEBUG_MODE: import.meta.env.VITE_DEBUG_MODE === 'true',

  /**
   * The Akeneo attribute type code that identifies an asset collection attribute.
   * This is a PIM platform constant — do not change unless Akeneo renames this type.
   */
  ASSET_COLLECTION_ATTR_TYPE: 'pim_catalog_asset_collection' as const,

  /**
   * Number of products and product models to fetch per API page.
   * The Akeneo REST API maximum is 100.
   */
  PRODUCTS_PAGE_SIZE: 100,

  /**
   * Reserved constant for documentation purposes.
   * The Akeneo asset API uses cursor-based (search_after) pagination,
   * so page size is determined by the API server, not this value.
   */
  ASSETS_PAGE_SIZE: 100,
} as const;
