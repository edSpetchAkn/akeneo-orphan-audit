/**
 * OrphanAuditApp — root React component.
 *
 * Orchestrates the full audit UI:
 *   1. Family and attribute dropdowns (populated from hooks on mount)
 *   2. Run Audit button
 *   3. Progress indicator (while running)
 *   4. Summary banner and results table (after completion)
 *   5. Debug panel (when CONFIG.DEBUG_MODE is true)
 *
 * This component is the top of the React tree. It holds no domain logic —
 * all audit work is delegated to `useAuditRunner`.
 */

import React, { useState } from 'react';
import { CONFIG } from './config';
import { useAssetFamilies } from './hooks/useAssetFamilies';
import { useAssetCollectionAttrs } from './hooks/useAssetCollectionAttrs';
import { useAuditRunner } from './hooks/useAuditRunner';
import { FamilySelector } from './components/FamilySelector';
import { AttributeSelector } from './components/AttributeSelector';
import { ProgressIndicator } from './components/ProgressIndicator';
import { SummaryBanner } from './components/SummaryBanner';
import { AuditResultsTable } from './components/AuditResultsTable';
import { DebugPanel } from './components/DebugPanel';

// ─── Style constants ──────────────────────────────────────────────────────────

const pageStyle: React.CSSProperties = {
  fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
  maxWidth: '1200px',
  margin: '0 auto',
  padding: '32px 24px',
  color: '#11324D',
};

const headerStyle: React.CSSProperties = {
  marginBottom: '28px',
  paddingBottom: '20px',
  borderBottom: '1px solid #e8e8e8',
};

const titleStyle: React.CSSProperties = {
  fontSize: '22px',
  fontWeight: 700,
  color: '#11324D',
  margin: '0 0 8px 0',
};

const subtitleStyle: React.CSSProperties = {
  fontSize: '14px',
  color: '#5a5a5a',
  margin: 0,
  lineHeight: '1.5',
};

const formSectionStyle: React.CSSProperties = {
  display: 'flex',
  gap: '20px',
  flexWrap: 'wrap',
  alignItems: 'flex-end',
  marginBottom: '20px',
  padding: '20px',
  backgroundColor: '#fafafa',
  border: '1px solid #e8e8e8',
  borderRadius: '4px',
};

const buttonBase: React.CSSProperties = {
  height: '40px',
  padding: '0 24px',
  border: 'none',
  borderRadius: '4px',
  fontSize: '14px',
  fontWeight: 600,
  cursor: 'pointer',
  flexShrink: 0,
};

const buttonPrimary: React.CSSProperties = {
  ...buttonBase,
  backgroundColor: '#11324D',
  color: '#ffffff',
};

const buttonDisabled: React.CSSProperties = {
  ...buttonBase,
  backgroundColor: '#c7c7c7',
  color: '#888888',
  cursor: 'not-allowed',
};

const buttonSecondary: React.CSSProperties = {
  ...buttonBase,
  backgroundColor: 'transparent',
  color: '#11324D',
  border: '1px solid #c7c7c7',
};

const loadingBannerStyle: React.CSSProperties = {
  padding: '12px 16px',
  backgroundColor: '#EEF5FB',
  border: '1px solid #4CA8E0',
  borderRadius: '4px',
  color: '#11324D',
  fontSize: '13px',
  marginBottom: '16px',
};

const errorBannerStyle: React.CSSProperties = {
  padding: '12px 16px',
  backgroundColor: '#FDECEA',
  border: '1px solid #FACACA',
  borderRadius: '4px',
  color: '#CB1119',
  fontSize: '13px',
  marginBottom: '20px',
};

const resultsTitleStyle: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: 600,
  color: '#11324D',
  margin: '0 0 16px 0',
};

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Root component for the Orphan Asset Audit extension.
 *
 * Renders the full audit workflow UI within the Activity navigation tab.
 * All API calls are delegated to hooks; all audit logic is in auditService.ts.
 *
 * @returns The complete audit UI tree.
 */
