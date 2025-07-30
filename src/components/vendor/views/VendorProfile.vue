<script setup>
// VendorProfileDark.vue (v3)
// - Fix: profile info no longer hidden / overlapped by cards (moved into normal flow).
// - Add: payout method selection (GCash, BDO, etc.) in Withdraw modal w/ masked acct display.
// - Cleaned up global listeners, focus mgmt, and a11y.

import { ref, reactive, computed, onMounted, onUnmounted, nextTick, watch } from "vue";
import { storeToRefs } from "pinia";
import {
  PencilSquareIcon,
  WalletIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  UsersIcon,
  EyeIcon,
  StarIcon,
  ShoppingBagIcon,
  ChartBarIcon,
} from "@heroicons/vue/24/outline";
import { useVendorDashboardStore } from "../../../stores/vendor/dashboardStores";
import { formatToPHCurrency } from "../../../utils/currencyFormat";

/* ----------------------- Store ----------------------- */
const vendorDashboard = useVendorDashboardStore();
const { vendor } = storeToRefs(vendorDashboard);

/* Auto‑fetch vendor on mount if needed */
onMounted(() => {
  if (!vendor.value && typeof vendorDashboard.fetchVendor === "function") {
    vendorDashboard.fetchVendor();
  }
});

/* Re‑fetch if store exposes a vendorId prop that changes (optional) */
watch(
  () => vendorDashboard.vendorId,
  (id, old) => {
    if (id && id !== old && typeof vendorDashboard.fetchVendor === "function") {
      vendorDashboard.fetchVendor();
    }
  }
);

/* --------------------- Constants --------------------- */
const defaultAvatar = "https://via.placeholder.com/160?text=Store";
const defaultBanner = "https://via.placeholder.com/1200x300?text=Banner";

/* -------------------- Computed UI -------------------- */
const followerCount = computed(() => vendor.value?.followers?.length ?? 0);
const profileViews  = computed(() => vendor.value?.profileViews ?? 0);
const totalOrders   = computed(() => vendor.value?.totalOrders ?? 0);
const rating        = computed(() => vendor.value?.rating ?? 0);

const fullAddress = computed(() => {
  const a = vendor.value?.address || {};
  const parts = [a.street, a.barangay, a.city, a.province, a.zipCode]
    .map((s) => (s || "").trim())
    .filter(Boolean);
  return parts.join(", ");
});

/* ---------------- Modal State + Helpers --------------- */
const showEditModal     = ref(false);
const showCashInModal   = ref(false);
const showWithdrawModal = ref(false);

/* dedicated focus refs for accessibility */
const editFirstEl = ref(null);
const cashInFirstEl = ref(null);
const withdrawFirstEl = ref(null);

const focusEditModal = async () => { await nextTick(); editFirstEl.value?.focus?.(); };
const focusCashInModal = async () => { await nextTick(); cashInFirstEl.value?.focus?.(); };
const focusWithdrawModal = async () => { await nextTick(); withdrawFirstEl.value?.focus?.(); };

/* Global key handler: Escape closes topmost modal */
const handleEsc = (e) => {
  if (e.key === "Escape") {
    if (showWithdrawModal.value) showWithdrawModal.value = false;
    else if (showCashInModal.value) showCashInModal.value = false;
    else if (showEditModal.value) showEditModal.value = false;
  }
};

document.addEventListener("keydown", handleEsc);

/* Clean up */
onUnmounted(() => {
  document.removeEventListener("keydown", handleEsc);
});

/* ------------------- Edit Form ----------------------- */
const editForm = reactive({
  storeName: "",
  description: "",
  street: "",
  barangay: "",
  city: "",
  province: "",
  zipCode: "",
  imageUrl: "",
  bannerUrl: "",
});

const editErrors = ref({});

