<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted, defineAsyncComponent } from "vue";
const ProductCard = defineAsyncComponent(() => import("../components/ProductCard.vue"));
import { formatToPHCurrency } from "../utils/currencyFormat"
import {
  ShoppingCartIcon,
} from "@heroicons/vue/24/outline";
import { ProductOption } from "../types/product";
import MiniHeader from "../components/MiniHeader.vue";
import { Alert } from "../components/composable/Alert"
import { useProductsStore } from "../stores/productStores"
import { useRoute, useRouter } from "vue-router";
import { useTheme } from "../composables/useTheme";
const route = useRoute();
const router = useRouter();
const productStore = useProductsStore();
const { isDark } = useTheme();

// Component state
const selectedImage = ref<string>("");
const selectedOption = ref<ProductOption | null>(null);
const currentImageIndex = ref(0);
let imageSlideInterval: number;

const productId = String(route.params.id);
const product = computed(() => {
  return productStore.productById
})


const productStock = computed(() => {
  // product may be undefined while fetching; option may be undefined for simple products
  const prod = product?.value;
  if (!prod) return 0;

  // If product has options, sum their stock (safely handle missing stock values)
  if (Array.isArray(prod.option) && prod.option.length > 0) {
    return prod.option.reduce((total: number, option: any) => {
      return total + (option?.stock ?? 0);
    }, 0);
  }

  // Fallback to product.stock when no options exist
  return prod.stock ?? 0;
});


const addToCart = async () => {
  if (product?.value?.option.length <= 0) {
    await productStore.addToCart(product.value?._id, product.value?._id, 1);
    return;
  }

  if (selectedOption?.value === null) {
    Alert("Please select option!", "warning", "var(--secondary-color)")
    return
  }
  await productStore.addToCart(selectedOption.value?._id, productStore.productId, 1);
};


onMounted(async () => {
  await productStore.fetchProductsById(productId);
  await productStore.fetchRelatedProducts(productId)
  if (product.value?.imageUrls && product.value?.imageUrls?.length > 0) {
    selectedImage.value = product.value.imageUrls[0];
    startImageSlideshow();
  }
});

onUnmounted(() => {
  stopImageSlideshow();
});


const startImageSlideshow = () => {
  if (product.value.imageUrls && product.value.imageUrls.length > 1) {
    imageSlideInterval = setInterval(() => {
      currentImageIndex.value =
        (currentImageIndex.value + 1) % product.value.imageUrls.length;
      selectedImage.value = product.value.imageUrls[currentImageIndex.value];
    }, 3000); // Change image every 3 seconds
  }
};

const stopImageSlideshow = () => {
  if (imageSlideInterval) {
    clearInterval(imageSlideInterval);
    imageSlideInterval = null;
  }
};

const selectImageManually = (image: string, index: number) => {
  stopImageSlideshow(); // Stop auto-slide when user manually selects
  selectedImage.value = image;
  currentImageIndex.value = index;

  // Restart auto-slide after 5 seconds of inactivity
  setTimeout(() => {
    startImageSlideshow();
  }, 5000);
};

const selectOption = (option: ProductOption) => {
  selectedOption.value = option;
  if (option.imageUrl) {
    selectedImage.value = option.imageUrl;
  }
};

const handleImageError = (event: Event) => {
  const target = event.target as HTMLImageElement;
  target.src =
    "https://images.pexels.com/photos/90946/pexels-photo-90946.jpeg?auto=compress&cs=tinysrgb&w=400";
};

// const formatToPHCurrency = (price: number) => {
//   return new Intl.NumberFormat("en-US", {
//     minimumFractionDigits: 2,
//     maximumFractionDigits: 2,
//   }).format(price);
// };

const formatNumber = (num: number) => {
  return new Intl.NumberFormat("en-US").format(num);
};

