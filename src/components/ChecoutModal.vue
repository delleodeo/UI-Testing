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
  selectedItems: Array,
})


const userData = localStorage.getItem("userInfo")
const user = userData ? JSON.parse(userData) : {}
const emit = defineEmits(['close', 'confirm'])

const address = reactive({
  ...user.address
})

// console.log("props ", props?.selectedItems[0]?.shippingFee)

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
const phoneError = ref('')
const isEditing = ref(false)
const isSubmitting = ref(false)

const isAddressValid = computed(() =>
  address.street &&
  address.barangay &&
  address.city &&
  address.province &&
  address.zipCode
)

const hasAddress = computed(() =>
  Object.values(address).some(val => val)
)

function isValidPHPhone(number) {
  const pattern = /^(09\d{9}|\+639\d{9})$/
  return pattern.test(number)
}

watch(phoneNumber, (val) => {
  phoneError.value = val
    ? (isValidPHPhone(val) ? '' : 'Invalid PH phone number.')
    : 'Phone number is required.'
})

const canConfirm = computed(() =>
  customerName.value &&
  isAddressValid.value &&
  selectedPaymentMethod.value &&
  !isSubmitting.value
)

const saveCustomerInfo = async () => {
  if (isEditing.value) {
    const name = customerName.value;
    const phone = phoneNumber.value
    const userInfo = { address, name, phone }
    await userStore.updateUser(userInfo)
  }
  isEditing.value = !isEditing.value
}

function generateTrackingNumber() {
  const timestamp = Date.now() // milliseconds
  const randomHex = crypto.getRandomValues(new Uint32Array(1))[0].toString(16).toUpperCase()
  return `DSTRK${timestamp}${randomHex}`
}



async function submitOrder() {
  if (!canConfirm.value) return

  isSubmitting.value = true
  const includedVendors = new Set()


  const groupedItems = props.selectedItems.reduce((acc, item) => {
    if (!acc[item.vendorId]) acc[item.vendorId] = []
    acc[item.vendorId].push(item)
    return acc
  }, {})


  Object.entries(groupedItems).forEach(async ([vendorId, items]) => {
    if (includedVendors.has(vendorId)) return

    const subTotal = items.reduce((total, item) => {
      console.log(item.quantity, " quan")
      return total + (item.price * item.quantity)
    }, 0)

    const orderData = {
      shippingFee: props.selectedItems[0].shippingFee,
      shippingAddress: { ...address },
      paymentMethod: selectedPaymentMethod.value,
      phone: phoneNumber.value,
      name: customerName.value,
      items,
      vendorId,
      subTotal,
      trackingNumber: generateTrackingNumber()
    }

    const response = await orderStore.createOrder(orderData)
    console.log(response)
    await nextTick()
    if (!response) return


    items.forEach((i) => {
       cartStore.deleteItem(vendorId, i.optionId, i.productId)
    })
    Alert("Order placed successfully go to your order to check!");
    emit('close')
    includedVendors.add(vendorId)
  })

  setTimeout(() => {
    isSubmitting.value = false
  }, 1500)

  cartStore.isFetched = false
  await cartStore.fetchCart()
}

</script>