const openEditModal = () => {
  const v = vendor.value ?? {};
  Object.assign(editForm, {
    storeName: v.storeName || "",
    description: v.description || "",
    imageUrl: v.imageUrl || "",
    bannerUrl: v.bannerUrl || "",
    street: v.address?.street || "",
    barangay: v.address?.barangay || "",
    city: v.address?.city || "",
    province: v.address?.province || "",
    zipCode: v.address?.zipCode || "",
  });
  editErrors.value = {};
  showEditModal.value = true;
  focusEditModal();
};

const validateEdit = () => {
  const errs = {};
  if (!editForm.storeName.trim()) errs.storeName = "Store name is required.";
  editErrors.value = errs;
  return Object.keys(errs).length === 0;
};

const saveEdit = async () => {
  if (!validateEdit()) return;
  const payload = {
    storeName: editForm.storeName.trim(),
    description: editForm.description.trim(),
    imageUrl: editForm.imageUrl.trim(),
    bannerUrl: editForm.bannerUrl.trim(),
    address: {
      street: editForm.street.trim(),
      barangay: editForm.barangay.trim(),
      city: editForm.city.trim(),
      province: editForm.province.trim(),
      zipCode: editForm.zipCode.trim(),
    },
  };
  try {
    await vendorDashboard.updateVendor?.(payload);
  } catch (err) {
    console.error("Vendor update failed:", err);
  }
  showEditModal.value = false;
};

/* ------------------- Wallet -------------------------- */
const walletCash = computed(() => vendor.value?.accountBalance?.cash ?? 0);
const walletUsdt = computed(() => vendor.value?.accountBalance?.usdt ?? 0);

// ---- payout accounts ----
const fallbackPayoutAccounts = [
  { id: "gcash", type: "gcash", label: "GCash ****1234", accountMasked: "****1234" },
  { id: "bdo",   type: "bdo",   label: "BDO ****9876",   accountMasked: "****9876" },
];

function maskAcct(num) {
  if (!num) return "****";
  const s = String(num).replace(/\s+/g, "");
  const last4 = s.slice(-4);
  return "****" + last4;
}

const payoutAccounts = computed(() => {
  const list = vendor.value?.payoutAccounts;
  if (Array.isArray(list) && list.length) {
    return list.map((p, i) => ({
      id: p.id ?? "payout-" + i,
      type: p.type ?? "other",
      label: p.label || ((p.type ? p.type.toUpperCase() : "ACCT") + " " + maskAcct(p.accountNumber || p.walletId)),
      accountMasked: maskAcct(p.accountNumber || p.walletId),
      raw: p,
    }));
  }
  return fallbackPayoutAccounts;
});

const selectedPayoutId = ref(null);

watch(
  payoutAccounts,
  (newList) => {
    if (!newList?.length) selectedPayoutId.value = null;
    else if (!selectedPayoutId.value || !newList.some((p) => p.id === selectedPayoutId.value)) {
      selectedPayoutId.value = newList[0].id;
    }
  },
  { immediate: true }
);

const selectedPayout = computed(() => payoutAccounts.value.find((p) => p.id === selectedPayoutId.value) || null);

/* withdraw + cash in form state */
const cashInAmount     = ref("");
const withdrawAmount   = ref("");
const walletError      = ref("");

const openCashIn = () => {
  walletError.value = "";
  cashInAmount.value = "";
  showCashInModal.value = true;
  focusCashInModal();
};

const openWithdraw = () => {
  walletError.value = "";
  withdrawAmount.value = "";
  showWithdrawModal.value = true;
  focusWithdrawModal();
};

const cashIn = async () => {
  const amt = Number(cashInAmount.value);
  if (isNaN(amt) || amt <= 0) {
    walletError.value = "Invalid amount.";
    return;
  }
  try {
    await vendorDashboard.cashIn?.({ amount: amt, currency: "cash" });
    showCashInModal.value = false;
  } catch (err) {
    console.error(err);
    walletError.value = "Cash in failed.";
  }
};

