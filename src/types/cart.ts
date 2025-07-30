// src/types/cart.ts

export interface OrderItem {
  productId: string;
  optionId: string;
  quantity: number;
  itemId: string;
  price: number;
  imgUrl: string;
  name: string;
  label: string
}

export interface OrderStructure {
  items: OrderItem[];
  shippingFee: number;
  shopId: string;
  shopName: string;
  date: Date,
}

export interface CartState {
  cartData: {
    shops: OrderStructure[];
  };
  isFetched: boolean,
  Count: number,
  selectedItems: string[];
  pendingUpdates: {};
  debounceTimers: {},
  selectedItemData: []
}