const formatDate = (dateString?: string) => {
  if (!dateString) return "Recently";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const buyNow = () => {
  alert("Proceeding to checkout!");
};

const viewVendor = (vendorId) => {
  window.location.assign(`/view/vendor/${vendorId}`)
}

</script>

<template>
  <div class="product-details-page">
    <MiniHeader></MiniHeader>
    <div class="container">
      <div class="product-main">
  
        <div class="product-images">
          <div class="main-image">
            <img v-if="selectedImage" :src="selectedImage" :alt="product.name" @error="handleImageError" />
            <div v-else class="placeholder-image">
              <div class="placeholder-icon">📷</div>
              <p>No Image Available</p>
            </div>

          </div>

          <div class="thumb-con">
            <div v-if="product.imageUrls && product.imageUrls.length > 0" class="image-thumbnails">
              <button v-for="(image, index) in product.imageUrls" :key="index"
                :class="['thumbnail', { active: currentImageIndex === index }]"
                @click="selectImageManually(image, index)">
                <img :src="image" :alt="`${product.name} ${index + 1}`" fetchpriority="low" loading="lazy"
                  @error="handleImageError" />
              </button>
            </div>
          </div>

          <div v-if="product.imageUrls && product.imageUrls.length > 1" class="image-indicators">
            <button v-for="(image, index) in product.imageUrls" :key="`indicator-${index}`"
              :class="['indicator', { active: currentImageIndex === index }]"
              @click="selectImageManually(image, index)"></button>
          </div>

          <div class="shop-desktop" @click="viewVendor(product.vendorId)">
            <img src="../assets/fruit.png" alt="">
            <p>{{ product.storeName }}</p>
          </div>
          <!-- Product Info -->
        </div>
        <div class="product-details">
          <!-- Image indicators for auto-slide -->

          <div class="product-info">
            <!-- Product Header -->
            <div class="product-header">
              <h1 class="product-title">{{ product.name }}</h1>

              <div class="price-main">
                <span class="current-price">{{ formatToPHCurrency(product.price) }}</span>
                <span class="original-price">
                  {{ formatToPHCurrency(product.price) }}

                </span>
                <div class="badges">
                  <span v-if="product.isNew" class="badge badge-new">New</span>
                  <span v-if="product.isHot" class="badge badge-hot">Hot</span>
                </div>
              </div>
            </div>

            <div class="product-stats">
              <div class="stat-item">
                <span class="stat-label">Rating:</span>
                <div class="rating-section">
                  <span class="stat-value rating-text">{{ product.averageRating }}</span>
                  <span class="reviews-count">({{ product.numReviews }} reviews)</span>
                </div>
              </div>
              <div class="stat-item">
                <span class="stat-label">Sold:</span>
                <span class="stat-value">{{
                  formatNumber(product.sold)
                  }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Stock:</span>
                <span class="stat-value">{{productStock || product.stock }} units</span>
              </div>

              <div class="stat-item">
                <span class="stat-label">Location:</span>
                <span class="stat-value">{{ product.municipality }}</span>
              </div>
            </div>
            <!-- Product Options -->
            <div v-if="product.option && product.option.length > 0" class="product-options">
              <h3>Available Options</h3>
              <div class="options-grid">
                <div v-for="option in product.option" :key="option._id"
                  :class="['option-card', { selected: selectedOption?._id === option._id }]"
                  @click="selectOption(option)">
                  <div class="option-image">
                    <img v-if="option.imageUrl" :src="option.imageUrl" :alt="option.label" @error="handleImageError" />
                    <div v-else class="option-placeholder">📦</div>
                    <span v-if="option.isHot" class="option-badge">🔥 Hot</span>
                  </div>

                  <div class="option-info">
                    <h4 class="option-label">{{ option.label }}</h4>
                    <p class="option-price">{{ formatToPHCurrency(option.price) }}</p>
                    <div class="option-stats">
                      <span>Stock: {{ option.stock }}</span>
                      <!-- <span>Sold: {{ formatNumber(option.sold) }}</span> -->
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Action Buttons (Desktop) -->
            <div class="action-buttons desktop-only">
              <button class="btn btn-primary btn-large" :disabled="(selectedOption?.stock || product.stock) === 0"
                @click="addToCart">
                <span v-if="(selectedOption?.stock || product.stock) === 0">Out of Stock</span>
                <span v-else>Add to Cart</span>
              </button>
              <button class="btn btn-secondary btn-large" :disabled="(selectedOption?.stock || product.stock) === 0"
                @click="buyNow">
                <span v-if="(selectedOption?.stock || product.stock) === 0">Unavailable</span>
                <span v-else>Buy Now</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Product Description -->
      <div class="product-description">
        <h2>Product Description</h2>
        <p>{{ product.description }}</p>
      </div>

      <!-- Reviews Section -->
      <div class="reviews-section">
        <h2>Customer Reviews</h2>

        <div v-if="product.reviews && product.reviews.length > 0" class="reviews-list">
          <div v-for="review in product.reviews" :key="review._id || review._id" class="review-item">
            <div class="review-header">
              <h4 class="reviewer-name">{{ review.reviewerName || "Anonymous" }}</h4>
              <div class="review-rating">
                <span v-for="star in 5" :key="star" :class="['star', { filled: star <= review.rating }]">
                  ★
                </span>
              </div>
            </div>
            <p v-if="review.comment" class="review-comment">{{ review.comment }}</p>
            <span class="review-date">{{ formatDate(review.createdAt) }}</span>
          </div>
        </div>

        <div v-else class="no-reviews">
          <p>No reviews yet. Be the first to review this product!</p>
        </div>

        <!-- Leave a Review Form -->
        <!-- <div class="review-form">
          <h3>Leave a Review</h3>
          <form @submit.prevent="submitReview">
            <div class="form-group">
              <label for="reviewer-name">Your Name</label>
              <input id="reviewer-name" v-model="newReview.reviewerName" type="text" required
                placeholder="Enter your name" />
            </div>

            <div class="form-group">
              <label>Rating</label>
              <div class="rating-input">
                <button v-for="star in 5" :key="star" type="button"
                  :class="['star-btn', { active: star <= newReview.rating }]" @click="newReview.rating = star">
                  ★
                </button>
              </div>
            </div>

            <div class="form-group">
              <label for="review-comment">Comment (Optional)</label>
              <textarea id="review-comment" v-model="newReview.comment"
                placeholder="Share your experience with this product..." rows="4"></textarea>
            </div>

            <button type="submit" class="btn btn-primary">Submit Review</button>
          </form>
        </div> -->
      </div>

      <!-- Related Products Section -->
      <div v-if="productStore.relatedProducts.length > 0" class="related-products">
        <h2>Related Products</h2>
        <div class="related-grid">
          <ProductCard typesOfProductList="RelatedProducts"></ProductCard>
        </div>
      </div>

      <!-- Mobile spacing for sticky buttons -->
      <div class="mobile-spacing"></div>
    </div>

    <!-- Sticky Mobile Action Buttons -->
    <div class="sticky-mobile-actions">
      <div class="mobile-action-container">
        <div class="vendor-avatar" @click="viewVendor(product.vendorId)">
          <img src="../assets/fruit.png" alt="">
          <p>{{ product.storeName }}</p>
        </div>
        <div class="mobile-price-info">
          <div class="mobile-price">
            {{ formatToPHCurrency(selectedOption?.price || product.price) }}
          </div>
          <div class="mobile-stock">
            {{ selectedOption?.stock || product.stock }} in stock
          </div>
        </div>
        <div class="mobile-button-wrapper">
          <button class="btn btn-primary mobile-add-to-cart" :disabled="(selectedOption?.stock || product.stock) === 0"
            @click="addToCart">
            <ShoppingCartIcon class="cart-icon" />
            <span v-if="(selectedOption?.stock || product.stock) === 0">Out of Stock</span>
            <span v-else>Add to Cart</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.product-details-page {
  background-color: var(--bg-primary);
  max-height: 100dvh;
  padding-top: var(--header-height);
  overflow: auto;
  transition: background-color var(--transition-fast);
}

/* Modern Header */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

/* Main Product Section */
.product-main {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
  gap: 3rem;
}

/* .product-details{
  max-width: 50vw;
} */

/* Product Images */
.product-images {
  display: flex;
  flex-direction: column;
  gap: 1rem;

}

.main-image {
  width: 100%;
  height: auto;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: var(--shadow);
  background: var(--surface);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
  border: 1px solid var(--border-color);
}

.main-image img {
  width: 100%;
 aspect-ratio:4/3;
  object-fit: contain;
}

.placeholder-image {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  background: var(--bg-secondary);
  height: 100%;
  transition: all var(--transition-fast);
}

.placeholder-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.thumb-con {
  max-width: 100dvw;
  display: flex;
  overflow: auto;
  scrollbar-width: thin;
}

.image-thumbnails {
  width: fit-content;
  display: flex;
  gap: 10px;
  padding: 5px;
}

.image-thumbnails button {
  display: flex;
  overflow: auto;
  min-width: 60px;
  border: 1px solid var(--border-color);
  padding: 1px;
  transition: border-color var(--transition-fast);
}

.thumbnail {
  width: 80px;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.3s ease;
  background: none;
  padding: 0;
}

.thumbnail:hover,
.thumbnail.active {
  border-color: var(--secondary-color);
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(9, 74, 37, 0.3);
}

.thumbnail img {
  width: 100%;
  height: 100%;
  object-fit:contain;
}

/* Image Indicators */
.image-indicators {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 1rem;
}

.indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: none;
  background: var(--border-color);
  cursor: pointer;
  transition: all 0.3s ease;
}

.indicator.active {
  background: var(--primary-color);
  transform: scale(1.2);
}

.indicator:hover {
  background: var(--secondary-color);
}

/* Product Info */
.product-info {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 50vw;
  padding: 0px 8px;
}

.badges {
  display: flex;
  gap: 0.5rem;
}

.badge {
  padding: 0.2rem 0.7rem;
  border-radius: 20px;
  font-size: clamp(10px, 2vw, 14px);
  font-weight: 600;
  text-transform: uppercase;
}

.badge-new {
  background: var(--primary-color);
  color: var(--background-alt);
}

.badge-hot {
  background: var(--secondary-color);
  color: var(--background-alt);
}

.product-title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.2;
  transition: color var(--transition-fast);
}

