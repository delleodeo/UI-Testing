<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick, type Ref } from "vue";
import {
  AdjustmentsHorizontalIcon,
  MagnifyingGlassIcon,
  PhotoIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@heroicons/vue/24/outline";
import { ProductOption, Product } from "../../../types/product";
import { formatToPHCurrency } from "../../../utils/currencyFormat";
import { handleImageError } from "../../../utils/fallbackImage";
import { useVendorDashboardStore } from "../../../stores/vendor/dashboardStores";


const vendorDashboad = useVendorDashboardStore()

// data layer  
const products: Ref<Product[]> = computed(() => vendorDashboad.vendorProducts);


setTimeout(() => {
  console.table(products.value)
}, 100)
const loading = ref(false);
const updatingProductIds = ref<Set<string>>(new Set());
const updatingOptionIds = ref<Set<string>>(new Set());
const placeholderImg =
  "https://via.placeholder.com/400x240/334155/ffffff?text=No+Image";
const placeholderImgSmall =
  "https://via.placeholder.com/80x60/334155/ffffff?text=Img";


function productStock(p: Product): number {
  if (p.isOption && p.option?.length) {
    return p.option.reduce((sum, o) => sum + (o.stock || 0), 0);
  }
  return p.stock || 0;
}
function productSold(p: Product): number {
  if (p.isOption && p.option?.length) {
    return p.option.reduce((sum, o) => sum + (o.sold || 0), 0);
  }
  return p.sold || 0;
}
function productDisplayPrice(p: Product): number {
  if (p.isOption && p.option?.length) {
    return Math.min(...p.option.map(o => o.price ?? p.price));
  }
  return p.price;
}


/* ------------------------------------------------------------------ */
/* Data + Mock Service Layer                                          */
/* ------------------------------------------------------------------ */


function simulateDelay(ms = 300) {
  return new Promise(res => setTimeout(res, ms));
}
// async function fetchProducts() {
//   loading.value = true;
//   await simulateDelay(400);
//   loading.value = false;
// }

/* Clamp helper */
function clampStock(n: number) {
  return n < 0 ? 0 : n;
}

/* Adjust STOCK: product (non-option) */
async function adjustProductStockSrv(id: string, delta: number) {
  if (!delta) return;
  updatingProductIds.value.add(id);
  await simulateDelay(250);
  const p = products.value.find(s => s._id === id);
  if (p) {
    p.stock = clampStock((p.stock || 0) + delta);
  }
  updatingProductIds.value.delete(id);
}

/* Adjust STOCK: specific option */
async function adjustProductOptionStockSrv(pid: string, optKey: string, delta: number) {
  if (!delta) return;
  const ukey = `${pid}::${optKey}`;
  updatingOptionIds.value.add(ukey);
  await simulateDelay(250);
  const p = products.value.find(s => s._id === pid);
  if (p?.option?.length) {
    const idx = p.option.findIndex(
      o => (o._id ?? String(p.option!.indexOf(o))) === optKey
    );
    if (idx >= 0) {
      const o = p.option[idx];
      o.stock = clampStock((o.stock || 0) + delta);
    }
  }
  updatingOptionIds.value.delete(ukey);
}
function isOptionUpdating(pid: string, optKey: string) {
  return updatingOptionIds.value.has(`${pid}::${optKey}`);
}

/* ------------------------------------------------------------------ */
/* UI State                                                           */
/* ------------------------------------------------------------------ */
const showFilters = ref(false);
function toggleFilters() {
  showFilters.value = !showFilters.value;
}

const search = ref("");
type StockFilter = "all" | "in" | "out";
const filterStock = ref<StockFilter>("all");

type SortKey = "name" | "stock" | "stock_desc" | "price" | "price_desc";
const sortKey = ref<SortKey>("name");

/* expand */
const expanded = ref<Set<string>>(new Set());
function toggleExpand(id: string) {
  const set = new Set(expanded.value);
  set.has(id) ? set.delete(id) : set.add(id);
  expanded.value = set;
}
function isExpanded(id: string) {
  return expanded.value.has(id);
}

/* expand transitions */
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

const filteredProducts = computed<Product[]>(() => {
  const s = search.value.toLowerCase().trim();
  const f = filterStock.value;
  return products.value.filter(p => {
    if (s && !p.name.toLowerCase().includes(s)) return false;
    const stk = productStock(p);
    if (f === "in" && stk <= 0) return false;
    if (f === "out" && stk > 0) return false;
    return true;
  });
});

const sortedProducts = computed<Product[]>(() => {
  const arr = [...filteredProducts.value];
  switch (sortKey.value) {
    case "name":
      arr.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "stock":
      arr.sort((a, b) => productStock(a) - productStock(b));
      break;
    case "stock_desc":
      arr.sort((a, b) => productStock(b) - productStock(a));
      break;
    case "price":
      arr.sort((a, b) => productDisplayPrice(a) - productDisplayPrice(b));
      break;
    case "price_desc":
      arr.sort((a, b) => productDisplayPrice(b) - productDisplayPrice(a));
      break;
  }
  return arr;
});

/* ------------------------------------------------------------------ */
/* Pagination                                                         */
/* ------------------------------------------------------------------ */
const page = ref(1);
const pageSize = ref(12);
const pageCount = computed(() =>
  Math.max(1, Math.ceil(sortedProducts.value.length / pageSize.value))
);
const paged = computed(() => {
  const p = Math.min(page.value, pageCount.value) || 1;
  const start = (p - 1) * pageSize.value;
  return sortedProducts.value.slice(start, start + pageSize.value);
});
function prevPage() {
  if (page.value > 1) page.value--;
}
function nextPage() {
  if (page.value < pageCount.value) page.value++;
}
function applyFilters() {
  page.value = 1;
}
function resetFilters() {
  search.value = "";
  filterStock.value = "all";
  sortKey.value = "name";
  applyFilters();
}

/* ------------------------------------------------------------------ */
/* Stock UI helpers                                                   */
/* ------------------------------------------------------------------ */
const stockAdjustMap = reactive<Record<string, number | undefined>>({}); // product-level
const stockAdjustOptMap = reactive<Record<string, number | undefined>>({}); // pid::optKey

function optKeyFor(p: Product, o: ProductOption, idx: number) {
  return o._id ?? String(idx);
}
function getOptModelKey(pid: string, optKey: string) {
  return `${pid}::${optKey}`;
}

/* Product quick adjust */
function addOneProduct(p: Product) {
  adjustProductStockSrv(p._id, 1);
}
function minusOneProduct(p: Product) {
  adjustProductStockSrv(p._id, -1);
}
function applyProductCustomStock(p: Product) {
  const amt = Number(stockAdjustMap[p._id] || 0);
  if (amt) {
    vendorDashboad.adjustProductStock(p._id, null, amt)
    adjustProductStockSrv(p._id, amt);
    stockAdjustMap[p._id] = undefined;
  }
}

/* Option quick adjust */
async function addOneProductOption(p: Product, o: ProductOption, idx: number) {
  adjustProductOptionStockSrv(p._id, optKeyFor(p, o, idx), 1);
  await vendorDashboad.adjustProductStock(p._id, o._id, 1)
}
async function minusOneProductOption(p: Product, o: ProductOption, idx: number) {
  adjustProductOptionStockSrv(p._id, optKeyFor(p, o, idx), -1);
  await vendorDashboad.adjustProductStock(p._id, o._id, -1)
}
function applyProductOptionCustomStock(p: Product, o: ProductOption, idx: number) {

  const key = getOptModelKey(p._id, optKeyFor(p, o, idx));
  const amt = Number(stockAdjustOptMap[key] || 0);

  if (amt) {
    vendorDashboad.adjustProductStock(p._id, o._id, amt)
    adjustProductOptionStockSrv(p._id, optKeyFor(p, o, idx), amt);
    stockAdjustOptMap[key] = undefined;
  }
}

/* ------------------------------------------------------------------ */
/* Lifecycle                                                          */
/* ------------------------------------------------------------------ */
onMounted(() => {

});
</script>

<template>
  <div class="inventory-page">

    <div class="inv-controls">
      <div class="search-box">
        <MagnifyingGlassIcon class="icon" />
        <input v-model.trim="search" type="search" placeholder="Search products..." @input="applyFilters" />
      </div>

      <div class="sort-box">
        <label class="sort-label">Sort:</label>
        <select v-model="sortKey" @change="applyFilters">
          <option value="name">Name (A→Z)</option>
          <option value="stock">Stock (Low→High)</option>
          <option value="stock_desc">Stock (High→Low)</option>
          <option value="price">Price (Low→High)</option>
          <option value="price_desc">Price (High→Low)</option>
        </select>
      </div>

      <transition name="fade">
        <div class="inv-filters-panel">
          <div class="inv-filters-grid">
            <div class="filter-group">
              <select v-model="filterStock" @change="applyFilters">
                <option value="all">All</option>
                <option value="in">In Stock</option>
                <option value="out">Out of Stock</option>
              </select>
            </div>
          </div>
        </div>
      </transition>
    </div>

    <!-- Filter Panel -->


    <!-- Summary -->
    <div class="inv-summary">
      <span>{{ filteredProducts.length }} result<span v-if="filteredProducts.length !== 1">s</span></span>
      <span class="divider">|</span>
      <span>Page {{ page }} / {{ pageCount }}</span>
    </div>

    <!-- Grid -->
    <div class="inv-grid">
      <!-- Skeletons -->
      <div v-if="loading" v-for="n in 6" :key="'skel_' + n" class="inv-skel"></div>

      <!-- Cards -->
      <template v-else>
        <div v-for="p in paged" :key="p._id" :class="['inv-card', { updating: updatingProductIds.has(p._id) }]">
          <!-- Image -->
          <div class="card-img-wrapper">
            <img :src="p.imageUrls?.[0]" :alt="p.name" fetchpriority="high" loading="lazy" class="card-img"
              @error="handleImageError" />
            <div class="card-badges">
              <!-- Low only -->
              <span v-if="productStock(p) > 0 && productStock(p) <= 10" class="tag low">Low</span>
            </div>
          </div>

          <!-- Content -->
          <div class="card-body">
            <h2 class="p-name">{{ p.name }}</h2>

            <div class="p-metrics">
              <div class="p-metric">
                <span class="lbl">Price</span>
                <span class="val">{{ formatToPHCurrency(productDisplayPrice(p)) }}</span>
              </div>
              <div class="p-metric">
                <span class="lbl">Stock</span>
                <span class="val">{{ productStock(p) }}</span>
              </div>
              <div class="p-metric">
                <span class="lbl">Sold</span>
                <span class="val">{{ productSold(p) }}</span>
              </div>
            </div>

            <!-- Collapse Toggle (if options) -->
            <button v-if="p.isOption && p.option?.length" type="button" class="expand-btn" @click="toggleExpand(p._id)"
              :aria-expanded="isExpanded(p._id)">
              <span>{{
                isExpanded(p._id)
                  ? "Hide Options"
                  : "Show Options (" + p.option.length + ")"
              }}</span>
              <ChevronDownIcon v-if="!isExpanded(p._id)" class="icon mini" />
              <ChevronUpIcon v-else class="icon mini" />
            </button>

            <!-- Expandable Options -->
            <transition @enter="expandEnter" @after-enter="expandAfterEnter" @leave="expandLeave">
              <div v-show="isExpanded(p._id)" class="card-opt-wrapper">
                <ul class="card-opt-list">
                  <li v-for="(opt, i) in p.option" :key="p._id + '_opt_' + i" class="card-opt-row" :class="{
                    updating: isOptionUpdating(
                      p._id,
                      optKeyFor(p, opt, i)
                    ),
                  }">
                    <img :src="opt.imageUrl" :alt="p.name" loading="lazy" fetchpriority="low" class="card-opt-thumb"
                      @error="handleImageError" />
                    <div class="card-opt-meta">
                      <p class="card-opt-label">
                        {{ opt.label || "Option " + (i + 1) }}
                        <span v-if="opt.stock > 0 && opt.stock <= 10" class="card-opt-low">Low</span>
                      </p>
                      <p class="card-opt-sub muted">
                        {{ formatToPHCurrency(opt.price) }}
                        Stock: {{ opt.stock }}
                        Sold: {{ opt.sold }}
                      </p>
                    </div>

                    <!-- Option stock controls -->
                    <div class="card-opt-controls">

                      <!-- <div class="card-opt-actions">

                        <button class="btn tiny outline" type="button" @click="minusOneProductOption(p, opt, i)"
                          :disabled="isOptionUpdating(p._id, optKeyFor(p, opt, i)) ||
                            opt.stock <= 0
                            ">
                          −1
                        </button>
                        <button class="btn tiny outline" type="button" @click="addOneProductOption(p, opt, i)"
                          :disabled="isOptionUpdating(p._id, optKeyFor(p, opt, i))">
                          +1
                        </button>
                      </div> -->
                      <div class="opt-add-field">
                        <input v-model.number="stockAdjustOptMap[
                          getOptModelKey(p._id, optKeyFor(p, opt, i))
                        ]
                          " type="number" step="1" :placeholder="'±'" :disabled="isOptionUpdating(p._id, optKeyFor(p, opt, i))
                            " @keyup.enter="applyProductOptionCustomStock(p, opt, i)" />
                        <button class="btn tiny ghost" type="button" :disabled="isOptionUpdating(p._id, optKeyFor(p, opt, i)) ||
                          !(
                            stockAdjustOptMap[
                            getOptModelKey(p._id, optKeyFor(p, opt, i))
                            ] || 0
                          )
                          " @click="applyProductOptionCustomStock(p, opt, i)">
                          Apply
                        </button>
                      </div>
                    </div>
                  </li>
                </ul>
              </div>
            </transition>

            <!-- Product Stock Controls (non-option only) -->
            <div v-if="!p.isOption" class="stock-actions">
              <!-- <button class="btn tiny outline" type="button" @click="minusOneProduct(p)" :disabled="updatingProductIds.has(p._id) || productStock(p) <= 0
                ">
                −1
              </button>
              <button class="btn tiny outline" type="button" @click="addOneProduct(p)"
                :disabled="updatingProductIds.has(p._id)">
                +1
              </button> -->

              <div class="stock-add-field">
                <input v-model.number="stockAdjustMap[p._id]" type="number" step="1" :placeholder="'±'"
                  :disabled="updatingProductIds.has(p._id)" @keyup.enter="applyProductCustomStock(p)" />
                <button class="btn tiny ghost" type="button" :disabled="updatingProductIds.has(p._id) || !(stockAdjustMap[p._id] || 0)
                  " @click="applyProductCustomStock(p)">
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty -->
        <div v-if="!paged.length" class="inv-empty">
          <PhotoIcon class="icon large" />
          <p>No products found.</p>
        </div>
      </template>
    </div>

    <!-- Pagination -->
    <div v-if="pageCount > 1" class="inv-pager">
      <button class="btn tiny outline" type="button" :disabled="page === 1" @click="prevPage">
        Prev
      </button>
      <span class="pager-label">Page {{ page }} of {{ pageCount }}</span>
      <button class="btn tiny outline" type="button" :disabled="page === pageCount" @click="nextPage">
        Next
      </button>
    </div>
  </div>
