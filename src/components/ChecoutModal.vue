<script setup>
import { reactive, computed, ref, watch, nextTick } from 'vue'
import Cookies from 'js-cookie'
import { handleImageError } from '../utils/fallbackImage'
import { formatToPHCurrency } from '../utils/currencyFormat'
import { useCartStore } from '../stores/cartStores'
import { useUserStore } from '../stores/userStores'
import { useOrderStore } from '../stores/OrderStores'
import { Alert } from "../components/composable/Alert.js"

const cartStore = useCartStore()
const userStore = useUserStore()
const orderStore = useOrderStore()

const props = defineProps({
  show: Boolean,
  selectedItems: {
    type: Array,
    default: () => []
  },
})

const userData = localStorage.getItem("userInfo")
const user = userData ? JSON.parse(userData) : {}
const emit = defineEmits(['close', 'confirm'])

/* ---------- State ---------- */
const address = reactive({ ...user.address })

const focused = reactive({
  name: false,
  phone: false,
  street: false,
  barangay: false,
  city: false,
  province: false,
  zipCode: false
})

const customerName = ref(user?.name || '')
const phoneNumber = ref(user?.phone || '')
const selectedPaymentMethod = ref('')
const selectedDelivery = ref('') // 'jnt' | 'pickup' | 'agreement'
const customerAgreement = ref('')
const phoneError = ref('')
const isEditing = ref(false)
const isSubmitting = ref(false)

/* shippingFee is per-order here. If you want per-vendor shipping later, switch to a map. */
const shippingFee = ref(0)

/* ---------- Helpers & Validation ---------- */
function isValidPHPhone(number) {
  const pattern = /^(09\d{9}|\+639\d{9})$/
  return pattern.test(number)
}

watch(phoneNumber, (val) => {
  phoneError.value = val
    ? (isValidPHPhone(val) ? '' : 'Invalid PH phone number.')
    : 'Phone number is required.'
})

const isAddressValid = computed(() =>
  !!(address.street && address.barangay && address.city && address.province && address.zipCode)
)

const hasAddress = computed(() =>
  Object.values(address).some(val => val)
)

/* Update shipping fee whenever delivery option changes */
watch(selectedDelivery, (newValue) => {
  if (newValue === 'jnt') {
    shippingFee.value = 60
  } else if (newValue === 'pickup') {
    shippingFee.value = 0
  } else if (newValue === 'agreement') {
    shippingFee.value = null // null === "to be discussed"
  } else {
    shippingFee.value = 0
  }
})

/* computed total (cart subtotal + shipping if number) */
const totalAmount = computed(() => {
  const subtotal = cartStore.itemsSubtotal || 0
  const fee = shippingFee.value
  return (typeof fee === 'number') ? subtotal + fee : subtotal
})

/* confirm guard:
   keep selectedDelivery required (you already expect it), allow 'agreement' even though shippingFee is null */
const canConfirm = computed(() =>
  customerName.value &&
  isAddressValid.value &&
  selectedPaymentMethod.value &&
  selectedDelivery.value &&
  !isSubmitting.value
)

/* ---------- Utility ---------- */
function generateTrackingNumber() {
  const timestamp = Date.now()
  const randomHex = crypto.getRandomValues(new Uint32Array(1))[0].toString(16).toUpperCase()
  return `DSTRK${timestamp}${randomHex}`
}

/* getShippingFeeForOrder - explicit function in case you want to change logic later */
function getShippingFeeForOrder() {
  // returns number (0 or 60) or null for "to be discussed"
  return shippingFee.value
}

