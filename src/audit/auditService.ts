/**
 * Core orphan asset audit logic.
 *
 * This module is pure TypeScript — it has no React dependencies and no
 * UI side-effects. It is the only module that calls `fetchAllPages` and
 * `fetchAllAssetPages`; pagination logic must not be inlined elsewhere.
 *
 * The audit is strictly READ-ONLY. No PATCH, POST, or DELETE calls are
 * made against any PIM resource at any point.
 */

import { CONFIG } from '../config';
import { fetchAllPages, fetchAllAssetPages } from './pimApiHelpers';
import type { OnPageFetchedCallback } from './pimApiHelpers';
import type { AuditAsset, AuditProgress, AuditResult, DebugLogEntry } from './auditTypes';
import { ANY_ATTRIBUTE_CODE, STEP_LABELS } from './auditTypes';

// ─── Internal Helpers ─────────────────────────────────────────────────────────

/**
 * Creates a structured debug log entry with the current timestamp.
 *
 * @param step    - Step identifier string (e.g. "STEP 1").
 * @param message - Human-readable description of the event.
 * @param count   - Optional numeric count to attach to the entry.
 * @returns       A populated `DebugLogEntry`.
 */
function makeLogEntry(step: string, message: string, count?: number): DebugLogEntry {
  return {
    timestamp: new Date().toISOString(),
    step,
    message,
    count,
  };
}

/**
 * Extracts a locale-keyed label map from an `Asset` object.
 *
 * The Akeneo asset REST API returns a top-level `labels` object that is not
 * modeled in the SDK's simplified `Asset` interface. This helper accesses it
 * via a type assertion, then falls back to searching the asset's `values`
 * for an attribute named `label`, and finally returns an empty object if
 * neither source has labels.
 *
 * @param asset - The raw `Asset` returned by the SDK.
 * @returns     A `Record<string, string>` mapping locale codes to label strings.
 */
function extractAssetLabels(asset: Asset): Record<string, string> {
  // The SDK types describe a "simplified" Asset that omits the labels field
  // present in the actual API response. Access it via assertion.
  const assetWithLabels = asset as unknown as { labels?: Record<string, string> };
  if (assetWithLabels.labels && typeof assetWithLabels.labels === 'object') {
    const labels = assetWithLabels.labels;
    // Verify values are strings before returning
    const result: Record<string, string> = {};
    for (const [locale, label] of Object.entries(labels)) {
      if (typeof label === 'string') {
        result[locale] = label;
      }
    }
    if (Object.keys(result).length > 0) {
      return result;
    }
  }

  // Fallback: search for a 'label' attribute key in values
  const labelValues = asset.values['label'] as
    | Array<{ locale?: string | null; data?: unknown }>
    | undefined;
  if (Array.isArray(labelValues)) {
    const result: Record<string, string> = {};
    for (const entry of labelValues) {
      if (entry.locale && typeof entry.data === 'string') {
        result[entry.locale] = entry.data;
      }
    }
    if (Object.keys(result).length > 0) {
      return result;
    }
  }

  return {};
}

/**
 * Extracts all asset codes from a product or product model's values map
 * for the specified attribute codes, and adds them to `targetSet`.
 *
 * @param values          - The `values` map from a product or product model.
 * @param attrCodes       - The attribute codes to scan (all must be pim_catalog_asset_collection).
 * @param targetSet       - The Set to add found asset codes to (mutated in-place).
 */
function collectAssetCodesFromValues(
  values: ProductValues | ProductModelValues,
  attrCodes: string[],
  targetSet: Set<string>,
): void {
  for (const attrCode of attrCodes) {
    const valueEntries = values[attrCode] ?? [];
    for (const entry of valueEntries) {
      // data is typed as `any` in SDK types — asset collection data is string[]
      const assetCodes = entry.data as unknown;
      if (Array.isArray(assetCodes)) {
        for (const code of assetCodes) {
          if (typeof code === 'string') {
            targetSet.add(code);
          }
        }
      }
    }
  }
}

// ─── Main Audit Function ──────────────────────────────────────────────────────

