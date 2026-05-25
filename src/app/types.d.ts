// Types For Services
type ColorSchemeType = 'auto' | 'light' | 'dark';

type AuthType = {
  email: string;
  password: string;
  token: string;
};

type AlertSeverityType = 'success' | 'error';

type NotificationType = {
  id: string;
  label: string;
  message: string;
  send_at: string;
  severity: 'warning' | 'info';
  is_read: boolean;
};

type NotificationsPaneType = 'unread' | 'all';

// Types for Components
type RouteType = {
  routerLink: string;
  title: string;
};

type DynamicRouteType = RouteType | (() => RouteType);

type FeatureDetailsType = {
  title: string;
  body: string;
  circleBgClx: string;
};

type EmailVerificationAndLoginStageType = 'VERIFY_EMAIL' | 'LOGIN_STAGE';

type OverviewWidgetItem = {
  id: number;
  totalSum: number;
  overviewTitle: string;
  myMatIcon: string;
};

type StreetDataFormType = 'view' | 'edit' | 'new-create' | 'existing-create';

// MODAL TYPES
type InputsType = Record<string, unknown> | undefined;
type ModalValueType = {
  template: Type<any>;
  inputs: InputsType;
  modalIcon?: string;
};
type ImageModalValueType = { template: Type<any>; imageUrl: string };

// Confirmation Modal
type ConfirmModalPropsType = {
  matIconName: string;
  title: string;
  message: string;
  severity?: 'error' | 'warning';
  ok: () => void;
};

// New Street Data Form Types
type IdAndNameType = { id: number; name: string };
type NameAndValueType = { name: string; value: number };
type SectionType = IdAndNameType & { location_id: number };
type LocationType = IdAndNameType & { is_active: boolean };
type CreationType = 'create' | 'createAnother' | null;

// Street Data Table
type OptionType = { value: string; label: string };
type StreetDataColType = Pick<
  StreetData,
  | 'id'
  | 'unique_code'
  | 'street_address'
  | 'sector'
  | 'section'
  | 'location'
  | 'is_verified'
  | 'image_path'
  | 'created_at'
  | 'creator'
>;

// Window Augmentation
interface Window {
  ipData: {
    city: string;
    country: string;
    hostname: string;
    ip: string;
    loc: string;
    org: string;
    readme: string;
    region: string;
    timezone: string;
  };
}

// Street Data Search
type SearchedStreetDataType = {
  id: number;
  streetAddress: string;
  developmentName: string;
  uniqueCode: string;
  imagePath: string;
};

type Nullable<T> = T | null;

type PaginatedListingsParams = {
  limit?: number;
  currentPage?: number;
  updatedById?: number;
  sortBy?: string;
  agFilterModel?: any;
};

// Property Data
type PaginationMetaDataResponse = {
  totalPages: number;
  limit: number;
  totalRecords: number;
  currentPage: number;
  nextPage: number;
  prevPage: number;
};
