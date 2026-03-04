/**
 * AuditResultsTable component.
 *
 * Displays the classified asset list in a sortable, filterable table.
 *
 * Columns: Asset Code | Label | Status
 *
 * Features:
 * - Sortable by any column (click header to toggle ASC/DESC)
 * - Filter toggle: All | Orphans Only | In Use Only
 * - Coloured status badge per row
 * - Row count in the table footer
 */

import React, { useMemo, useState } from 'react';
import { CONFIG } from '../config';
import type { AuditAsset } from '../audit/auditTypes';

/** Props for the AuditResultsTable component. */
interface AuditResultsTableProps {
  /** The classified asset list from the completed audit. */
  assets: AuditAsset[];
}

/** The columns that can be sorted. */
type SortColumn = 'code' | 'label' | 'status';

/** Sort direction. */
type SortDirection = 'asc' | 'desc';

/** Active filter mode. */
type FilterMode = 'all' | 'orphan' | 'in_use';

// ─── Style constants ──────────────────────────────────────────────────────────

const tableContainerStyle: React.CSSProperties = {
  overflowX: 'auto',
  border: '1px solid #e0e0e0',
  borderRadius: '4px',
};

const controlsRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  marginBottom: '12px',
  flexWrap: 'wrap',
};

const filterButtonBase: React.CSSProperties = {
  padding: '6px 14px',
  border: '1px solid #c7c7c7',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '13px',
  backgroundColor: '#ffffff',
  color: '#3A3A3A',
  transition: 'background-color 0.1s ease',
};

const filterButtonActive: React.CSSProperties = {
  ...filterButtonBase,
  backgroundColor: '#11324D',
  color: '#ffffff',
  borderColor: '#11324D',
};

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: '13px',
};

const thStyle: React.CSSProperties = {
  padding: '10px 16px',
  textAlign: 'left',
  backgroundColor: '#f5f5f5',
  borderBottom: '2px solid #e0e0e0',
  fontWeight: 600,
  color: '#11324D',
  fontSize: '12px',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  cursor: 'pointer',
  userSelect: 'none',
  whiteSpace: 'nowrap',
};

const tdStyle: React.CSSProperties = {
  padding: '10px 16px',
  borderBottom: '1px solid #f0f0f0',
  color: '#3A3A3A',
  verticalAlign: 'middle',
};

const footerStyle: React.CSSProperties = {
  padding: '10px 16px',
  backgroundColor: '#fafafa',
  borderTop: '1px solid #e0e0e0',
  fontSize: '12px',
  color: '#888888',
  textAlign: 'right',
};

const badgeBase: React.CSSProperties = {
  display: 'inline-block',
  padding: '2px 10px',
  borderRadius: '12px',
  fontSize: '11px',
  fontWeight: 700,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
};

const badgeOrphan: React.CSSProperties = {
  ...badgeBase,
  backgroundColor: '#FDECEA',
  color: '#CB1119',
  border: '1px solid #FACACA',
};

const badgeInUse: React.CSSProperties = {
  ...badgeBase,
  backgroundColor: '#EBF7EF',
  color: '#3AAC5F',
  border: '1px solid #C3E8CF',
};

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Sortable, filterable table of audited assets.
 *
 * @param props - See `AuditResultsTableProps`.
 * @returns     A table with filter controls, sortable headers, and a row count footer.
 */
