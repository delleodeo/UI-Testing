<script setup lang="ts">
import {
  ref,
  computed,
  onMounted,
  onUnmounted,
  watch,
  nextTick,
  type Ref,
} from "vue";
import { useRouter } from "vue-router";
import OptionForm from "./OptionForm.vue";
import OptionEditForm from "./OptionEditForm.vue";
import ProductEditForm from "./ProductEditForm.vue";
import {
  Product,
  ProductOption as Option,
} from "../../types/product";
import { formatToPHCurrency } from "../../utils/currencyFormat";
import { useVendorDashboardStore } from "../../stores/vendor/dashboardStores";
import { confirmAndDeleteVariant } from "../composable/Alert";

/* Heroicons (outline) */
import {
  XMarkIcon,
  PencilSquareIcon,
  TrashIcon,
  PlusCircleIcon,
  SparklesIcon,
} from "@heroicons/vue/24/outline";

const vendorDashboardStore = useVendorDashboardStore();
const router = useRouter();

/* -----------------------------------
   Props & Emits
----------------------------------- */
const props = defineProps<{
  product: Product;
}>();

const emit = defineEmits<{
  close: [];
  "add-option": [productId: string, option: Omit<Option, "_id">];
  "update-product": [productId: string, product: Partial<Product>];
  "update-option": [
    productId: string,
    optionId: string,
    option: Partial<Option>
  ];
}>();

/* -----------------------------------
   Local UI State
----------------------------------- */
const showAddForm = ref(false);
const editingProduct = ref(false);
const editingOption = ref<string | null>(null);

/* show/hide modal fade scale handled by wrapper appear */
const isMounted = ref(false); // for transition enter

/* -----------------------------------
   Focus Trap
----------------------------------- */
const modalRoot: Ref<HTMLElement | null> = ref(null);
let lastActiveEl: Element | null = null;

function trapFocus(e: KeyboardEvent) {
  if (e.key !== "Tab") return;
  const root = modalRoot.value;
  if (!root) return;
  const focusable = root.querySelectorAll<
    HTMLElement
  >(
    'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])'
  );
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (e.shiftKey) {
    if (document.activeElement === first) {
      e.preventDefault();
      (last as HTMLElement).focus();
    }
  } else {
    if (document.activeElement === last) {
      e.preventDefault();
      (first as HTMLElement).focus();
    }
  }
}

function handleEsc(e: KeyboardEvent) {
  if (e.key === "Escape") closeModal();
}

/* -----------------------------------
   Mount / Unmount Side Effects
----------------------------------- */
onMounted(() => {
  lastActiveEl = document.activeElement;
  document.addEventListener("keydown", trapFocus);
  document.addEventListener("keydown", handleEsc);
  document.body.style.overflow = "hidden";
  // trigger enter transition
  requestAnimationFrame(() => (isMounted.value = true));
  // focus close btn after render
  nextTick(() => {
    modalRoot.value?.querySelector<HTMLElement>(".close-btn")?.focus();
  });
});

onUnmounted(() => {
  document.removeEventListener("keydown", trapFocus);
  document.removeEventListener("keydown", handleEsc);
  document.body.style.overflow = "";
  if (lastActiveEl instanceof HTMLElement) lastActiveEl.focus();
});

/* -----------------------------------
   Computed Safe Product Data
----------------------------------- */
const productImage = computed(() => {
  const imgs = props.product?.imageUrls ?? [];
  return imgs.length ? imgs[0] : "https://via.placeholder.com/600x400?text=No+Image";
});

const productDescription = computed(
  () => props.product?.description?.trim() || "No description."
);

const productStock = computed(() => props.product?.stock ?? 0);
const productSold = computed(() => props.product?.sold ?? 0);
const productRating = computed(() =>
  Number.isFinite(props.product?.averageRating)
    ? props.product.averageRating.toFixed(1)
    : "0.0"
);

/* Some products may have `option` missing; normalize */
const productOptions = computed<Option[]>(() => {
  const raw: any = (props.product as any).option ?? (props.product as any).options;
  return Array.isArray(raw) ? raw : [];
});

/* -----------------------------------
   UI Event Handlers
----------------------------------- */
function closeModal() {
  // fade out then emit close
  isMounted.value = false;
  setTimeout(() => emit("close"), 160); // match CSS leave
}

function handleOverlayClick() {
  closeModal();
}

function toggleEditProduct() {
  editingProduct.value = !editingProduct.value;
  if (editingProduct.value) {
    showAddForm.value = false;
    editingOption.value = null;
  }
}

