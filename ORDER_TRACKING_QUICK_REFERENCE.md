# Order Tracking Quick Reference

## Quick Start

### Open Tracker Modal from Anywhere
```vue
<script setup>
import { ref } from 'vue'
import OrderTrackerModal from '@/components/OrderTrackerModal.vue'

const showTracker = ref(false)
const orderId = ref('') // Optional: pre-select an order
</script>

<template>
  <button @click="showTracker = true">Track Order</button>
  
  <OrderTrackerModal
    v-if="showTracker"
    :order-id="orderId"
    @close="showTracker = false"
  />
</template>
```

---

## Component Props

### OrderTrackerModal
```typescript
interface Props {
  orderId?: string  // Optional: Pre-select an order
}

interface Emits {
  close: []  // Emitted when modal is closed
}
```

**Usage Examples**:

```vue
<!-- Browse mode: Let user select order -->
<OrderTrackerModal @close="handleClose" />

<!-- Direct track mode: Pre-select specific order -->
<OrderTrackerModal 
  order-id="123456"
  @close="handleClose" 
/>
```

---

## Store Methods

### OrderStores

```typescript
import { useOrderStore } from '@/stores/OrderStores'

const orderStore = useOrderStore()

// Fetch rider location for an order
const location = await orderStore.fetchRiderLocation(orderId)
// Returns: { latitude, longitude, timestamp, speed, heading }

// Clear cached location
orderStore.clearRiderLocation(orderId)
```

---

## Map Customization

### Change Update Interval
**File**: `OrderTrackerModal.vue`
```javascript
// Default: 5000ms (5 seconds)
trackingInterval.value = window.setInterval(() => {
  updateRiderLocation()
}, 5000)  // ← Change this value
```

### Customize Markers
```javascript
// Customer Marker Color
background: #3b82f6  // Blue

// Rider Marker Color
background: #f97316  // Orange

// Route Line Style
color: '#f97316',
weight: 4,
opacity: 0.7,
dashArray: '10, 10'
```

### Change Default Location
```javascript
// Default: Oriental Mindoro, Philippines
const customerLocation = [13.0583, 121.0583]
```

---

## Order Status Logic

### When to Show Track Button
```vue
<!-- Only show for shipped orders -->
<button 
  v-if="order.status === 'shipped'"
  @click="trackOrder(order.orderId)"
>
  Track Order
</button>
```

### Status Messages
| Order Status | Message |
|-------------|---------|
| `pending` | "Your order is pending. We'll notify you when it's out for delivery." |
| `paid` | "Your order is paid. We'll notify you when it's out for delivery." |
| `shipped` | "Your order is on the way!" (Shows map) |
| `delivered` | N/A (No tracking needed) |
| Pickup Order | "This is a pickup order. Please collect your order from the store." |

---

## API Integration

### Expected Endpoint
```
GET /api/order/tracking/:orderId
```

### Request Headers
```javascript
{
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

### Response Format
```json
{
  "latitude": 13.0583,
  "longitude": 121.0583,
  "timestamp": "2025-10-18T10:30:00Z",
  "speed": 25,
  "heading": 45
}
```

### Handle API Failure
The system automatically falls back to simulated tracking if API fails.

---

## Styling

### Theme Variables Used
```css
--surface             /* Modal background */
--text-primary        /* Main text color */
--text-secondary      /* Secondary text */
--border-color        /* Borders */
--primary-color       /* Buttons, accents */
--bg-secondary        /* Secondary backgrounds */
--surface-hover       /* Hover states */
--shadow-md, -lg, -xl /* Shadows */
--border-radius       /* Border radius */
```

### Custom Classes
```css
.modal-overlay        /* Full-screen overlay */
.modal-container      /* Main modal box */
.map-container        /* Leaflet map area */
.order-selection      /* Order list view */
.tracking-view        /* Map tracking view */
.status-message       /* Status alerts */
```

---

## Event Handling

### Modal Events
```vue
<OrderTrackerModal
  @close="handleClose"
/>

function handleClose() {
  // Cleanup, navigation, etc.
  showTrackerModal.value = false
}
```

### Track Button Click
```vue
<button @click="trackOrder(order.orderId)">
  Track Order
</button>

function trackOrder(orderId: string) {
  orderToTrack.value = orderId
  showTrackerModal.value = true
}
```

---

## Common Tasks

### 1. Add Tracker to New Page
```vue
<script setup>
import { ref } from 'vue'
import OrderTrackerModal from '@/components/OrderTrackerModal.vue'