const withdraw = async () => {
  const amt = Number(withdrawAmount.value);
  if (isNaN(amt) || amt <= 0) {
    walletError.value = "Invalid amount.";
    return;
  }
  if (amt > walletCash.value) {
    walletError.value = "Insufficient balance.";
    return;
  }
  const account = selectedPayout.value;
  try {
    await vendorDashboard.withdraw?.({ amount: amt, currency: "cash", payoutAccountId: account?.id });
    showWithdrawModal.value = false;
  } catch (err) {
    console.error(err);
    walletError.value = "Withdraw failed.";
  }
};

/* ------------------- Analytics ----------------------- */
const revenueRows = computed(() => {
  const months = vendor.value?.monthlyRevenueComparison ?? [];
  if (!months.length) return [];
  const max = Math.max(
    1,
    ...months.map((m) => Number(m.currentValue) || 0),
    ...months.map((m) => Number(m.previousValue) || 0)
  );
  return months.map((m) => {
    const cv = Number(m.currentValue) || 0;
    const pv = Number(m.previousValue) || 0;
    return {
      id: m.month || Math.random().toString(36).slice(2),
      month: (m.month || "").slice(0, 3),
      current: cv,
      previous: pv,
      currentPct: (cv / max) * 100,
      previousPct: (pv / max) * 100,
    };
  });
});

/* -------------------- Loading / State ---------------- */
const isLoading = computed(() => vendorDashboard.loading ?? false);
const hasVendor = computed(() => !!vendor.value);
const loadError = computed(() => vendorDashboard.error ?? "");
</script>

