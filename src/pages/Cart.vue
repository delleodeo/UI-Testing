<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue';
import { useCartStore } from '../stores/cartStores';
import { useUserStore } from '../stores/userStores';
import { useRouter } from 'vue-router';
import { formatToPHCurrency } from '../utils/currencyFormat.js';
import CheckoutModal from "../components/ChecoutModal.vue"
import {
    CheckIcon,
    TrashIcon,
    ShoppingCartIcon,
    BuildingStorefrontIcon,
    PlusIcon,
    MinusIcon,

} from '@heroicons/vue/24/outline';

import {
    ArrowLeftIcon
} from '@heroicons/vue/24/solid';

const cartStore = useCartStore();
const userStore = useUserStore()
const router = useRouter()
const selectedItems = ref(null)
const checkoutData = computed(() => cartStore.selectedItemData)
const isCheckOut = ref(false)

const sortedShops = computed(() => {
    return [...cartStore.cartData.shops].sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateB - dateA;
    });
});


const checkOut = () => {
    cartStore.getSelectedItem()
    selectedItems.value = checkoutData.value
    isCheckOut.value = true
    console.table(checkoutData.value)
}

const goBack = () => {
    router.back()
}

onMounted(async () => {
    await cartStore.fetchCart();
    await userStore.fetchUser()
    await nextTick()
    localStorage.setItem("userInfo", JSON.stringify(userStore.userData))
});

const closeCheckout = () => {
    isCheckOut.value = false
}

</script>

<template>
    <CheckoutModal :selectedItems="selectedItems" :show="isCheckOut" @close="closeCheckout"></CheckoutModal>
    <section class="cart-container">
        <div class="cart-header">
            <h1 class="cart-title">
                <ArrowLeftIcon class="icon-back" @click="goBack"></ArrowLeftIcon>Shopping Cart
            </h1>
            <div class="cart-actions">
                <button class="btn-select-all" @click="cartStore.toggleSelectAll"
                    :class="{ active: cartStore.isAllSelected }" :disabled="cartStore.cartData.shops.length === 0">
                    <CheckIcon class="icon" />
                    <span class="btn-text">
                        {{ cartStore.isAllSelected ? 'Deselect All' : 'Select All' }}
                    </span>
                </button>
                <button class="btn-delete-all" @click="cartStore.clearCart" :disabled="!cartStore.isAllSelected">
                    <TrashIcon class="icon" />
                    <span class="btn-text btn-text2">Delete Selected</span>
                    <span class="btn-count">({{ cartStore.selectedItems.length }})</span>
                </button>
            </div>
        </div>

        <div class="cart-content">
            <div v-if="cartStore.cartData.shops.length === 0" class="empty-cart">
                <ShoppingCartIcon class="empty-icon" />
                <h2>Your cart is empty</h2>
                <p>Add some items to get started!</p>
            </div>

            <div v-else class="shops-list">
                <div v-for="shop in sortedShops" :key="shop.shopId" class="shop-section">
                    <div class="shop-header">
                        <div class="shop-info">
                            <input type="checkbox" :id="`shop-${shop.shopId}`"
                                :checked="cartStore.isShopSelected(shop.shopId)"
                                @change="cartStore.toggleShopSelection(shop.shopId)" class="shop-checkbox" />
                            <label :for="`shop-${shop.shopId}`" class="shop-name">
                                <BuildingStorefrontIcon class="shop-icon" />
                                <span>{{ shop.shopName }}</span>
                            </label>
                        </div>
                    </div>

                    <div class="items-list">
                        <div v-for="item in shop.items" :key="item.itemId" class="cart-item">
                            <div class="item-checkbox">
                                <input type="checkbox" :id="`item-${item.itemId}`"
                                    :checked="cartStore.selectedItems.includes(item.itemId)"
                                    @change="cartStore.toggleItemSelection(item.itemId)" />
                            </div>

                            <div class="item-image">
                                <img :src="item.imgUrl" :alt="item.name" loading="lazy" />
                            </div>

                            <div class="item-info">
                                <div class="item-details">
                                    <h3 class="item-name">{{ item.name }}</h3>
                                    <h3 class="item-ctgry">{{ item.label }}</h3>
                                    <p class="item-price">{{ formatToPHCurrency(item.price) }}</p>
                                </div>

                                <div class="item-controls">
                                    <div class="quantity-section">
                                        <div class="quantity-controls">
                                            <button class="qty-btn qty-minus"
                                                @click="cartStore.handleDecrement(item.productId, item.optionId, shop.shopId)"
                                                :disabled="item.quantity <= 1" aria-label="Decrease quantity">
                                                <MinusIcon class="icon" />
                                            </button>
                                            <span class="quantity">{{ item.quantity }}</span>
                                            <button class="qty-btn qty-plus"
                                                @click="cartStore.handleIncrement(item.productId, item.optionId, shop.shopId)"
                                                :disabled="item.quantity >= 50" aria-label="Increase quantity">
                                                <PlusIcon class="icon" />
                                            </button>
                                        </div>
                                    </div>

                                    <button class="btn-delete-item"
                                        @click="cartStore.deleteItem(shop.shopId, item.itemId, item.productId)"
                                        aria-label="Delete item">
                                        <TrashIcon class="icon" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div v-if="cartStore.cartData.shops.length > 0" class="checkout-sticky">
            <div class="checkout-content">
                <div class="checkout-summary">
                    <div class="summary-line">
                        <span class="summary-label">
                            {{ cartStore.selectedItemsCount }} item{{ cartStore.selectedItemsCount !== 1 ? 's' : '' }}
                            selected
                        </span>
                    </div>
                    <div class="summary-subtotal">
                        <span>Items Subtotal: {{ formatToPHCurrency(cartStore.itemsSubtotal) }}</span>
                        <span>Total Shipping: ₱{{ cartStore.selectedShippingTotal.toFixed(2) }}</span>
                    </div>
                </div>

                <button @click="checkOut" class="btn-checkout" :disabled="cartStore.selectedItems.length === 0"
                    :class="{ disabled: cartStore.selectedItems.length === 0 }">
                    <span>Check Out :</span>
                    <span class="subtotal">{{ formatToPHCurrency(cartStore.total) }}</span>
                </button>
            </div>
            <!-- <div class="mobile-nav">
                <MobileNav activeItem="cart"></MobileNav>
            </div> -->
        </div>

    </section>
