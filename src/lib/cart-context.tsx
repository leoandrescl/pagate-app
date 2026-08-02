"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type CartProductType = "digital" | "session" | "community";

export type CartItem = {
  productId: string;
  name: string;
  priceClp: number;
  type: CartProductType;
  quantity: number;
  durationMinutes?: number;
  platform?: string;
};

type CartContextValue = {
  username: string;
  items: CartItem[];
  itemCount: number;
  subtotalClp: number;
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  sessionSlots: Record<string, string>;
  setSessionSlot: (productId: string, slotIso: string) => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function storageKey(username: string) {
  return `pagate-cart-${username}`;
}

function slotsKey(username: string) {
  return `pagate-cart-slots-${username}`;
}

export function CartProvider({
  username,
  children,
}: {
  username: string;
  children: ReactNode;
}) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [sessionSlots, setSessionSlots] = useState<Record<string, string>>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey(username));
      if (raw) setItems(JSON.parse(raw) as CartItem[]);
      const slotsRaw = localStorage.getItem(slotsKey(username));
      if (slotsRaw) setSessionSlots(JSON.parse(slotsRaw) as Record<string, string>);
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, [username]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(storageKey(username), JSON.stringify(items));
  }, [items, username, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(slotsKey(username), JSON.stringify(sessionSlots));
  }, [sessionSlots, username, hydrated]);

  const addItem = useCallback((item: Omit<CartItem, "quantity">) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === item.productId);
      if (existing) {
        return prev.map((i) =>
          i.productId === item.productId
            ? { ...i, quantity: i.quantity + 1 }
            : i,
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
    setSessionSlots((prev) => {
      const next = { ...prev };
      delete next[productId];
      return next;
    });
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.productId !== productId));
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.productId === productId ? { ...i, quantity } : i)),
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setSessionSlots({});
  }, []);

  const setSessionSlot = useCallback((productId: string, slotIso: string) => {
    setSessionSlots((prev) => ({ ...prev, [productId]: slotIso }));
  }, []);

  const itemCount = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items],
  );

  const subtotalClp = useMemo(
    () => items.reduce((sum, i) => sum + i.priceClp * i.quantity, 0),
    [items],
  );

  const value = useMemo(
    () => ({
      username,
      items,
      itemCount,
      subtotalClp,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      sessionSlots,
      setSessionSlot,
    }),
    [
      username,
      items,
      itemCount,
      subtotalClp,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      sessionSlots,
      setSessionSlot,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart debe usarse dentro de CartProvider");
  }
  return ctx;
}