</template>

<style scoped>
/* :root {
  --dashboard-primary: rgb(21, 30, 46);
  --text-color: #f1f5f9;
  --text-light: #cbd5e1;
  --text-light-2: #94a3b8;
  --low: #fbbf24;
  --card-bg: rgba(255, 255, 255, 0.08);
  --card-bg-hover: rgba(255, 255, 255, 0.14);
  --glass-border: rgba(255, 255, 255, 0.15);
  --glass-border-hover: rgba(255, 255, 255, 0.28);
  --radius-lg: 1rem;
  --radius-sm: 0.5rem;
  --focus-ring: 0 0 0 3px rgba(255, 255, 255, 0.35);
} */

.inventory-page {
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

/* Header */
.inv-header {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 0.75rem;
  align-items: center;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  padding: 0.9rem 1rem;
  backdrop-filter: blur(6px);
}

.inv-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: 0.4px;
  color: #fff;
}

.inv-header-actions {
  display: flex;
  gap: 0.45rem;
  flex-wrap: wrap;
}

/* Controls */
.inv-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem;
  align-items: center;
  justify-content: space-between;
}

.search-box {
  flex: 1 1 260px;
  display: flex;
  align-items: center;
  gap: 0.55rem;
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.18);
  padding: 0.65rem 0.85rem;
  border-radius: 0.9rem;
}

