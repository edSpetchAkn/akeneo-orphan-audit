/**
 * useAuditRunner hook.
 *
 * Manages the full lifecycle of an audit run: idle → running → complete/error.
 * Exposes state for the UI and a `runAudit` action to trigger the audit.
 *
 * The hook calls `runOrphanAudit` from `auditService.ts` and channels progress
 * updates into React state so child components can re-render in real time.
 */

import { useCallback, useState } from 'react';
import { runOrphanAudit } from '../audit/auditService';
import type { AuditProgress, AuditResult } from '../audit/auditTypes';

/** The shape of the state managed by this hook. */
interface AuditRunnerState {
  /** True while the audit is executing. */
  isRunning: boolean;
  /** The most recent progress update, or null when not running. */
  progress: AuditProgress | null;
  /** The completed audit result, or null if no audit has finished yet. */
  result: AuditResult | null;
  /** A human-readable error message if the last run failed, otherwise null. */
  error: string | null;
}

/** Return type of the `useAuditRunner` hook. */
export interface UseAuditRunnerReturn {
  /** Current audit lifecycle state. */
  state: AuditRunnerState;
  /**
   * Starts a new audit run. Clears any previous result or error first.
   * No-op if an audit is already running.
   *
   * @param familyCode  - The code of the asset family to audit.
   * @param attrCode    - The code of the pim_catalog_asset_collection attribute.
   */
  runAudit: (familyCode: string, attrCode: string) => void;
  /** Clears the current result and error, returning to the idle state. */
  reset: () => void;
}

const INITIAL_STATE: AuditRunnerState = {
  isRunning: false,
  progress: null,
  result: null,
  error: null,
};

/**
 * Manages audit execution state and progress.
 *
 * Wraps `runOrphanAudit` in React state management so components receive
 * live progress updates during the audit. Uses `useCallback` to ensure
 * `runAudit` and `reset` have stable identities across renders.
 *
 * @returns `{ state, runAudit, reset }` — see `UseAuditRunnerReturn`.
 */
export function useAuditRunner(): UseAuditRunnerReturn {
  const [state, setState] = useState<AuditRunnerState>(INITIAL_STATE);

  const runAudit = useCallback((familyCode: string, attrCode: string): void => {
    setState({
      isRunning: true,
      progress: null,
      result: null,
      error: null,
    });

    /**
     * Progress callback passed to `runOrphanAudit`.
     * Updates the `progress` slice of state on each step or page fetch.
     *
     * @param progress - The latest progress snapshot from the audit service.
     */
    function onProgress(progress: AuditProgress): void {
      setState((prev) => ({ ...prev, progress }));
    }

    runOrphanAudit(familyCode, attrCode, onProgress)
      .then((result) => {
        setState({
          isRunning: false,
          progress: null,
          result,
          error: null,
        });
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : String(err);
        setState({
          isRunning: false,
          progress: null,
          result: null,
          error: message,
        });
      });
  }, []);

  const reset = useCallback((): void => {
    setState(INITIAL_STATE);
  }, []);

  return { state, runAudit, reset };
}
