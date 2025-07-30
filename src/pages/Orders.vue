<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { BuildingStorefrontIcon } from "@heroicons/vue/24/outline"
import { useOrderStore } from '../stores/OrderStores'
import type { Order, OrderItem, OrderStatus, PaymentMethod } from '../types/order'
import { handleImageError } from '../utils/fallbackImage'

const orderStore = useOrderStore()
const orders = computed<Order[]>(() => orderStore.orders)

onMounted(async () => {
  await orderStore.fetchOrders()
})

// Available order statuses
const statuses: OrderStatus[] = ['pending', 'paid', 'shipped', 'delivered', 'cancelled']
const currentStatus = ref<OrderStatus>('pending')

// Filter orders by selected status
const filteredOrders = computed(() =>
  orders.value.filter(order => order.status === currentStatus.value)
)

const selectStatus = (status: OrderStatus) => {
  currentStatus.value = status
}

const getOrderCount = (status: OrderStatus) =>
  orders.value.filter(order => order.status === status).length

const capitalize = (val: string) =>
  val.charAt(0).toUpperCase() + val.slice(1)

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('en-PH', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })

const formatDeliveryTime = (dateStr: string) =>
  new Date(dateStr).toLocaleTimeString('en-PH', {
    hour: '2-digit', minute: '2-digit'
  }) + ' Delivered'

const formatCurrency = (amount: number) =>
  amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const formatPaymentMethod = (method: PaymentMethod) => ({
  wallet: 'Digital Wallet',
  cod: 'Cash on Delivery',
  gcash: 'GCash'
})[method] || method

const getStatusClass = (status: OrderStatus) => ({
  pending: 'status-pending',
  paid: 'status-paid',
  shipped: 'status-shipped',
  delivered: 'status-delivered',
  cancelled: 'status-cancelled',

})[status] || ''

const getStatusDisplayText = (status: OrderStatus) => ({
  pending: 'Order pending',
  paid: 'Order paid',
  shipped: 'Order shipped',
  delivered: 'Order delivered',
  cancelled: 'Order cancelled'
})[status] || status


// Action handlers
const requestRefund = (orderId: string) => console.log('Request refund:', orderId)
const writeReview = (orderId: string) => console.log('Write review:', orderId)
const trackOrder = (orderId: string) => console.log('Track order:', orderId)
const cancelOrder = (orderId: string) => console.log('Cancel order:', orderId)
const rateOrder = (orderId: string, rating: number) =>
  console.log(`Rated order ${orderId} with ${rating} stars`)
</script>