.rating-section {
  display: flex;
  align-items: center;
  gap: 3px;
}


.reviews-count {
  color: var(--text-secondary);
  font-size: clamp(12px, 2vw, 14px);
  transition: color var(--transition-fast);
}


.price-main {
  display: flex;
  align-items: center;
  gap: .5rem;
}

.current-price {
  font-size: 2.2rem;
  font-weight: 700;
  color: var(--secondary-color);
  max-width: 24ch;
  word-break: break-word;
}

.original-price {
  font-size: 1rem;
  color: var(--text-secondary);
  text-decoration: line-through;
  max-width: 24ch;
  word-break: break-word;
  transition: color var(--transition-fast);
}

/* Product Stats */
.product-stats {
  display: flex;
  gap: 1rem;
  background-color: var(--surface);
  padding: 1rem 10px;
  border-radius: 12px;
  box-shadow: var(--shadow);
  border: 1px solid var(--border-color);
  transition: all var(--transition-fast);
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  flex: 1 1 auto;
  justify-content: center;
}

.stat-item:not(:last-child) {
  border-right: 1px solid var(--border-color);
}

.stat-label {
  font-size: clamp(12px, 2vw, 1rem);
  color: var(--text-secondary);
  font-weight: 500;
  transition: color var(--transition-fast);
}

