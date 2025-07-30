<script setup lang="ts">
import { ref, computed, defineProps, onMounted } from 'vue';
import { ShoppingCartIcon, StarIcon } from '@heroicons/vue/24/solid';
import { Alert } from './composable/Alert';
import { formatToPHCurrency } from '../utils/currencyFormat';
import SelectProduct from "./ProductSelectionModal.vue";
import { useProductsStore } from '../stores/productStores';
import type { Product } from '../types/product';
import { useVendorStore } from '../stores/vendorStores';
import { handleImageError } from '../utils/fallbackImage';
import { useCartStore } from '../stores/cartStores';

const cartStore = useCartStore();
const productStore = useProductsStore();
const vendorStore = useVendorStore();
const isOpen = ref(false);
const selectedProductData = ref<Product | null>(null);

const props = defineProps<{
    typesOfProductList: 'FeaturedProducts' | 'AllProducts' | 'SearchResultProducts' | 'RelatedProducts' | 'VendorProducts'
}>();

const products = computed(() => {
    if (props.typesOfProductList === "FeaturedProducts") return productStore.featuredProducts;
    else if (props.typesOfProductList === "AllProducts") return productStore.products;
    else if (props.typesOfProductList === "SearchResultProducts") return productStore.searchResultProducts
    else if (props.typesOfProductList === "RelatedProducts") return productStore.relatedProducts
    else if (props.typesOfProductList === "VendorProducts") return vendorStore.vendorProducts
    return [];
});


setTimeout(() => {
    console.log(products.value)
})
const updateSelectedProductData = (newProduct: Product) => {
    selectedProductData.value = newProduct;
};

const addProductToCart = async (item: Product) => {
    if (!item.option || item.option.length === 0) {
        await productStore.addToCart(item._id, item._id);
        cartStore.isFetched = false
        await cartStore.fetchCart()
        return;
    }
    isOpen.value = true;
    updateSelectedProductData(item);
};

const handleClose = () => {
    isOpen.value = false;
};

// const handleImageError = (event: Event) => {
//     const target = event.target as HTMLImageElement;
//     target.src =
//         "https://images.pexels.com/photos/90946/pexels-photo-90946.jpeg?auto=compress&cs=tinysrgb&w=400";
// };


const viewProduct = (productId) => {
    window.location.assign(`/product/${productId}`)
}
</script>

<template>
    <SelectProduct :isOpen="isOpen" :optData="selectedProductData" @close="handleClose" />
    <section class="product-card">
        <div class="product-content-container">

            <div class="products-container">

                <div v-for="(item, index) in products" :key="item._id" class="cards cart-item">
                    <div class="img-con">
                        <img :src="item?.imageUrls[0]" @click="viewProduct(item._id)" fetchpriority="auto" loading="lazy" :alt="item?.name"
                            @error="handleImageError" />
                    </div>
                    <div class="details-con">
                        <p class="name">{{ item.name }}</p>
                        <p class="description">{{ item.description }}</p>
                        <div class="rating-sold">
                            <span>
                                <StarIcon class="icon"></StarIcon>
                                <span>{{ item.averageRating }}({{ item.numReviews }})</span>
                                <span class="divider">|</span>
                                <span>Sold({{ item.sold }})</span>
                            </span>
                        </div>
                        <div class="price-add-btn">
                            <button @click="addProductToCart(item)">
                                <span>{{ formatToPHCurrency(item.price) }}</span>
                                <ShoppingCartIcon class="icon"></ShoppingCartIcon>
                            </button>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    </section>
</template>

<style scoped>
/* in App.vue or style.css */
.swal2-popup.custom-icon-size .swal2-icon {
    font-size: 50px;
}




.product-card {
    width: 100%;
    height: fit-content;
    margin-bottom: 1rem;
}

.product-content-container {
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: .7rem;
}

.products-container {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(175px, 1fr));
    gap: .5rem;
    max-width: 100%;
    width: fit-content;
    box-sizing: border-box;

}


.cards {
    animation: fadeIn 0.3s ease-out;
    border-radius: 12px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    cursor: pointer;
    min-height: 12rem;
    border: 1px solid rgba(219, 217, 207, 0.521);
    box-shadow: 0 0 1px rgba(0, 0, 0, 0.308);
    max-width: 300px;
}

.cards:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
}

.img-con {
    width: 100%;
    background-color: rgb(199, 199, 199);
    display: flex;
    align-items: center;
}

.img-con img {
    width: 100%;
    aspect-ratio: 4/3;
    background-position: center;
    object-fit: cover;
    background-size: cover;
}

.details-con {
    padding: 5px 10px;
    background-color: var(--background-color);
    display: flex;
    flex-direction: column;
    flex: 1 1 auto;
    gap: .5rem;
    justify-content: space-between;
}

.details-con .name {
    font-size: clamp(var(--font-size-base), 3vw, var(--font-size-lg));
    max-width: 100%;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
    margin: 0;
    hyphens: auto;
    font-weight: 600;
}

.details-con .description {
    max-width: 80%;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
    word-break: break-word;
    overflow-wrap: break-word;
    hyphens: auto;
    margin: 0;
    font-size: clamp(var(--font-size-sm), 3vw, var(--font-size-base));
}

.rating-sold {
    display: flex;
    align-items: center;
}

.rating-sold .icon {
    height: 1.2rem;
    aspect-ratio: 1;
    color: rgb(219, 137, 13);
}

.rating-sold span {
    font-size: clamp(10.78px, 2.5vw, 12px);
    height: 100%;
    display: flex;
    align-items: center;
    gap: 3px;
}

.rating-sold span span {
    margin-top: 5px;
}

.divider {
    color: grey;
}

.price-add-btn {
    display: flex;
    justify-content: flex-end;
    flex-wrap: nowrap;
}

.price-add-btn button {
    font-size: clamp(14px, 2.5vw, 16px);
    color: var(--background-color);
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 5px 7px;
    border: 0;
    background-color: var(--primary-color);
    border-radius: .5rem;
    width: 100%;
    max-width: 100%;
    margin-top: 0.35rem;
    overflow: hidden;
    flex-wrap: nowrap;
    gap: 5px;
    cursor: pointer;
    transition: var(--transition-fast);
}

.price-add-btn button span {
    margin-top: 3px;
}

.price-add-btn button .icon {
    height: 1.2rem;
    aspect-ratio: 1;
}

@media (min-width: 720px) {

    .products-container {
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));

    }

    .price-add-btn button {
        padding: 8px;
    }

    .price-add-btn button:hover {
        opacity: var(--hover-opacity);
    }



}

@media (max-width: 768px) {}

@media (max-width: 680px) {
    .details-con {
        gap: .25rem;
    }

    .cards:hover {
        transform: none;
        box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
    }

    .rating-sold .icon {
        height: .85rem;

    }


}
</style>