export type Product = {
  id: string;
  creatorId: string;
  name: string;
  description: string;
  priceClp: number;
  fileName: string;
  filePath: string;
  createdAt: string;
};

export type Creator = {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  headline: string;
  avatarInitials: string;
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
};

export type DemoStore = {
  creator: Creator;
  products: Product[];
  purchases: Purchase[];
};