.stat-value {
  font-size: clamp(12.78px, 2vw, 1.1rem);
  font-weight: 600;
  color: var(--text-primary);
  transition: color var(--transition-fast);
}

.filled {
  color: var(--secondary-color);
}

/* Product Options */
.product-options {
  background: var(--surface);
  padding: 1.5rem;
  border-radius: 15px;
  box-shadow: var(--shadow);
  border-top: 3px solid var(--primary-color);
  border-bottom: 3px solid var(--primary-color);
  transition: all var(--transition-fast);
}

.product-options h3 {
  margin: 0 0 1rem 0;
  color: var(--text-primary);
  transition: color var(--transition-fast);
}

.options-grid {
  display: flex;
  overflow-x: auto;
  padding: 10px 0;
  scroll-snap-type: x mandatory;
  scroll-padding-inline: 50%;
  scroll-behavior: smooth;
  gap: 10px;
  overflow: auto;
  scrollbar-width: thin;

}

.option-card {
  border: 2px solid var(--border-color);
  border-radius: 12px;
  padding: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: var(--background-alt);
  position: relative;
  min-width: 190px;
}

.option-card:hover,
.option-card.selected {
  border-color: var(--primary-color);
  box-shadow: var(--shadow-hover);
  transform: translateY(-2px);
}

