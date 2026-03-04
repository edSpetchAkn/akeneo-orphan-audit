/**
 * Entry point for the Akeneo Orphan Asset Audit extension.
 *
 * This file mounts the React application into the DOM. The Akeneo Extension
 * SDK sandbox environment does not provide a pre-existing root element, so
 * one is created if absent.
 *
 * The global `PIM` object is injected at runtime by the PIM shell — no import
 * or registration call is required. The SDK handles authentication and API
 * proxying transparently.
 *
 * Registration approach:
 * - The Advanced Custom Component pattern mounts a standard React app.
 * - There is no `PIM.registerCustomComponent()` API in the current SDK.
 * - The compiled bundle (dist/akeneo-orphan-audit.js) is loaded and executed
 *   directly by the PIM sandbox, which calls this entry point.
 *
 * @see extension_configuration.json for the position and metadata used by the PIM.
 */

import { StrictMode } from 'react';
import ReactDOM from 'react-dom';
import { OrphanAuditApp } from './OrphanAuditApp';

// Ensure a root element exists in the sandbox DOM.
// Use innerHTML assignment to match the exact pattern used by Akeneo SDK examples,
// which ensures compatibility with the SES sandbox environment.
if (!document.getElementById('root')) {
  document.body.innerHTML = '<div id="root"></div>';
}

ReactDOM.render(
  <StrictMode>
    <OrphanAuditApp />
  </StrictMode>,
  document.getElementById('root'),
);