export function OrphanAuditApp(): JSX.Element {
  const { families, isLoading: familiesLoading, error: familiesError } = useAssetFamilies();
  const {
    attributes,
    isLoading: attrsLoading,
    error: attrsError,
  } = useAssetCollectionAttrs();
  const { state, runAudit, reset } = useAuditRunner();

  const [selectedFamilyCode, setSelectedFamilyCode] = useState<string>('');
  const [selectedAttrCode, setSelectedAttrCode] = useState<string>('');

  // ─── Derived state ──────────────────────────────────────────────────────────

  // Only block the form on families loading — attributes load inline in the dropdown.
  const isDataLoading = familiesLoading;
  const dataError = familiesError;

  const canRunAudit =
    !isDataLoading &&
    !attrsLoading &&
    !state.isRunning &&
    selectedFamilyCode !== '' &&
    selectedAttrCode !== '';

  // Reset attribute selection when the family changes.
  function handleFamilyChange(code: string): void {
    setSelectedFamilyCode(code);
    setSelectedAttrCode('');
    reset();
  }

  function handleAttrChange(code: string): void {
    setSelectedAttrCode(code);
    reset();
  }

  function handleRunAudit(): void {
    if (!canRunAudit) return;
    runAudit(selectedFamilyCode, selectedAttrCode);
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={pageStyle}>
      {/* Page header */}
      <header style={headerStyle}>
        <h1 style={titleStyle}>Orphan Asset Audit</h1>
        <p style={subtitleStyle}>
          Identify assets in an asset family that are not referenced by any product or product
          model. Select a family and its linked asset collection attribute, then run the audit.
          {CONFIG.DEBUG_MODE && (
            <span
              style={{
                marginLeft: '8px',
                padding: '1px 8px',
                backgroundColor: '#3A3A3A',
                color: '#f0f0f0',
                borderRadius: '10px',
                fontSize: '11px',
                fontFamily: 'monospace',
              }}
            >
              DEBUG MODE
            </span>
          )}
        </p>
      </header>

      {/* Data loading indicator */}
      {isDataLoading && (
        <div style={loadingBannerStyle} role="status" aria-live="polite">
          Loading asset families and attributes…
        </div>
      )}

      {/* Data load error */}
      {dataError && (
        <div style={errorBannerStyle} role="alert">
          <strong>Error loading data:</strong> {dataError}
        </div>
      )}

      {/* Selection form */}
      {!isDataLoading && !dataError && (
        <section style={formSectionStyle} aria-label="Audit configuration">
          <FamilySelector
            families={families}
            value={selectedFamilyCode}
            onChange={handleFamilyChange}
            disabled={state.isRunning}
          />

          <AttributeSelector
            attributes={attributes}
            selectedFamilyCode={selectedFamilyCode}
            value={selectedAttrCode}
            onChange={handleAttrChange}
            disabled={state.isRunning}
            loading={attrsLoading}
            error={attrsError}
          />

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexShrink: 0 }}>
            <button
              style={canRunAudit ? buttonPrimary : buttonDisabled}
              onClick={handleRunAudit}
              disabled={!canRunAudit}
              aria-label="Run orphan asset audit"
            >
              {state.isRunning ? 'Running…' : 'Run Audit'}
            </button>

            {state.result && !state.isRunning && (
              <button
                style={buttonSecondary}
                onClick={reset}
                aria-label="Clear audit results and start over"
              >
                Clear
              </button>
            )}
          </div>
        </section>
      )}

      {/* Audit error */}
      {state.error && (
        <div style={errorBannerStyle} role="alert">
          <strong>Audit failed:</strong> {state.error}
        </div>
      )}

      {/* Progress indicator — shown while audit is running */}
      {state.isRunning && state.progress && (
        <ProgressIndicator progress={state.progress} />
      )}

      {/* Results — shown when audit has completed successfully */}
      {state.result && !state.isRunning && (
        <section aria-label="Audit results">
          <SummaryBanner result={state.result} />

          <h2 style={resultsTitleStyle}>Asset Classification</h2>

          <AuditResultsTable assets={state.result.assets} />

          {/* Debug panel — visible and collapsible when CONFIG.DEBUG_MODE is true */}
          {CONFIG.DEBUG_MODE && (
            <DebugPanel logs={state.result.debugLogs} />
          )}
        </section>
      )}
    </div>
  );
}
