# Akeneo Orphan Asset Audit — Advanced Custom Component

## Purpose

This tool enables **data stewards** and **PIM administrators** to identify _orphan assets_: assets that exist in an Akeneo asset family but are not referenced by any product or product model via a `pim_catalog_asset_collection` attribute.

Orphan assets consume storage, clutter the asset library, and can indicate broken catalogue workflows. Running a regular audit lets teams clean up unused assets with confidence.

This component surfaces in the **Activity** area of the PIM, making it accessible to catalogue managers without requiring any product-editing context.

---

## Architecture

```
Browser (PIM Shell)
    └── Custom Component Sandbox (iFrame)
            └── OrphanAuditApp (React 17)
                    └── globalThis.PIM (Akeneo Extension SDK)
                            └── PIM REST API (authenticated via session)
```

The extension runs entirely inside the PIM's secure sandbox. All API calls go through the Akeneo Extension SDK (`globalThis.PIM.api.*`), which transparently handles authentication using the logged-in user's session. There is no backend, no external server, and no credentials to rotate.

---

## Why No Backend?

The **Advanced Custom Component** feature of Akeneo Serenity handles hosting and authentication natively:

- The compiled JavaScript bundle is uploaded directly to the PIM via the Extensions UI.
- The sandbox runtime injects the global `PIM` object, providing authenticated access to the PIM REST API.
- OAuth tokens, CSRF protection, and rate-limiting are handled by the SDK layer — the extension author writes zero authentication code.

This means the tool is fully deployable to any Akeneo Serenity instance in minutes, with no infrastructure changes.

---

## Configuration Reference

### `src/config.ts` constants

| Constant | Default | Description |
|---|---|---|
| `DEFAULT_LOCALE` | `en_US` | Locale used for label display in the results table. Falls back to the first available locale if the selected locale has no label. |
| `DEBUG_MODE` | `false` | When `true`, enables the in-app DebugPanel and verbose `console.debug` output at each audit step. Set via `VITE_DEBUG_MODE=true`. |
| `ASSET_COLLECTION_ATTR_TYPE` | `pim_catalog_asset_collection` | The Akeneo attribute type code for asset collection attributes. Do not change unless Akeneo changes this type string. |
| `PRODUCTS_PAGE_SIZE` | `100` | Number of products/product models/attributes fetched per API page. Maximum allowed by the Akeneo API is `100`. |
| `ASSETS_PAGE_SIZE` | `100` | Reserved for future use — the asset API uses cursor pagination, so page size is not directly configurable. |

### `.env` variables

| Variable | Example | Description |
|---|---|---|
| `VITE_DEFAULT_LOCALE` | `fr_FR` | Override the default label locale. Must match a locale code active in the PIM instance. |
| `VITE_DEBUG_MODE` | `true` | Enable debug mode. Set to `true` only during development or troubleshooting — it disables console stripping in the production build. |

---

## Build & Deploy

### Prerequisites

- Node.js 18+ with npm
- Access to the target Akeneo Serenity instance with the Extensions feature enabled

### Steps

```bash
# 1. Clone / copy this project
cd akeneo-orphan-audit

# 2. Copy environment file and configure
cp .env.example .env
# Edit .env as needed (VITE_DEFAULT_LOCALE, VITE_DEBUG_MODE)

# 3. Install dependencies
npm install

# 4. Build the production bundle
npm run build
# Output: dist/akeneo-orphan-audit.js
```

### Upload to the PIM

1. In your Akeneo PIM, navigate to **Connect → Extensions**.
2. Click **Add an extension**.
3. Upload the `extension_configuration.json` file from the project root.
4. Then upload the compiled bundle at `dist/akeneo-orphan-audit.js`.
5. Save and activate the extension.
6. Navigate to **Activity** in the PIM — you should see the **Orphan Asset Audit** tab.