function handleUpdateProduct(updatedProduct: Partial<Product>) {
  emit("update-product", props.product._id, updatedProduct);
  editingProduct.value = false;
}

function startEditOption(optionId: string) {
  editingOption.value = optionId;
  showAddForm.value = false;
  editingProduct.value = false;
}

function handleUpdateOption() {
  editingOption.value = null;
}

async function handleDeleteOption(productId: string, variantId: string) {
  try {
    const { isConfirmed } = await confirmAndDeleteVariant();
    if (!isConfirmed) return;
    await vendorDashboardStore.deleteProduct(productId, variantId);
  } catch (error) {
    console.error(error);
  }
}

async function deleteProduct(productId: string) {
  try {
    const { isConfirmed } = await confirmAndDeleteVariant();
    if (!isConfirmed) return;
    await vendorDashboardStore.deleteProduct(productId, null);
    closeModal();
  } catch (error) {
    console.error("Failed to delete product:", error);
  }
}

/* Reset sub-states if product prop changes (rare but safe) */
watch(
  () => props.product._id,
  () => {
    editingProduct.value = false;
    editingOption.value = null;
    showAddForm.value = false;
  }
);
</script>

<template>
  <div
    class="modal-overlay"
    :class="{ 'is-open': isMounted }"
    @click="handleOverlayClick"
  >
    <div
      ref="modalRoot"
      class="modal-content"
      role="dialog"
      aria-modal="true"
      :aria-label="product.name"
      @click.stop
    >
      <!-- Header -->
      <div class="modal-header">
        <h2 class="modal-title">
          <SparklesIcon class="icon" />
          {{ product.name }}
        </h2>
        <button
          @click="closeModal"
          class="close-btn"
          aria-label="Close"
          type="button"
        >
          <XMarkIcon class="icon" />
        </button>
      </div>

      <div class="modal-body">
        <!-- PRODUCT SUMMARY (hidden when editing product) -->
        <transition name="fade">
          <div
            v-if="!editingProduct"
            class="product-details"
          >
            <img
              :src="productImage"
              :alt="product.name"
              class="product-image"
            />

            <div class="product-info">
              <p class="description">{{ productDescription }}</p>
              <div class="meta-info">
                <div class="meta-item">
                  <span class="label">Stock:</span>
                  <span class="value">{{ productStock }}</span>
                </div>
                <div class="meta-item">
                  <span class="label">Sold:</span>
                  <span class="value">{{ productSold }}</span>
                </div>
                <div class="meta-item">
                  <span class="label">Rating:</span>
                  <span class="value">{{ productRating }}/5</span>
                </div>
                <div class="meta-item">
                  <span class="label">Price:</span>
                  <span class="value price">{{ formatToPHCurrency(product.price) }}</span>
                </div>
              </div>
            </div>
          </div>
        </transition>

        <!-- Header Actions -->
        <div class="header-actions" v-if="!editingProduct">
          <button
            @click="toggleEditProduct"
            class="btn tiny outline"
            type="button"
          >
            <PencilSquareIcon class="icon mini" /> Edit Product
          </button>
          <button
            @click="deleteProduct(product._id)"
            class="btn tiny danger outline"
            type="button"
          >
            <TrashIcon class="icon mini" /> Delete Product
          </button>
        </div>

        <!-- EDIT PRODUCT FORM -->
        <transition name="slide-v">
          <ProductEditForm
            v-if="editingProduct"
            :product="product"
            @successfullUpdate="closeModal"
            @submit="handleUpdateProduct"
            @cancel="editingProduct = false"
          />
        </transition>

        <!-- OPTIONS SECTION -->
        <div class="options-section">
          <div class="section-header">
            <h3>Product Options</h3>
            <button
              v-if="!showAddForm"
              @click="showAddForm = true"
              class="btn tiny outline"
              type="button"
            >
              <PlusCircleIcon class="icon mini" /> Add Option
            </button>
          </div>

          <!-- ADD OPTION FORM -->
          <transition name="slide-v">
            <OptionForm
              v-if="showAddForm"
              :productId="product._id"
              @cancel="showAddForm = false"
            />
          </transition>

          <!-- OPTIONS GRID -->
          <div
            v-if="productOptions.length > 0"
            class="options-grid"
          >
            <div
              v-for="option in productOptions"
              :key="option._id"
              class="option-card"
            >
              <!-- View Mode -->
              <template v-if="editingOption !== option._id">
                <div
                  v-if="option.imageUrl"
                  class="option-image"
                >
                  <img
                    :src="option.imageUrl"
                    :alt="option.label"
                  />
                </div>
                <div class="option-info">
                  <h4 class="option-label">
                    {{ option.label || "Unnamed Option" }}
                  </h4>
                  <div class="option-details">
                    <span class="option-price">
                      {{ formatToPHCurrency(option.price) }}
                    </span>
                    <span class="option-stock">Stock ({{ option.stock ?? 0 }})</span>
                    <span class="option-sold">Sold ({{ option.sold ?? 0 }})</span>
                  </div>
                  <div
                    v-if="option.isHot"
                    class="option-badge"
                  >
                    Hot
                  </div>
                  <div class="option-actions">
                    <button
                      @click="startEditOption(option._id)"
                      class="btn tiny outline"
                      type="button"
                    >
                      <PencilSquareIcon class="icon mini" /> Edit
                    </button>
                    <button
                      @click="handleDeleteOption(product._id, option._id)"
                      class="btn tiny danger outline"
                      type="button"
                    >
                      <TrashIcon class="icon mini" /> Delete
                    </button>
                  </div>
                </div>
              </template>

              <!-- Edit Mode -->
              <transition name="slide-v">
                <OptionEditForm
                  v-if="editingOption === option._id"
                  :option="option"
                  :productId="product._id"
                  @submit="handleUpdateOption"
                  @cancel="editingOption = null"
                />
              </transition>
            </div>
          </div>

          <!-- Empty State -->
          <div
            v-else-if="!showAddForm"
            class="empty-options"
          >
            <p>No options available for this product.</p>
          </div>
        </div>
      </div> <!-- /modal-body -->
    </div> <!-- /modal-content -->
  </div>