</template>


<style scoped>
.mobile-nav {
    position: relative;
}

.cart-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 24px;
    background-color: var(--background-color);
    min-height: 100dvh;
    max-height: 100dvh;
    overflow: auto;
    padding-bottom: 120px;
    /* Space for sticky checkout */
}

/* Header Styles */
.cart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 32px;
    padding-bottom: 24px;
    border-bottom: 2px solid var(--border-color);
    background-color: #fff;
    z-index: 100;
}

.cart-title {

    font-weight: 700;
    color: var(--primary-color);
    margin: 0;
    line-height: 1.2;
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 0px 10px;
}

.cart-title .icon-back {
    width: clamp(1rem, 5vw, 1.7rem);
    aspect-ratio: 1;
    cursor: pointer;
}

.cart-actions {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
}

.btn-select-all,
.btn-delete-all {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    border: 2px solid var(--border-color);
    border-radius: 8px;
    background: whitesmoke;
    color: var(--text-secondary);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: var(--transition);
    white-space: nowrap;
    border-color: var(--secondary-color);
    color: var(--secondary-color);
}

.btn-select-all:hover,
.btn-delete-all:hover:not(:disabled) {

    transform: translateY(-1px);
}

.btn-select-all.active {
    background: var(--secondary-color);
    border-color: var(--secondary-color);
    color: white;
}

.btn-delete-all {
    border-color: var(--secondary-color);
    color: var(--secondary-color);
}

.btn-delete-all:hover:not(:disabled) {
    background: var(--secondary-color);
    color: white;
}

.btn-delete-all:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    transform: none;
}

.icon {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
}

/* Empty Cart */
.empty-cart {
    text-align: center;
    padding: 80px 20px;
    color: var(--text-secondary);
}

.empty-icon {
    width: 80px;
    height: 80px;
    margin: 0 auto 24px;
    color: #ccc;
}

.empty-cart h2 {
    font-size: 24px;
    margin-bottom: 12px;
    color: var(--primary-color);
}