.option-image {
  width: 100%;
  aspect-ratio: 4/3;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 1rem;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  max-width: 200px;
}

.option-image img {
  width: 100%;

  aspect-ratio: 4/3;
  object-fit: cover;
}

.option-placeholder {
  font-size: 2rem;
  color: var(--text-light);
}

.option-label {
  font-size: clamp(14px, 2vw, 1rem);
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  color: var(--text-color);
}

.option-price {
  font-size: clamp(1rem, 2vw, 1.2rem);
  font-weight: 700;
  color: var(--secondary-color);
  margin: 0 0 0.5rem 0;
  max-width: 20ch;
  word-break: break-word;
}

.option-stats {
  display: flex;
  gap: 1rem;
  font-size: 0.8rem;
  color: var(--text-light);
  margin-bottom: 0.5rem;

}

.option-badge {
  background: var(--secondary-color);
  color: var(--background-alt);
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 600;
  position: absolute;
  top: 10px;
  left: 10px;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: 1rem;
}

.btn {
  padding: 1rem 2rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 50px;
}

.btn-large {
  flex: 1;
  font-size: 1.1rem;
  padding: 1.25rem 2rem;
}

.btn-primary {
  background: var(--primary-color);
  color: var(--background-alt);
}

.btn-primary:hover:not(:disabled) {
  background: #0a5a2e;
  transform: translateY(-2px);
  box-shadow: var(--shadow-hover);
}

.btn-secondary {
  background: var(--secondary-color);
  color: var(--background-alt);
}

.btn-secondary:hover:not(:disabled) {
  background: #e55a00;
  transform: translateY(-2px);
  box-shadow: var(--shadow-hover);
}

.btn-outline {
  background: transparent;
  border: 2px solid var(--primary-color);
  color: var(--primary-color);
}

.btn-outline:hover:not(:disabled) {
  background: var(--primary-color);
  color: var(--background-alt);
}

.btn:disabled {
  background: var(--bg-secondary);
  color: var(--text-secondary);
  cursor: not-allowed;
  transform: none;
  opacity: 0.5;
}

/* Product Description */
.product-description {
  background: var(--surface);
  padding: 2rem;
  border-radius: 12px;
  box-shadow: var(--shadow-medium);
  border: 1px solid var(--border-color);
  transition: all var(--transition-fast);
}

.product-description h2 {
  margin: 10px 0 1rem 0;
  color: var(--text-primary);
  font-size: clamp(1.3rem, 2vw, 1.5rem);
  transition: color var(--transition-fast);
}

.product-description p {
  line-height: 1.6;
  color: var(--text-primary);
  font-size: 1rem;
  transition: color var(--transition-fast);
}