<template>
  <div class="orders-wrapper">
    <!-- Top Tab Navigation -->
    <div class="tab-nav">
      <div class="tab-nav-inner">
        <button v-for="status in statuses" :key="status" :class="{ active: currentStatus === status }"
          @click="selectStatus(status)" class="tab-button">
          <span class="tab-text">{{ capitalize(status) }}</span>
          <span v-if="getOrderCount(status) > 0" class="tab-count">{{ getOrderCount(status) }}</span>
        </button>
      </div>
    </div>

    <!-- Orders List -->
    <div class="orders-container">
      <!-- Empty State -->
      <div v-if="filteredOrders.length === 0" class="empty-state">
        <div class="empty-icon">📦</div>
        <h3 class="empty-title">No {{ currentStatus }} orders</h3>
        <p class="empty-description">
          Orders with {{ currentStatus }} status will appear here when available.
        </p>
      </div>

      <!-- Orders Grid -->
      <div v-else class="orders-grid">
        <div v-for="(order, index) in filteredOrders" :key="order.orderId" class="order-card"
          :style="{ animationDelay: `${index * 50}ms` }">
          <!-- Order Header -->
          <div class="order-header">
            <div class="store-info">
              <div class="store-badge">
                <span class="store-icon">
                  <BuildingStorefrontIcon class="icon"></BuildingStorefrontIcon>
                </span>
                <span class="store-name">TechStore</span>
              </div>
              <span :class="['order-status', getStatusClass(order.status)]">
                {{ getStatusDisplayText(order.status) }}
              </span>
            </div>
          </div>

          <!-- Delivery Status -->
          <div v-if="order.status === 'delivered'" class="delivery-status">
            <div class="delivery-icon">🚚</div>
            <div class="delivery-info">
              <div class="delivery-time">{{ formatDeliveryTime(order.updatedAt) }}</div>
              <div class="delivery-message">Your package has been delivered.</div>
            </div>
            <div class="delivery-arrow">›</div>
          </div>

          <!-- Tracking Status for Shipped Orders -->
          <div v-else-if="order.status === 'shipped'" class="delivery-status">
            <div class="delivery-icon">📦</div>
            <div class="delivery-info">
              <div class="delivery-time">In Transit</div>
              <div class="delivery-message">Tracking: {{ order.trackingNumber }}</div>
            </div>
            <div class="delivery-arrow">›</div>
          </div>

          <!-- Order Items -->
          <div class="items-section">
            <div v-for="(item, i) in order.items" :key="i" class="item-card">
              <div class="item-image">
                <img :src="item.imgUrl" :alt="item.name" @error="handleImageError" />
              </div>
              <div class="item-details">
                <div class="item-info">
                  <h4 class="item-name">{{ item.name || "N/A" }}</h4>
                  <p class="item-variant">{{ item.label }}</p>
                  <div class="item-quantity">x{{ item.quantity }}</div>
                </div>
                <div class="item-price">
                  <span class="price">₱{{ formatCurrency(item.price) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Order Total -->
          <div class="order-total">
            <span class="total-label">Shipping Fee:</span>
            <span class="total-amount">₱{{ formatCurrency(order?.shippingFee || 0) }}</span>
          </div>
          <div class="order-total">
            <span class="total-label">Total:</span>
            <span class="total-amount">₱{{ formatCurrency(order.subTotal + order.shippingFee) }}</span>
          </div>

          <!-- Action Buttons -->
          <div class="action-buttons" v-if="order.status === 'delivered'">
            <button class="btn-secondary" @click="requestRefund(order.orderId)">
              Request refund
            </button>
            <button class="btn-primary" @click="writeReview(order.orderId)">
              Write review
            </button>
          </div>

          <div class="action-buttons" v-else-if="order.status === 'shipped'">
            <button class="btn-primary" @click="trackOrder(order.orderId)">
              Track order
            </button>
            <!-- <button class="btn-primary" @click="contactSeller(order.orderId)">
              Contact seller
            </button> -->
          </div>

          <div class="action-buttons" v-else-if="order.status === 'pending'">
            <button class="btn-secondary" @click="cancelOrder(order.orderId)">
              Cancel order
            </button>
            <!-- <button class="btn-primary" @click="payNow(order.orderId)">
              Pay now
            </button> -->
          </div>

          <!-- Quick Review (for delivered orders) -->
          <div v-if="order.status === 'delivered'" class="quick-review">
            <span class="review-label">Quick review</span>
            <div class="star-rating">
              <button v-for="star in 5" :key="star" class="star" :class="{ filled: star <= (0) }"
                @click="rateOrder(order.orderId, star)">
                ★
              </button>
            </div>
          </div>

          <!-- Order Details Footer -->
          <div class="shipping-address">
            <h4>Shiping Address</h4>
            <span>{{ order.shippingAddress.province }}, </span>
            <span>{{ order.shippingAddress.city }}, </span>
            <span>{{ order.shippingAddress.barangay }}, </span>
            <span>{{ order.shippingAddress.street }}</span>
          </div>
          <div class="order-footer">
            <div class="footer-info">
              <span class="order-id">TRK No: {{ order.trackingNumber.toUpperCase() }}</span>
              <span class="order-date">{{ formatDate(order.updatedAt) }}</span>
            </div>
            <div class="payment-info">
              <span class="payment-method">{{ formatPaymentMethod(order.paymentMethod) }}</span>
              <!-- <span :class="['payment-status ', getStatusClass(order.status)]">
                {{ getStatusDisplayText(order.status) }}
              </span> -->
            </div>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>


<style scoped>
.orders-wrapper {
  display: flex;
  flex-direction: column;

  background: var(--backgorund-color);
  color: var(--gray-900);
  line-height: 1.5;
  height: 100dvh;
  overflow: auto;
  padding-bottom: 4rem;
}

/* Tab Navigation */
.tab-nav {
  background: white;
  border-bottom: 1px solid var(--gray-200);
  position: sticky;
  top: 0;
  z-index: 10;
  box-shadow: var(--shadow-sm);
  max-width: 1200px;
  display: flex;
  width: 100dvw;
  justify-content: center;
  margin: 0 auto;
}

.tab-nav-inner {
  display: flex;
  width: fit-content;
  overflow: auto;
  max-width: 100dvw;
  padding: 0px 10px;
}

.tab-nav-inner::-webkit-scrollbar {
  display: none;
}

.tab-button {
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
  padding: var(--spacing-2) var(--spacing-3);
  border: none;
  background: none;
  font-weight: 500;
  font-size: 14px;
  cursor: pointer;
  color: var(--gray-600);
  transition: all 0.2s ease;
  position: relative;
  white-space: nowrap;
  min-width: fit-content;
  border-bottom: 2px solid transparent;
}

.tab-button:hover {
  color: var(--primary-color);
  background: var(--primary-50);
}

.tab-button.active {
  color: var(--primary-color);
  border-bottom-color: var(--primary-color);
  background: var(--primary-50);
}

.tab-text {
  font-weight: 600;
}

.tab-count {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  background: var(--primary-color);
  color: white;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
  padding: 0 6px;
}

.tab-button.active .tab-count {
  background: var(--primary-color);
}

/* Orders Container */
.orders-container {
  flex: 1;
  max-width: 600px;
  margin: 0 auto;
  width: 100%;
  padding: var(--spacing-2);
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  text-align: center;
  padding: var(--spacing-4);
}

.empty-icon {
  font-size: 64px;
  margin-bottom: var(--spacing-3);
  opacity: 0.6;
}

.empty-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--gray-700);
  margin: 0 0 var(--spacing-2) 0;
  line-height: 1.2;
}

