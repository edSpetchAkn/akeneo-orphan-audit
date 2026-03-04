/**
 * Akeneo Extension SDK — Global Ambient Type Declarations
 *
 * This is a TypeScript "script" declaration file (no top-level import/export).
 * All declarations here are globally ambient — visible across the entire
 * project without any import statement.
 *
 * The global `PIM` variable is injected at runtime by the Akeneo PIM sandbox.
 * No npm import or `PIM.register()` call is needed — it's simply available
 * anywhere as `globalThis.PIM` or the shorter `PIM` alias.
 *
 * Source: adapted from the official SDK examples at
 * extension-sdk/examples/common/global.d.ts
 */

// ─── Shared Structures ───────────────────────────────────────────────────────

interface ApiLink {
  href: string;
}

interface ApiLinks {
  self?: ApiLink;
  first?: ApiLink;
  previous?: ApiLink;
  next?: ApiLink;
}

interface PaginatedList<T> {
  items: T[];
  count?: number;
  currentPage?: number;
  links?: ApiLinks;
}

// ─── Asset Family ─────────────────────────────────────────────────────────────

interface AssetFamily {
  code: string;
  labels: { [localeCode: string]: string };
  productLinkRules?: unknown[];
  transformations?: unknown[];
  namingConvention?: unknown;
  attributeAsMainMedia?: string;
  links?: ApiLinks;
}