const showTracker = ref(false)
</script>

<template>
  <button @click="showTracker = true">🚚 Track</button>
  <OrderTrackerModal v-if="showTracker" @close="showTracker = false" />
</template>
```

### 2. Track Specific Order on Page Load
```vue
<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const showTracker = ref(false)
const orderId = ref('')

onMounted(() => {
  if (route.query.trackOrder) {
    orderId.value = route.query.trackOrder
    showTracker.value = true
  }
})
</script>
```

### 3. Check if Order is Trackable
```typescript
function isTrackable(order: Order): boolean {
  return order.status === 'shipped' && 
         order.shippingOption !== 'pickup'
}
```

### 4. Get Shipped Orders
```typescript
import { useOrderStore } from '@/stores/OrderStores'

const orderStore = useOrderStore()
const shippedOrders = computed(() => 
  orderStore.orders.filter(o => o.status === 'shipped')
)
```

---

## Debugging

### Enable Console Logs
```javascript
// In OrderTrackerModal.vue
const updateRiderLocation = async () => {
  console.log('🔄 Updating rider location...')
  const location = await orderStore.fetchRiderLocation(selectedOrderId.value)
  console.log('📍 Rider location:', location)
}
```

### Check Map Initialization
```javascript
if (!map.value) {
  console.error('❌ Map not initialized')
  return
}
console.log('✅ Map ready:', map.value)
```

### Verify Order Data
```javascript
console.log('Order:', selectedOrder.value)
console.log('Can track:', canTrack.value)
console.log('Tracking message:', trackingMessage.value)
```

---

## Performance Tips

1. **Lazy Load Map** - Only initialize when modal opens
2. **Cleanup Intervals** - Always clear intervals on unmount
3. **Debounce Updates** - Prevent rapid-fire updates
4. **Cache Locations** - Store uses Map for O(1) lookup
5. **Optimize Markers** - Reuse instead of recreate

---

## Accessibility

### Keyboard Navigation
- Modal can be closed with ESC key (add if needed)
- All buttons are focusable
- Proper ARIA labels on buttons

### Screen Readers
```vue
<button 
  @click="openTracker" 
  aria-label="Track your order in real-time"
  title="Track your order"
>
  <TruckIcon />
</button>
```

---

## Mobile Considerations

### Touch Optimization
- Large touch targets (min 44x44px)
- Swipe to close modal (optional)
- Pinch to zoom on map
- Single tap to select order

### Performance
- Reduce update frequency on mobile
- Use smaller map tiles
- Minimize animations on low-end devices

---

## Testing

### Unit Tests
```javascript
import { mount } from '@vue/test-utils'
import OrderTrackerModal from '@/components/OrderTrackerModal.vue'

describe('OrderTrackerModal', () => {
  it('opens in browse mode without orderId', () => {
    const wrapper = mount(OrderTrackerModal)
    expect(wrapper.find('.order-selection').exists()).toBe(true)
  })
  
  it('opens in track mode with orderId', () => {
    const wrapper = mount(OrderTrackerModal, {
      props: { orderId: '123' }
    })
    expect(wrapper.find('.tracking-view').exists()).toBe(true)
  })
})
```

### E2E Tests
```javascript
// Cypress example
it('tracks order from header', () => {
  cy.visit('/')
  cy.get('[title="Track your order"]').click()
  cy.get('.order-item').first().click()
  cy.get('.map-container').should('be.visible')
})
```

---

## Cheat Sheet

### Import Statement
```javascript
import OrderTrackerModal from '@/components/OrderTrackerModal.vue'
```

### Store Import
```javascript
import { useOrderStore } from '@/stores/OrderStores'
```

### Icon Import (if needed)
```javascript
import { TruckIcon } from '@heroicons/vue/24/outline'
```

### Basic Template
```vue
<OrderTrackerModal
  v-if="showModal"
  :order-id="orderId"
  @close="showModal = false"
/>
```

### Check Order Status
```javascript
order.status === 'shipped'  // Can track
order.shippingOption === 'pickup'  // Cannot track (pickup)
```

---

## Support

For issues or questions:
1. Check console for errors
2. Verify Leaflet is installed
3. Check network tab for API calls
4. Review ORDER_TRACKING_IMPLEMENTATION.md

---

**Last Updated**: October 18, 2025
**Version**: 1.0.0