</template>

<style scoped>
/* ------- Transitions ------- */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-v-enter-active,
.slide-v-leave-active {
  transition: all 0.2s ease;
  overflow: hidden;
}
.slide-v-enter-from,
.slide-v-leave-to {
  opacity: 0;
  transform: translateY(-8px);
  max-height: 0;
}
.slide-v-enter-to,
.slide-v-leave-from {
  opacity: 1;
  transform: translateY(0);
  max-height: 1000px;
}

/* ------- Overlay ------- */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
  opacity: 0;
  transition: opacity 0.16s ease;
  padding: 1rem;
}
.modal-overlay.is-open {
  opacity: 1;
}

/* ------- Modal ------- */
.modal-content {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(16px);
  width: 100%;
  max-width: 1100px;
  max-height: 90vh;
  overflow-y: auto;
  border-radius: 1.25rem;
  box-shadow: 0 25px 60px -10px rgba(0, 0, 0, 0.7);
  color: #e2e8f0;
  position: relative;
  transform: scale(0.96) translateY(10px);
  opacity: 0;
  transition:
    opacity 0.16s ease,
    transform 0.16s ease;
}
.modal-overlay.is-open .modal-content {
  transform: scale(1) translateY(0);
  opacity: 1;
}

/* ------- Modal Header ------- */
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: .5rem;
  padding: 1.25rem 1.75rem 1rem;
  border-bottom: 1px solid rgba(255,255,255,.12);
}
.modal-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: .25px;
  display: inline-flex;
  align-items: center;
  gap: .5rem;
  color: #fff;
}
.modal-title .icon {
  width: 22px;
  height: 22px;
  stroke-width: 1.75;
}

.close-btn {
  background: rgba(255,255,255,.1);
  border: 1px solid rgba(255,255,255,.25);
  border-radius: .75rem;
  width: 32px;
  height: 32px;
  cursor: pointer;
  display: grid;
  place-items: center;
  line-height: 0;
  transition: background .2s, border-color .2s;
}
.close-btn .icon {
  width: 18px;
  height: 18px;
}
.close-btn:hover {
  background: rgba(255,255,255,.25);
  border-color: rgba(255,255,255,.4);
}

/* ------- Modal Body ------- */
.modal-body {
  padding: 2rem 1.75rem 2.5rem;
}

