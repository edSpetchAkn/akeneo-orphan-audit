/**
 * DebugPanel component.
 *
 * Renders a collapsible panel showing the structured debug log from the
 * most recent audit run. Only rendered when CONFIG.DEBUG_MODE is true.
 *
 * Each log entry displays: timestamp | step | message | optional count.
 */

import React, { useState } from 'react';
import type { DebugLogEntry } from '../audit/auditTypes';

/** Props for the DebugPanel component. */
interface DebugPanelProps {
  /** The debug log entries to display. */
  logs: DebugLogEntry[];
}

const panelStyle: React.CSSProperties = {
  marginTop: '24px',
  border: '1px solid #d5d5d5',
  borderRadius: '4px',
  overflow: 'hidden',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '10px 16px',
  backgroundColor: '#3A3A3A',
  cursor: 'pointer',
  userSelect: 'none',
};

const headerTextStyle: React.CSSProperties = {
  color: '#f0f0f0',
  fontFamily: 'monospace',
  fontSize: '13px',
  fontWeight: 600,
};

const chevronStyle = (open: boolean): React.CSSProperties => ({
  color: '#aaaaaa',
  fontSize: '11px',
  transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
  transition: 'transform 0.15s ease',
});

const logContainerStyle: React.CSSProperties = {
  maxHeight: '300px',
  overflowY: 'auto',
  backgroundColor: '#1E1E1E',
  padding: '12px 0',
};

const logRowStyle = (index: number): React.CSSProperties => ({
  display: 'grid',
  gridTemplateColumns: '160px 80px 1fr 60px',
  gap: '8px',
  padding: '3px 16px',
  backgroundColor: index % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.03)',
  fontFamily: 'monospace',
  fontSize: '12px',
  lineHeight: '1.5',
});

const cellStyles = {
  timestamp: { color: '#888888' } as React.CSSProperties,
  step: { color: '#569CD6', fontWeight: 600 } as React.CSSProperties,
  message: { color: '#D4D4D4', wordBreak: 'break-all' } as React.CSSProperties,
  count: { color: '#4EC9B0', textAlign: 'right' } as React.CSSProperties,
};

const emptyStyle: React.CSSProperties = {
  padding: '16px',
  color: '#888888',
  fontFamily: 'monospace',
  fontSize: '12px',
  backgroundColor: '#1E1E1E',
  textAlign: 'center',
};

/**
 * Collapsible debug log viewer. Only rendered when `CONFIG.DEBUG_MODE === true`.
 *
 * The panel is collapsed by default. Clicking the header toggles it open.
 * Log entries are rendered in a scrollable monospace list.
 *
 * @param props - See `DebugPanelProps`.
 * @returns     A collapsible debug panel, or null if there are no logs.
 */
export function DebugPanel({ logs }: DebugPanelProps): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={panelStyle}>
      <div
        style={headerStyle}
        onClick={() => setIsOpen((prev) => !prev)}
        role="button"
        tabIndex={0}
        aria-expanded={isOpen}
        aria-controls="debug-panel-body"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen((prev) => !prev);
          }
        }}
      >
        <span style={headerTextStyle}>
          🐛 Debug Log ({logs.length} {logs.length === 1 ? 'entry' : 'entries'})
        </span>
        <span style={chevronStyle(isOpen)}>▶</span>
      </div>

      {isOpen && (
        <div id="debug-panel-body" style={logContainerStyle} role="log" aria-label="Debug log">
          {logs.length === 0 ? (
            <div style={emptyStyle}>No log entries yet. Run an audit to populate this panel.</div>
          ) : (
            <>
              {/* Header row */}
              <div
                style={{
                  ...logRowStyle(-1),
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  fontWeight: 600,
                }}
              >
                <span style={{ color: '#888888' }}>TIMESTAMP</span>
                <span style={{ color: '#888888' }}>STEP</span>
                <span style={{ color: '#888888' }}>MESSAGE</span>
                <span style={{ color: '#888888', textAlign: 'right' }}>COUNT</span>
              </div>

              {logs.map((entry, index) => (
                <div key={`${entry.timestamp}-${index}`} style={logRowStyle(index)}>
                  <span style={cellStyles.timestamp}>
                    {entry.timestamp.replace('T', ' ').replace('Z', '')}
                  </span>
                  <span style={cellStyles.step}>{entry.step}</span>
                  <span style={cellStyles.message}>{entry.message}</span>
                  <span style={cellStyles.count}>
                    {entry.count !== undefined ? entry.count.toLocaleString() : '—'}
                  </span>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
