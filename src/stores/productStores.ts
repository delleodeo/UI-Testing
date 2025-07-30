import { defineStore } from 'pinia';
import axios from 'axios';
import type { Product } from '../types/product';
import type { FeatureSeller } from '../types/seller';
import { getAuthHeaders } from "../types/shared";
import { Alert } from '../components/composable/Alert.js';
import { useAuthStore } from './authStores';

const authStore = useAuthStore()
const token: string = authStore.token

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const headers = getAuthHeaders()

let scrollHandler: (() => void) | null = null;

export const useProductsStore = defineStore('products', {
  state: () => ({
    featuredProducts: [] as Product[],
    productById: <Product>{},
    products: [] as Product[],
    searchResultProducts: [] as Product[],
    relatedProducts: [] as Product[],
    featuredSeller: [] as FeatureSeller[],
    category: [],
    productId: '' as string | null,
    trendingProducts: [],
    suggestions: [],
    query: '' as string | '',
    error: null as string | null,
    selectedCategory: 'all' as string | "all",
    seletedMunicipality: 'all' as string | "all", skip: 0,
    limit: 15,
    hasMore: true,
    isLoading: false,
    isFetched: false,
    vendorIsFetched: false
  }),

  getters: {
    combinedProducts(state): Product[] {
      return [...state.featuredProducts, ...state.products];
    },
    totalProductsCount(state): number {
      return state.featuredProducts.length + state.products.length;
    },
  },

  actions: {
    async fetchSearchProducts(query: string, reset: boolean): Promise<void> {

      if (this.isLoading || !this.hasMore) return;

      if (reset) {
        this.searchResultProducts = []
      }
      this.isLoading = true;
      this.error = null;

      try {
        const response = await axios.get(`${API_BASE_URL}/products/search`, {
          params: { limit: this.limit, skip: this.skip, q: query },
        });
        const fetched: Product[] = response.data;

        console.table(fetched)

        fetched.forEach(item => {
          const filteredOption = item.option.filter(opt => {
            return opt.stock > 0;
          })

          item.option = filteredOption
        })

        if (fetched.length < this.limit) this.hasMore = false;
        this.searchResultProducts.push(...fetched);
        this.skip += this.limit;

      } catch (err: any) {
        console.error('Fetch error:', err);
        this.error = err?.response?.data?.message || 'Failed to fetch products.';
      } finally {
        this.isLoading = false;
      }
    },

    async fetchProducts(refresh = false): Promise<void> {
      console.log("tokeeennnnnnnnnnnnnnnn ", headers)
      if (this.isLoading || !this.hasMore || this.isFetched) return;

      if (refresh) {
        this.products = [];
      }
      console.log("firing")

      this.isLoading = true;
      this.error = null;

      try {
        const response = await axios.get(`${API_BASE_URL}/products`, {
          params: { limit: this.limit, skip: this.skip },
        });
        const fetched: Product[] = response.data;

        fetched.forEach(item => {
          const filteredOption = item.option.filter(opt => {
            return opt.stock > 0;
          })

          item.option = filteredOption

        })

        if (fetched.length < this.limit) this.hasMore = false;

        if (this.skip === 0) {
          this.featuredProducts = fetched.slice(0, 8); // only replace featured on first fetch
        }
        this.products.push(...fetched);

        this.skip += this.limit;
        this.isFetched = true

      } catch (err: any) {
        console.error('Fetch error:', err);
        this.error = err?.response?.data?.message || 'Failed to fetch products.';
      } finally {
        this.isLoading = false;
      }
    },

    async fetchFeaturedVendor(): Promise<void> {
      if (this.vendorIsFetched) return;

      try {
        this.featuredSeller = [];
        const response = await axios.get(`${API_BASE_URL}/vendor/featured`);
        const data = response.data;
        this.featuredSeller.push(...data)
        this.vendorIsFetched = true
      } catch (error) {
        console.log(error)
      }
    },

    async fetchProductsByCategory(category: string, filter: string, reset = false): Promise<void> {
      if (this.isLoading || !this.hasMore) return;

      // if (!this.hasMore) {
      //   this.skip = 0;
      //   this.limit = 15;
      //   this.hasMore = true
      // };

      this.isLoading = true;
      this.error = null;

      if (reset) {
        this.products = [];
        this.featuredProducts = [];
        this.skip = 0;
        this.hasMore = true;
        this.selectedCategory = category; // ✅ set current category for infinite scroll
      }

      try {
        const response = await axios.get(`${API_BASE_URL}/products/category/${category}`, {
          params: { limit: this.limit, skip: this.skip },
        });
        let fetched: Product[] = response.data;

        fetched = this.applyClientFilter(fetched, filter);

        if (fetched.length < this.limit) this.hasMore = false;

        this.products.push(...fetched);
        this.featuredProducts = fetched.slice(0, 8);
        this.skip += this.limit;
      } catch (err: any) {
        console.error('Category fetch error:', err);
        this.error = err?.response?.data?.message || 'Failed to fetch products by category.';
      } finally {
        this.isLoading = false;
      }
    },

    async fetchProductsByMunicipality(municipality: string, reset = false): Promise<void> {
      if (this.isLoading || !this.hasMore) return;


      this.isLoading = true;
      this.error = null;

      if (reset) {
        this.products = [];
        this.featuredProducts = [];
        this.skip = 0;
        this.hasMore = true;
        this.seletedMunicipality = municipality; // ✅ set current category for infinite scroll
      }

      try {
        const response = await axios.get(`${API_BASE_URL}/products/municipality/${municipality}`, {
          params: { limit: this.limit, skip: this.skip, category: this.selectedCategory },
        });
        let fetched: Product[] = response.data;

        fetched = this.applyClientFilter(fetched);

        if (fetched.length < this.limit) this.hasMore = false;

        this.products.push(...fetched);
        this.featuredProducts = fetched.slice(0, 8);
        this.skip += this.limit;
      } catch (err: any) {
        console.error('Category fetch error:', err);
        this.error = err?.response?.data?.message || 'Failed to fetch products by category.';
      } finally {
        this.isLoading = false;
      }
    },

    async fetchProductsById(productId: string): Promise<void> {
      if (this.isLoading || !this.hasMore) return;

      this.isLoading = true;
      this.error = null;
      this.productById = {};

      try {
        const response = await axios.get(`${API_BASE_URL}/products/${productId}`);
        let fetched: Product = response.data;
        this.productById = fetched;
        this.productId = fetched._id;
      } catch (err: any) {
        console.error('Category fetch error:', err);
        this.error = err?.response?.data?.message || 'Failed to fetch products by category.';
      } finally {
        this.isLoading = false;
      }
    },

    async fetchRelatedProducts(productId: string): Promise<void> {
      if (this.isLoading || !this.hasMore) return;

      this.isLoading = true;
      this.error = null;
      this.relatedProducts = [];

      try {
        const response = await axios.get(`${API_BASE_URL}/products/${productId}/related`);
        let fetched: Product[] = response.data;

        this.relatedProducts.push(...fetched)

      } catch (err: any) {
        console.error('Category fetch error:', err);
        this.error = err?.response?.data?.message || 'Failed to fetch products by category.';
      } finally {
        this.isLoading = false;
      }
    },


    async addToCart(optionId: string, productId: string, quantity = 1): Promise<void> {
      try {
        this.isLoading = true;
        await axios.post(
          `${API_BASE_URL}/cart/add`,
          { item: { productId, optionId, quantity } },
          { headers }
        );
        Alert("Product added to cart!", "success", 'var(--primary-color)');
        return;
      } catch (err: unknown) {
        console.error('Add to cart failed:', err);
        Alert("Product failed to cart!", "error", 'var(--secondary-color)');
        return;
      } finally {
        this.isLoading = false;
      }
    },

    filterProducts(filter: string): void {
      console.time("Filter time");
      const filteredFeatured = this.applyClientFilter(this.featuredProducts, filter);
      const filteredProducts = this.applyClientFilter(this.products, filter);
      this.featuredProducts = [...filteredFeatured.slice(0, 8)];
      this.products = [...filteredProducts];
      console.timeEnd("Filter time");
    },

    filterByMunicilipality(municipality: string,): void {
      this.hasMore = true;
      this.seletedMunicipality = municipality
      this.fetchProductsByMunicipality(municipality, true);
    },

    categoriesInProducts() {
      const categorySet = new Set<string>();
      categorySet.add("all");
      for (const product of this.products) {
        for (const cat of product.categories || []) {
          categorySet.add(cat);
        }
      }

      this.category = Array.from(categorySet).sort();
    },

    filterByCategory(category: string,): void {
      this.hasMore = true;
      this.selectedCategory = category

      if (this.selectedCategory.toLowerCase() == "all" && this.seletedMunicipality.toLowerCase() === "all") {
        this.products = [];
        this.featuredProducts = [];
        this.skip = 0;
        this.limit = 15;

        this.fetchProducts()
        console.log("this is fetching")
        console.log(this.seletedMunicipality)
        return
      }

      if (this.seletedMunicipality.toLowerCase() === 'all') {
        this.fetchProductsByCategory(this.selectedCategory, "", true)
        return
      }

      this.fetchProductsByMunicipality(this.seletedMunicipality, true);

    },

    applyClientFilter(products: Product[], filter: string): Product[] {
      switch (filter) {
        case 'Price: Low to High':
          return products.slice().sort((a, b) => a.price - b.price);
        case 'Price: High to Low':
          return products.slice().sort((a, b) => b.price - a.price);
        case 'Most Sold':
          return products.slice().sort((a, b) => b.sold - a.sold);
        case 'Best Rating':
          return products.slice().sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
        default:
          return products;
      }
    },

    initializeInfiniteScroll(container: HTMLElement): void {
      const throttle = (fn: () => void, delay: number) => {
        let lastCall = 0;
        return () => {
          const now = Date.now();
          if (now - lastCall >= delay) {
            lastCall = now;
            fn();
          }
        };
      };

      scrollHandler = throttle(() => {
        const scrollPosition = container.scrollTop + container.clientHeight;
        const threshold = container.scrollHeight - 300;
        if (scrollPosition >= threshold) {
          if (this.seletedMunicipality.toLowerCase() == "all" && this.selectedCategory.toLowerCase() !== "all") {
            this.fetchProductsByCategory(this.selectedCategory)
          }
          else if (this.seletedMunicipality.toLowerCase() !== "all" || this.selectedCategory.toLowerCase() !== "all") {
            this.fetchProductsByMunicipality(this.seletedMunicipality, false);

          } else {
            this.fetchProducts();
          }
        }
      }, 50);

      container.addEventListener("scroll", scrollHandler);
    },

    cleanupInfiniteScroll(container: HTMLElement): void {
      if (scrollHandler) {
        container.removeEventListener("scroll", scrollHandler);
        scrollHandler = null;
      }
    },

    async searchProducts(query) {
      if (!query.trim()) {
        this.suggestions = [];
        return;
      }

      this.isLoading = true;
      try {
        const response = await axios.get(
          `${API_BASE_URL}/products/search?q=${encodeURIComponent(query)}&limit=15`
        );

        const data = response.data;

        this.suggestions = data.map((product) => ({
          id: product.id || product._id,
          name: product.name || product.title,
          price: product.price,
          imageUrl:
            product.imageUrls?.[0] ||
            product.imageUrl ||
            "https://images.pexels.com/photos/90946/pexels-photo-90946.jpeg?auto=compress&cs=tinysrgb&w=400",
          category: product.categories?.[0] || product.category,
          rating: product.averageRating || product.rating,
        }));

      } catch (error) {
        console.error("Search error:", error);
        this.suggestions = [];
      } finally {
        this.isLoading = false;
      }
    }



  },
});
