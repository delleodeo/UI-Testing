<script setup lang="ts">
import { ref, onMounted, nextTick } from "vue";
import { formatToPHCurrency } from "../../../utils/currencyFormat";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon,
  PrinterIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CheckCircleIcon,
  TruckIcon,
  XCircleIcon,
  EllipsisHorizontalCircleIcon,
  ChatBubbleLeftEllipsisIcon,
} from "@heroicons/vue/24/outline";
import { Order } from "../../../types/order";
import { useOrdersStore, OrderStatus } from "../../../stores/vendor/vendorOrderStore";


const store = useOrdersStore();

const expanded = ref<Set<string>>(new Set());
const showFilters = ref(false);
const isAgreementModalVisible = ref(false);
const currentAgreementDetails = ref("");


onMounted(() => {
  store.fetchOrders().catch(e => {
    console.error("Orders fetch failed:", e);
  });
});


// Canonical currency formatter (unify usage across component)
function currency(n: number | null | undefined): string {
  const num = typeof n === "number" && !Number.isNaN(n) ? n : 0;
  return formatToPHCurrency(num); // assumes util returns e.g. ₱1,234.00
}

function dateLabel(iso: string | number | Date | null | undefined): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("en-PH", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatAddress(addr: Order["shippingAddress"] | null | undefined): string {
  if (!addr) return "N/A";
  const parts = [addr.street, addr.barangay, addr.city, addr.province, addr.zipCode]
    .map(p => (p ? String(p).trim() : ""))
    .filter(Boolean);
  return parts.length ? parts.join(", ") : "N/A";
}

// Safe accessors in case backend sends unexpected status values.
function safeStatusLabel(status: OrderStatus | string): string {
  return store.statusMap?.[status as OrderStatus]?.label ?? String(status);
}
function safeStatusColor(status: OrderStatus | string): string {
  return store.statusMap?.[status as OrderStatus]?.color ?? "#475569"; // slate fallback
}

function paymentStatusClass(status: string): string {
  return status ? status.toLowerCase() : "";
}


const BRAND = "rgb(21, 30, 46)"; // keep in sync w/ theme colors below

function buildReceiptHTML(order: Order) {
  const address = formatAddress(order.shippingAddress);

  const rows = order.items
    .map(
      it => `
        <tr>
          <td class="item">${escapeHtml(it.name)} <br/> ${escapeHtml(it.label)}</td>
          <td class="qty">${it.quantity}</td>
          <td class="prc">${currency(it.price)}</td>
          <td class="ln">${currency(it.price * it.quantity)}</td>
        </tr>`
    )
    .join("");

  const paymentMethod = order.paymentMethod ? order.paymentMethod.toUpperCase() : "-";
  const paymentStatus = order.paymentStatus ?? "-";
  const tracking = order.trackingNumber || "-";

  return `
  <section class="receipt">
    <header class="rh">
      <div class="brand">
        <div class="logo">DS</div>
        <div class="b-meta">
          <h1>DoroShop</h1>
          <p class="tag">Local Products</p>
        </div>
      </div>
      <div class="info">
        <div><span>Date:</span><strong>${dateLabel(order.createdAt)}</strong></div>
        <div><span>Status:</span><strong>${escapeHtml(safeStatusLabel(order.status))}</strong></div>
        <div><span>Payment:</span><strong>${escapeHtml(paymentMethod)} (${escapeHtml(paymentStatus)})</strong></div>
        <div><span>Tracking:</span><strong>${escapeHtml(tracking)}</strong></div>
      </div>
    </header>
    <div class="divider"></div>
    <div class="customer">
      <p class="c-head">Customer</p>
      <p class="c-name">${escapeHtml(order.name)}</p>
      <p class="c-addr">${escapeHtml(address)}</p>
    </div>
    <table class="items">
      <thead>
        <tr>
          <th class="item">Item</th>
          <th class="qty">Qty</th>
          <th class="prc">Price</th>
          <th class="ln">Total</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
      <tfoot>
        <tr>
          <td colspan="3" class="foot-lbl">Shippping Fee</td>
          <td class="foot-val">${currency(order.shippingFee)}</td>
        </tr>
             <tr>
          <td colspan="3" class="foot-lbl">Subtotal</td>
          <td class="foot-val">${currency(order.subTotal + order.shippingFee)}</td>
        </tr>
      </tfoot>
    </table>
    <div class="thanks">Thank you for supporting local sellers!</div>
  </section>`;
}

function printScaffold(content: string, title: string) {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>${escapeHtml(title)}</title>
<meta name="viewport" content="width=device-width,initial-scale=1" />
<style>
:root {
  --brand:${BRAND};
  --bg:#ffffff;
  --text:#1f2937;
  --muted:#64748b;
  --border:#e2e8f0;
  --radius:16px;
}
* { box-sizing:border-box; }
body {
  margin:0;
  font-family: system-ui,-apple-system,Inter,Roboto,Arial,sans-serif;
  background:#f1f5f9;
  padding:24px;
  color:var(--text);
}
.receipt {
  background:var(--bg);
  border:1px solid var(--border);
  border-radius:var(--radius);
  padding:22px 24px 28px;
  max-width:680px;
  margin:0 auto 40px;
  box-shadow:0 6px 28px -4px rgba(0,0,0,.12);
  page-break-inside: avoid;
}
.rh {
  display:flex; flex-wrap:wrap; gap:24px;
  justify-content:space-between; align-items:flex-start;
}
.brand { display:flex; gap:14px; align-items:center; }
.logo {
  width:64px; height:64px;
  background:linear-gradient(135deg,var(--brand) 0%, #2b3f59 100%);
  border-radius:18px;
  display:flex; align-items:center; justify-content:center;
  font-weight:700; font-size:22px; letter-spacing:.5px;
  color:#fff; box-shadow:0 6px 18px -4px rgba(0,0,0,.35);
}
.b-meta h1 {
  margin:0; font-size:22px; font-weight:700; color:var(--brand);
  letter-spacing:.75px;
}
.b-meta .tag {
  margin:4px 0 0; font-size:12px; text-transform:uppercase;
  letter-spacing:1px; font-weight:600; color:var(--muted);
}
.info { display:grid; gap:6px; font-size:13px; min-width:220px; }
.info span { color:var(--muted); font-weight:600; margin-right:6px; display:inline-block; min-width:60px; }
.divider {
  height:1px;
  background:linear-gradient(90deg,transparent,var(--border),transparent);
  margin:22px 0 16px;
}
.customer { margin-bottom:12px; }
.c-head {
  margin:0 0 2px; font-size:11px; font-weight:700;
  text-transform:uppercase; letter-spacing:1px; color:var(--muted);
}
.c-name { margin:0 0 4px; font-weight:600; }
.c-addr { margin:0; font-size:13px; line-height:1.45; }
table.items {
  width:100%; border-collapse:collapse; margin-top:4px;
  overflow:hidden; border:1px solid var(--border); border-radius:12px;
}
table.items thead th {
  background:var(--brand); color:#fff; font-weight:600; font-size:12px;
  letter-spacing:.5px; padding:10px 12px; text-align:left;
}
table.items tbody td {
  padding:10px 12px; border-top:1px solid var(--border);
  font-size:13px; vertical-align:middle;
}
table.items tfoot td {
  padding:12px 12px; border-top:1px solid var(--border);
  font-size:13px; font-weight:600; background:#f8fafc;
}
.qty,.prc,.ln,.foot-val { text-align:right; white-space:nowrap; }
.foot-lbl { text-align:right; }
.thanks {
  margin-top:30px; font-size:12px; text-align:center;
  color:var(--muted); letter-spacing:.5px;
}
.page-break { page-break-after:always; }
@media print {
  body { background:#fff; padding:10px; }
  .receipt { box-shadow:none; margin:0 auto 24px; }
}
</style>
</head>
<body>${content}</body>
</html>`;
}

function printUsingIframe(html: string, title: string) {
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.opacity = "0";
  iframe.setAttribute("sandbox", "allow-modals allow-same-origin allow-scripts");
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument!;
  doc.open();
  doc.write(printScaffold(html, title));
  doc.close();

  const cleanup = () => setTimeout(() => iframe.remove(), 500);

  const triggerPrint = () => {
    const win = iframe.contentWindow!;
    const imgs = Array.from(doc.images);
    const pending = imgs.filter(i => !i.complete);

    if (pending.length) {
      let done = 0;
      const doneOne = () => {
        done++;
        if (done === pending.length) {
          setTimeout(() => {
            win.focus();
            win.print();
            cleanup();
          }, 60);
        }
      };
      pending.forEach(img => {
        img.addEventListener("load", doneOne, { once: true });
        img.addEventListener("error", doneOne, { once: true });
      });
    } else {
      setTimeout(() => {
        win.focus();
        win.print();
        cleanup();
      }, 60);
    }
  };

  if (doc.readyState === "complete") triggerPrint();
  else iframe.addEventListener("load", triggerPrint, { once: true });
}

function printSingle(o: Order) {
  if (!store.canPrint(o)) return;
  printUsingIframe(buildReceiptHTML(o), `Receipt ${o.orderId}`);
}
function printVisible() {
  if (!store.hasPrintable) {
    alert("No printable orders on this page.");
    return;
  }
  const html = store.printablePaged.map(buildReceiptHTML).join('<div class="page-break"></div>');
  printUsingIframe(html, "Batch Receipts");
}


function handleStatusUpdate(o: Order, next: OrderStatus) {
  store.updateOrderStatus(o._id, next).catch(err => {
    console.log("Failed to update status: " + (err?.message || "Unknown error"));
  });
}

function shipOrder(o: Order) {
  handleStatusUpdate(o, "shipped");
}


function actionStatuses(o: Order) {
  let arr = store.allowedStatusTransitions(o) as OrderStatus[];
  if (o.paymentMethod === "cod") {
    arr = arr.filter(n => n !== "paid");
  }
  arr = arr.filter(n => n !== "shipped");
  return arr;
}


const statusKeys = ["all", "pending", "paid", "shipped", "delivered", "cancelled"] as const;
type StatusKey = typeof statusKeys[number];

function resetExpanded() {
  expanded.value = new Set();
}

function onStatusTabClick(key: StatusKey) {
  store.setActiveStatus(key);
  store.setPage(1);
  resetExpanded();
}

function onTabKey(e: KeyboardEvent) {
  const idx = statusKeys.indexOf(store.activeStatus as StatusKey);
  if (idx === -1) return;
  if (["ArrowRight", "ArrowLeft", "Home", "End"].includes(e.key)) {
    e.preventDefault();
    let newIdx = idx;
    if (e.key === "ArrowRight") newIdx = (idx + 1) % statusKeys.length;
    if (e.key === "ArrowLeft") newIdx = (idx - 1 + statusKeys.length) % statusKeys.length;
    if (e.key === "Home") newIdx = 0;
    if (e.key === "End") newIdx = statusKeys.length - 1;
    onStatusTabClick(statusKeys[newIdx]);
    nextTick(() => {
      const el = document.querySelectorAll<HTMLButtonElement>(".status-tabs button")[newIdx];
      el?.focus();
    });
  }
}

function toggleExpand(id: string) {
  const set = new Set(expanded.value);
  if (set.has(id)) set.delete(id);
  else set.add(id);
  expanded.value = set; // reactivity
}
function isExpanded(id: string) {
  return expanded.value.has(id);
}

function expandEnter(el: Element) {
  const e = el as HTMLElement;
  e.style.height = "0";
  e.style.opacity = "0";
  requestAnimationFrame(() => {
    e.style.transition = "height .35s ease, opacity .3s ease";
    e.style.height = e.scrollHeight + "px";
    e.style.opacity = "1";
  });
}
function expandAfterEnter(el: Element) {
  (el as HTMLElement).style.height = "auto";
}
function expandLeave(el: Element) {
  const e = el as HTMLElement;
  e.style.height = e.scrollHeight + "px";
  e.style.opacity = "1";
  requestAnimationFrame(() => {
    e.style.transition = "height .3s ease, opacity .25s ease";
    e.style.height = "0";
    e.style.opacity = "0";
  });
}

/* -------------------------------------------------------------------------------------------------
 * Filters & Search
 * ------------------------------------------------------------------------------------------------- */
function resetFilters() {
  store.resetFilters();
}
function onSearchInput(e: Event) {
  const target = e.target as HTMLInputElement;
  store.setSearch(target.value);
}

function showAgreementDetails(order: Order) {
  currentAgreementDetails.value = order.agreementDetails || "No details provided.";
  isAgreementModalVisible.value = true;
}

function closeAgreementModal() {
  isAgreementModalVisible.value = false;
}
</script>

<template>
  <div class="order-cards-page">

    <!-- Agreement Details Modal -->
    <transition name="fade">
      <div v-if="isAgreementModalVisible" class="agreement-modal-overlay" @click="closeAgreementModal">
        <div class="agreement-modal-container" @click.stop>
          <div class="agreement-modal-header">
            <h3>Agreement Details</h3>
            <button @click="closeAgreementModal" class="modal-close-btn">&times;</button>
          </div>
          <div class="agreement-modal-body">
            <p>{{ currentAgreementDetails }}</p>
          </div>
        </div>
      </div>
    </transition>

    <div class="status-tabs" role="tablist" aria-label="Order status" @keydown="onTabKey">
      <button v-for="key in statusKeys" :key="key" role="tab" type="button" :aria-selected="store.activeStatus === key"
        :tabindex="store.activeStatus === key ? 0 : -1" :class="['status-chip', { active: store.activeStatus === key }]"
        @click="onStatusTabClick(key as any)">
        <span class="lbl">{{ key === 'all' ? 'All' : safeStatusLabel(key as any) }}</span>
        <span class="count">{{ store.statusCounts[key as any] ?? 0 }}</span>
      </button>
    </div>


    <div class="controls">
      <div class="search-box">
        <MagnifyingGlassIcon class="icon" />
        <input v-model="store.search" type="search" placeholder="Search order ID, customer, tracking..."
          @input="onSearchInput" />
      </div>
      <div class="right-actions">
        <button class="btn outline small" type="button" :disabled="!store.hasPrintable" @click="printVisible">
          <PrinterIcon class="icon mini" /> Print Visible
        </button>
        <button class="btn ghost small" type="button"
          @click="store.setSortDir(store.sortDir === 'asc' ? 'desc' : 'asc')">
          <ArrowPathIcon class="icon flip" />
          {{ store.sortDir === 'asc' ? 'Oldest' : 'Newest' }}
        </button>
        <button class="btn ghost small" type="button" @click="showFilters = !showFilters" :aria-expanded="showFilters">
          <FunnelIcon class="icon" />
          Filters
        </button>
      </div>
    </div>

    <transition name="fade">
      <div v-if="showFilters" class="filters-panel">
        <div class="filters-grid">
          <div class="filter-group">
            <label>Date From</label>
            <input type="date" v-model="store.filterDateFrom"
              @change="store.setFilters({ dateFrom: store.filterDateFrom })" />
          </div>
          <div class="filter-group">
            <label>Date To</label>
            <input type="date" v-model="store.filterDateTo"
              @change="store.setFilters({ dateTo: store.filterDateTo })" />
          </div>
          <div class="filter-group">
            <label>Payment Method</label>
            <select v-model="store.filterPaymentMethod"
              @change="store.setFilters({ paymentMethod: store.filterPaymentMethod })">
              <option value="all">All</option>
              <option value="wallet">Wallet</option>
              <option value="gcash">GCash</option>
              <option value="cod">COD</option>
            </select>
          </div>
          <div class="filter-group">
            <label>Payment Status</label>
            <select v-model="store.filterPaymentStatus"
              @change="store.setFilters({ paymentStatus: store.filterPaymentStatus })">
              <option value="all">All</option>
              <option value="Pending">Pending</option>
              <option value="Paid">Paid</option>
              <option value="Refunded">Refunded</option>
              <option value="Failed">Failed</option>
            </select>
          </div>
        </div>
        <div class="filters-actions">
          <button class="btn tiny outline" type="button" @click="resetFilters">Reset Filters</button>
        </div>
      </div>
    </transition>


    <div class="summary">
      <span>{{ store.sorted.length }} result<span v-if="store.sorted.length !== 1">s</span></span>
      <span class="divider">|</span>
      <span>Page {{ store.page }} / {{ store.pageCount }}</span>
    </div>


    <div class="cards-grid">
      <div v-if="store.loading" class="loading-skeleton" v-for="n in 6" :key="'skel_' + n"></div>

      <template v-else>
        <div v-for="o in store.paged" :key="o._id" :class="['order-card', { updating: store.isUpdating(o._id) }]">
          <header class="card-head">
            <div class="left">
              <h2 class="oid">{{ o.orderId }}</h2>
              <p class="created">{{ dateLabel(o.updatedAt || Date.now())  }}</p>
            </div>
            <div class="right">
              <span class="status-pill" :style="{ '--pill': safeStatusColor(o.status) }">{{ safeStatusLabel(o.status)
              }}</span>
            </div>
          </header>

          <div class="info-line">
            <span class="lbl">Customer:</span>
            <span class="val">{{ o.name }}</span>
          </div>
          <div class="info-line">
            <span class="lbl">Shipping Fee:</span>
            <span class="val strong">{{ currency(o.shippingFee) }}</span>
          </div>
            <div class="info-line">
            <span class="lbl">Shipping Mode:</span>
            <span class="val strong">
              {{o.shippingOption}}
              <button v-if="o.shippingOption === 'agreement'" class="btn-icon" @click="showAgreementDetails(o)">
                <ChatBubbleLeftEllipsisIcon class="icon mini" />
              </button>
            </span>
          </div>
          <div class="info-line">
            <span class="lbl">Subtotal:</span>
            <span class="val strong">{{ currency(o.subTotal + o.shippingFee) }}</span>
          </div>
          <div class="info-line wrap">
            <span class="lbl">Payment:</span>
            <span class="val">
              {{ o.paymentMethod ? o.paymentMethod.toUpperCase() : '-' }}
              <span class="pay-badge" :class="paymentStatusClass(o.paymentStatus)">
                {{ o.paymentStatus }}
              </span>
            </span>
          </div>
          <div v-if="o.trackingNumber" class="info-line">
            <span class="lbl">Tracking:</span>
            <span class="val mono">{{ o.trackingNumber }}</span>
          </div>

          <!-- Expand Toggle -->
          <button class="expand-btn" type="button" @click="toggleExpand(o._id)" :aria-expanded="isExpanded(o._id)">
            <span>{{ isExpanded(o._id) ? 'Hide Items' : 'Show Items (' + o.items.length + ')' }}</span>
            <ChevronDownIcon v-if="!isExpanded(o._id)" class="icon mini" />
            <ChevronUpIcon v-else class="icon mini" />
          </button>

          <!-- Expandable Items -->
          <transition @enter="expandEnter" @after-enter="expandAfterEnter" @leave="expandLeave">
            <div v-show="isExpanded(o._id)" class="items-wrapper">
              <ul class="items-list">
                <li v-for="it in o.items" :key="it._id" class="item-row">
                  <img :src="it.imgUrl || 'https://via.placeholder.com/80x60?text=No+Img'" alt="" class="thumb" />
                  <div class="it-meta">
                    <p class="it-name">{{ it.name }}</p>
                    <p class="it-label">{{ it.label }}</p>
                    <p class="it-sub muted">
                      {{ it.quantity }} × {{ currency(it.price) }}
                    </p>
                  </div>
                  <div class="it-total">
                    {{ currency(it.price * it.quantity) }}
                  </div>
                </li>
              </ul>
              <div v-if="o.shippingAddress" class="ship-block">
                <p class="ship-title">Ship To</p>
                <p class="ship-addr">{{ formatAddress(o.shippingAddress) }}</p>
              </div>
            </div>
          </transition>

          <!-- Actions -->
          <div class="actions">
            <!-- Ship (pending only) -->
            <button v-if="o.status === 'pending'" class="btn tiny outline" type="button"
              :disabled="store.isUpdating(o._id)" @click="shipOrder(o)">
              <TruckIcon class="icon mini" />
              Ship
            </button>

            <!-- Other transitions (no shipped, no paid for COD) -->
            <button v-for="n in actionStatuses(o)" :key="n" class="btn tiny outline" type="button"
              :disabled="store.isUpdating(o._id)" @click="handleStatusUpdate(o, n)">
              <component
                :is="n === 'paid' ? CheckCircleIcon : n === 'shipped' ? TruckIcon : n === 'delivered' ? CheckCircleIcon : XCircleIcon"
                class="icon mini" />
              <span class="capitalize">{{ safeStatusLabel(n) }}</span>
            </button>

            <!-- Cancel -->
            <button v-if="o.status !== 'cancelled' && o.status !== 'delivered' && o.status !== 'shipped'"
              class="btn tiny danger outline" type="button" :disabled="store.isUpdating(o._id)"
              @click="handleStatusUpdate(o, 'cancelled')">
              <XCircleIcon class="icon mini" /> Cancel
            </button>

            <!-- Receipt -->
            <button v-if="store.canPrint(o)" class="btn tiny" type="button" :disabled="store.isUpdating(o._id)"
              @click="printSingle(o)">
              <PrinterIcon class="icon mini" /> Receipt
            </button>
          </div>
        </div>

        <div v-if="!store.paged.length" class="empty-state">
          <EllipsisHorizontalCircleIcon class="icon large" />
          <p>No orders found.</p>
        </div>
      </template>
    </div>

    <!-- Pagination -->
    <div class="pagination" v-if="store.pageCount > 1">
      <button class="btn tiny outline" type="button" :disabled="store.page === 1" @click="store.prevPage">Prev</button>
      <span class="pager-label">Page {{ store.page }} of {{ store.pageCount }}</span>
      <button class="btn tiny outline" type="button" :disabled="store.page === store.pageCount"
        @click="store.nextPage">Next</button>
    </div>
  </div>
</template>

<style scoped>
/* Layout & background */
.order-cards-page {
  min-height: 100dvh;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  padding: clamp(1rem, 2vw, 2rem);
  background: rgb(21, 30, 46);
  background:
    radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.04), transparent 60%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.05), transparent),
    rgb(21, 30, 46);
  color: #e2e8f0;
  padding-bottom: 10rem;
}

.status-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: .55rem;
  padding: .4rem;
  background: rgba(255, 255, 255, .05);
  backdrop-filter: blur(6px);
  border: 1px solid rgba(255, 255, 255, .12);
  border-radius: 1rem;
}

.status-chip {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: .45rem;
  padding: .55rem .85rem;
  background: rgba(255, 255, 255, 0.05);
  color: #cbd5e1;
  border: 1px solid transparent;
  border-radius: 2rem;
  font-size: .8rem;
  font-weight: 600;
  letter-spacing: .4px;
  cursor: pointer;
  transition: background .25s, color .25s, transform .25s;
}

.status-chip:hover {
  background: rgba(255, 255, 255, 0.09);
}

.status-chip.active {
  background: #fff;
  color: rgb(21, 30, 46);
  box-shadow: 0 4px 14px -4px rgba(0, 0, 0, .4);
}

.status-chip .count {
  font-size: .65rem;
  background: currentColor;
  color: #fff;
  padding: 2px 7px;
  border-radius: 1rem;
  font-weight: 700;
  line-height: 1;
}

.controls {
  display: flex;
  flex-wrap: wrap;
  gap: .8rem;
  align-items: center;
  justify-content: space-between;
}

.search-box {
  flex: 1 1 260px;
  display: flex;
  align-items: center;
  gap: .55rem;
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, .18);
  padding: .65rem .85rem;
  border-radius: .9rem;
}

.search-box .icon {
  width: 18px;
  height: 18px;
  stroke-width: 2;
  color: #94a3b8;
}

.search-box input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: #f1f5f9;
  font: inherit;
  font-size: .88rem;
}

.search-box input::placeholder {
  color: #64748b;
}

.right-actions {
  display: flex;
  gap: .5rem;
  flex-wrap: wrap;
}

.filters-panel {
  padding: .9rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, .12);
  border-radius: .9rem;
  font-size: .75rem;
  display: flex;
  flex-direction: column;
  gap: .75rem;
}

.filters-grid {
  display: grid;
  gap: .75rem;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: .35rem;
}

.filter-group label {
  font-size: .55rem;
  text-transform: uppercase;
  letter-spacing: .5px;
  font-weight: 600;
  color: #94a3b8;
}

.filter-group input,
.filter-group select {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.18);
  padding: .4rem .5rem;
  border-radius: .5rem;
  font-size: .65rem;
  color: #e2e8f0;
  font-family: inherit;
  outline: none;
}

.filter-group input:focus,
.filter-group select:focus {
  border-color: rgba(255, 255, 255, 0.38);
}

.filters-actions {
  display: flex;
  justify-content: flex-end;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity .25s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.summary {
  font-size: .7rem;
  display: flex;
  gap: .7rem;
  align-items: center;
  letter-spacing: .5px;
  color: #94a3b8;
  text-transform: uppercase;
  font-weight: 600;
}

.summary .divider {
  opacity: .35;
}

.cards-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fill, minmax(310px, 1fr));
  align-items: start;
}

.loading-skeleton {
  height: 230px;
  border-radius: 1rem;
  background: linear-gradient(110deg, rgba(255, 255, 255, 0.05) 25%, rgba(255, 255, 255, 0.09) 35%, rgba(255, 255, 255, 0.05) 55%);
  background-size: 200% 100%;
  animation: shimmer 1.5s linear infinite;
}

@keyframes shimmer {
  to {
    background-position: -200% 0;
  }
}

.order-card {
  display: flex;
  flex-direction: column;
  gap: .55rem;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 1rem;
  padding: 1rem .95rem 1.1rem;
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(6px);
  transition: border-color .35s, transform .25s, box-shadow .35s;
}

.order-card:hover {
  border-color: rgba(255, 255, 255, 0.28);
  transform: translateY(-4px);
  box-shadow: 0 10px 28px -6px rgba(0, 0, 0, .55);
}

.order-card.updating {
  opacity: .55;
  pointer-events: none;
}

.card-head {
  display: flex;
  justify-content: space-between;
  gap: .65rem;
}

.card-head .oid {
  margin: 0;
  font-size: .95rem;
  font-weight: 700;
  letter-spacing: .5px;
  color: #fff;
}

.card-head .created {
  margin: .25rem 0 0;
  font-size: .65rem;
  color: #94a3b8;
  font-weight: 500;
  letter-spacing: .4px;
}

.status-pill {
  display: inline-block;
  font-size: .55rem;
  font-weight: 700;
  letter-spacing: .6px;
  text-transform: uppercase;
  padding: .35rem .55rem;
  border-radius: 1rem;
  background: var(--pill);
  color: #fff;
  box-shadow: 0 2px 6px -2px rgba(0, 0, 0, .4);
  white-space: nowrap;
  align-self: flex-start;
}

.info-line {
  display: flex;
  justify-content: space-between;
  font-size: .7rem;
  gap: .75rem;
  color: #e2e8f0;
  line-height: 1.25;
}

.info-line.wrap {
  flex-wrap: wrap;
}

.info-line .lbl {
  font-weight: 600;
  font-size: .65rem;
  color: #94a3b8;
  letter-spacing: .4px;
  text-transform: uppercase;
}

.info-line .val {
  flex: 1;
  text-align: right;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 0.5rem;
}

.info-line .val.strong {
  font-weight: 700;
  color: #fff;
}

.mono {
  font-family: ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace;
}

.pay-badge {
  margin-left: .45rem;
  font-size: .55rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .5px;
  padding: 3px 6px;
  border-radius: .5rem;
  background: #475569;
  color: #e2e8f0;
}

.pay-badge.paid {
  background: #0d9488;
}

.pay-badge.pending {
  background: #b45309;
}

.pay-badge.refunded {
  background: #0369a1;
}

.pay-badge.failed {
  background: #991b1b;
}

.expand-btn {
  margin-top: .25rem;
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.15);
  padding: .55rem .7rem;
  border-radius: .75rem;
  font: inherit;
  font-size: .65rem;
  letter-spacing: .6px;
  text-transform: uppercase;
  font-weight: 600;
  cursor: pointer;
  color: #cbd5e1;
  display: flex;
  align-items: center;
  gap: .5rem;
  transition: background .3s, border-color .3s;
}

.expand-btn:hover {
  background: rgba(255, 255, 255, 0.14);
  border-color: rgba(255, 255, 255, 0.3);
}

.items-wrapper {
  overflow: hidden;
  margin-top: .4rem;
}

.items-list {
  list-style: none;
  margin: 0 0 .8rem;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: .6rem;
}

.item-row {
  display: flex;
  gap: .7rem;
  align-items: center;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: .75rem;
  padding: .55rem .65rem;
}

.thumb {
  width: 70px;
  height: 52px;
  object-fit: cover;
  border-radius: .55rem;
  background: #334155;
  flex-shrink: 0;
}

.it-meta {
  flex: 1 1 auto;
}

.it-name, .it-label {
  margin: 0 0 2px;
  font-size: .7rem;
  font-weight: 600;
  letter-spacing: .25px;
  color: #fff;
}

.it-label{
  font-size: .5rem;
  color: rgb(143, 143, 143);
}

.it-sub {
  margin: 0;
  font-size: .6rem;
}

.muted {
  color: #94a3b8;
}

.it-total {
  font-size: .65rem;
  font-weight: 600;
  white-space: nowrap;
  color: #f1f5f9;
}

.ship-block {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  padding: .55rem .7rem .65rem;
  border-radius: .7rem;
  font-size: .6rem;
  line-height: 1.3;
  color: #cbd5e1;
  letter-spacing: .3px;
}

.ship-title {
  margin: 0 0 .3rem;
  text-transform: uppercase;
  font-weight: 600;
  font-size: .55rem;
  letter-spacing: .6px;
  color: #94a3b8;
}

.ship-addr {
  margin: 0;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: .45rem;
  margin-top: .4rem;
}

.btn {
  --btn-bg: #fff;
  --btn-fg: rgb(21, 30, 46);
  display: inline-flex;
  align-items: center;
  gap: .35rem;
  border: none;
  background: var(--btn-bg);
  color: var(--btn-fg);
  font: inherit;
  font-weight: 600;
  padding: .55rem .85rem;
  border-radius: .6rem;
  font-size: .65rem;
  letter-spacing: .6px;
  cursor: pointer;
  position: relative;
  transition: background .3s, transform .25s, box-shadow .3s;
  box-shadow: 0 4px 14px -6px rgba(0, 0, 0, .4);
}

.btn:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: 0 8px 28px -8px rgba(0, 0, 0, .65);
}

.btn:active:not(:disabled) {
  transform: translateY(-1px);
}

.btn:disabled {
  opacity: .4;
  cursor: not-allowed;
}

.btn.outline {
  background: transparent;
  color: #e2e8f0;
  border: 1px solid rgba(255, 255, 255, 0.35);
  box-shadow: none;
}

.btn.outline:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.15);
}

.btn.ghost {
  background: rgba(255, 255, 255, 0.1);
  color: #e2e8f0;
  box-shadow: none;
}

.btn.ghost:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.2);
}

.btn.danger {
  --btn-bg: #dc2626;
  --btn-fg: #fff;
}

.btn.danger.outline {
  background: transparent;
  color: #fca5a5;
  border: 1px solid #dc2626;
}

.btn.danger.outline:hover {
  background: #dc2626;
  color: #fff;
}

.btn.tiny {
  padding: .4rem .55rem;
  font-size: .55rem;
  letter-spacing: .5px;
}

.btn.small {
  padding: .5rem .75rem;
  font-size: .6rem;
}

.icon {
  width: 18px;
  height: 18px;
  stroke-width: 2;
}

.icon.mini {
  width: 14px;
  height: 14px;
}

.flip {
  transform: scaleY(-1);
}

.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 3rem 1rem;
  background: rgba(255, 255, 255, 0.06);
  border: 1px dashed rgba(255, 255, 255, 0.25);
  border-radius: 1rem;
  display: flex;
  flex-direction: column;
  gap: .85rem;
  color: #94a3b8;
  font-size: .85rem;
  letter-spacing: .5px;
}

.empty-state .icon.large {
  width: 46px;
  height: 46px;
  stroke-width: 1.5;
  margin: 0 auto;
  opacity: .8;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: .9rem;
  margin-top: .5rem;
  flex-wrap: wrap;
  font-size: .65rem;
  color: #cbd5e1;
  letter-spacing: .4px;
}

.pager-label {
  font-weight: 600;
}

/* Agreement Modal Styles */
.agreement-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.agreement-modal-container {
  width: 100%;
  max-width: 500px;
  background: rgba(30, 41, 59, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 1rem;
  box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  max-height: 80vh;
}

.agreement-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.15);
}

.agreement-modal-header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #f1f5f9;
}

.modal-close-btn {
  background: none;
  border: none;
  color: #94a3b8;
  font-size: 1.75rem;
  line-height: 1;
  cursor: pointer;
  transition: color 0.2s;
}

.modal-close-btn:hover {
  color: #fff;
}

.agreement-modal-body {
  padding: 1.25rem;
  overflow-y: auto;
  color: #cbd5e1;
  font-size: 0.85rem;
  line-height: 1.6;
}

.agreement-modal-body p {
  margin: 0;
  white-space: pre-wrap; /* Preserve line breaks from textarea */
}

.btn-icon {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #cbd5e1;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}

.btn-icon:hover {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
}

.btn-icon .icon.mini {
  width: 14px;
  height: 14px;
}

@media (max-width: 620px) {
  .cards-grid {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  }

  .order-card {
    padding: .9rem .85rem .95rem;
  }

  .card-head .oid {
    font-size: .9rem;
  }

  .expand-btn {
    font-size: .58rem;
  }

  .info-line .lbl {
    font-size: .55rem;
  }
}
</style>