.search-box .icon {
  width: 18px;
  height: 18px;
  stroke-width: 2;
  color: var(--text-light-2);
}

.search-box input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: #fff;
  font: inherit;
  font-size: 0.88rem;
}

.search-box input::placeholder {
  color: var(--text-light-2);
}

.sort-box {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.18);
  padding: 0.45rem 0.65rem;
  border-radius: 0.9rem;
}

.sort-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-light-2);
  letter-spacing: 0.4px;
}

.sort-box select {
  background: transparent;
  border: none;
  outline: none;
  color: #fff;
  font: inherit;
  font-size: 0.88rem;
  cursor: pointer;
}

.sort-box select option {
  color: #000;
}



.inv-filters-grid {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 1rem;
  padding: 0px 7px;
}

.filter-group label {
  font-size: 0.55rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
  color: var(--text-light-2);
}

.filter-group select {
  background-color: transparent;

  padding: 0.6rem 1rem;
  border: 0;
  font-size: 0.75rem;
  color: white;
  font-family: inherit;
  outline: none;
  cursor: pointer;
}

.filter-group select option {
  color: black;
}

.filter-group select:focus {
  border-color: rgba(255, 255, 255, 0.38);
}

.filters-actions {
  display: flex;
  justify-content: flex-end;
}

/* Summary */
.inv-summary {
  font-size: 0.7rem;
  display: flex;
  gap: 0.7rem;
  align-items: center;
  letter-spacing: 0.5px;
  color: var(--text-light-2);
  text-transform: uppercase;
  font-weight: 600;
  flex-wrap: wrap;
}

