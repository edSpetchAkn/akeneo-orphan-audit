/**
 * SummaryBanner component.
 *
 * Displays a high-level summary of audit results: total assets,
 * orphan count, in-use count, and products/models scanned.
 */

import React from 'react';
import type { AuditResult } from '../audit/auditTypes';

/** Props for the SummaryBanner component. */
interface SummaryBannerProps {
  /** The completed audit result to summarise. */
  result: AuditResult;
}

const bannerStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '16px',
  padding: '20px 24px',
  backgroundColor: '#f5f5f5',
  borderRadius: '4px',
  border: '1px solid #e0e0e0',
  marginBottom: '24px',
};

const statCardStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  minWidth: '120px',
  padding: '12px 16px',
  backgroundColor: '#ffffff',
  borderRadius: '4px',
  border: '1px solid #e0e0e0',
};

const statValueStyle: React.CSSProperties = {
  fontSize: '28px',
  fontWeight: 700,
  lineHeight: 1.2,
  marginBottom: '4px',
};

const statLabelStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#5a5a5a',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  textAlign: 'center',
};

/**
 * Banner component that renders audit summary statistics.
 *
 * Each statistic is displayed in its own card with a coloured value.
 * Orphan counts are highlighted in red; in-use counts in green.
 *
 * @param props - See `SummaryBannerProps`.
 * @returns     A flex row of statistic cards.
 */
export function SummaryBanner({ result }: SummaryBannerProps): JSX.Element {
  const { summary } = result;

  return (
    <div style={bannerStyle} role="region" aria-label="Audit summary">
      <div style={statCardStyle}>
        <span style={{ ...statValueStyle, color: '#11324D' }}>{summary.total}</span>
        <span style={statLabelStyle}>Total Assets</span>
      </div>

      <div style={statCardStyle}>
        <span style={{ ...statValueStyle, color: '#CB1119' }}>{summary.orphanCount}</span>
        <span style={statLabelStyle}>Orphaned</span>
      </div>

      <div style={statCardStyle}>
        <span style={{ ...statValueStyle, color: '#3AAC5F' }}>{summary.inUseCount}</span>
        <span style={statLabelStyle}>In Use</span>
      </div>

      <div style={{ ...statCardStyle, borderLeft: '2px solid #e0e0e0', marginLeft: '8px' }}>
        <span style={{ ...statValueStyle, color: '#5a5a5a', fontSize: '22px' }}>
          {summary.scannedProducts.toLocaleString()}
        </span>
        <span style={statLabelStyle}>Products Scanned</span>
      </div>

      <div style={statCardStyle}>
        <span style={{ ...statValueStyle, color: '#5a5a5a', fontSize: '22px' }}>
          {summary.scannedProductModels.toLocaleString()}
        </span>
        <span style={statLabelStyle}>Models Scanned</span>
      </div>

      {summary.orphanCount > 0 && (
        <div
          style={{
            alignSelf: 'center',
            padding: '8px 16px',
            backgroundColor: '#FFF3CD',
            border: '1px solid #FFCD39',
            borderRadius: '4px',
            color: '#664D03',
            fontSize: '13px',
            maxWidth: '300px',
          }}
          role="alert"
        >
          <strong>{summary.orphanCount}</strong> asset
          {summary.orphanCount === 1 ? '' : 's'} found with no product references.
        </div>
      )}
    </div>
  );
}
