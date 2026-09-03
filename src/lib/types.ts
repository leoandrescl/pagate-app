export type ProductType = "digital" | "session";

export type Product = {
  id: string;
  creatorId: string;
  type: ProductType;
  name: string;
  description: string;
  priceClp: number;
  durationMinutes?: number;
  fileName?: string;
  filePath?: string;
  createdAt: string;
};

export type Availability = {
  timezone: string;
  weekdays: number[]; // 1=lun … 5=vie
  startHour: number;
  endHour: number;
  slotMinutes: number;
};

export type GoogleCalendarConnection = {
  connected: boolean;
  email?: string;
  connectedAt?: string;
};

export type Creator = {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  headline: string;
  avatarInitials: string;
  availability: Availability;
  googleCalendar?: GoogleCalendarConnection;
};

export type OnboardingStepId =
  | "handle"
  | "product-type"
  | "pagos"
  | "download-expiry"
  | "profile"
  | "socials"
  | "done";

export type PaymentSettings = {
  mercadoPago: "later" | "connected" | "skipped";
  transferEnabled: boolean;
  transferHolder?: string;
  transferRut?: string;
  transferEmail?: string;
  transferBank?: string;
  transferAccount?: string;
};

export type PaymentMethod = "mercadopago" | "transfer";

export type StoreSocialLinks = {
  instagram?: string;
  tiktok?: string;
  whatsapp?: string;
};

export type DownloadPolicy = {
  expiryDays: number | null;
  maxCount: number;
};

export type PurchaseStatus = "pending" | "paid" | "rejected";

export type Purchase = {
  id: string;
  token: string;
  productId: string;
  buyerName: string;
  buyerEmail: string;
  amountClp: number;
  status: PurchaseStatus;
  downloadsRemaining: number;
  expiresAt: string;
  createdAt: string;
  /** ISO start of booked session (solo type=session) */
  slotStart?: string;
  slotEnd?: string;
  meetUrl?: string;
  googleEventId?: string;
  mpPreferenceId?: string;
  mpPaymentId?: string;
  paymentMethod?: PaymentMethod;
};

export type DemoStore = {
  creator: Creator;
  products: Product[];
  purchases: Purchase[];
};

export type StoreBundle = DemoStore & {
  ownerId: string | null;
  onboardingCompletedAt: string | null;
  onboardingStep: OnboardingStepId;
  intendedProductTypes: ProductType[];
  downloadExpiryDays: number | null;
  downloadMaxCount: number;
  paymentSettings: PaymentSettings;
  socialLinks: StoreSocialLinks;
  avatarUrl: string | null;
};

export type GoogleTokenStore = {
  access_token: string;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
  expiry_date?: number | null;
  email?: string;
};

export type MercadoPagoTokenStore = {
  access_token: string;
  refresh_token?: string;
  public_key?: string;
  mp_user_id?: string;
  live_mode?: boolean;
  expires_at?: string | null;
};