.empty-description {
  font-size: 16px;
  color: var(--gray-500);
  margin: 0;
  max-width: 400px;
}

/* Orders Grid */
.orders-grid {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Order Card */
.order-card {
  background: white;
  border-radius: var(--border-radius-lg);
  box-shadow: 0 0 3px rgb(170, 170, 170);
  overflow: hidden;
  transition: all 0.2s ease;
  animation: slideIn 0.3s ease forwards;
  opacity: 0;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.order-card:hover {
  box-shadow: var(--shadow-lg);
}

/* Order Header */
.order-header {
  padding: var(--spacing-2) var(--spacing-3);
  border-bottom: 1px solid var(--gray-100);
}

.store-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.store-badge {
  display: flex;
  align-items: center;
  gap: var(--spacing-1);

  color: black;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: clamp(1rem, 2vw, 1.5rem);
  font-weight: 600;
}

.store-icon {
  font-size: 14px;
}

.store-icon .icon {
  height: 1.4rem;
  aspect-ratio: 1;
  color: var(--primary-color);
}

/* .store-name {
  font-size: 12px;
} */

.order-status {
  font-size: clamp(12px, 2vw, 14px);
  font-weight: 500;
  color: var(--gray-600);
  padding: 5px 7px;
  border-radius: 7px;
  color: white;
}

.status-delivered {
  background-color: var(--success-color);
}

.status-shipped {
  background-color: var(--success-600);
}

.status-pending {
  background-color: var(--secondary-color);
}

.status-paid {
  background-color: var(--success-600);
}

.status-cancelled {
  background-color: var(--error-color);
}

/* Delivery Status */
.delivery-status {
  display: flex;
  align-items: center;
  padding: var(--spacing-2) var(--spacing-3);
  background: var(--gray-50);
  border-bottom: 1px solid var(--gray-100);
}

.delivery-icon {
  font-size: 18px;
  margin-right: var(--spacing-2);
  color: var(--gray-600);
}

.delivery-info {
  flex: 1;
}

.delivery-time {
  font-size: 14px;
  font-weight: 600;
  color: var(--gray-900);
  margin-bottom: 2px;
}

.delivery-message {
  font-size: 13px;
  color: var(--gray-600);
}

.delivery-arrow {
  font-size: 16px;
  color: var(--gray-400);
}

/* Items Section */
.items-section {
  padding: var(--spacing-3);
}

.item-card {
  display: flex;
  gap: var(--spacing-2);
  margin-bottom: var(--spacing-2);
}

.item-card:last-child {
  margin-bottom: 0;
}

.item-image {
  width: 60px;
  height: 60px;
  border-radius: var(--border-radius);
  overflow: hidden;
  background: var(--gray-100);
  flex-shrink: 0;
  box-shadow: 0 0 5px rgb(129, 129, 129);
  display: flex;
  align-items: center;
}

.item-image img {
  width: 100%;
  aspect-ratio: 4/3;
  object-fit: contain;
}

.item-details {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.item-info {
  flex: 1;
}

.item-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--gray-900);
  margin: 0 0 4px 0;
  line-height: 1.3;
}

.item-variant {
  font-size: 13px;
  color: var(--gray-600);
  margin: 0 0 4px 0;
}

.item-quantity {
  font-size: 13px;
  color: var(--gray-600);
}

.item-price {
  text-align: right;
}

.price {
  font-size: 14px;
  font-weight: 600;
  color: var(--gray-900);
}

/* Order Total */
.order-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 7px var(--spacing-3);
  border-top: 1px solid var(--gray-100);
  background: var(--gray-50);

}