/* ------- Product Details ------- */
.product-details {
  display: grid;
  grid-template-columns: 360px 1fr;
  gap: 1.75rem;
  margin-bottom: 1.75rem;
}
.product-image {
  width: 100%;
  aspect-ratio: 4/2.5;
  object-fit: cover;
  border-radius: 1rem;
  border: 1px solid rgba(255,255,255,.15);
  background: rgba(255,255,255,.05);
}
.product-info .description {
  margin: 0 0 1.25rem;
  font-size: 0.95rem;
  line-height: 1.6;
  color: #cbd5e1;
  white-space: normal;
  overflow-wrap: break-word;
}
.meta-info {
  display: grid;
  gap: .65rem;
  font-size: .9rem;
}
.meta-item {
  display: flex;
  justify-content: space-between;
  gap: .75rem;
  padding-bottom: .65rem;
  border-bottom: 1px solid rgba(255,255,255,.08);
}
.meta-item .label {
  font-weight: 600;
  font-size: .8rem;
  color: #94a3b8;
  letter-spacing: .25px;
  text-transform: uppercase;
}
.meta-item .value {
  font-weight: 700;
  color: #fff;
  white-space: nowrap;
}
.meta-item .value.price {
  color: var(--secondary-color,#fbbf24);
}

/* ------- Header Actions ------- */
.header-actions {
  display: flex;
  gap: .75rem;
  flex-wrap: wrap;
  margin-bottom: 2rem;
}

/* ------- Button System ------- */
.btn {
  --btn-bg: #fff;
  --btn-fg: rgb(21,30,46);
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
  font-size: .75rem;
  letter-spacing: .6px;
  cursor: pointer;
  position: relative;
  transition: background .25s, transform .25s, box-shadow .25s;
  box-shadow: 0 4px 14px -6px rgba(0,0,0,.4);
}
.btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 28px -8px rgba(0,0,0,.65);
}
.btn:active:not(:disabled) {
  transform: translateY(-1px);
}
.btn:disabled {
  opacity: .4;
  cursor: not-allowed;
}

.btn.tiny {
  padding: .4rem .6rem;
  font-size: .7rem;
}
.btn.outline {
  --btn-bg: transparent;
  --btn-fg: #e2e8f0;
  border: 1px solid rgba(255,255,255,.35);
  box-shadow: none;
}
.btn.outline:hover:not(:disabled) {
  background: rgba(255,255,255,.15);
}
.btn.danger {
  --btn-bg: #dc2626;
  --btn-fg: #fff;
}
.btn.danger.outline {
  --btn-bg: transparent;
  --btn-fg: #fca5a5;
  border-color: #dc2626;
}
.btn.danger.outline:hover {
  background: #dc2626;
  color: #fff;
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

/* ------- Options Section ------- */
.options-section {
  border-top: 1px solid rgba(255,255,255,.1);
  padding-top: 2rem;
}
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: .75rem;
  margin-bottom: 1.5rem;
}
.section-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: #fff;
  letter-spacing: .25px;
}

/* ------- Options Grid ------- */
.options-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fill,minmax(270px,1fr));
  align-items: start;
}
.option-card {
  background: rgba(255,255,255,.08);
  border: 1px solid rgba(255,255,255,.15);
  border-radius: 1rem;
  overflow: hidden;
  backdrop-filter: blur(6px);
  transition: border-color .25s, transform .25s, box-shadow .25s;
  position: relative;
}
.option-card:hover {
  border-color: rgba(255,255,255,.28);
  transform: translateY(-3px);
  box-shadow: 0 10px 28px -6px rgba(0,0,0,.55);
}
.option-image {
  width: 100%;
  aspect-ratio: 4/2.5;
  overflow: hidden;
  background: rgba(255,255,255,.05);
}
.option-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.option-info {
  padding: 1rem;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: .75rem;
}
.option-label {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  line-height: 1.3;
  color: #fff;
}
.option-details {
  display: flex;
  flex-direction: column;
  gap: .25rem;
  font-size: .85rem;
}
.option-price {
  font-weight: 700;
  color: var(--secondary-color,#fbbf24);
}
.option-stock,
.option-sold {
  color: #94a3b8;
  font-size: .8rem;
}
.option-badge {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: #f59e0b;
  color: #fff;
  padding: 2px 6px;
  border-radius: .5rem;
  font-size: .7rem;
  font-weight: 700;
  letter-spacing: .25px;
  text-transform: uppercase;
}
.option-actions {
  margin-top: .75rem;
  padding-top: .75rem;
  border-top: 1px solid rgba(255,255,255,.12);
  display: flex;
  gap: .5rem;
  flex-wrap: wrap;
}

/* ------- Empty Options ------- */
.empty-options {
  text-align: center;
  padding: 2rem;
  color: #94a3b8;
  font-size: .95rem;
  letter-spacing: .25px;
}

/* ------- Responsive ------- */
@media (max-width: 768px) {
  .modal-body {
    padding: 1.5rem 1.25rem 2rem;
  }
  .modal-header {
    padding: 1rem 1.25rem .75rem;
  }
  .product-details {
    grid-template-columns: 1fr;
    gap: 1.25rem;
  }
  .header-actions {
    justify-content: flex-start;
  }
  .options-grid {
    grid-template-columns: 1fr;
  }
}
</style>
