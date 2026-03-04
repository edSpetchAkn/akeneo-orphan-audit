/**
 * Shared inline style constants used across form components.
 *
 * Using a central styles module prevents style duplication and ensures
 * visual consistency without requiring an external CSS library.
 */

import type React from 'react';

/** Shared style constants for form and layout elements. */
export const styles: Record<string, React.CSSProperties> = {
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    flex: '1 1 280px',
    minWidth: '200px',
  },
  label: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#11324D',
    letterSpacing: '0.01em',
  },
  select: {
    height: '40px',
    padding: '0 12px',
    border: '1px solid #c7c7c7',
    borderRadius: '4px',
    fontSize: '14px',
    color: '#11324D',
    backgroundColor: '#ffffff',
    cursor: 'pointer',
    outline: 'none',
    width: '100%',
  },
  selectDisabled: {
    backgroundColor: '#f5f5f5',
    color: '#888888',
    cursor: 'not-allowed',
  },
  helperText: {
    fontSize: '12px',
    color: '#888888',
    fontStyle: 'italic',
  },
};