/* ---------- Main submitOrder (refactored & robust) ---------- */
async function submitOrder() {
  if (!canConfirm.value) return

  isSubmitting.value = true

  try {
    // group items by vendorId (safely)
    const groupedItems = (props.selectedItems || []).reduce((acc, item) => {
      if (!item || !item.vendorId) return acc
      if (!acc[item.vendorId]) acc[item.vendorId] = []
      acc[item.vendorId].push(item)
      return acc
    }, {})

    // convert groupedItems entries to array so we can use for..of with await
    const entries = Object.entries(groupedItems)

    for (const [vendorId, items] of entries) {
      // calculate subtotal for this vendor's items
      const subTotal = items.reduce((total, item) => total + (Number(item.price || 0) * Number(item.quantity || 1)), 0)

      // determine shipping fee for this order (you could change to per-vendor if needed)
      const fee = getShippingFeeForOrder()

      const orderData = {
        shippingFee: (typeof fee === 'number') ? fee : 0, // send 0 to backend when fee unknown
        shippingAddress: { ...address },
        paymentMethod: selectedPaymentMethod.value,
        shippingOption: selectedDelivery.value,
        agreementDetails: selectedDelivery.value === 'agreement' ? customerAgreement.value : '',
        phone: phoneNumber.value,
        name: customerName.value,
        items,
        vendorId,
        subTotal,
        trackingNumber: generateTrackingNumber(),
      }

      // create order (await response)
      const response = await orderStore.createOrder(orderData)

      if (!response || response.error) {
        // handle single-order failure gracefully — show message and continue (or break based on your preference)
        console.error('Order creation failed for vendor', vendorId, response)
        Alert('Failed to place order for one of the vendors. Please try again or contact support.')
        // you may choose to break here; I'm continuing to attempt remaining vendors
        continue
      }

      // remove items from cart only after a successful order
      items.forEach((i) => {
        try {
          cartStore.deleteItem(vendorId, i.optionId, i.productId)
        } catch (err) {
          console.warn('Failed to remove item from cart', i, err)
        }
      })
    }

    // success UX
    Alert("Order(s) placed successfully — check your Orders page for details!")
    emit('close')
  } catch (err) {
    console.error('submitOrder error', err)
    Alert('An unexpected error occurred while creating your order. Please try again.')
  } finally {
    // always reset submitting state and refetch cart
    isSubmitting.value = false
    cartStore.isFetched = false
    await cartStore.fetchCart()
  }
}

/* ---------- Save customer info ---------- */
const saveCustomerInfo = async () => {
  if (isEditing.value) {
    const name = customerName.value
    const phone = phoneNumber.value
    const userInfo = { address, name, phone }
    try {
      await userStore.updateUser(userInfo)
      Alert('Profile updated')
    } catch (err) {
      console.error('Failed to update user', err)
      Alert('Failed to save profile changes')
    }
  }
  isEditing.value = !isEditing.value
}

</script>