<template>
  <div class="vendor-profile" :data-loaded="hasVendor">
    <!-- Loading State -->
    <div v-if="isLoading && !hasVendor" class="loading-wrapper">
      <div class="skeleton-banner"></div>
      <div class="skeleton-card" v-for="n in 3" :key="n"></div>
    </div>

    <!-- Error State -->
    <div v-else-if="!isLoading && !hasVendor && loadError" class="error-state">
      <p>We couldn't load your vendor profile. Please try again.</p>
      <button class="btn btn-blue" @click="vendorDashboard.fetchVendor?.()">Retry</button>
    </div>

    <template v-else>
      <!-- Decorative Banner -->
      <header
        class="banner"
        role="img"
        :aria-label="vendor?.storeName ? vendor.storeName + ' banner' : 'Vendor banner'"
        :style="{ backgroundImage: 'url(' + (vendor?.bannerUrl || defaultBanner) + ')' }"
      >
        <div class="banner-overlay"></div>
      </header>

      <!-- Profile Header (now in normal flow; never hidden) -->
      <div class="profile-header">
        <img
          :src="vendor?.imageUrl || defaultAvatar"
          class="profile-header-avatar"
          alt="Store avatar"
          loading="lazy"
        />
        <div class="profile-header-text">
          <h1 class="store-name">{{ vendor?.storeName || 'Vendor Store' }}</h1>
          <p class="store-desc">{{ vendor?.description || 'No description available.' }}</p>
          <p v-if="fullAddress" class="store-address">{{ fullAddress }}</p>
          <button class="btn edit-btn" type="button" @click="openEditModal">
            <PencilSquareIcon class="icon" />
            <span>Edit Profile</span>
          </button>
        </div>
      </div>

      <div class="cards-container">
        <!-- Wallet -->
        <section class="card wallet-card" aria-labelledby="wallet-heading">
          <h2 id="wallet-heading" class="card-title">
            <WalletIcon class="icon" />
            <span>Wallet</span>
          </h2>
          <div class="balances">
            <div class="balance">
              <span class="label">Cash</span>
              <span class="amount">{{ formatToPHCurrency(walletCash) }}</span>
            </div>
            <div class="balance">
              <span class="label">USDT</span>
              <span class="amount">{{ walletUsdt.toFixed(2) }} USDT</span>
            </div>
          </div>
          <div class="wallet-actions">
            <button class="btn btn-green" type="button" @click="openCashIn">
              <ArrowDownTrayIcon class="icon" />
              <span>Cash In</span>
            </button>
            <button class="btn btn-blue" type="button" @click="openWithdraw">
              <ArrowUpTrayIcon class="icon" />
              <span>Withdraw</span>
            </button>
          </div>
        </section>

        <!-- Stats -->
        <section class="card stats-card" aria-label="Vendor stats summary">
          <div class="stat">
            <UsersIcon class="icon" />
            <span class="stat-value">{{ followerCount }}</span>
            <span class="stat-label">Followers</span>
          </div>
          <div class="stat">
            <EyeIcon class="icon" />
            <span class="stat-value">{{ profileViews }}</span>
            <span class="stat-label">Views</span>
          </div>
          <div class="stat">
            <ShoppingBagIcon class="icon" />
            <span class="stat-value">{{ totalOrders }}</span>
            <span class="stat-label">Orders</span>
          </div>
          <div class="stat">
            <StarIcon class="icon" />
            <span class="stat-value">{{ rating.toFixed(1) }}</span>
            <span class="stat-label">Rating</span>
          </div>
        </section>

        <!-- Analytics -->
        <section class="card analytics-card" aria-labelledby="analytics-heading">
          <h2 id="analytics-heading" class="card-title">
            <ChartBarIcon class="icon" />
            <span>Revenue Analytics</span>
          </h2>
          <div v-if="revenueRows.length" class="mini-chart">
            <div v-for="row in revenueRows" :key="row.id" class="mini-row">
              <span class="mini-label">{{ row.month }}</span>
              <div class="mini-bars">
                <span class="mini-bar current" :style="{ width: row.currentPct + '%' }"></span>
                <span class="mini-bar previous" :style="{ width: row.previousPct + '%' }"></span>
              </div>
              <span class="mini-value">{{ formatToPHCurrency(row.current) }}</span>
            </div>
          </div>
          <div v-else class="chart-placeholder">No revenue data.</div>
        </section>
      </div>
    </template>

    <!-- =================== Edit Profile Modal =================== -->
    <transition name="fade-scale">
      <div
        v-if="showEditModal"
        class="modal-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-profile-title"
        @click.self="showEditModal = false"
      >
        <div class="modal">
          <h3 id="edit-profile-title" class="modal-title">Edit Profile</h3>

          <label class="form-field">
            <span>Store Name *</span>
            <input v-model="editForm.storeName" ref="editFirstEl" type="text" />
            <span v-if="editErrors.storeName" class="error">{{ editErrors.storeName }}</span>
          </label>

          <label class="form-field">
            <span>Description</span>
            <textarea v-model="editForm.description" rows="2"></textarea>
          </label>

          <label class="form-field">
            <span>Profile Image URL</span>
            <input v-model="editForm.imageUrl" type="url" />
          </label>

          <label class="form-field">
            <span>Banner Image URL</span>
            <input v-model="editForm.bannerUrl" type="url" />
          </label>

          <details class="address-details">
            <summary>Address (optional)</summary>
            <div class="address-grid">
              <input v-model="editForm.street" placeholder="Street" />
              <input v-model="editForm.barangay" placeholder="Barangay" />
              <input v-model="editForm.city" placeholder="City" />
              <input v-model="editForm.province" placeholder="Province" />
              <input v-model="editForm.zipCode" placeholder="ZIP Code" />
            </div>
          </details>

          <div class="modal-actions">
            <button class="btn btn-blue" type="button" @click="saveEdit">Save</button>
            <button class="btn btn-red" type="button" @click="showEditModal = false">Cancel</button>
          </div>
        </div>
      </div>
    </transition>

    <!-- =================== Cash In Modal =================== -->
    <transition name="fade-scale">
      <div
        v-if="showCashInModal"
        class="modal-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cashin-title"
        @click.self="showCashInModal = false"
      >
        <div class="modal">
          <h3 id="cashin-title" class="modal-title">Cash In</h3>
          <label class="form-field">
            <span>Amount</span>
            <input v-model="cashInAmount" type="number" inputmode="decimal" min="0" ref="cashInFirstEl" />
          </label>
          <p v-if="walletError" class="error" aria-live="polite">{{ walletError }}</p>
          <div class="modal-actions">
            <button class="btn btn-green" type="button" @click="cashIn">Confirm</button>
            <button class="btn btn-red" type="button" @click="showCashInModal = false">Cancel</button>
          </div>
        </div>
      </div>
    </transition>

    <!-- =================== Withdraw Modal =================== -->
    <transition name="fade-scale">
      <div
        v-if="showWithdrawModal"
        class="modal-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="withdraw-title"
        @click.self="showWithdrawModal = false"
      >
        <div class="modal">
          <h3 id="withdraw-title" class="modal-title">Withdraw</h3>

          <label class="form-field">
            <span>Amount</span>
            <input v-model="withdrawAmount" type="number" inputmode="decimal" min="0" ref="withdrawFirstEl" />
          </label>

          <label class="form-field">
            <span>Withdraw To</span>
            <select v-model="selectedPayoutId">
              <option v-for="acct in payoutAccounts" :key="acct.id" :value="acct.id">{{ acct.label }}</option>
            </select>
          </label>

          <div v-if="selectedPayout" class="payout-preview">
            <p class="payout-preview-line">{{ selectedPayout.label }}</p>
          </div>

          <p v-if="walletError" class="error" aria-live="polite">{{ walletError }}</p>
          <div class="modal-actions">
            <button class="btn btn-blue" type="button" @click="withdraw">Confirm</button>
            <button class="btn btn-red" type="button" @click="showWithdrawModal = false">Cancel</button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
