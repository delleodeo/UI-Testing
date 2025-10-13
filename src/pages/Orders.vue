<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { BuildingStorefrontIcon, ChatBubbleLeftEllipsisIcon, ArrowLeftIcon } from "@heroicons/vue/24/outline"
import { useOrderStore } from '../stores/OrderStores'
import type { Order, OrderItem, OrderStatus, PaymentMethod } from '../types/order'
import { handleImageError } from '../utils/fallbackImage'
import CustomerChatModal from '../components/CustomerChatModal.vue'
import ConfirmationModal from '../components/ConfirmationModal.vue'

const router = useRouter()

const orderStore = useOrderStore()
const orders = computed<Order[]>(() => orderStore.orders)

// Chat modal state
const showChatModal = ref(false)
const selectedOrderId = ref('')
const selectedVendorName = ref('')

// Cancel confirmation modal state
const showCancelModal = ref(false)
const orderToCancel = ref('')
const isCancelling = ref(false)

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

const formatDate = (dateStr: string | Date) =>
  new Date(dateStr).toLocaleDateString('en-PH', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })

const formatDeliveryTime = (dateStr: string | Date) =>
  new Date(dateStr).toLocaleTimeString('en-PH', {
    hour: '2-digit', minute: '2-digit'
  }) + ' Delivered'

const formatCurrency = (amount: number) =>
  amount.toFixed(2)

const getOrderById = (orderId: string) =>
  orders.value.find(order => order._id === orderId || order.orderId === orderId)

// Computed property for selected order in cancel modal
const selectedOrderForCancel = computed(() => 
  orderToCancel.value ? getOrderById(orderToCancel.value) : null
)

const formatPaymentMethod = (method: PaymentMethod) => ({
  wallet: 'Digital Wallet',
  cod: 'Cash on Delivery',
  gcash: 'GCash'
})[method] || method

const formatShippingMethod = (shippingOption: string) => {
  const shippingMethods = {
    'J&T': 'J&T Express',
    'j&t': 'J&T Express',
    'jnt': 'J&T Express',
    'pickup': 'Store Pickup',
    'Pick Up': 'Store Pickup',
    'agreement': 'Customer Agreement',
    'Agreement': 'Customer Agreement',
    'delivery': 'Standard Delivery',
    'standard': 'Standard Delivery',
    'express': 'Express Delivery',
    'same-day': 'Same Day Delivery'
  };
  
  return shippingMethods[shippingOption] || shippingOption || 'Standard Delivery';
}

const getShippingIcon = (shippingOption: string) => {
  const icons = {
    'J&T': '🚚',
    'j&t': '🚚', 
    'jnt': '🚚',
    'pickup': '🏪',
    'Pick Up': '🏪',
    'agreement': '🤝',
    'Agreement': '🤝',
    'delivery': '📦',
    'standard': '📦',
    'express': '⚡',
    'same-day': '🚀'
  };
  
  return icons[shippingOption] || '📦';
}

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


// Chat functions
const openChat = (order: Order) => {
  selectedOrderId.value = order._id || order.orderId
  selectedVendorName.value = 'TechStore' // You can get this from order data
  showChatModal.value = true
}

const closeChat = () => {
  showChatModal.value = false
  selectedOrderId.value = ''
  selectedVendorName.value = ''
}

// Check if order has agreement shipping
const hasAgreementShipping = (order: Order) => {
  return order.shippingOption === 'agreement'
}

// Action handlers
const requestRefund = (orderId: string) => console.log('Request refund:', orderId)
const writeReview = (orderId: string) => console.log('Write review:', orderId)
const trackOrder = (orderId: string) => console.log('Track order:', orderId)

// Show cancel confirmation modal
const showCancelConfirmation = (orderId: string) => {
  if (!orderId) {
    console.error('❌ No order ID provided');
    alert('Error: Order ID is missing. Please refresh the page and try again.');
    return;
  }
  
  orderToCancel.value = orderId;
  showCancelModal.value = true;
}

// Handle cancel confirmation
const handleCancelConfirm = async () => {
  try {
    isCancelling.value = true;
    console.log('🔄 Cancelling order:', orderToCancel.value);
    
    // Call the order store to cancel the order
    await orderStore.cancelOrder(orderToCancel.value);
    
    // Refresh orders to show updated status
    await orderStore.fetchOrders();
    
    console.log('✅ Order cancelled successfully');
    
    // Close modal and reset state
    showCancelModal.value = false;
    orderToCancel.value = '';
    
    // Show success message (you could use a toast notification here instead)
    alert('Order has been cancelled successfully.');
    
  } catch (error) {
    console.error('❌ Failed to cancel order:', error);
    alert('Failed to cancel order. Please try again or contact support.');
  } finally {
    isCancelling.value = false;
  }
}