/* Shop Sections */
.shops-list {
    display: flex;
    flex-direction: column;
    gap: 24px;
    margin-bottom: 4rem;
}

.shop-section {
    background: white;
    border-radius: var(--border-radius);
    box-shadow: var(--shadow-medium);
    overflow: hidden;
    transition: var(--transition);
}

.shop-section:hover {
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
}

.shop-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
    background: var(--hover-bg);
    border-bottom: 1px solid var(--border-color);
}

.shop-info {
    display: flex;
    align-items: center;
    gap: 12px;
}

.shop-checkbox {
    width: 18px;
    height: 18px;
    cursor: pointer;
    accent-color: var(--primary-color);
}

.shop-name {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 18px;
    font-weight: 600;
    color: rgb(5, 49, 5);
    cursor: pointer;
    transition: var(--transition);
}

.shop-name:hover {
    color: var(--primary-color);
}

.shop-icon {
    width: 20px;
    height: 20px;
    color: var(--primary-color);
}

.btn-delete-shop {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    border: 1px solid var(--secondary-color);
    border-radius: 6px;
    background: white;
    color: var(--secondary-color);
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: var(--transition);
}

.btn-delete-shop:hover {
    background: var(--secondary-color);
    color: white;
    transform: translateY(-1px);
}

/* Cart Items */
.items-list {
    padding: 0;
}

.cart-item {
    display: grid;
    grid-template-columns: 40px 100px 1fr;
    gap: 16px;
    align-items: flex-start;
    padding: 20px 24px;
    border-bottom: 1px solid #f0f0f0;
    transition: var(--transition);
}

.cart-item:hover {
    background: var(--hover-bg);
}

.cart-item:last-child {
    border-bottom: none;
}

.item-checkbox input {
    width: 16px;
    height: 16px;
    cursor: pointer;
    accent-color: var(--primary-color);
    margin-top: 4px;
}

.item-image {
    width: 100px;
    height: 100px;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid var(--border-color);
}

.item-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: var(--transition);
}

.item-image:hover img {
    transform: scale(1.05);
}

.item-info {
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-width: 0;
}

.item-details {
    flex: 1;
}

.item-name,
.item-ctgry {
    font-size: 16px;
    font-weight: 600;
    color: rgb(5, 49, 5);
    margin: 0 0 8px 0;
    line-height: 1.4;
    display: -webkit-box;
    max-width: 80%;
    text-overflow: ellipsis;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.item-ctgry {
    font-size: clamp(10px, 2vw, 12px);
    color: rgba(145, 145, 145, 0.801);
}

.item-price {
    font-size: 14px;
    color: var(--text-secondary);
    margin: 0;
    font-weight: 500;
}

.item-controls {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 16px;
}


.quantity-controls {
    display: flex;
    align-items: center;
    gap: 12px;
    background: var(--hover-bg);
    border-radius: 8px;
    padding: 4px;
    width: fit-content;
}

.qty-btn {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--border-color);
    border-radius: 6px;
    background: white;
    cursor: pointer;
    transition: var(--transition);
}

.qty-btn:hover:not(:disabled) {
    border-color: var(--secondary-color);
    background: var(--secondary-color);
    color: white;
    transform: scale(1.05);
}

.qty-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    transform: none;
}

.quantity {
    font-size: 16px;
    font-weight: 600;
    min-width: 24px;
    text-align: center;
    color: var(--primary-color);
}

.item-total {
    text-align: right;
    min-width: 80px;
}




.btn-delete-item {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--border-color);
    border-radius: 6px;
    background: white;
    color: var(--text-secondary);
    cursor: pointer;
    transition: var(--transition);
}

.btn-delete-item:hover {
    border-color: var(--secondary-color);
    background: var(--secondary-color);
    color: white;
    transform: scale(1.05);
}

/* Sticky Checkout */
.checkout-sticky {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background-color: #fdfaf3e0;
    border-top: 1px solid var(--border-color);
    box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1);
    z-index: 1000;
    backdrop-filter: blur(10px);
    margin-bottom: 3.5rem;
}

.checkout-content {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 24px;
    gap: 24px;
}

