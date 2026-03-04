/**
 * ProgressIndicator component.
 *
 * Displays the current audit step, step label, items processed, and an
 * animated progress bar. Visible only while an audit is running.
 */

import React from 'react';
import type { AuditProgress } from '../audit/auditTypes';

/** Props for the ProgressIndicator component. */
interface ProgressIndicatorProps {
  /** Current progress state emitted by the audit runner. */
  progress: AuditProgress;
}

const containerStyle: React.CSSProperties = {
  padding: '16px 20px',
  backgroundColor: '#EEF5FB',
  borderRadius: '4px',
  border: '1px solid #4CA8E0',
  marginBottom: '24px',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '8px',
};

const stepLabelStyle: React.CSSProperties = {
  fontWeight: 600,
  color: '#11324D',
  fontSize: '14px',
};

const stepCountStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#4CA8E0',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const progressTrackStyle: React.CSSProperties = {
  height: '6px',
  backgroundColor: '#D0E8F5',
  borderRadius: '3px',
  overflow: 'hidden',
  marginBottom: '8px',
};

const itemsProcessedStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#5a5a5a',
};

/**
 * Animated progress indicator for the audit run.
 *
 * The progress bar fills proportionally to the current step number.
 * The fill animation is handled via a CSS transition on the width property.
 *
 * @param props - See `ProgressIndicatorProps`.
 * @returns     A progress panel with bar and step details.
 */
export function ProgressIndicator({ progress }: ProgressIndicatorProps): JSX.Element {
  const percentage = Math.round((progress.currentStep / progress.totalSteps) * 100);

  return (
    <div style={containerStyle} role="status" aria-live="polite" aria-label="Audit progress">
      <div style={headerStyle}>
        <span style={stepLabelStyle}>{progress.stepLabel}</span>
        <span style={stepCountStyle}>
          Step {progress.currentStep} of {progress.totalSteps}
        </span>
      </div>

      <div style={progressTrackStyle} aria-hidden="true">
        <div
          style={{
            height: '100%',
            width: `${percentage}%`,
            backgroundColor: '#4CA8E0',
            borderRadius: '3px',
            transition: 'width 0.3s ease',
          }}
        />
      </div>

      {progress.itemsProcessed > 0 && (
        <span style={itemsProcessedStyle}>
          {progress.itemsProcessed.toLocaleString()} items processed
        </span>
      )}
    </div>
  );
}