// Handle cancel modal close
const handleCancelClose = () => {
  if (!isCancelling.value) {
    showCancelModal.value = false;
    orderToCancel.value = '';
  }
}

const rateOrder = (orderId: string, rating: number) =>
  console.log(`Rated order ${orderId} with ${rating} stars`)

// Back navigation
const goBack = () => {
  // Check if there's a previous page in history
  if (window.history.length > 1) {
    router.back()
  } else {
    // Fallback to home page if no history
    router.push('/products')
  }
}

// Header actions
const handleFilter = () => {
  console.log('Open filter options')
  // TODO: Implement filter functionality
}

const handleSearch = () => {
  console.log('Open search')
  // TODO: Implement search functionality
}
</script>

<template>
  <div class="orders-wrapper">
    <!-- Chat Modal -->
    <CustomerChatModal 
      :show="showChatModal"
      :order-id="selectedOrderId"
      :vendor-name="selectedVendorName"
      @close="closeChat"
    />

    <!-- Cancel Order Confirmation Modal -->
    <ConfirmationModal
      :is-visible="showCancelModal"
      title="Cancel Order"
      :message="`Are you sure you want to cancel order ${orderToCancel}? This action cannot be undone and may affect your order history.`"
      confirm-text="Yes, Cancel Order"
      cancel-text="Keep Order"
      loading-text="Cancelling..."
      :is-loading="isCancelling"
      @confirm="handleCancelConfirm"
      @cancel="handleCancelClose"
    >
      <template #icon>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 18L18 6M6 6L18 18" stroke="#EF4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </template>
      <template #content>
        <div class="cancel-order-details">
          <div v-if="selectedOrderForCancel" class="order-summary">
            <h4 class="summary-title">Order Summary</h4>
            <div class="summary-info">
              <span class="info-label">Total Amount:</span>
              <span class="info-value">₱{{ formatCurrency((selectedOrderForCancel.subTotal || 0) + (selectedOrderForCancel.shippingFee || 0)) }}</span>
            </div>
            <div class="summary-info">
              <span class="info-label">Items:</span>
              <span class="info-value">{{ selectedOrderForCancel.items?.length || 0 }} item(s)</span>
            </div>
            <div class="summary-info">
              <span class="info-label">Status:</span>
              <span class="info-value">{{ capitalize(selectedOrderForCancel.status || '') }}</span>
            </div>
          </div>
          
          <div class="warning-section">
            <p class="warning-text">
              <strong>⚠️ What happens when you cancel:</strong>
            </p>
            <ul class="warning-list">
              <li>Your order will be immediately cancelled</li>
              <li>Any payment will be refunded within 3-5 business days</li>
              <li>You cannot reactivate this order once cancelled</li>
              <li>The vendor will be notified of the cancellation</li>
            </ul>
          </div>
        </div>
      </template>
    </ConfirmationModal>

    <!-- Header Layout Similar to Shopping Cart -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <button @click="goBack" class="back-button">
            <ArrowLeftIcon class="back-icon" />
          </button>
          <h1 class="page-title">My Orders</h1>
        </div>
        <!-- <div class="header-right">
          <button @click="handleFilter" class="action-button secondary">
            <span>Filter</span>
          </button>
          <button @click="handleSearch" class="action-button primary">
            <span>Search Orders</span>
          </button>
        </div> -->
      </div>
    </div>

    <!-- Enhanced Tab Navigation -->
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
                <!-- Chat button for agreement orders -->
                <button 
                  v-if="hasAgreementShipping(order)" 
                  @click="openChat(order)"
                  class="chat-btn"
                  title="Chat with vendor about delivery"
                >
                  <ChatBubbleLeftEllipsisIcon class="chat-icon" />
                </button>
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

          <!-- Shipping Method Info (All Orders) -->
          <div class="delivery-info-section">
            <div class="delivery-method">
              <span class="delivery-icon">{{ getShippingIcon(order.shippingOption) }}</span>
              <div class="delivery-details">
                <span class="delivery-label">Delivery Method:</span>
                <span class="delivery-value">{{ formatShippingMethod(order.shippingOption) }}</span>
                <span v-if="order.shippingFee > 0" class="delivery-fee">
                  (₱{{ formatCurrency(order.shippingFee) }})
                </span>
              </div>
              <!-- Chat button only for agreement orders -->
              <button 
                v-if="hasAgreementShipping(order)" 
                @click="openChat(order)" 
                class="chat-link"
              >
                💬 Chat about delivery
              </button>
            </div>
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
            <button class="btn-secondary" @click="showCancelConfirmation(order._id || order.orderId)">
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