.checkout-summary {
    flex: 1;
}

.summary-line {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
}

.summary-label {
    font-size: 14px;
    color: var(--text-secondary);
    font-weight: 500;
}

/* .summary-total {
    font-size: 20px;
    font-weight: 700;
    color: var(--primary-color);
} */

.summary-subtotal {
    font-size: 12px;
    color: var(--text-secondary);
    display: flex;
    flex-direction: column;
}

.btn-checkout {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 16px 32px;
    border: none;
    border-radius: 8px;
    background: var(--primary-color);
    color: white;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: var(--transition);
    white-space: nowrap;
}

.btn-checkout:hover:not(.disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(9, 74, 37, 0.3);
}

.btn-checkout.disabled {
    background: #ccc;
    cursor: not-allowed;
    transform: none;
}

.subtotal {
    font-size: 16px;
    transition: var(--transition);
}

.btn-checkout:hover:not(.disabled) .subtotal {
    transform: translateX(4px);
}

.checkout-spacer {
    height: 80px;
}

/* Responsive Design */
@media (min-width: 840px) {
    .checkout-sticky {
        margin-bottom: 0;
    }

    .shops-list {
        margin-bottom: 0;
    }


}

@media (max-width: 840px) {
    .cart-title {
        padding: 0;
    }

    .cart-title .icon-back {
        display: none;
    }
}

@media (max-width: 768px) {
    .cart-container {
        padding: 0;
        padding-bottom: 100px;
    }

    .cart-header {
        gap: 16px;
        display: flex;
        align-self: center;
        padding: 20px 16px;
        margin-bottom: 20px;
        position: sticky;
        top: 0;
    }

    .cart-title {
        font-size: 20px;
        text-align: center;
    }

    .btn-select-all,
    .btn-delete-all {
        padding: 10px;
        font-size: 12px;
    }

    .btn-text2 {
        display: none;
    }

    .cart-actions {
        gap: 8px;
        justify-content: space-between;
    }




    .btn-count {
        display: inline;
    }

    .shop-header {
        gap: 12px;
        padding: 12px;
    }

    .shop-info {
        justify-content: flex-start;
    }

    .delete-text {
        display: none;
    }

    .shops-list {
        gap: 16px;
        padding: 0 16px;
    }

    .cart-item {
        grid-template-columns: 30px 80px 1fr;
        gap: 12px;
        padding: 16px;
    }

    .item-image {
        width: 80px;
        height: 80px;
    }

    .item-controls {
        gap: 12px;
    }

    .quantity-controls {
        justify-content: center;
        margin: 0 auto;
    }

    .item-total {
        text-align: center;
    }

    .btn-delete-item {
        align-self: center;
    }

    .checkout-content {
        padding: 12px 16px;
        gap: 16px;
    }

    .summary-total {
        font-size: 18px;
    }

    .btn-checkout {
        padding: 12px 20px;
        font-size: 14px;
    }
}

@media (max-width: 480px) {



    .cart-title {
        font-size: 18px;
        text-align: center;
        color: white;
    }

    .btn-select-all,
    .btn-delete-all {
        padding: 10px 12px;
        font-size: 10.78px;
    }

    .cart-header {
        padding: 16px 12px;
        background-color: var(--primary-color);
    }

    .shops-list {
        padding: 0 12px;
    }

    .cart-item {
        grid-template-columns: 25px 70px 1fr;
        gap: 10px;
        padding: 12px;
    }

    .item-image {
        width: 70px;
        height: 70px;
    }

    .item-name {
        font-size: 14px;
    }

    .item-price {
        font-size: 13px;
    }

    .checkout-content {
        padding: 10px 12px;
        gap: 12px;
    }

    .summary-total {
        font-size: 16px;
    }

    .btn-checkout {
        padding: 10px 16px;
        font-size: 13px;
    }
}

/* Focus states for accessibility */
button:focus-visible,
input:focus-visible {
    outline: 2px solid var(--secondary-color);
    outline-offset: 2px;
}

/* Loading states */
.cart-item.loading {
    opacity: 0.6;
    pointer-events: none;
}

/* Animation for smooth interactions */

.cart-item {
    animation: fadeIn 0.3s ease-out;
}
</style>