.inv-summary .divider {
  opacity: 0.35;
}

/* Grid */
.inv-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fill, minmax(310px, 1fr));
  align-items: start;
}

/* Skeleton */
.inv-skel {
  height: 320px;
  border-radius: var(--radius-lg);
  background: linear-gradient(110deg,
      rgba(255, 255, 255, 0.05) 25%,
      rgba(255, 255, 255, 0.09) 35%,
      rgba(255, 255, 255, 0.05) 55%);
  background-size: 200% 100%;
  animation: shimmer 1.5s linear infinite;
}

@keyframes shimmer {
  to {
    background-position: -200% 0;
  }
}

/* Card */
.inv-card {
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

.inv-card:hover {
  border-color: var(--glass-border-hover);
  transform: translateY(-4px);
  box-shadow: 0 10px 28px -6px rgba(0, 0, 0, 0.55);
}

.inv-card.updating {
  opacity: 0.55;
  pointer-events: none;
}

/* Card image */
.card-img-wrapper {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 2.4;
  background: #334155;
  overflow: hidden;
}

.card-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 1rem;
  overflow: hidden;
}

.card-badges {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  display: flex;
  gap: 0.3rem;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.tag.low {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 2px 6px;
  font-size: 0.6rem;
  font-weight: 700;
  border-radius: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: var(--low);
  color: #000;
}

/* Card body */
.card-body {
  padding: 1rem 0.95rem 1.1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.p-name {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0.4px;
  color: #fff;
}

.p-metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.55rem;
  font-size: 0.75rem;
  text-align: center;
  text-align: start;
}

.p-metric .lbl {
  display: block;
  font-size: 0.55rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-light-2);
  margin-bottom: 2px;
  font-weight: 600;
}

