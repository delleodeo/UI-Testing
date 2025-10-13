import { defineStore } from "pinia";
import { ref, computed } from "vue";
import axios, {
  AxiosError,
  AxiosInstance,
  CancelTokenSource,
  AxiosHeaders,
} from "axios";
import { Alert } from "../../components/composable/Alert";
import { Order } from "../../types/order";
import { getAuthHeaders } from "../../types/shared";

export type PaymentMethod = "wallet" | "gcash" | "cod";
export type OrderStatus =
  | "pending"
  | "paid"
  | "shipped"
  | "delivered"
  | "cancelled";
export type PaymentStatus = "Pending" | "Paid" | "Failed" | "Refunded";

interface FetchOptions {
  force?: boolean;
  silent?: boolean;
  noCache?: boolean;
}

interface ShipPayload {
  trackingNumber: string;
  carrier: string;
  shipDate?: string;
  notes?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function resolveAuthHeader(): string {
  const headers = getAuthHeaders();
  return headers.Authorization;
}

let axiosInstance: AxiosInstance | null = null;

function createAxios(): AxiosInstance {
  const instance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 15000,
  });

  instance.interceptors.request.use(config => {
    config.headers = AxiosHeaders.from({
      Accept: "application/json",
      Authorization: resolveAuthHeader(),
      ...(config.headers || {}),
    });
    return config;
  });

  instance.interceptors.response.use(
    response => response,
    (error: AxiosError) => Promise.reject(error)
  );

  return instance;
}

export function api(): AxiosInstance {
  if (!axiosInstance) axiosInstance = createAxios();
  return axiosInstance;
}


function normalizeAxiosError(err: unknown): string {
  if (axios.isCancel(err)) return "Request cancelled";
  const ax = err as AxiosError<any>;
  if (ax.response) {
    const data = ax.response.data as any;
    return (
      data?.message ||
      data?.error ||
      `HTTP ${ax.response.status} ${ax.response.statusText || ""}`.trim()
    );
  }
  if (ax.request) return "Network error or no response";
  return ax.message || "Unknown error";
}

function normalizeOrder(o: Order): Order {
  return {
    ...o,
    items: Array.isArray(o.items) ? o.items : [],
  };
}