Alternatively, use the Akeneo Extensions deployment API to automate this step. See the [API deployment docs](https://api.akeneo.com/advanced-extensions/api-deployment.html).

---

## Extension Registration

When uploading via the PIM Extensions UI, use the values from `extension_configuration.json`:

| Field | Value |
|---|---|
| `position` | `pim.activity.navigation.tab` |
| `name` | `akeneo-orphan-audit` |
| `type` | `sdk_script` |
| `file` | `dist/akeneo-orphan-audit.js` |
| `default_label` | `Orphan Asset Audit` |

Labels can be provided for multiple locales in the `configuration.labels` object of `extension_configuration.json`.

---

## Re-deployment Checklist

When deploying to a **new PIM instance**, review and update these values:

| Item | File | What to Check |
|---|---|---|
| Default locale | `.env` → `VITE_DEFAULT_LOCALE` | Must match a locale active in the target PIM (e.g. `fr_FR`, `de_DE`) |
| Extension name | `extension_configuration.json` → `name` | Must be unique in the target instance |
| Extension label | `extension_configuration.json` → `configuration.labels` | Update display labels as needed |
| Debug mode | `.env` → `VITE_DEBUG_MODE` | Set to `false` for production deployments |
| Bundle filename | `extension_configuration.json` → `file` | Must match the output filename from `vite.config.ts` |

No source code changes are required between deployments — all instance-specific values are in `.env` and `extension_configuration.json`.

---

## Audit Logic Walkthrough

The audit runs five sequential steps:

**Step 1 — Validate Attribute Linkage**
The tool fetches every attribute in the PIM and checks that the attribute code you selected is of type `pim_catalog_asset_collection` and is configured to reference the asset family you selected. If the attribute does not link to the chosen family, the audit stops with a clear error message.

**Step 2 — Scan Products**
Every product in the catalogue is fetched, page by page. For each product, the tool reads the value of the selected asset collection attribute and records which asset codes are referenced. A live counter shows how many products have been scanned.

**Step 3 — Scan Product Models**
The same scan is repeated for product models (the configurable product variants). Asset codes found here are added to the same in-use set.

**Step 4 — Fetch the Full Asset List**
Every asset in the chosen asset family is fetched. The tool builds a complete catalogue of what assets exist.

**Step 5 — Classify**
Each asset from Step 4 is classified:
- **IN USE** — the asset code was found in at least one product or product model value (Steps 2 or 3).
- **ORPHAN** — the asset code was not found in any product or product model value.

The results are displayed in a sortable, filterable table.

---

## Known Limitations

- **Performance on large catalogues**: Auditing 100,000+ products may take several minutes. The progress indicator shows real-time step and item counts. Consider running audits during off-peak hours.
- **Single family per run**: The audit runs against one asset family at a time. To audit multiple families, run the tool once per family.
- **Read-only**: The tool never modifies, deletes, or reclassifies any PIM data. It is a diagnostic tool only.
- **Asset label extraction**: Akeneo stores asset labels inside the `values` object (not as a top-level field). The tool attempts to extract labels from the `labels` field (present in the API response) and falls back to inspecting `values`. If no label is found, the asset code is displayed.
- **Permissions**: The audit can only scan products and assets that the logged-in user has read access to. If the user's ACL restricts visibility of certain products, those products will not be scanned and the audit results may be incomplete.

---

## Debug Mode

To enable debug mode:

```bash
# In .env
VITE_DEBUG_MODE=true

# Then rebuild
npm run build
```

When debug mode is active:

- A **Debug Panel** appears at the bottom of the page (collapsed by default). Click to expand it and see a timestamped log of every audit step, including item counts at each stage.
- Verbose `console.debug` output is written to the browser developer console at each pagination page fetch and each audit step completion.
- Look for log lines prefixed with `[PAGINATE]` (pagination progress) and `[STEP N]` (step summaries).

**Important**: In production builds with `VITE_DEBUG_MODE=false`, all `console.log/debug/info/warn` calls are stripped by the Terser minifier. Debug mode has no performance or security impact in production.