/* Reviews Section */
.reviews-section {
  background: var(--surface);
  padding: 2rem;
  border-radius: 12px;
  box-shadow: var(--shadow-medium);
  max-height: 40rem;
  overflow: auto;
  border: 1px solid var(--border-color);
  transition: all var(--transition-fast);
}

.reviews-section h2 {
  margin: 10px 0 1rem 0;
  color: var(--text-primary);
  font-size: clamp(1.3rem, 2vw, 1.5rem);
  position: sticky;
  top: 0;
  background-color: var(--surface);
  transition: all var(--transition-fast);
}

.reviews-list {
  margin-bottom: 1rem;

}

.review-item {
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 1.5rem;
  margin-bottom: 1.5rem;
}

.review-item:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.reviewer-name {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  transition: color var(--transition-fast);
}

.product-header {
  gap: 8px;
  display: flex;
  flex-direction: column;
}

.review-rating .star {
  font-size: 1rem;
}

.review-comment {
  margin: 0.5rem 0;
  line-height: 1.5;
  color: var(--text-primary);
  transition: color var(--transition-fast);
}

.review-date {
  font-size: 0.8rem;
  color: var(--text-secondary);
  transition: color var(--transition-fast);
}

.no-reviews {
  text-align: center;
  padding: 2rem;
  color: var(--text-secondary);
  margin-bottom: 2rem;
  transition: color var(--transition-fast);
}

/* Review Form */
.review-form {
  border-top: 1px solid var(--border-color);
  padding-top: 2rem;
}

.shop-desktop {
  height: 4.4rem;
  padding: 10px;
  gap: 10px;
  display: flex;
  background-color: var(--bg-secondary);
  border-radius: .8rem;
  transition: background-color var(--transition-fast);
}

.shop-desktop p {
  font-weight: 600;
  font-size: clamp(14px, 2vw, 1.3rem);
  margin-top: 5px;
  max-width: 18ch;
  overflow: hidden;
  /* required for ellipsis */
  white-space: nowrap;
  /* prevent wrapping */
  text-overflow: ellipsis;
}

.shop-desktop img {
  border: 2px solid var(--secondary-color);
  cursor: pointer;
  height: 100%;
  aspect-ratio: 1;
  padding: 5px;
  background-color: rebeccapurple;
  border-radius: 50rem;
}

.review-form h3 {
  margin: 0 0 1.5rem 0;
  color: var(--text-color);
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: var(--text-color);
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
  font-family: inherit;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--primary-color);
}

.rating-input {
  display: flex;
  gap: 0.25rem;
}

.star-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: var(--border-color);
  cursor: pointer;
  transition: color 0.2s ease;
}

.star-btn:hover,
.star-btn.active {
  color: #ffc107;
}

/* Related Products */
.related-products {
  background: var(--surface);
  padding: 2rem;
  border-radius: 12px;
  box-shadow: var(--shadow-medium);
  padding-bottom: 3rem;
  border: 1px solid var(--border-color);
  transition: all var(--transition-fast);
}

.related-products h2 {
  margin: 0 0 2rem 0;
  color: var(--text-primary);
  font-size: clamp(1.3rem, 2vw, 1.5rem);
  transition: color var(--transition-fast);
}

/* Mobile Sticky Actions */
.sticky-mobile-actions {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--background-color);
  border-top: 1px solid var(--border-color);
  padding: 1rem;
  display: none;
  z-index: 999;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1);
}

.mobile-action-container {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 1rem;
  justify-content: space-around;
}

