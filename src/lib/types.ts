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

export type Purchase = {
  id: string;
  token: string;
  productId: string;
  buyerName: string;
  buyerEmail: string;
  amountClp: number;
  status: "paid";
  downloadsRemaining: number;
  expiresAt: string;
  createdAt: string;
  /** ISO start of booked session (solo type=session) */
  slotStart?: string;
  slotEnd?: string;
  meetUrl?: string;
  googleEventId?: string;
};

export type DemoStore = {
  creator: Creator;
  products: Product[];
  purchases: Purchase[];
};

export type GoogleTokenStore = {
  access_token: string;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
  expiry_date?: number | null;
  email?: string;
};