.p-metric .val {
  font-weight: 700;
  color: #fff;
  white-space: nowrap;
  font-size: 0.8rem;
}

/* Expand button */
.expand-btn {
  margin-top: 0.25rem;
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.15);
  padding: 0.55rem 0.7rem;
  border-radius: 0.75rem;
  font: inherit;
  font-size: 0.65rem;
  letter-spacing: 0.6px;
  text-transform: uppercase;
  font-weight: 600;
  cursor: pointer;
  color: var(--text-light);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background 0.3s, border-color 0.3s;
}

.expand-btn:hover {
  background: rgba(255, 255, 255, 0.14);
  border-color: rgba(255, 255, 255, 0.3);
}

/* Options */
.card-opt-wrapper {
  overflow: hidden;
  margin-top: 0.35rem;
}

.card-opt-list {
  list-style: none;
  margin: 0 0 0.8rem;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.card-opt-row {
  display: flex;
  gap: 0.7rem;
  align-items: center;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 0.75rem;
  padding: 0.55rem 0.65rem;
}

.card-opt-row.updating {
  opacity: 0.55;
  pointer-events: none;
}

.card-opt-thumb {
  width: 70px;
  height: 52px;
  object-fit: cover;
  border-radius: 0.55rem;
  background: #334155;
  flex-shrink: 0;
}

.card-opt-meta {
  flex: 1 1 auto;
}

.card-opt-label {
  margin: 0 0 2px;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.25px;
  color: #fff;
}

.card-opt-label .card-opt-low {
  margin-left: 0.25rem;
  font-size: 0.6rem;
  padding: 1px;
  border-radius: 0.35rem;
  background: var(--low);
  color: var(--secondary-color);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 700;
}

.card-opt-sub {
  margin: 0;
  font-size: 0.65rem;
  color: var(--text-light-2);
}

/* Option stock controls */
.card-opt-controls {
  display: flex;
  align-items: flex-start;
  gap: 0.35rem;
  flex-direction: column;
}

.card-opt-actions {
  display: flex;
  gap: 5px;
}

.opt-add-field {
  display: flex;
  gap: 0.25rem;
  align-items: center;
}

.opt-add-field input {
  width: 60px;
  padding: 0.35rem 0.45rem;
  font-size: 0.7rem;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 0.5rem;
  color: #fff;
  outline: none;

}

.opt-add-field input:focus {
  border-color: rgba(255, 255, 255, 0.38);
  box-shadow: var(--focus-ring);
}

/* Product stock controls */
.stock-actions {
  margin-top: 0.25rem;
  display: flex;
  gap: 0.45rem;
  flex-wrap: wrap;
  align-items: center;
}

.stock-add-field {
  display: flex;
  gap: 0.35rem;
  align-items: center;
}

.stock-add-field input {
  width: 70px;
  padding: 0.4rem 0.5rem;
  font-size: 0.75rem;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 0.5rem;
  color: #fff;
  outline: none;
}


input[type=number]::-webkit-inner-spin-button,
input[type=number]::-webkit-outer-spin-button {
  -webkit-appearance: none;
}


.stock-add-field input:focus {
  border-color: rgba(255, 255, 255, 0.38);
  box-shadow: var(--focus-ring);
}

/* Buttons */
.btn {
  --btn-bg: #fff;
  --btn-fg: var(--dashboard-primary);
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  border: none;
  background: var(--btn-bg);
  color: var(--btn-fg);
  font: inherit;
  font-weight: 600;
  padding: 0.55rem 0.85rem;
  border-radius: 0.6rem;
  font-size: 0.75rem;
  letter-spacing: 0.6px;
  cursor: pointer;
  position: relative;
  transition: background 0.3s, transform 0.25s, box-shadow 0.3s;
  box-shadow: 0 4px 14px -6px rgba(0, 0, 0, 0.4);
}

.btn:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: 0 8px 28px -8px rgba(0, 0, 0, 0.65);
}