/***** THEME TOKENS *********************************************************/
:host, .vendor-profile {
  --vp-bg: rgb(21, 30, 46);
  --vp-bg-card: rgba(255, 255, 255, 0.05);
  --vp-bg-card-hover: rgba(255, 255, 255, 0.08);
  --vp-bg-card-active: rgba(255, 255, 255, 0.12);
  --vp-text: #ffffff;
  --vp-text-muted: rgba(255, 255, 255, 0.65);
  --vp-border: rgba(255, 255, 255, 0.15);
  --vp-border-strong: rgba(255, 255, 255, 0.25);
  --vp-accent-blue: #3b82f6;
  --vp-accent-green: #10b981;
  --vp-accent-red: #ef4444;
  --vp-radius: 12px;
  --vp-shadow: 0 4px 16px rgba(0,0,0,.4);
  --vp-shadow-sm: 0 2px 8px rgba(0,0,0,.35);
  --vp-transition: 160ms ease-in-out;
}

.vendor-profile {
  width: 100%;
  background: var(--vp-bg);
  color: var(--vp-text);
  font-family: "Inter", sans-serif;
  padding-bottom: rem;
  line-height: 1.4;
  overflow: auto;
}

.vendor-profile[data-loaded="true"] {
  transition: opacity var(--vp-transition);
}

/* Loading */
.loading-wrapper { padding: 2rem; }
.skeleton-banner {
  height: 200px; margin-bottom: 3.5rem; border-radius: var(--vp-radius);
  background: linear-gradient(90deg, rgba(255,255,255,.08) 25%, rgba(255,255,255,.15) 37%, rgba(255,255,255,.08) 63%);
  background-size: 400% 100%; animation: shimmer 1.6s infinite;
}
.skeleton-card {
  height: 160px; margin: 1rem 0; border-radius: var(--vp-radius);
  background: linear-gradient(90deg, rgba(255,255,255,.05) 25%, rgba(255,255,255,.12) 37%, rgba(255,255,255,.05) 63%);
  background-size: 400% 100%; animation: shimmer 1.6s infinite;
}
@keyframes shimmer { 0%{background-position:200% 0;}100%{background-position:-200% 0;} }

