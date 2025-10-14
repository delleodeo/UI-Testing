<script setup lang="ts">
import { computed } from "vue";
import { formatToPHCurrency } from "../../utils/currencyFormat";
import type { Product } from "../../types/product";

/* Props & Emits */
const props = defineProps<{
  product: Partial<Product>;
}>();

const emit = defineEmits<{
  "view-product": [product: Partial<Product>];
}>();

/* Constants */
const PLACEHOLDER_IMG =
  "https://via.placeholder.com/400x260?text=No+Image";

/* Safe access helpers */
const imgSrc = computed(() => {
  const urls = props.product?.imageUrls;
  return (Array.isArray(urls) && urls.length ? urls[0] : PLACEHOLDER_IMG) as string;
});

const productName = computed(() => props.product?.name ?? "Unnamed Product");

const productPrice = computed(() => {
  const p = props.product?.price;
  return typeof p === "number" ? p : 0;
});

const productSold = computed(() => {
  const n = props.product?.sold;
  return typeof n === "number" ? n : 0;
});

const avgRating = computed(() => {
  const r = Number(props.product?.averageRating ?? 0);
  if (Number.isNaN(r)) return 0;
  return Math.min(5, Math.max(0, r));
});

const ratingText = computed(() => avgRating.value.toFixed(1));

const numReviews = computed(() => {
  const n = props.product?.numReviews;
  return typeof n === "number" ? n : 0;
});

/* Badges */
const isNew = computed(() => Boolean(props.product?.isNew));
const isHot = computed(() => Boolean(props.product?.isHot));

/* Events */
function viewProduct() {
  emit("view-product", props.product);
}
</script>

<template>
  <div class="product-card">
    <!-- Image -->
    <div class="product-image" @click="viewProduct" role="button" tabindex="0">
      <img :src="imgSrc" :alt="productName" />
      <div class="badges">
        <span v-if="isNew" class="badge badge-new">New</span>
        <span v-if="isHot" class="badge badge-hot">Hot</span>
      </div>
    </div>

    <!-- Info -->
    <div class="product-info">
      <h3 class="product-name">{{ productName }}</h3>

      <!-- Price + Sold -->
      <div class="product-meta">
        <div class="price">{{ formatToPHCurrency(productPrice) }}</div>
        <div class="sold">Sold ({{ productSold }})</div>
      </div>

      <!-- Rating -->
      <div class="rating" v-if="numReviews || avgRating">
        <div class="stars" aria-hidden="true">
          <span
            v-for="i in 5"
            :key="i"
            class="star"
            :class="{ filled: i <= Math.floor(avgRating) }"
            >★</span
          >
        </div>
        <span class="rating-text">{{ ratingText }} ({{ numReviews }})</span>
      </div>

      <!-- Actions -->
      <div class="actions">
        <button @click="viewProduct" class="btn small">
          View Details
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ===== Theme Sync w/ Order Cards ===== */
.product-card {
  display: flex;
  flex-direction: column;
  gap: 0;
  background: var(--surface);
  border: 1px solid var(--border-primary);
  border-radius: 1rem;
  overflow: hidden;
  backdrop-filter: blur(6px);
  color: var(--text-primary);
  transition: border-color 0.35s, transform 0.25s, box-shadow 0.35s;
  position: relative;
  box-shadow: var(--shadow-md);
}

.product-card:hover {
  border-color: var(--color-primary);
  transform: translateY(-4px);
  box-shadow: var(--shadow-xl);
}

/* ===== Image ===== */
.product-image {
  position: relative;
  overflow: hidden;
  cursor: pointer;
}
.product-image img {
  width: 100%;
  aspect-ratio: 4 / 2.6;
  object-fit: cover;
  transition: transform 0.3s ease;
  display: block;
  border-radius: 10px;
}
.product-image:hover img {
  transform: scale(1.05);
}

/* ===== Badges ===== */
.badges {
  position: absolute;
  top: 8px;
  left: 8px;
  display: flex;
  gap: 4px;
}
.badge {
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  line-height: 1;
  box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.35);
}
.badge-new {
  background: #0d9488;
  color: #fff;
}
.badge-hot {
  background: #f59e0b;
  color: #fff;
}

/* ===== Info ===== */
.product-info {
  padding: 1rem 0.95rem 1.1rem;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}
.product-name {
  font-size: 1rem;
  font-weight: 700;
  margin: 0;
  line-height: 1.3;
  color: var(--text-primary);
}

/* ===== Meta ===== */
.product-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: .9rem;
  line-height: 1.25;
}
.price {
  font-weight: 700;
  color: var(--secondary-color, #fbbf24);
  letter-spacing: .25px;
  white-space: nowrap;
}
.sold {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-secondary);
  letter-spacing: .25px;
}

/* ===== Rating ===== */
.rating {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.75rem;
  color: var(--text-secondary);
}
.stars {
  display: flex;
  gap: 2px;
  line-height: 1;
}
.star {
  color: var(--text-muted);
  font-size: 1rem;
  transition: color 0.2s ease;
}
.star.filled {
  color: #f59e0b;
}
.rating-text {
  line-height: 1;
}

/* ===== Actions ===== */
.actions {
  display: flex;
  margin-top: .25rem;
}

/* Button system (copied + trimmed from order-cards) */
.btn {
  --btn-bg: var(--color-primary);
  --btn-fg: var(--text-inverse);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  border: none;
  background: var(--btn-bg);
  color: var(--btn-fg);
  font: inherit;
  font-weight: 600;
  padding: 0.55rem 0.85rem;
  border-radius: 0.6rem;
  font-size: 0.8rem;
  letter-spacing: 0.6px;
  cursor: pointer;
  position: relative;
  transition: background 0.3s, transform 0.25s, box-shadow 0.3s;
  box-shadow: var(--shadow-md);
  width: 100%;
}
.btn:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: var(--shadow-lg);
  background: var(--color-primary-hover);
}
.btn:active:not(:disabled) {
  transform: translateY(-1px);
}
.btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn.outline {
  --btn-bg: transparent;
  --btn-fg: var(--text-primary);
  border: 1px solid var(--border-primary);
  box-shadow: none;
}
.btn.outline:hover:not(:disabled) {
  background: var(--bg-secondary);
  border-color: var(--color-primary);
}

.btn.small {
  padding: 0.5rem 0.75rem;
  font-size: 0.75rem;
}

/* If you want primary accent for product CTA instead of white, uncomment:
.btn.primary {
  --btn-bg: var(--primary-color, #22c55e);
  --btn-fg: #fff;
}
*/

/* ===== Responsive tweaks ===== */
@media (max-width: 767px) {
  .product-info {
    padding: 0.9rem 0.85rem 0.95rem;
  }
  .product-name {
    font-size: 0.95rem;
  }
  .btn {
    font-size: 0.7rem;
    padding: 0.5rem 0.75rem;
  }
}
</style>