.vendor-avatar {
  flex-direction: column;
  aspect-ratio: 1;
  border-right: 1px solid rgb(179, 176, 176);
  padding-right: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.vendor-avatar p {
  font-size: clamp(10.78px, 2vw, 12px);
  max-width: 7ch;
  /* allow a reasonable name length */
  overflow: hidden;
  /* required for ellipsis */
  white-space: nowrap;
  /* prevent wrapping */
  text-overflow: ellipsis;
}

.vendor-avatar img {
  width: clamp(40px, 8vw, 60px);
  aspect-ratio: 1;
  background-color: rebeccapurple;
  border-radius: 50rem;
  padding: 3px;
  border: 2px solid var(--secondary-color);
}

.mobile-price-info {
  display: flex;
  flex-direction: column;
}

.mobile-price {
  font-size: clamp(1.2rem, 2vw, 1.5rem);
  font-weight: 700;
  color: var(--secondary-color);
  max-width: 10ch;
  word-break: break-word;
}

.mobile-stock {
  font-size: clamp(12px, 2vw, .9rem);
  color: var(--text-light);
}

.mobile-button-wrapper {
  flex: 1 1 auto;
  display: flex;
  justify-content: flex-end;
}

.mobile-add-to-cart {
  height: 55px;
  padding: 0 1.7rem;
  border-radius: 16px;
  font-weight: 600;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-width: 150px;
  box-shadow: 0 4px 16px rgba(9, 74, 37, 0.3);
  transition: all 0.3s ease;
}

.mobile-add-to-cart:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(9, 74, 37, 0.4);
}

.cart-icon {
  width: 22px;
  height: 22px;
}

.mobile-spacing {
  height: 85px;
  display: none;
}

.desktop-only {
  display: flex;
}

/* 
.product-details {
  display: flex;
  padding: 10px;
} */


@media (max-width: 990px) {
  .product-options {
    padding: 1rem 8px;
  }

}

@media (min-width: 841px) {
  .options-grid {
    max-width: 550px;
  }

}

/* Responsive Design */
@media (max-width: 840px) {
  .shop-desktop {
    display: none;
  }

  .product-info {
    max-width: 100vw;
  }

  .product-details-page {
    padding-top: var(--header-height);
  }

  .related-products {
    padding: 10px 8px;
    padding-bottom: 0rem;
  }


  .product-description,
  .reviews-section {
    padding: 10px 8px;
  }

  .reviews-section {
    padding-top: 0;

  }


  .image-thumbnails {
    padding: 3px 8px;
  }

  .container {
    padding: 0.3rem 0rem;
  }

  .product-main {
    grid-template-columns: 1fr;
    gap: 2rem;
  }

  .main-image {
    height: 450px;
  }

  .product-title {
    font-size: 1.5rem;
  }

  .current-price {
    font-size: 1.8rem;
  }

  .desktop-only {
    display: none;
  }

  .sticky-mobile-actions {
    display: block;
  }

  .mobile-spacing {
    display: block;
  }

  .image-indicators {
    margin-top: 0.5rem;
  }

  .indicator {
    width: 6px;
    height: 6px;
  }

  .option-card {
    min-width: 160px;
  }

  .review-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}

@media (max-width: 767px) {
  .main-image {
    height: 360px;
  }
}

@media (max-width:660px) {
  .main-image {
    height: 300px;
    border-radius: 0;
  }

  .product-images {
    gap: 5px;
  }

  .image-thumbnails {
    gap: 8px;
    padding: 3px;
  }

  .thumbnail {
    width: 60px;
    padding: 0;
  }

  .image-indicators {
    display: none;
  }
}

@media (max-width: 480px) {
  .breadcrumb {
    font-size: 0.8rem;
  }

  .product-title {
    font-size: 1.25rem;
  }

  .current-price {
    font-size: 1.5rem;
  }

  .categories {
    flex-direction: column;
    align-items: flex-start;
  }

  .mobile-action-container {
    gap: 0.75rem;
  }

  .mobile-price-info {
    text-align: center;
  }

  .mobile-add-to-cart {
    width: 100%;
    min-width: auto;
  }
}

@media (max-width: 360px) {
  .mobile-add-to-cart {
    padding: 0 1.5rem;
    font-size: 0.9rem;
  }
}
</style>