/* Error */
.error-state{margin:0 auto;padding:4rem 1rem;max-width:480px;text-align:center;color:var(--vp-text-muted);} .error-state p{margin-bottom:1rem;}

/* Banner */
.banner{position:relative;height:200px;width:100%;background-size:cover;background-position:center;border-bottom:1px solid var(--vp-border);overflow:hidden;}
.banner-overlay{position:absolute;inset:0;background:linear-gradient(to bottom,rgba(0,0,0,.0) 0%,rgba(0,0,0,.6) 100%);pointer-events:none;}

/* Profile Header */
.profile-header{width:100%;max-width:1200px;margin:0 auto;padding-inline:clamp(1rem,3vw,2rem);padding-top:1.25rem;padding-bottom:2.5rem;display:grid;grid-template-columns:auto 1fr;gap:clamp(1rem,3vw,2rem);align-items:end;}
@media (max-width:480px){.profile-header{grid-template-columns:1fr;grid-template-rows:auto auto;text-align:center;align-items:center;}}
.profile-header-avatar{width:clamp(96px,16vw,128px);height:clamp(96px,16vw,128px);border-radius:50%;border:4px solid var(--vp-bg-card-hover);object-fit:cover;background:var(--vp-bg-card);justify-self:start;}@media (max-width:480px){.profile-header-avatar{justify-self:center;}}
.profile-header-text{max-width:min(90vw,640px);} 
.store-name{margin:0;font-size:clamp(1.5rem,3vw,2rem);font-weight:700;color:var(--vp-text);} 
.store-desc{margin:.25rem 0;color:var(--vp-text-muted);font-size:1rem;} 
.store-address{margin:0 0 .75rem;color:var(--vp-text-muted);font-size:.9rem;}
.edit-btn{--btn-bg:var(--vp-accent-blue);} 

/* Cards Layout */
.cards-container{width:100%;max-width:1200px;margin:0 auto;padding-inline:clamp(1rem,3vw,2rem);margin-top:0;display:grid;grid-template-columns:1fr;gap:1.5rem;}@media (min-width:640px){.cards-container{grid-template-columns:repeat(auto-fit,minmax(min(100%,360px),1fr));}}
.card{position:relative;background:var(--vp-bg-card);border:1px solid var(--vp-border);border-radius:var(--vp-radius);padding:1.5rem;box-shadow:var(--vp-shadow-sm);transition:background var(--vp-transition),box-shadow var(--vp-transition),transform var(--vp-transition);} .card:hover{background:var(--vp-bg-card-hover);box-shadow:var(--vp-shadow);transform:translateY(-2px);} .card:active{background:var(--vp-bg-card-active);} .card-title{margin:0 0 1.25rem;display:flex;align-items:center;gap:.5rem;font-size:1rem;font-weight:600;color:var(--vp-text);} 

/* Wallet */
.wallet-card .balances{display:flex;justify-content:space-between;margin-bottom:1.25rem;gap:1.5rem;} .balance{display:flex;flex-direction:column;min-width:0;} .balance .label{font-size:.85rem;color:var(--vp-text-muted);} .balance .amount{margin-top:.25rem;font-size:1.25rem;font-weight:700;color:var(--vp-text);word-break:break-word;} .wallet-actions{display:flex;flex-wrap:wrap;gap:.75rem;}

/* Stats */
.stats-card{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:1.25rem;text-align:center;font-weight:500;} .stat{display:flex;flex-direction:column;align-items:center;gap:.25rem;color:var(--vp-text);} .stat-value{font-size:1.2rem;font-weight:700;line-height:1;} .stat-label{font-size:.8rem;color:var(--vp-text-muted);} 