export const useOrdersStore = defineStore("vendorOrders", {
  state: () => ({
    orders: [] as Order[],
    loading: false,
    error: null as string | null,
    lastFetched: null as number | null,

    // filters
    search: "",
    activeStatus: "all" as "all" | OrderStatus,
    filterPaymentMethod: "all" as "all" | PaymentMethod,
    filterPaymentStatus: "all" as "all" | PaymentStatus,
    filterDateFrom: "",
    filterDateTo: "",
    sortDir: "desc" as "asc" | "desc",
    page: 1,
    pageSize: 12,

    updatingIds: new Set<string>(),
    listCancelSource: null as CancelTokenSource | null,

    statusMap: {
      pending: { label: "Pending", color: "#eab308" },
      paid: { label: "Paid", color: "#0d9488" },
      shipped: { label: "Shipped", color: "#2563eb" },
      delivered: { label: "Delivered", color: "#16a34a" },
      cancelled: { label: "Cancelled", color: "#dc2626" },
    } as const,
  }),

  getters: {
    filtered(state) {
      const q = state.search.trim().toLowerCase();
      const fromTime = state.filterDateFrom ? new Date(state.filterDateFrom + "T00:00:00").getTime() : null;
      const toTime = state.filterDateTo ? new Date(state.filterDateTo + "T23:59:59.999").getTime() : null;

      return state.orders.filter(o => {
        if (state.activeStatus !== "all" && o.status !== state.activeStatus) return false;
        if (state.filterPaymentMethod !== "all" && o.paymentMethod !== state.filterPaymentMethod) return false;
        if (state.filterPaymentStatus !== "all" && o.paymentStatus !== state.filterPaymentStatus) return false;

        const t = new Date(o.createdAt).getTime();
        if (fromTime !== null && t < fromTime) return false;
        if (toTime !== null && t > toTime) return false;

        if (q) {
          const match =
            o.orderId.toLowerCase().includes(q) ||
            o.name.toLowerCase().includes(q) ||
            (o.trackingNumber || "").toLowerCase().includes(q);
          if (!match) return false;
        }
        return true;
      });
    },

    sorted(state): Order[] {
      const list = [...this.filtered];
      list.sort((a, b) => {
        const av = new Date(a.createdAt).getTime();
        const bv = new Date(b.createdAt).getTime();
        return state.sortDir === "asc" ? av - bv : bv - av;
      });
      return list;
    },

    pageCount(state): number {
      return Math.max(1, Math.ceil(this.sorted.length / state.pageSize));
    },

    paged(state): Order[] {
      if (state.page > this.pageCount) state.page = this.pageCount;
      const start = (state.page - 1) * state.pageSize;
      return this.sorted.slice(start, start + state.pageSize);
    },

    statusCounts(state): Record<string, number> {
      const base: Record<string, number> = { all: state.orders.length };
      for (const k of Object.keys(state.statusMap)) base[k] = 0;
      for (const o of state.orders) base[o.status] += 1;
      return base;
    },

    printablePaged(): Order[] {
      return this.paged.filter(o => this.canPrint(o));
    },

    hasPrintable(): boolean {
      return this.printablePaged.length > 0;
    },

    isUpdating: state => (id: string): boolean => state.updatingIds.has(id),

    canPrint: () => (o: Order): boolean => o.status !== "cancelled",

    allowedStatusTransitions: () => (order: Order): OrderStatus[] => {
      switch (order.status) {
        case "paid": return ["shipped", "delivered"];
        case "shipped": return ["delivered", "cancelled"];
        default: return [];
      }
    }
  },

  actions: {
    async fetchOrders(opts: FetchOptions = {}) {
      const { force = false, silent = false, noCache = false } = opts;

      if (this.loading && !force) return;
      if (!noCache && !force && this.lastFetched && Date.now() - this.lastFetched < 15_000) return;

      if (this.listCancelSource) this.listCancelSource.cancel("Superseded");
      this.listCancelSource = axios.CancelToken.source();

      if (!silent) {
        this.loading = true;
        this.error = null;
      }

      try {
        const { data } = await api().get<Order[]>("/order/vendor", {
          cancelToken: this.listCancelSource.token,
        });

        if (!Array.isArray(data)) throw new Error("Invalid response shape");
        this.orders = data.map(normalizeOrder);

        console.log(this.orders)
        this.lastFetched = Date.now();
        this.page = 1;
      } catch (err) {
        const msg = normalizeAxiosError(err);
        if (msg !== "Request cancelled") this.error = msg;
      } finally {
        if (!silent) this.loading = false;
        this.listCancelSource = null;
      }
    },

    async fetchSingleOrder(orderId: string): Promise<Order | null> {
      try {
        const { data } = await api().get<Order>(`/order/${orderId}`);
        if (data && data._id) {
          // Update the order in the main list as well
          const index = this.orders.findIndex(o => o._id === data._id);
          if (index !== -1) {
            this.orders[index] = normalizeOrder(data);
          }
          return this.orders[index];
        }
        return null;
      } catch (err) {
        console.error(`Failed to fetch order ${orderId}:`, normalizeAxiosError(err));
        return null;
      }
    },

    async updateOrderStatus(id: string, next: OrderStatus) {
      const order = this.orders.find(o => o._id === id);
      if (!order) throw new Error("Order not found");
      if (order.status === next) return;

      const prev = { ...order };
      this.updatingIds.add(id);

      order.status = next;
      if (next === "paid") order.paymentStatus = "Paid";
      if (next === "cancelled" && order.paymentStatus === "Paid") {
        order.paymentStatus = "Refunded";
      }

      try {
        const { data } = await api().patch<Order | Record<string, any>>(
          `/order/${encodeURIComponent(id)}/status`,
          { status: next }
        );

        if ((data as any)?._id) {
          const idx = this.orders.findIndex(o => o._id === (data as any)._id);
          if (idx !== -1) this.orders[idx] = normalizeOrder(data as Order);
        }

        Alert(`Order update to ${next}`, "success", "var(--primary-color)");
      } catch (err) {
        Alert(`Order failed to update to ${next}`, "error", "var(--secondary-color)");
        const idx = this.orders.findIndex(o => o._id === prev._id);
        if (idx !== -1) this.orders[idx] = prev;
        throw new Error(normalizeAxiosError(err));
      } finally {
        this.updatingIds.delete(id);
      }
    },

    async shipOrder(id: string, payload: ShipPayload) {
      const order = this.orders.find(o => o._id === id);
      if (!order) throw new Error("Order not found");
      if (order.status !== "paid") throw new Error("Only paid orders can be shipped");
      if (!payload.trackingNumber?.trim()) throw new Error("Tracking number is required");
      if (!payload.carrier?.trim()) throw new Error("Carrier is required");

      const prev = { ...order };
      this.updatingIds.add(id);

      order.status = "shipped";
      order.trackingNumber = payload.trackingNumber.trim();
      order.shippingCarrier = payload.carrier.trim();
      order.shippedAt = payload.shipDate || new Date().toISOString();
      if (payload.notes) order.shippingNotes = payload.notes;

      try {
        const { data } = await api().patch<Order | Record<string, any>>(
          `/vendor/orders/${encodeURIComponent(id)}/ship`,
          {
            trackingNumber: order.trackingNumber,
            carrier: order.shippingCarrier,
            shipDate: order.shippedAt,
            notes: order.shippingNotes,
            status: "shipped",
          }
        );

        if ((data as any)?._id) {
          const idx = this.orders.findIndex(o => o._id === (data as any)._id);
          if (idx !== -1) this.orders[idx] = normalizeOrder(data as Order);
        }
      } catch (err) {
        const idx = this.orders.findIndex(o => o._id === prev._id);
        if (idx !== -1) this.orders[idx] = prev;
        throw new Error(normalizeAxiosError(err));
      } finally {
        this.updatingIds.delete(id);
      }
    },

    async addAgreementMessage(orderId: string, message: string) {
      if (!message.trim()) return;

      this.updatingIds.add(orderId);
      try {
        // Make the API call but we don't need to process the response here.
        // The UI update will be handled by the Socket.IO listener in the component.
        await api().post(
          `/order/${encodeURIComponent(orderId)}/agreement-message`,
          { message }
        );

      } catch (err) {
        const errorMsg = normalizeAxiosError(err);
        Alert(`Failed to send message: ${errorMsg}`, "error");
        // Re-throw to be caught in the component if needed
        throw new Error(errorMsg);
      } finally {
        this.updatingIds.delete(orderId);
      }
    },

    // UI helpers
    setSearch(v: string) { this.search = v; this.page = 1; },
    setActiveStatus(v: "all" | OrderStatus) { this.activeStatus = v; this.page = 1; },
    setSortDir(d: "asc" | "desc") { this.sortDir = d; },
    setFilters(partial: {
      paymentMethod?: "all" | PaymentMethod;
      paymentStatus?: "all" | PaymentStatus;
      dateFrom?: string;
      dateTo?: string;
    }) {
      if (partial.paymentMethod !== undefined) this.filterPaymentMethod = partial.paymentMethod;
      if (partial.paymentStatus !== undefined) this.filterPaymentStatus = partial.paymentStatus;
      if (partial.dateFrom !== undefined) this.filterDateFrom = partial.dateFrom;
      if (partial.dateTo !== undefined) this.filterDateTo = partial.dateTo;
      this.page = 1;
    },
    resetFilters() {
      this.filterPaymentMethod = "all";
      this.filterPaymentStatus = "all";
      this.filterDateFrom = "";
      this.filterDateTo = "";
      this.page = 1;
    },
    setPage(p: number) {
      this.page = Math.min(Math.max(1, p), this.pageCount);
    },
    nextPage() {
      if (this.page < this.pageCount) this.page++;
    },
    prevPage() {
      if (this.page > 1) this.page--;
    },
  }
});
