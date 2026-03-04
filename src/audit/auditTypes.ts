/**
 * TypeScript interfaces for all audit data shapes.
 *
 * This module is the single source of truth for the data structures that
 * flow through the audit pipeline. Import from here — do not redeclare
 * these shapes elsewhere.
 */

/** A single asset, classified as either orphaned or in use. */
export interface AuditAsset {
  /** Akeneo asset code (unique within the asset family). */
  code: string;
  /** Display labels keyed by locale code. May be empty if the asset has no labels. */
  labels: Record<string, string>;
  /** Classification result after the audit. */
  status: 'ORPHAN' | 'IN_USE';
}

/** Top-level result returned by `runOrphanAudit`. */
export interface AuditResult {
  summary: {
    /** Total number of assets in the audited family. */
    total: number;
    /** Number of assets with no product or product model reference. */
    orphanCount: number;
    /** Number of assets referenced by at least one product or product model. */
    inUseCount: number;
    /** Total number of products scanned (all products, not filtered by family). */
    scannedProducts: number;
    /** Total number of product models scanned. */
    scannedProductModels: number;
  };
  /** Classified asset list, one entry per asset in the family. */
  assets: AuditAsset[];
  /** Structured debug log entries, returned regardless of DEBUG_MODE. */
  debugLogs: DebugLogEntry[];
}

/** A single entry in the audit's structured debug log. */
export interface DebugLogEntry {
  /** ISO 8601 timestamp of when this log entry was created. */
  timestamp: string;
  /** The audit step that produced this log (e.g. "STEP 1", "STEP 5"). */
  step: string;
  /** Human-readable description of what happened at this step. */
  message: string;
  /** Optional numeric count associated with the log entry. */
  count?: number;
}

/**
 * Progress state emitted by `runOrphanAudit` after each major step or
 * page fetch. Consumed by `useAuditRunner` to drive the ProgressIndicator UI.
 */
export interface AuditProgress {
  /** The step currently executing (1–5). */
  currentStep: number;
  /** Always 5 — the total number of audit steps. */
  totalSteps: 5;
  /** Human-readable label for the current step. */
  stepLabel: string;
  /** Number of items processed so far within the current step. */
  itemsProcessed: number;
}

/**
 * Sentinel value for "scan all linked attributes" mode.
 *
 * When passed as `assetCollectionAttributeCode` to `runOrphanAudit`, the
 * per-attribute validation check in Step 1 is skipped and every asset
 * collection attribute linked to the selected family is scanned.
 */
export const ANY_ATTRIBUTE_CODE = '__any__' as const;

/**
 * Human-readable labels for each audit step.
 * Keyed by step number (1–5).
 */
export const STEP_LABELS: Readonly<Record<number, string>> = {
  1: 'Validating attribute linkage...',
  2: 'Scanning products...',
  3: 'Scanning product models...',
  4: 'Fetching asset catalogue...',
  5: 'Classifying assets...',
} as const;