/* Page Header - Shopping Cart Style */
.page-header {
  background: white;
  border-bottom: 1px solid #e5e7eb;
  padding: 1rem 1.5rem;
  position: sticky;
  top: 0;
  z-index: 20;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.back-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  background: transparent;
  border: none;
  border-radius: 50%;
  color: #059669;
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 0;
}

.back-button:hover {
  background: #f0fdf4;
  color: #047857;
}

.back-button:active {
  transform: scale(0.95);
}

.back-icon {
  width: 1.5rem;
  height: 1.5rem;
  flex-shrink: 0;
}

.page-title {
  font-size: 1.75rem;
  font-weight: 600;
  color: #059669;
  margin: 0;
  letter-spacing: -0.025em;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.action-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid;
}

.action-button.secondary {
  background: white;
  border-color: #d1d5db;
  color: #6b7280;
}

.action-button.secondary:hover {
  background: #f9fafb;
  border-color: #9ca3af;
  color: #4b5563;
}

.action-button.primary {
  background: #f97316;
  border-color: #f97316;
  color: white;
}

.action-button.primary:hover {
  background: #ea580c;
  border-color: #ea580c;
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
  .page-header {
    padding: 0.75rem 1rem;
  }

  .header-content {
    gap: 1rem;
  }

  .page-title {
    font-size: 1.5rem;
  }

  .back-button {
    width: 2.25rem;
    height: 2.25rem;
  }

  .back-icon {
    width: 1.25rem;
    height: 1.25rem;
  }

  .header-right {
    gap: 0.5rem;
  }

  .action-button {
    padding: 0.375rem 0.75rem;
    font-size: 0.8rem;
  }

  .action-button span {
    display: none;
  }

  .action-button.secondary::after {
    content: "⚙";
    font-size: 1rem;
  }

  .action-button.primary::after {
    content: "🔍";
    font-size: 1rem;
  }

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

/* Chat Button Styles */
.chat-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 0.25rem;
  color: var(--primary-color);
  transition: all 0.2s ease;
  margin-left: 0.5rem;
}

.chat-btn:hover {
  background: var(--primary-50);
  transform: scale(1.1);
}

.chat-icon {
  width: 18px;
  height: 18px;
}

/* Delivery Info Section */
.delivery-info-section {
  padding: var(--spacing-2) var(--spacing-3);
  background: #f0f9ff;
  border-top: 1px solid var(--gray-100);
  border-bottom: 1px solid var(--gray-100);
}

.delivery-method {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  font-size: 14px;
}

.delivery-icon {
  font-size: 18px;
  display: flex;
  align-items: center;
}

.delivery-details {
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
  flex-grow: 1;
}

.delivery-label {
  color: var(--gray-600);
  font-weight: 500;
}

.delivery-value {
  color: var(--primary-color);
  font-weight: 600;
}

.delivery-fee {
  color: var(--gray-500);
  font-weight: 400;
  font-size: 13px;
}

.chat-link {
  background: var(--primary-color);
  color: white;
  border: none;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-left: auto;
}

.chat-link:hover {
  background: var(--primary-600);
  transform: translateY(-1px);
}

/* Cancel Order Modal Styles */
.cancel-order-details {
  margin-top: 0.75rem;
}

.order-summary {
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.summary-title {
  color: #1E293B;
  font-weight: 600;
  margin: 0 0 0.75rem 0;
  font-size: 14px;
}

.summary-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  font-size: 13px;
}

.summary-info:last-child {
  margin-bottom: 0;
}

.info-label {
  color: #64748B;
  font-weight: 500;
}

.info-value {
  color: #1E293B;
  font-weight: 600;
}

.warning-section {
  background: #FEF2F2;
  border: 1px solid #FECACA;
  border-radius: 8px;
  padding: 1rem;
}

.warning-text {
  color: #B91C1C;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  font-size: 14px;
}

.warning-list {
  margin: 0;
  padding-left: 1.25rem;
  color: #7F1D1D;
  font-size: 13px;
  line-height: 1.4;
}

.warning-list li {
  margin-bottom: 0.25rem;
}

.warning-list li:last-child {
  margin-bottom: 0;
}
</style>