/**
 * Runs the five-step orphan asset audit for the given asset family and
 * asset collection attribute.
 *
 * The audit is read-only — it makes no write calls to the PIM API.
 *
 * @param assetFamilyCode              - The code of the asset family to audit.
 * @param assetCollectionAttributeCode - The code of the pim_catalog_asset_collection
 *                                       attribute that links products to this family.
 * @param onProgress                   - Callback invoked after each step or pagination
 *                                       page to report progress to the UI.
 * @returns                            A complete `AuditResult` including classified
 *                                     assets, summary counts, and debug logs.
 * @throws                             An `Error` if the selected attribute is not
 *                                     linked to the selected asset family.
 */
export async function runOrphanAudit(
  assetFamilyCode: string,
  assetCollectionAttributeCode: string,
  onProgress: (progress: AuditProgress) => void,
): Promise<AuditResult> {
  const debugLogs: DebugLogEntry[] = [];
  const usedAssetCodes = new Set<string>();
  let scannedProducts = 0;
  let scannedProductModels = 0;

  // ─── STEP 1: Validate attribute linkage ────────────────────────────────────

  onProgress({
    currentStep: 1,
    totalSteps: 5,
    stepLabel: STEP_LABELS[1],
    itemsProcessed: 0,
  });

  const allAttributes = await fetchAllPages<Attribute>(
    ({ page, limit }) => globalThis.PIM.api.attribute_v1.list({ page, limit }),
    CONFIG.PRODUCTS_PAGE_SIZE,
    'attributes',
  );

  // Filter to attributes that are asset collections linked to our target family.
  const linkedAttributes = allAttributes.filter(
    (attr) =>
      attr.type === CONFIG.ASSET_COLLECTION_ATTR_TYPE &&
      attr.referenceDataName === assetFamilyCode,
  );
  const linkedAttributeCodes = linkedAttributes.map((attr) => attr.code);

  const isAnyMode = assetCollectionAttributeCode === ANY_ATTRIBUTE_CODE;

  const step1Entry = makeLogEntry(
    'STEP 1',
    isAnyMode
      ? `Any-mode: scanning all ${linkedAttributeCodes.length} linked attribute(s) for family "${assetFamilyCode}"`
      : `${linkedAttributeCodes.length} asset collection attribute(s) confirmed for family "${assetFamilyCode}"`,
    linkedAttributeCodes.length,
  );
  debugLogs.push(step1Entry);

  if (CONFIG.DEBUG_MODE) {
    console.debug(`[STEP 1] ${step1Entry.message}`);
  }

  if (!isAnyMode && !linkedAttributeCodes.includes(assetCollectionAttributeCode)) {
    throw new Error(
      `Attribute "${assetCollectionAttributeCode}" is not linked to asset family "${assetFamilyCode}". ` +
        `Attributes confirmed as linked to this family: [${linkedAttributeCodes.join(', ') || 'none'}]. ` +
        `Verify that the attribute type is pim_catalog_asset_collection and that its ` +
        `referenceDataName equals "${assetFamilyCode}".`,
    );
  }

  // ─── STEP 2: Build used-asset set from Products ────────────────────────────

  onProgress({
    currentStep: 2,
    totalSteps: 5,
    stepLabel: STEP_LABELS[2],
    itemsProcessed: 0,
  });

  const onProductPage: OnPageFetchedCallback = (_page, _count, runningTotal) => {
    onProgress({
      currentStep: 2,
      totalSteps: 5,
      stepLabel: STEP_LABELS[2],
      itemsProcessed: runningTotal,
    });
  };

  const allProducts = await fetchAllPages<Product>(
    ({ page, limit }) => globalThis.PIM.api.product_uuid_v1.list({ page, limit }),
    CONFIG.PRODUCTS_PAGE_SIZE,
    'products',
    onProductPage,
  );

  scannedProducts = allProducts.length;

  for (const product of allProducts) {
    if (!product.values) continue;
    collectAssetCodesFromValues(product.values, linkedAttributeCodes, usedAssetCodes);
  }

  const step2Entry = makeLogEntry(
    'STEP 2',
    `Scanned ${scannedProducts} products — ${usedAssetCodes.size} unique asset codes in use`,
    usedAssetCodes.size,
  );
  debugLogs.push(step2Entry);

  if (CONFIG.DEBUG_MODE) {
    console.debug(`[STEP 2] ${step2Entry.message}`);
  }

  // ─── STEP 3: Build used-asset set from Product Models ─────────────────────

  onProgress({
    currentStep: 3,
    totalSteps: 5,
    stepLabel: STEP_LABELS[3],
    itemsProcessed: 0,
  });

  const onModelPage: OnPageFetchedCallback = (_page, _count, runningTotal) => {
    onProgress({
      currentStep: 3,
      totalSteps: 5,
      stepLabel: STEP_LABELS[3],
      itemsProcessed: runningTotal,
    });
  };

  const allProductModels = await fetchAllPages<ProductModel>(
    ({ page, limit }) => globalThis.PIM.api.product_model_v1.list({ page, limit }),
    CONFIG.PRODUCTS_PAGE_SIZE,
    'product-models',
    onModelPage,
  );

  scannedProductModels = allProductModels.length;

  for (const model of allProductModels) {
    if (!model.values) continue;
    collectAssetCodesFromValues(model.values, linkedAttributeCodes, usedAssetCodes);
  }

  const step3Entry = makeLogEntry(
    'STEP 3',
    `Scanned ${scannedProductModels} product models — ${usedAssetCodes.size} unique asset codes in use`,
    usedAssetCodes.size,
  );
  debugLogs.push(step3Entry);

  if (CONFIG.DEBUG_MODE) {
    console.debug(`[STEP 3] ${step3Entry.message}`);
  }

  // ─── STEP 4: Fetch master asset list ──────────────────────────────────────

  onProgress({
    currentStep: 4,
    totalSteps: 5,
    stepLabel: STEP_LABELS[4],
    itemsProcessed: 0,
  });

  const onAssetPage: OnPageFetchedCallback = (_page, _count, runningTotal) => {
    onProgress({
      currentStep: 4,
      totalSteps: 5,
      stepLabel: STEP_LABELS[4],
      itemsProcessed: runningTotal,
    });
  };

  const rawAssets = await fetchAllAssetPages(
    assetFamilyCode,
    `assets/${assetFamilyCode}`,
    onAssetPage,
  );

  const allAssets = rawAssets.map((asset) => ({
    code: asset.code,
    labels: extractAssetLabels(asset),
  }));

  const step4Entry = makeLogEntry(
    'STEP 4',
    `Total assets in family "${assetFamilyCode}": ${allAssets.length}`,
    allAssets.length,
  );
  debugLogs.push(step4Entry);

  if (CONFIG.DEBUG_MODE) {
    console.debug(`[STEP 4] ${step4Entry.message}`);
  }

  // ─── STEP 5: Classify ─────────────────────────────────────────────────────

  onProgress({
    currentStep: 5,
    totalSteps: 5,
    stepLabel: STEP_LABELS[5],
    itemsProcessed: 0,
  });

  const classifiedAssets: AuditAsset[] = allAssets.map((asset) => ({
    code: asset.code,
    labels: asset.labels,
    status: usedAssetCodes.has(asset.code) ? 'IN_USE' : 'ORPHAN',
  }));

  const orphanCount = classifiedAssets.filter((a) => a.status === 'ORPHAN').length;
  const inUseCount = classifiedAssets.filter((a) => a.status === 'IN_USE').length;
  const total = classifiedAssets.length;

  const step5Entry = makeLogEntry(
    'STEP 5',
    `ORPHANS: ${orphanCount} | IN USE: ${inUseCount} | TOTAL: ${total}`,
  );
  debugLogs.push(step5Entry);

  if (CONFIG.DEBUG_MODE) {
    console.debug(`[STEP 5] ${step5Entry.message}`);
  }

  onProgress({
    currentStep: 5,
    totalSteps: 5,
    stepLabel: 'Audit complete',
    itemsProcessed: total,
  });

  return {
    summary: {
      total,
      orphanCount,
      inUseCount,
      scannedProducts,
      scannedProductModels,
    },
    assets: classifiedAssets,
    debugLogs,
  };
}