interface AssetFamilyGetParams {
  code: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface AssetFamilyUpsertParams { data: any[] }

interface AssetFamilyUpsertResult {
  items: { code: string; status: string; message?: string }[];
}

interface SdkApiAssetFamily {
  get: (params: AssetFamilyGetParams) => Promise<AssetFamily>;
  /** Returns all asset families as a plain array — no pagination. */
  list: () => Promise<AssetFamily[]>;
  upsert: (params: AssetFamilyUpsertParams) => Promise<AssetFamilyUpsertResult>;
}

// ─── Asset ────────────────────────────────────────────────────────────────────

interface Asset {
  code: string;
  assetFamilyCode: string;
  values: { [key: string]: unknown };
  created?: string;
  updated?: string;
  links?: ApiLinks;
}

interface AssetBaseParams { assetFamilyCode: string }
interface AssetGetParams extends AssetBaseParams { code: string }

interface AssetListParams extends AssetBaseParams {
  search?: string;
  channel?: string;
  locales?: string;
  paginationCursor?: string;
  limit?: number;
}

interface AssetData { code: string; values: { [key: string]: unknown } }
interface AssetUpsertParams extends AssetBaseParams { asset: AssetData }
interface AssetOperationStatus {
  code: string;
  status: 'success' | 'error';
  message?: string;
  errors?: Array<{ property: string; message: string }>;
}
interface AssetOperationResponse { results: AssetOperationStatus[] }

interface SdkApiAsset {
  get: (params: AssetGetParams) => Promise<Asset>;
  list: (params: AssetListParams) => Promise<PaginatedList<Asset>>;
  upsert: (params: AssetUpsertParams) => Promise<AssetOperationResponse>;
  delete: (params: AssetGetParams) => Promise<AssetOperationResponse>;
}

// ─── Attribute ────────────────────────────────────────────────────────────────

interface Attribute {
  code: string;
  type: string;
  group?: string | null;
  labels?: { [locale: string]: string };
  localizable?: boolean;
  scopable?: boolean;
  availableLocales?: string[];
  sortOrder?: number;
  groupLabels?: { [locale: string]: string };
  defaultValue?: unknown;
  usableInGrid?: boolean;
  unique?: boolean;
  maxCharacters?: number | null;
  validationRule?: string | null;
  validationRegexp?: string | null;
  wysiwygEnabled?: boolean | null;
  decimalsAllowed?: boolean;
  negativeAllowed?: boolean | null;
  minValue?: number | null;
  maxValue?: number | null;
  metricFamily?: string | null;
  defaultMetricUnit?: string | null;
  maxFileSize?: number | null;
  allowedExtensions?: string[] | null;
  dateMin?: string | null;
  dateMax?: string | null;
  /**
   * For pim_catalog_asset_collection: the linked asset family code.
   * For akeneo_reference_entity: the linked reference entity code.
   */
  referenceDataName?: string | null;
  tableConfiguration?: unknown[];
  isMainIdentifier?: boolean;
  isMandatory?: boolean;
  maxItemsCount?: number | null;
  links?: ApiLinks;
}

interface AttributeList extends PaginatedList<Attribute> {}

interface AttributeListParams {
  search?: unknown;
  page?: number;
  limit?: number;
  withCount?: boolean;
  withTableSelectOptions?: boolean;
}

interface AttributeGetParams { code: string; withTableSelectOptions?: boolean }
interface AttributeCreateParams {
  data: { code: string; type: string; group?: string; [key: string]: unknown };
}
interface AttributePatchParams { code: string; data: { [key: string]: unknown } }

interface SdkApiAttribute {
  get: (params: AttributeGetParams) => Promise<Attribute>;
  list: (params?: AttributeListParams) => Promise<AttributeList>;
  create: (params: AttributeCreateParams) => Promise<void>;
  patch: (params: AttributePatchParams) => Promise<void>;
}

// ─── Product ──────────────────────────────────────────────────────────────────

interface Completeness { locale?: string; scope?: string; data?: number }

interface ProductAssociations {
  [associationType: string]: { groups?: string[]; products?: string[]; product_models?: string[] };
}

interface ProductQuantifiedAssociations {
  [associationType: string]: {
    products?: Array<{ identifier: string; quantity: number }>;
    product_models?: Array<{ code: string; quantity: number }>;
  };
}

interface ProductValues {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [attributeCode: string]: Array<{ locale?: string; scope?: string; data: any; linked_data?: unknown }>;
}

interface Product {
  uuid: string;
  identifier?: string;
  enabled?: boolean;
  family?: string | null;
  categories?: string[];
  groups?: string[];
  parent?: string | null;
  values?: ProductValues;
  associations?: ProductAssociations;
  quantifiedAssociations?: ProductQuantifiedAssociations;
  completenesses?: Completeness[];
  created?: string;
  updated?: string;
  metadata?: { workflow_status?: string };
  links?: ApiLinks;
}

interface ProductList extends PaginatedList<Product> {}

interface ProductListParams {
  search?: unknown;
  page?: number;
  limit?: number;
  withCount?: boolean;
  withCompletenesses?: boolean;
  withAssetShareLinks?: boolean;
}

interface ProductGetParams { uuid: string; withCompletenesses?: boolean; withAssetShareLinks?: boolean }
interface ProductCreateParams {
  data: { identifier?: string; family?: string; values?: ProductValues; [key: string]: unknown };
}
interface ProductPatchParams { uuid: string; data: { [key: string]: unknown } }
interface ProductDeleteParams { uuid: string }

interface SdkApiProductUuid {
  get: (params: ProductGetParams) => Promise<Product>;
  list: (params?: ProductListParams) => Promise<ProductList>;
  create: (params: ProductCreateParams) => Promise<void>;
  patch: (params: ProductPatchParams) => Promise<void>;
  delete: (params: ProductDeleteParams) => Promise<void>;
}

// ─── Product Model ────────────────────────────────────────────────────────────

interface ProductModelValues {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [attributeCode: string]: Array<{ locale?: string; scope?: string; data: any; linked_data?: unknown }>;
}

interface ProductModelAssociations {
  [associationType: string]: { groups?: string[]; products?: string[]; product_models?: string[] };
}

interface ProductModelQuantifiedAssociations {
  [associationType: string]: {
    products?: Array<{ identifier: string; quantity: number }>;
    product_models?: Array<{ code: string; quantity: number }>;
  };
}

interface ProductModel {
  code?: string;
  family?: string | null;
  family_variant?: string;
  parent?: string | null;
  categories?: string[];
  values?: ProductModelValues;
  associations?: ProductModelAssociations;
  quantifiedAssociations?: ProductModelQuantifiedAssociations;
  created?: string;
  updated?: string;
  metadata?: { workflow_status?: string };
  links?: ApiLinks;
}

interface ProductModelList extends PaginatedList<ProductModel> {}

interface ProductModelListParams {
  search?: string;
  attributeCode?: string;
  orderDirection?: string;
  categoryCode?: string;
  channelCode?: string;
  localeCode?: string;
  page?: number;
  limit?: number;
  withCount?: boolean;
  withAssetShareLinks?: boolean;
}

interface ProductModelGetParams { code: string; withAssetShareLinks?: boolean }
interface ProductModelCreateParams {
  data: { code: string; family: string; family_variant: string; [key: string]: unknown };
}
interface ProductModelPatchParams { code: string; data: { [key: string]: unknown } }
interface ProductModelDeleteParams { code: string }

interface SdkApiProductModel {
  get: (params: ProductModelGetParams) => Promise<ProductModel>;
  list: (params?: ProductModelListParams) => Promise<ProductModelList>;
  post: (params: ProductModelCreateParams) => Promise<void>;
  patch: (params: ProductModelPatchParams) => Promise<void>;
  delete: (params: ProductModelDeleteParams) => Promise<void>;
}

// ─── Navigation & Context ─────────────────────────────────────────────────────

type pimNavigate = {
  internal: (path: string) => void;
  external: (rawUrl: string) => void;
  refresh: () => void;
};

type BaseContext = {
  position: string;
  user: { catalog_locale: string; catalog_scope: string };
};

type PIM_CONTEXT = BaseContext &
  (
    | { product?: { uuid: string; identifier: string | null } }
    | { category?: { code: string } }
    | { productGrid?: { productUuids: string[]; productModelCodes: string[] } }
  );

type PIM_USER = {
  username: string;
  uuid: string;
  first_name: string;
  last_name: string;
  groups: Array<{ id: number; name: string }>;
};

type EXTENSION_VARIABLES = Record<string | number, string | number | Array<string | number>>;

type externalGateway = {
  call: (requestParameters?: externalGatewayRequest) => Promise<unknown>;
  longCall: (requestParameters?: externalGatewayRequest) => Promise<unknown>;
};

interface externalGatewayRequest {
  method: string;
  headers?: Record<string, string>;
  body?: string;
  url?: string;
  credentials_code?: string;
}

// ─── PIM SDK Root ─────────────────────────────────────────────────────────────

type PIM_SDK = {
  user: PIM_USER;
  context: PIM_CONTEXT;
  api: {
    external: externalGateway;
    asset_v1: SdkApiAsset;
    asset_family_v1: SdkApiAssetFamily;
    attribute_v1: SdkApiAttribute;
    product_uuid_v1: SdkApiProductUuid;
    product_model_v1: SdkApiProductModel;
    /** Additional API namespaces — see full global.d.ts for complete coverage. */
    [key: string]: unknown;
  };
  navigate: pimNavigate;
  custom_variables: EXTENSION_VARIABLES;
};

// ─── Global Variable ──────────────────────────────────────────────────────────

/**
 * The Akeneo Extension SDK global, injected at runtime by the PIM sandbox.
 * Available in all source files without any import statement.
 */
declare var PIM: PIM_SDK;