/* Analytics */
.analytics-card .mini-chart{display:grid;gap:.75rem;} .mini-row{display:grid;grid-template-columns:40px 1fr auto;gap:.5rem;align-items:center;} .mini-label{font-size:.8rem;color:var(--vp-text-muted);text-transform:uppercase;letter-spacing:.5px;} .mini-bars{position:relative;height:8px;background:rgba(255,255,255,.12);border-radius:4px;overflow:hidden;} .mini-bar{position:absolute;top:0;bottom:0;transition:width var(--vp-transition);} .mini-bar.current{background:var(--vp-accent-green);} .mini-bar.previous{background:var(--vp-accent-blue);opacity:.6;} .mini-value{font-size:.8rem;color:var(--vp-text-muted);text-align:right;} .chart-placeholder{text-align:center;padding:1rem 0;font-size:.9rem;color:var(--vp-text-muted);} 

/* Buttons */
.btn{--btn-bg:var(--vp-accent-blue);background:var(--btn-bg);padding:.45rem 1.1rem;border-radius:6px;color:#fff;display:inline-flex;align-items:center;gap:.4rem;cursor:pointer;border:none;font-size:.9rem;font-weight:600;line-height:1;transition:filter var(--vp-transition),transform var(--vp-transition),box-shadow var(--vp-transition);} .btn:hover{filter:brightness(1.05);transform:translateY(-1px);box-shadow:var(--vp-shadow-sm);} .btn:active{filter:brightness(.95);transform:translateY(0);box-shadow:none;} .btn-green{--btn-bg:var(--vp-accent-green);} .btn-blue{--btn-bg:var(--vp-accent-blue);} .btn-red{--btn-bg:var(--vp-accent-red);} .icon{width:18px;height:18px;stroke-width:2;flex-shrink:0;}

/* Modals */
.modal-overlay{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;padding:1rem;background:rgba(0,0,0,.6);z-index:1000;} .modal{width:min(100%,480px);max-height:90vh;overflow-y:auto;background:var(--vp-bg);border:1px solid var(--vp-border-strong);border-radius:var(--vp-radius);padding:1.5rem;box-shadow:var(--vp-shadow);display:flex;flex-direction:column;gap:1rem;color:var(--vp-text);} .modal-title{margin:0;font-size:1.25rem;font-weight:600;color:var(--vp-text);} 
.form-field{display:flex;flex-direction:column;gap:.35rem;font-size:.9rem;} .form-field>span{color:var(--vp-text-muted);} .form-field input,.form-field textarea,.form-field select{width:100%;padding:.6rem .75rem;font-size:1rem;color:var(--vp-text);background:var(--vp-bg-card);border:1px solid var(--vp-border);border-radius:6px;outline:none;transition:border var(--vp-transition),background var(--vp-transition);} .form-field input:focus,.form-field textarea:focus,.form-field select:focus{border:1px solid var(--vp-accent-blue);background:var(--vp-bg-card-hover);} 
.address-details{font-size:.9rem;color:var(--vp-text-muted);} .address-details[open] summary{margin-bottom:.5rem;} .address-details summary{cursor:pointer;outline:none;} .address-grid{margin-top:.5rem;display:grid;grid-template-columns:1fr 1fr;gap:.5rem;} .address-grid input{padding:.55rem .75rem;font-size:.9rem;} @media(max-width:480px){.address-grid{grid-template-columns:1fr;}}
.payout-preview{padding:.5rem .75rem;background:var(--vp-bg-card-hover);border:1px solid var(--vp-border);border-radius:6px;font-size:.9rem;color:var(--vp-text);} .payout-preview-line{margin:0;}
.modal-actions{display:flex;justify-content:flex-end;gap:.75rem;margin-top:.5rem;}
.error{color:var(--vp-accent-red);font-size:.8rem;line-height:1.2;}

/* Transitions */
.fade-scale-enter-active,.fade-scale-leave-active{transition:opacity var(--vp-transition),transform var(--vp-transition);} .fade-scale-enter-from,.fade-scale-leave-to{opacity:0;transform:scale(.96);} 
</style>