.total-label {
  font-size: 14px;
  color: var(--gray-600);
}

.total-amount {
  font-size: 16px;
  font-weight: 700;
  color: var(--gray-900);
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: var(--spacing-2);
  padding: var(--spacing-2) var(--spacing-3);
  border-top: 1px solid var(--gray-100);
}

.btn-secondary,
.btn-primary {
  flex: 1;
  padding: 10px 16px;
  border-radius: var(--border-radius);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.btn-secondary {
  background: var(--gray-100);
  color: var(--gray-700);
}

.btn-secondary:hover {
  background: var(--gray-200);
}

.btn-primary {
  background: var(--secondary-color);
  color: white;
}

.btn-primary:hover {
  background: rgb(255, 123, 0);
}

/* Quick Review */
.quick-review {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-2) var(--spacing-3);
  border-top: 1px solid var(--gray-100);
}

.review-label {
  font-size: 14px;
  color: var(--gray-600);
}

.star-rating {
  display: flex;
  gap: 4px;
}

.star {
  background: none;
  border: none;
  font-size: 18px;
  color: var(--gray-300);
  cursor: pointer;
  transition: color 0.2s ease;
}

.star.filled {
  color: #ffd700;
}

.star:hover {
  color: #ffd700;
}

/* Order Footer */
.order-footer {
  padding: var(--spacing-2) var(--spacing-3);
  background: var(--gray-50);
  border-top: 1px solid var(--gray-100);
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-2);
}


.shipping-address {
  padding: var(--spacing-2) var(--spacing-3);
  background: var(--gray-50);
  border-top: 1px solid var(--gray-100);
  border-bottom: 1px solid rgb(230, 230, 230);
}

.shipping-address h4 {
  font-size: 14px;
}

.shipping-address span {
  font-size: 14px;
  color: var(--gray-500);
  font-weight: 500;
}

.footer-info,
.payment-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.order-id,
.payment-method {
  font-size: 12px;
  color: var(--gray-500);
  font-weight: 500;
}

.order-date,
.payment-status {
  font-size: 12px;
  font-weight: 600;
}

.payment-paid {
  color: var(--success-600);
}

.payment-pending {
  color: var(--warning-600);
}

/* Responsive Design */
@media (max-width: 768px) {
  .orders-container {
    max-width: 100%;
    padding: var(--spacing-1);
  }

  .tab-button {
    padding: var(--spacing-2);
    font-size: 13px;
  }

  .order-footer {
    grid-template-columns: 1fr;
    gap: var(--spacing-1);
  }

  .item-name {
    font-size: 13px;
  }

  .item-variant,
  .item-quantity {
    font-size: 12px;
  }
}

@media (max-width: 480px) {
  .store-info {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-1);
  }

  .action-buttons {
    flex-direction: column;
  }

  .btn-secondary,
  .btn-primary {
    flex: none;
  }
}

/* Focus and Accessibility */
.tab-button:focus-visible,
.btn-secondary:focus-visible,
.btn-primary:focus-visible,
.star:focus-visible {
  outline: 2px solid var(--primary-color);
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {

  .order-card,
  .tab-button,
  .btn-secondary,
  .btn-primary,
  .star {
    transition: none;
  }

  .orders-grid {
    animation: none;
  }

  .order-card {
    animation: none;
    opacity: 1;
  }
}
</style>