<template>
  <transition name="fade">
    <div v-if="show" class="modal-overlay">
      <div class="modal-container">
        <button class="close-button" @click="emit('close')">&times;</button>
        <h2 class="modal-title">Checkout</h2>

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
                <p class="item-meta">{{ formatToPHCurrency(item.price) }}</p>
              </div>
            </div>
          </div>
          <div class="totals">
            <div class="subtotal">
              <span>Total:</span>
              <strong>{{ formatToPHCurrency(cartStore.itemsSubtotal) }}</strong>
            </div>
            <div class="subtotal">
              <span>Shipping:</span>
              <strong>{{ formatToPHCurrency(cartStore.selectedShippingTotal) }}</strong>
            </div>
            <div class="subtotal total">
              <span>Subtotal:</span>
              <strong>{{ formatToPHCurrency(cartStore.total) }}</strong>
            </div>
          </div>
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
                {{ key.charAt(0).toUpperCase() + key.slice(1) }}
              </label>
            </div>
            <p v-if="!isAddressValid" class="error">Please complete all address fields.</p>
          </div>

          <div v-else class="address-display">
            <p><strong>Name:</strong> {{ customerName }}</p>
            <p><strong>Phone:</strong> {{ phoneNumber }}</p>
            <p><strong>Shipping Address:</strong> {{ address.street }}, {{ address.barangay }}, {{ address.city }}, {{
              address.province }}, {{ address.zipCode }}</p>
          </div>
        </section>

        <!-- Actions -->
        <div class="actions">
          <button class="btn cancel" @click="emit('close')" :disabled="isSubmitting">Cancel</button>
          <button class="btn confirm" :disabled="!canConfirm" @click="submitOrder">
            <span v-if="isSubmitting">Processing...</span>
            <span v-else>Confirm Order</span>
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
:root {
  --primary-color: #2563eb;
  --secondary-color: #16a34a;
  --border-color: #ddd;
  --text-muted: #555;
  --bg-light: #f9f9f9;
}

.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 900000;
  padding: 1rem;
  height: 100dvh;
  backdrop-filter: blur(4px);
}

.modal-container {
  background: white;
  border-radius: 1.2rem;
  padding: 24px;
  width: 100%;
  max-width: 650px;
  max-height: 95dvh;
  overflow-y: auto;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.1);
  position: relative;
  display: flex;
  flex-direction: column;
}

.close-button {
  position: absolute;
  top: 10px;
  right: 12px;
  font-size: 1.5rem;
  background: none;
  border: none;
  cursor: pointer;
}

.modal-title {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 1.5rem;
}

.card {
  background: var(--bg-light);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 1.4rem;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
}

.items-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.item {
  display: flex;
  gap: 12px;
  align-items: center;
}

.item-img {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 8px;
}

.item-details {
  flex: 1;
}

.item-label {
  font-weight: 600;
}

.item-meta {
  font-size: 12px;
  color: var(--text-muted);
}

.totals {
  margin-top: 12px;
}

.subtotal {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  margin-bottom: 6px;
}

.total strong {
  color: var(--secondary-color);
  font-weight: 700;
}

.radio-group {
  display: grid;
  gap: 1rem;
  flex-wrap: wrap;
}

.radio-tile {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: 1px solid #ccc;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s;
}

.radio-tile.selected {
  background-color: #f0f9ff;
  border-color: #3b82f6;
}

.radio-tile.selected {
  border-color: var(--primary-color);
  background-color: #eff6ff;
}

.radio-tile input {
  accent-color: var(--primary-color);
}

.address-header {
  display: flex;
  justify-content: space-between;
}

.address-header h3 {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.edit-btn {
  font-size: 14px;
  background: none;
  border: none;
  color: var(--primary-color);
  cursor: pointer;
}

.address-form {
  display: grid;
  gap: 20px;
  margin-top: 12px;
}

.input-group {
  position: relative;
}

.input-group input {
  width: 100%;
  padding: 14px 12px;
  border: 1px solid #ccc;
  border-radius: 8px;
  background: white;
  font-size: 14px;
}

.input-group input:focus {
  outline: 2px solid var(--primary-color);
}

.input-group label {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 14px;
  background: white;
  padding: 0 4px;
  color: #aaa;
  pointer-events: none;
  transition: 0.2s;
}

.input-group label.floated {
  top: 0;
  transform: translateY(-50%) scale(0.9);
  color: #444;
}

.address-display {
  background: #fff;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 10px;
  font-size: 14px;
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: auto;
}

.btn {
  padding: 10px 16px;
  font-size: 14px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
}

.btn.cancel {
  background: #f3f4f6;
  color: #333;
}

.btn.confirm {
  background: var(--primary-color);
  color: white;
}

.btn.confirm:disabled {
  background: #bbb;
  cursor: not-allowed;
}

.error {
  font-size: 13px;
  color: red;
  margin-top: 6px;
}
</style>
