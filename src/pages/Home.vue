<script setup lang="ts">
import {
  ref,
  onMounted,
  onBeforeUnmount,
  watch,
  nextTick,
  defineAsyncComponent
} from "vue"
import { useRoute } from "vue-router"

import Header from "../components/Header.vue"
import Banner from "../components/Banner.vue"
import Category from "../components/Category.vue"
import FeaturedSeller from "../components/FeaturedSeller.vue"
import FeaturedProduct from "../components/ProductCard.vue"
const LoadingCard = defineAsyncComponent(() => import("../components/Loading.vue"))

import { useCartStore } from "../stores/cartStores"
import { useProductsStore } from "../stores/productStores"
import { useAuthStore } from "../stores/authStores"
import { useTheme } from "../composables/useTheme"

const productsStore = useProductsStore()
const cartStore = useCartStore()
const authStore = useAuthStore()
const { isDark } = useTheme()
const route = useRoute()
const forceRefresh = ref(false)

const targetSection = ref<HTMLElement | null>(null)
const scrollContainer = ref<HTMLDivElement | null>(null)

let scrollTimeout: ReturnType<typeof setTimeout> | null = null

console.log("sdjjsajd ", document.cookie)

// ✅ Debounced scroll to avoid layout shifts
const handleScroll = () => {
  if (scrollTimeout) clearTimeout(scrollTimeout)
  scrollTimeout = setTimeout(() => {
    if (targetSection.value) {
      targetSection.value.scrollIntoView({
        behavior: "smooth",
        block: "start"
      })
    }
  }, 100)
}

const loadProducts = async () => {
  try {
    await productsStore.fetchFeaturedVendor()
    await productsStore.fetchProducts(true)
    await nextTick()
    if (scrollContainer.value) {
      productsStore.initializeInfiniteScroll(scrollContainer.value)
    } else {
      console.warn("Scroll container is null, cannot initialize infinite scroll.")
    }
  } catch (error) {
    console.error("Error loading products:", error)
  }
}

onMounted(() => {
  loadProducts()
})

// 🔁 Handle route changes for refetching
watch(
  () => route.fullPath,
  () => {
    loadProducts()
  }
)

// 🧹 Clean up infinite scroll listeners
onBeforeUnmount(() => {
  if (scrollContainer.value) {
    productsStore.cleanupInfiniteScroll(scrollContainer.value)
  }
  if (scrollTimeout) {
    clearTimeout(scrollTimeout)
    scrollTimeout = null
  }
})
</script>

<template>
  <Header />
  <main ref="scrollContainer" class="product-listing-container">
    <Banner />
    <Category class="sticky" @scrollTop="handleScroll" />

    <section class="content">
      <span ref="targetSection"></span>
      <FeaturedSeller />
      <div v-if="productsStore.products.length > 0" class="animation">
        <h3>Featured Products</h3>
        <FeaturedProduct typesOfProductList="FeaturedProducts" />
        <div class="product-heading">
          <h3 class="heading">Mindoro's Products</h3>
          <p>Explore the Unique Products From Oriental Mindoro</p>
        </div>
        <FeaturedProduct typesOfProductList="AllProducts" />
      </div>
      <div v-if="productsStore.isLoading" class="loading-con">
        <LoadingCard v-for="n in 20" :key="n" />
      </div>
      <div v-if="productsStore.products.length <= 0 && !productsStore.isLoading" class="no-product">
        <p>No products yet.</p>
      </div>
      <div v-if="productsStore.isLoading" class="loading-con">
        <LoadingCard v-for="n in 20" :key="n" />
      </div>
    </section>

    <div class="mobile-spacing"></div>
    <!-- <MobileNav activeItem="home"></MobileNav> -->
  </main>
</template>

<style scoped>
.mobile-spacing {
  height: 4rem;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animation {
  animation: fadeIn .3s ease-out;
}

.product-listing-container {
  max-height: 100dvh;
  height: 200dvh;
  padding: 0;
  overflow-x: hidden;
  height: 100vh;
  position: relative;
  padding: 10px 0;
  max-width: 1180px;
  margin: 0 auto;
  padding-bottom: 0;
  background-color: var(--bg-primary);
  transition: background-color var(--transition-fast);
}

.no-product {
  min-height: 7rem;
  display: flex;
  align-items: center;
  color: var(--text-secondary);
  justify-content: center;
  transition: color var(--transition-fast);
}

.loading-con {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(165px, 1fr));
  gap: 10px;
}

.isLoading {
  width: 100%;
  text-align: center;
  padding: 3rem;
  font-size: 16px;
}

.content {
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  background-color: var(--bg-primary);
  transition: background-color var(--transition-fast);
}

.product-listing-container h3 {
  font-size: clamp(1rem, 3vw, 1.5rem);
  margin: 0 auto;
  width: 100%;
  max-width: 1200px;
  margin-bottom: 0.5rem;
  color: var(--text-primary);
  transition: color var(--transition-fast);
}

.sticky {
  position: sticky !important;
  top: 4.8rem;
}

@media (max-width: 1200px) {
  .product-listing-container {
    padding: 0;
  }
}

@media (max-width: 820px) {
  .sticky {
    position: sticky;
    top: 4.2rem;
  }
}

.product-heading {
  text-align: center;
  margin: 1.5rem auto;
  width: 100%;
  display: flex;
  justify-content: center;
  flex-direction: column;
  align-items: center;
  height: 120px;
  /* 👈 lock the height */
  overflow: hidden;
  transition: opacity 0.3s ease;
}


.product-heading .heading {
  font-size: clamp(1.2rem, 2vw, 2rem);
  color: var(--text-primary);
  transition: color var(--transition-fast);
}

.product-heading p {
  max-width: 80%;
  width: 100%;
  text-align: center;
  font-size: clamp(16px, 2vw, 18px);
  color: var(--text-secondary);
  transition: color var(--transition-fast);
}

@media (max-width: 768px) {
  .content {
    padding: 7px;
    gap: 8px;
  }
}

@media (min-width: 720px) {
  .loading-con {
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  }
}
</style>