<template>
  <transition name="fade">
    <div v-if="show" class="modal-overlay">
      <div class="modal-container">
        <div class="modal-header">
          <h2 class="modal-title">Checkout</h2>
          <button class="close-button" @click="emit('close')">&times;</button>
        </div>

        <div class="modal-body">
          <div class="checkout-details">
            <!-- Customer Information -->
            <section class="card">
              <div class="address-header">
                <h3 class="section-title">Customer Information</h3>
                <button v-if="hasAddress" @click="saveCustomerInfo" class="edit-btn" :disabled="isSubmitting">
                  {{ isEditing ? 'Save' : 'Edit' }}
                </button>
              </div>

              <div v-if="isEditing || !hasAddress" class="address-form">
                <div class="input-group">
                  <input type="text" v-model="customerName" id="name" @focus="focused.name = true"
                    @blur="focused.name = !!customerName" placeholder=" " />
                  <label :for="'name'" :class="{ floated: focused.name || customerName }">Full Name</label>
                </div>

                <div class="input-group">
                  <input type="text" v-model="phoneNumber" id="phone" @focus="focused.phone = true"
                    @blur="focused.phone = !!phoneNumber" placeholder=" " />
                  <label :for="'phone'" :class="{ floated: focused.phone || phoneNumber }">Contact Number</label>
                </div>
                <p v-if="phoneError" class="error">{{ phoneError }}</p>

                <div class="input-group" v-for="(value, key) in address" :key="key">
                  <input v-model="address[key]" :id="key" type="text" @focus="focused[key] = true"
                    @blur="focused[key] = !!address[key]" placeholder=" " />
                  <label :for="key" :class="{ floated: focused[key] || address[key] }">
                    {{ key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1') }}
                  </label>
                </div>
                <p v-if="!isAddressValid" class="error">Please complete all address fields.</p>
              </div>

              <div v-else class="address-display">
                <p><strong>{{ customerName }}</strong> ({{ phoneNumber }})</p>
                <p>{{ address.street }}, {{ address.barangay }}, {{ address.city }}, {{ address.province }}, {{
                  address.zipCode }}</p>
              </div>
            </section>

            <!-- Delivery Option -->
            <section class="card">
              <h3 class="section-title">Delivery Option</h3>
              <div class="radio-group">
                <label class="radio-tile" :class="{ selected: selectedDelivery === 'jnt' }">
                  <input type="radio" value="jnt" v-model="selectedDelivery" :disabled="isSubmitting" />
                  <div class="delivery-option">
                    <span>J&T Express</span>
                    <small>₱60 standard delivery fee.</small>
                  </div>
                </label>
                <label class="radio-tile" :class="{ selected: selectedDelivery === 'pickup' }">
                  <input type="radio" value="pickup" v-model="selectedDelivery" :disabled="isSubmitting" />
                  <div class="delivery-option">
                    <span>Pick Up</span>
                    <small>₱0 (no shipping cost).</small>
                  </div>
                </label>
                <label class="radio-tile" :class="{ selected: selectedDelivery === 'agreement' }">
                  <input type="radio" value="agreement" v-model="selectedDelivery" :disabled="isSubmitting" />
                  <div class="agreement-option">
                    <span>🤝 Customer Agreement</span>
                    <small>You and the seller will discuss delivery options and costs.</small>
                  </div>
                </label>
              </div>
              <transition name="fade">
                <div v-if="selectedDelivery === 'agreement'" class="agreement-details">
                  <h4 class="agreement-title">Agreement Details</h4>
                  <div class="input-group">
                    <textarea v-model="customerAgreement" id="customerAgreement"
                      placeholder="e.g., I prefer Lalamove, please message me for details..."
                      class="agreement-textarea"></textarea>
                  </div>
                </div>
              </transition>
              <p v-if="!selectedDelivery" class="error">Please select a delivery option.</p>
            </section>

            <!-- Payment Method -->
            <section class="card">
              <h3 class="section-title">Payment Method</h3>
              <div class="radio-group">
                <label class="radio-tile" :class="{ selected: selectedPaymentMethod === 'wallet' }">
                  <input type="radio" value="wallet" v-model="selectedPaymentMethod" :disabled="isSubmitting" />
                  <span>💰 Wallet</span>
                </label>
                <label class="radio-tile" :class="{ selected: selectedPaymentMethod === 'gcash' }">
                  <input type="radio" value="gcash" v-model="selectedPaymentMethod" :disabled="isSubmitting" />
                  <span>📱 GCash</span>
                </label>
                <label class="radio-tile" :class="{ selected: selectedPaymentMethod === 'cod' }">
                  <input type="radio" value="cod" v-model="selectedPaymentMethod" :disabled="isSubmitting" />
                  <span>💵 Cash on Delivery</span>
                </label>
              </div>
              <p v-if="!selectedPaymentMethod" class="error">Please select a payment method.</p>
            </section>
          </div>

          <div class="checkout-summary">
            <!-- Order Summary -->
            <section class="card">
              <h3 class="section-title">Order Summary</h3>
              <div class="items-list">
                <div v-for="(item, i) in props.selectedItems" :key="i" class="item">
                  <img :src="item.imgUrl" alt="Product" @error="handleImageError" class="item-img" />
                  <div class="item-details">
                    <p class="item-label">{{ item.name }}</p>
                    <p class="item-meta">{{ item.label }}</p>
                    <p class="item-meta">x{{ item.quantity }}</p>
                  </div>
                  <p class="item-price">{{ formatToPHCurrency(item.price) }}</p>
                </div>
              </div>
              <hr class="divider" />
              <div class="totals">
                <div class="subtotal">
                  <span>Items Subtotal:</span>
                  <strong>{{ formatToPHCurrency(cartStore.itemsSubtotal) }}</strong>
                </div>
                <div class="subtotal">
                  <span>Shipping:</span>
                  <strong v-if="shippingFee === null">To be discussed</strong>
                  <strong v-else>{{ formatToPHCurrency(shippingFee) }}</strong>
                </div>
                <div class="subtotal total">
                  <span>Total:</span>
                  <strong>{{ formatToPHCurrency(totalAmount) }}</strong>
                </div>
              </div>
            </section>

            <!-- Actions -->
            <div class="actions">
              <button class="btn confirm" :disabled="!canConfirm" @click="submitOrder">
                <span v-if="isSubmitting">Processing...</span>
                <span v-else>Confirm Order</span>
              </button>
              <button class="btn cancel" @click="emit('close')" :disabled="isSubmitting">Cancel</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
:root {
  --primary-gradient: linear-gradient(to right, #3b82f6, #2563eb);
  --secondary-color: #16a34a;
  --border-color: #e5e7eb;
  --text-primary: #1f2937;
  --text-secondary: #6b7280;
  --bg-light: #f9fafb;
  --bg-white: #ffffff;
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --radius: 0.75rem;
}

.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease-out;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.98);
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(255, 255, 255, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 900000;
  padding: 1rem;
  backdrop-filter: blur(4px);
}

.modal-container {
  background: white;
  border-radius: var(--radius);
  width: 100%;
  max-width: 1024px;
  height: 95dvh;
  box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
}

.close-button {
  font-size: 1.75rem;
  font-weight: 200;
  color: var(--text-secondary);
  background: none;
  border: none;
  cursor: pointer;
  line-height: 1;
  transition: color 0.2s;
}

.close-button:hover {
  color: var(--text-primary);
}

.modal-body {
  flex-grow: 1;
  overflow-y: auto;
  padding: 1.5rem;
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

@media (min-width: 1024px) {
  .modal-body {
    grid-template-columns: 1fr 400px;
  }
}

.checkout-details {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.checkout-summary {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.card {
  background: var(--bg-light);
  border: 1px solid var(--border-color);
  border-radius: var(--radius);
  padding: 1.5rem;
}

.section-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 1rem;
}

.divider {
  border: none;
  border-top: 1px solid var(--border-color);
  margin: 1rem 0;
}

/* Order Summary */
.items-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.item {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.item-img {
  width: 64px;
  height: 64px;
  object-fit: cover;
  border-radius: 0.5rem;
  border: 1px solid var(--border-color);
}

.item-details {
  flex: 1;
}

.item-label {
  font-weight: 500;
  color: var(--text-primary);
  font-size: 0.9rem;
}

.item-meta {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.item-price {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-primary);
}

.totals {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.subtotal {
  display: flex;
  justify-content: space-between;
  color: var(--text-secondary);
}

.subtotal strong {
  color: var(--text-primary);
  font-weight: 500;
}

.total {
  font-size: 1.125rem;
  font-weight: 600;
  margin-top: 0.5rem;
}

.total strong {
  color: var(--primary-color);
}

/* Radio Tiles */
.radio-group {
  display: grid;
  gap: 0.75rem;
}

.radio-tile {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  cursor: pointer;
  transition: border-color 0.2s, box-shadow 0.2s;
  background-color: var(--bg-white);
}

.radio-tile:hover {
  border-color: var(--primary-color);
}

.radio-tile.selected {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px var(--primary-color);
}

.radio-tile input {
  accent-color: var(--primary-color);
  height: 1.25em;
  width: 1.25em;
  margin-top: 4px; /* Align with text */
  align-self: flex-start;
}

.delivery-option,
.agreement-option {
  display: flex;
  flex-direction: column;
}

.agreement-option small,
.delivery-option small {
  font-size: 0.8rem;
  color: var(--text-secondary);
  font-weight: 400;
}

.agreement-details {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
}

.agreement-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.75rem;
}

/* Customer Info */
.address-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.section-title {
  margin-bottom: 0;
}

.edit-btn {
  font-size: 0.875rem;
  font-weight: 500;
  background: none;
  border: none;
  color: var(--primary-color);
  cursor: pointer;
  transition: color 0.2s;
}

.edit-btn:hover {
  color: var(--primary-color-dark);
}

.address-form {
  display: grid;
  gap: 1rem;
}

.input-group {
  position: relative;
}

.input-group input,
.agreement-textarea {
  width: 100%;
  padding: 0.875rem;
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  background: var(--bg-white);
  font-size: 0.9rem;
  color: var(--text-primary);
  transition: border-color 0.2s, box-shadow 0.2s;
}

.input-group input:focus,
.agreement-textarea:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px var(--primary-color);
}

.input-group label {
  position: absolute;
  left: 0.875rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.9rem;
  background: var(--bg-white);
  padding: 0 0.25rem;
  color: var(--text-secondary);
  pointer-events: none;
  transition: all 0.2s ease;
}

.input-group input:not(:placeholder-shown)+label,
.input-group input:focus+label,
.input-group label.floated {
  top: 0;
  transform: translateY(-50%) scale(0.85);
  color: var(--primary-color);
}

.agreement-textarea {
  min-height: 100px;
  resize: vertical;
}

.address-display {
  font-size: 0.9rem;
  color: var(--text-secondary);
  line-height: 1.5;
}

.address-display strong {
  color: var(--text-primary);
  font-weight: 500;
}

/* Actions */
.actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: auto;
}

.btn {
  padding: 0.875rem 1.5rem;
  font-size: 1rem;
  font-weight: 500;
  border-radius: 0.5rem;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
}

.btn.confirm {
  background: var(--primary-color);
  color:white;
  box-shadow: var(--shadow-md);
}

.btn.confirm:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
}

.btn.confirm:disabled {
  background: #9ca3af;
  cursor: not-allowed;
  box-shadow: none;
}

.btn.cancel {
  background: var(--bg-white);
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
  order: 1; /* Places cancel button below confirm on mobile */
}

.btn.cancel:hover:not(:disabled) {
  background-color: var(--bg-light);
  border-color: #d1d5db;
}

.error {
  font-size: 0.8rem;
  color: #ef4444;
  margin-top: 0.25rem;
}
</style>