export function AuditResultsTable({ assets }: AuditResultsTableProps): JSX.Element {
  const [sortColumn, setSortColumn] = useState<SortColumn>('status');
  // 'desc' on the status column puts ORPHAN before IN_USE alphabetically.
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');

  /**
   * Handles a column header click: toggles direction if same column,
   * otherwise switches to the new column with ascending direction.
   *
   * @param column - The column that was clicked.
   */
  function handleSort(column: SortColumn): void {
    if (column === sortColumn) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  }

  /**
   * Returns the best available label for an asset, using `CONFIG.DEFAULT_LOCALE`
   * first, then falling back to the first available locale's label, then to
   * an empty string.
   *
   * @param asset - The asset to extract a label from.
   * @returns     The display label string.
   */
  function getLabel(asset: AuditAsset): string {
    const labels = asset.labels ?? {};
    if (labels[CONFIG.DEFAULT_LOCALE]) {
      return labels[CONFIG.DEFAULT_LOCALE];
    }
    const values = Object.values(labels);
    return values[0] ?? '';
  }

  /** Memoised filtered and sorted asset list to avoid recomputing on every render. */
  const processedAssets = useMemo(() => {
    // 1. Filter
    const filtered = assets.filter((asset) => {
      if (filterMode === 'orphan') return asset.status === 'ORPHAN';
      if (filterMode === 'in_use') return asset.status === 'IN_USE';
      return true;
    });

    // 2. Sort
    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0;
      if (sortColumn === 'code') {
        comparison = a.code.localeCompare(b.code);
      } else if (sortColumn === 'label') {
        comparison = getLabel(a).localeCompare(getLabel(b));
      } else if (sortColumn === 'status') {
        comparison = a.status.localeCompare(b.status);
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [assets, sortColumn, sortDirection, filterMode]);

  /**
   * Returns the sort direction indicator character for a column header.
   *
   * @param column - The column to render the indicator for.
   * @returns      '↑', '↓', or '⇅' depending on sort state.
   */
  function sortIndicator(column: SortColumn): string {
    if (column !== sortColumn) return ' ⇅';
    return sortDirection === 'asc' ? ' ↑' : ' ↓';
  }

  const orphanCount = assets.filter((a) => a.status === 'ORPHAN').length;
  const inUseCount = assets.filter((a) => a.status === 'IN_USE').length;

  return (
    <div>
      {/* Filter controls */}
      <div style={controlsRowStyle} role="group" aria-label="Filter results">
        <span style={{ fontSize: '13px', color: '#5a5a5a', marginRight: '4px' }}>Show:</span>

        <button
          style={filterMode === 'all' ? filterButtonActive : filterButtonBase}
          onClick={() => setFilterMode('all')}
          aria-pressed={filterMode === 'all'}
        >
          All ({assets.length})
        </button>

        <button
          style={filterMode === 'orphan' ? filterButtonActive : filterButtonBase}
          onClick={() => setFilterMode('orphan')}
          aria-pressed={filterMode === 'orphan'}
        >
          Orphans Only ({orphanCount})
        </button>

        <button
          style={filterMode === 'in_use' ? filterButtonActive : filterButtonBase}
          onClick={() => setFilterMode('in_use')}
          aria-pressed={filterMode === 'in_use'}
        >
          In Use Only ({inUseCount})
        </button>
      </div>

      {/* Table */}
      <div style={tableContainerStyle}>
        <table style={tableStyle} aria-label="Audit results">
          <thead>
            <tr>
              <th
                style={thStyle}
                onClick={() => handleSort('code')}
                aria-sort={sortColumn === 'code' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
              >
                Asset Code{sortIndicator('code')}
              </th>
              <th
                style={thStyle}
                onClick={() => handleSort('label')}
                aria-sort={sortColumn === 'label' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
              >
                Label ({CONFIG.DEFAULT_LOCALE}){sortIndicator('label')}
              </th>
              <th
                style={thStyle}
                onClick={() => handleSort('status')}
                aria-sort={sortColumn === 'status' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
              >
                Status{sortIndicator('status')}
              </th>
            </tr>
          </thead>
          <tbody>
            {processedAssets.length === 0 ? (
              <tr>
                <td colSpan={3} style={{ ...tdStyle, textAlign: 'center', color: '#888888', padding: '32px' }}>
                  No assets match the current filter.
                </td>
              </tr>
            ) : (
              processedAssets.map((asset) => (
                <tr
                  key={asset.code}
                  style={{
                    backgroundColor: asset.status === 'ORPHAN'
                      ? 'rgba(203, 17, 25, 0.02)'
                      : 'transparent',
                  }}
                >
                  <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: '12px' }}>
                    {asset.code}
                  </td>
                  <td style={tdStyle}>
                    {getLabel(asset) || (
                      <span style={{ color: '#aaaaaa', fontStyle: 'italic' }}>No label</span>
                    )}
                  </td>
                  <td style={tdStyle}>
                    <span style={asset.status === 'ORPHAN' ? badgeOrphan : badgeInUse}>
                      {asset.status === 'ORPHAN' ? 'Orphan' : 'In Use'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Footer */}
        <div style={footerStyle}>
          Showing {processedAssets.length.toLocaleString()} of {assets.length.toLocaleString()} assets
        </div>
      </div>
    </div>
  );
}