.btn:active:not(:disabled) {
  transform: translateY(-1px);
}

.btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn.outline {
  background: transparent;
  color: var(--text-color);
  border: 1px solid rgba(255, 255, 255, 0.35);
  box-shadow: none;
  font-size: 0.7rem;
  padding: 0.4rem 0.6rem;
}

.btn.outline:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.15);
}

.btn.ghost {
  background: var(--primary-color);
  color: var(--text-color);
  box-shadow: none;
  font-size: 0.7rem;
  padding: 0.4rem 0.6rem;
}

.filter {
  border: 0;
  padding: 8px 1rem;
  background-color: var(--primary-color);
  border-radius: 1rem;
  color: white;
  cursor: pointer;
  transition: all 150ms ease-in-out;
}

.filter:hover {
  transform: scale(103%);
}


.btn.ghost:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.2);
}

.btn.tiny {
  padding: 0.4rem 0.55rem;
  font-size: 0.65rem;
  letter-spacing: 0.5px;
  color: white !important;
}

.btn.small {
  padding: 0.5rem 0.75rem;
  font-size: 0.7rem;
}

/* Icons */
.icon {
  width: 18px;
  height: 18px;
  stroke-width: 2;
}

.icon.mini {
  width: 14px;
  height: 14px;
}

.icon.large {
  width: 46px;
  height: 46px;
  stroke-width: 1.5;
}

/* Empty */
.inv-empty {
  grid-column: 1 / -1;
  text-align: center;
  padding: 3rem 1rem;
  background: rgba(255, 255, 255, 0.06);
  border: 1px dashed rgba(255, 255, 255, 0.25);
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  color: var(--text-light-2);
  font-size: 0.85rem;
  letter-spacing: 0.5px;
}

.inv-empty .icon.large {
  margin: 0 auto;
  opacity: 0.8;
}

/* Pager */
.inv-pager {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.9rem;
  margin-top: 0.5rem;
  flex-wrap: wrap;
  font-size: 0.8rem;
  color: var(--text-light);
  letter-spacing: 0.4px;
}

.pager-label {
  font-weight: 600;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Responsive */
@media (max-width: 620px) {
  .inv-grid {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  }

  .inv-header {
    padding: 0.75rem;
  }

  .inv-title {
    font-size: 1.1rem;
  }

  .p-name {
    font-size: 0.95rem;
  }

  .p-metric .val {
    font-size: 0.75rem;
  }

  .btn.tiny {
    font-size: 0.6rem;
  }
}
</style>
