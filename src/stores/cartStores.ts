import { defineStore } from "pinia";
import pLimit from 'p-limit';
const limit = pLimit(10);
import axios from "axios";
import { CartState } from "../types/cart";
import { getAuthHeaders } from "../types/shared";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const headers = getAuthHeaders()

export const useCartStore = defineStore("cart", {
  state: (): CartState => ({
    cartData: {
      shops: [],
    },
    Count: 0,
    selectedItems: [],
    pendingUpdates: {},
    debounceTimers: {},
    isFetched: false,
    selectedItemData: []
  }),

  getters: {
    isAllSelected(state) {
      const allItemIds = state.cartData.shops.flatMap(
        (shop) => shop.items?.map((item) => item.itemId) || []
      );
      return (
        allItemIds.length > 0 &&
        allItemIds.every((id) => state.selectedItems.includes(id))
      );
    },

    selectedItemsCount: (state) => state.selectedItems.length,

    itemsSubtotal(state) {
      let total = 0;
      state.cartData.shops.forEach((shop) => {
        shop.items?.forEach((item) => {
          if (state.selectedItems.includes(item.itemId)) {
            total += (item.price || 0) * (item.quantity || 0);
          }
        });
      });
      return total;
    },

    selectedShippingTotal(state) {
      let total = 0;
      state.cartData.shops.forEach((shop) => {
        const shopHasSelectedItem = shop.items?.some((item) =>
          state.selectedItems.includes(item.itemId)
        );
        if (shopHasSelectedItem) {
          total += shop.shippingFee || 0;
        }
      });
      return total;
    },

    total() {
      return this.itemsSubtotal + this.selectedShippingTotal;
    },

    countItem(state) {
      return state.cartData.shops.reduce((count, shop) => {
        return count + (shop.items?.length || 0);
      }, 0);
    }

  },
  actions: {
    itemCount() {
      const count = this.cartData.shops.reduce((count, shop) => {
        return count + (shop.items?.length || 0);
      }, 0);

      this.Count = count;
      console.log(this.Count)
    },
    parseItemId(itemId) {
      const [productId, optionId] = itemId.split("-");
      return { productId, optionId };
    },

    // Fetch cart
    async fetchCart() {
      if (this.isFetched) return
      try {
        const cartRes = await axios.get(`${API_BASE_URL}/cart`, {
          headers
        });

        const cart = cartRes.data;
        const shopsMap = new Map();

        const vendorFetchMap = new Map<string, Promise<any>>();
        const fetchPromises = cart.items.map(cartItem => limit(async () => {
          try {
            const productRes = await axios.get(`${API_BASE_URL}/products/${cartItem.productId}`);
            const product = productRes.data;

            const vendorId = typeof product.vendorId === "object"
              ? product.vendorId._id
              : product.vendorId;

      
            let vendorPromise = vendorFetchMap.get(vendorId);
            if (!vendorPromise) {
              vendorPromise = axios
                .get(`${API_BASE_URL}/vendor/${vendorId}/details`, { headers })
                .then(res => res.data.data);
              vendorFetchMap.set(vendorId, vendorPromise);
              console.log("Fetching vendor:", vendorId);
            } else {
              console.log("Skipping duplicate fetch for vendor:", vendorId);
            }

            const vendor = await vendorPromise;

            const selectedOption = product.option?.find(
              (opt) => opt._id === cartItem.optionId
            );

            const shopId = vendorId;
            const shippingFee = cart?.shippingFee || 50;


            if (!shopsMap.has(shopId)) {
              shopsMap.set(shopId, {
                shopId,
                shopName: vendor?.storeName || "Shop",
                shippingFee,
                items: [],
                date: new Date()
              });
            }

            const item = {
              shippingFee,
              itemId: `${product._id}-${selectedOption?._id || 'default'}`,
              vendorId: product.vendorId,
              productId: product?._id,
              optionId: selectedOption?._id || product?._id,
              name: product?.name,
              price: selectedOption?.price || product.price,
              quantity: cartItem.quantity,
              imgUrl: selectedOption?.imageUrl || product?.imageUrls[0],
              label: selectedOption?.label || ""
            };

            console.log(product.name)

            shopsMap.get(shopId).items.unshift(item);

          } catch (err) {
            console.error(`Failed to process cart item ${cartItem.productId}:`, err);
          }
        }));

        await Promise.all(fetchPromises);

        this.cartData.shops = Array.from(shopsMap.values());
        this.isFetched = true
      } catch (error) {
        console.error("Failed to fetch cart:", error);
      }
    },

    toggleSelectAll() {
      if (this.isAllSelected) {
        this.selectedItems = [];
      } else {
        const allItemIds = this.cartData.shops.flatMap(
          (shop) => shop.items?.map((item) => item.itemId) || []
        );
        this.selectedItems = [...allItemIds];

      }
    },

    isShopSelected(shopId) {
      const shop = this.cartData.shops.find((s) => s.shopId === shopId);
      if (!shop?.items?.length) return false;
      return shop.items.every((item) =>
        this.selectedItems.includes(item.itemId)
      );
    },

    toggleShopSelection(shopId) {
      const shop = this.cartData.shops.find((s) => s.shopId === shopId);
      if (!shop?.items?.length) return;

      const shopItemIds = shop.items.map((item) => item.itemId);
      const allSelected = shopItemIds.every((id) =>
        this.selectedItems.includes(id)
      );

      if (allSelected) {
        this.selectedItems = this.selectedItems.filter(
          (id) => !shopItemIds.includes(id)
        );
      } else {
        const newSelections = shopItemIds.filter(
          (id) => !this.selectedItems.includes(id)
        );
        this.selectedItems = [...this.selectedItems, ...newSelections];
      }
    },

    toggleItemSelection(itemId) {
      const index = this.selectedItems.indexOf(itemId);
      if (index > -1) {
        this.selectedItems.splice(index, 1);
      } else {
        this.selectedItems.push(itemId);
      }
    },

    isItemSelected(itemId) {
      return this.selectedItems.includes(itemId);
    },

    async deleteItem(shopId: string, itemId: string, productId: string) {
      try {
        const deleteItem = await axios.delete(`${API_BASE_URL}/cart/remove`, {
          data: {
            productId,
            optionId: itemId,
          },
          headers
        });

        if (deleteItem.status !== 200) {
          return { success: false, message: "Failed to delete item!" };
        }

        const shop = this.cartData.shops.find((s) => s.shopId === shopId);

        if (shop) {
          shop.items = shop.items?.filter((item) => item.itemId !== itemId) || [];
          this.selectedItems = this.selectedItems.filter((id) => id !== itemId);

          if (shop.items.length === 0) {
            this.cartData.shops = this.cartData.shops.filter(
              (s) => s.shopId !== shopId
            );
          }
        }

        return { success: true };
      } catch (error) {
        console.error("Error deleting item:", error);
        return { success: false, message: "Error occurred while deleting item." };
      }
    },

    deleteSelected() {
      if (this.selectedItems.length === 0) return;

      this.cartData.shops.forEach((shop) => {
        shop.items =
          shop.items?.filter(
            (item) => !this.selectedItems.includes(item.itemId)
          ) || [];
      });
      this.cartData.shops = this.cartData.shops.filter(
        (shop) => shop.items?.length > 0
      );
      this.selectedItems = [];
    },

    updateLocalItem(shopId, itemId, quantity) {
      const shop = this.cartData.shops.find((s) => s.shopId === shopId);
      if (shop) {
        const item = shop.items?.find((i) => i.optionId === itemId);

        if (item) {
          const newQuantity = (item.quantity || 0) + quantity;
          if (newQuantity > 50) {
            return false; // Prevent exceeding max
          }
          if (newQuantity < 1) {
            return false; // Prevent going below min
          }
          item.quantity = newQuantity;
          return true;
        }
      }
      return false;
    },

    handleIncrement(productId, optionId, shopId) {
      this.handleQuantityChange(productId, optionId, shopId, +1);
    },

    handleDecrement(productId, optionId, shopId) {
      this.handleQuantityChange(productId, optionId, shopId, -1);
    },

    handleQuantityChange(productId, optionId, shopId, quantityChange) {
      const itemKey = `${shopId}-${optionId}`;

      // Update local quantity immediately
      const canUpdate = this.updateLocalItem(shopId, optionId, quantityChange);
      if (!canUpdate) {
        console.warn(
          quantityChange > 0
            ? "Maximum quantity of 50 reached. Increment blocked."
            : "Minimum quantity of 1 reached. Decrement blocked."
        );
        return;
      }

      // Accumulate quantity changes
      if (!this.pendingUpdates[itemKey]) {
        this.pendingUpdates[itemKey] = 0;
      }
      this.pendingUpdates[itemKey] += quantityChange;

      // Clear existing timer
      if (this.debounceTimers[itemKey]) {
        clearTimeout(this.debounceTimers[itemKey]);
      }

      // Set new debounce timer
      this.debounceTimers[itemKey] = setTimeout(() => {
        const accumulatedQuantity = this.pendingUpdates[itemKey];
        delete this.pendingUpdates[itemKey];
        delete this.debounceTimers[itemKey];

        this.updateCartItemQuantity(productId, optionId, accumulatedQuantity, shopId);
      }, 300);
    },

    async updateCartItemQuantity(productId, optionId, quantity) {
      try {
        console.log(productId, +" "+ optionId)
        await axios.put(
          `${API_BASE_URL}/cart/update`,
          {
            item: {
              productId,
              optionId,
              quantity,
            },
          },
          {
            headers,
          }
        );
        console.log(`Cart updated on server: item ${optionId} quantity change ${quantity}`);
      } catch (error) {
        console.error("Failed to update cart item quantity:", error);
      }
    },

    getSelectedItem() {
      this.selectedItemData = []
      this.selectedItems.forEach((selectedItem) => {
        const item = this.cartData.shops.flatMap(
          (shop) => shop.items?.find((item) => item.itemId === selectedItem) || []
        );

        this.selectedItemData.push(...item)
     
      });
    },

    // Remove item from cart via API
    async clearCart() {
      if (this.isAllSelected) {
        this.deleteSelected();
        try {
          await axios.delete(`${API_BASE_URL}/cart/clear`, {
            headers
          });
        } catch (error) {
          console.error("Failed to remove cart item:", error);
        }
      }
    },
  },
});
