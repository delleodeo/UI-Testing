<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, computed, watch } from "vue";
import { formatToPHCurrency } from "../../../utils/currencyFormat";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon,
  PrinterIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CheckCircleIcon,
  TruckIcon,
  XCircleIcon,
  EllipsisHorizontalCircleIcon,
  ChatBubbleLeftEllipsisIcon,
  PaperAirplaneIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  CreditCardIcon,
  ArchiveBoxIcon,
  HandThumbUpIcon,
  ExclamationTriangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/vue/24/outline";
import { 
  CheckCircleIcon as CheckCircleSolidIcon,
  TruckIcon as TruckSolidIcon,
  XCircleIcon as XCircleSolidIcon,
} from "@heroicons/vue/24/solid";
import { Order, AgreementMessage } from "../../../types/order";
import { useOrdersStore, OrderStatus } from "../../../stores/vendor/vendorOrderStore";
import { io, Socket } from "socket.io-client";


const store = useOrdersStore();

const expanded = ref<Set<string>>(new Set());
const showFilters = ref(false);
const activeChatOrder = ref<Order | null>(null);
const newMessage = ref("");
const isSendingMessage = ref(false);
const isConnected = ref(false);
let socket: Socket | null = null;
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;


// Auto-scroll to bottom when messages change
watch(() => activeChatOrder.value?.agreementMessages, () => {
  nextTick(() => {
    scrollToBottom();
  });
}, { deep: true, flush: 'post' });


function connectSocket() {
  if (socket?.connected) return;

  // Use the correct API base URL without /v1 path for Socket.IO
  const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
  const socketUrl = apiUrl.replace('/v1', ''); // Remove /v1 if present
  
  console.log('Connecting to Socket.IO server:', socketUrl);
  
  socket = io(socketUrl, {
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: maxReconnectAttempts,
    reconnectionDelay: 1000,
    timeout: 10000,
    transports: ['websocket', 'polling'], // Try websocket first, fallback to polling
    upgrade: true,
    forceNew: true,
  });

  socket.on('connect', () => {
    console.log('Socket.IO connected successfully with ID:', socket.id);
    isConnected.value = true;
    reconnectAttempts = 0;
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket.IO disconnected:', reason);
    isConnected.value = false;
  });

  socket.on('connect_error', (error) => {
    console.error('Socket.IO connection error:', error);
    isConnected.value = false;
    reconnectAttempts++;
    
    if (reconnectAttempts < maxReconnectAttempts) {
      setTimeout(() => {
        console.log(`Attempting to reconnect... (${reconnectAttempts}/${maxReconnectAttempts})`);
        socket.connect();
      }, 2000 * Math.pow(2, reconnectAttempts));
    }
  });

  // Listen for new messages from the server
  socket.on('new_agreement_message', (data: { orderId: string; message: AgreementMessage }) => {
    console.log('Received new message:', data);
    
    // Find the order in the main store list
    const orderIndex = store.orders.findIndex(o => o._id === data.orderId);
    
    // Update ONLY the main store list. Vue's reactivity will handle the rest.
    if (orderIndex !== -1) {
      const order = store.orders[orderIndex];
      if (!order.agreementMessages) {
        order.agreementMessages = [];
      }
      // Add the message only if it doesn't already exist (failsafe)
      if (!order.agreementMessages.some(m => m.timestamp === data.message.timestamp && m.message === data.message.message)) {
        order.agreementMessages.push(data.message);
      }
    }
  });
}

function scrollToBottom() {
  const chatHistoryEl = document.querySelector('.chat-history');
  if (chatHistoryEl) {
    chatHistoryEl.scrollTop = chatHistoryEl.scrollHeight;
  }
}

onMounted(() => {
  store.fetchOrders().catch(e => {
    console.error("Orders fetch failed:", e);
  });

  // Connect to Socket.IO
  connectSocket();
});

onUnmounted(() => {
  // Clean disconnect
  if (socket) {
    if (activeChatOrder.value) {
      socket.emit('leave_order', activeChatOrder.value._id);
    }
    socket.disconnect();
    socket = null;
  }
});


// Canonical currency formatter (unify usage across component)
function currency(n: number | null | undefined): string {
  const num = typeof n === "number" && !Number.isNaN(n) ? n : 0;
  return formatToPHCurrency(num); // assumes util returns e.g. ₱1,234.00
}

function dateLabel(iso: string | number | Date | null | undefined): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("en-PH", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatAddress(addr: Order["shippingAddress"] | null | undefined): string {
  if (!addr) return "N/A";
  const parts = [addr.street, addr.barangay, addr.city, addr.province, addr.zipCode]
    .map(p => (p ? String(p).trim() : ""))
    .filter(Boolean);
  return parts.length ? parts.join(", ") : "N/A";
}

// Safe accessors in case backend sends unexpected status values.
function safeStatusLabel(status: OrderStatus | string): string {
  return store.statusMap?.[status as OrderStatus]?.label ?? String(status);
}
function safeStatusColor(status: OrderStatus | string): string {
  return store.statusMap?.[status as OrderStatus]?.color ?? "#475569"; // slate fallback
}

function paymentStatusClass(status: string): string {
  return status ? status.toLowerCase() : "";
}


const BRAND = "rgb(21, 30, 46)"; // keep in sync w/ theme colors below

function buildReceiptHTML(order: Order) {
  const address = formatAddress(order.shippingAddress);

  const rows = order.items
    .map(
      it => `
        <tr>
          <td class="item">${escapeHtml(it.name)} <br/> ${escapeHtml(it.label)}</td>
          <td class="qty">${it.quantity}</td>
          <td class="prc">${currency(it.price)}</td>
          <td class="ln">${currency(it.price * it.quantity)}</td>
        </tr>`
    )
    .join("");

  const paymentMethod = order.paymentMethod ? order.paymentMethod.toUpperCase() : "-";
  const paymentStatus = order.paymentStatus ?? "-";
  const tracking = order.trackingNumber || "-";

  return `
  <section class="receipt">
    <header class="rh">
      <div class="brand">
        <div class="logo">DS</div>
        <div class="b-meta">
          <h1>DoroShop</h1>
          <p class="tag">Local Products</p>
        </div>
      </div>
      <div class="info">
        <div><span>Date:</span><strong>${dateLabel(order.createdAt)}</strong></div>
        <div><span>Status:</span><strong>${escapeHtml(safeStatusLabel(order.status))}</strong></div>
        <div><span>Payment:</span><strong>${escapeHtml(paymentMethod)} (${escapeHtml(paymentStatus)})</strong></div>
        <div><span>Tracking:</span><strong>${escapeHtml(tracking)}</strong></div>
      </div>
    </header>
    <div class="divider"></div>
    <div class="customer">
      <p class="c-head">Customer</p>
      <p class="c-name">${escapeHtml(order.name)}</p>
      <p class="c-addr">${escapeHtml(address)}</p>
    </div>
    <table class="items">
      <thead>
        <tr>
          <th class="item">Item</th>
          <th class="qty">Qty</th>
          <th class="prc">Price</th>
          <th class="ln">Total</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
      <tfoot>
        <tr>
          <td colspan="3" class="foot-lbl">Shippping Fee</td>
          <td class="foot-val">${currency(order.shippingFee)}</td>
        </tr>
             <tr>
          <td colspan="3" class="foot-lbl">Subtotal</td>
          <td class="foot-val">${currency(order.subTotal + order.shippingFee)}</td>
        </tr>
      </tfoot>
    </table>
    <div class="thanks">Thank you for supporting local sellers!</div>
  </section>`;
}

function printScaffold(content: string, title: string) {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>${escapeHtml(title)}</title>
<meta name="viewport" content="width=device-width,initial-scale=1" />
<style>
:root {
  --brand:${BRAND};
  --bg:#ffffff;
  --text:#1f2937;
  --muted:#64748b;
  --border:#e2e8f0;
  --radius:16px;
}
* { box-sizing:border-box; }
body {
  margin:0;
  font-family: system-ui,-apple-system,Inter,Roboto,Arial,sans-serif;
  background:#f1f5f9;
  padding:24px;
  color:var(--text);
}
.receipt {
  background:var(--bg);
  border:1px solid var(--border);
  border-radius:var(--radius);
  padding:22px 24px 28px;
  max-width:680px;
  margin:0 auto 40px;
  box-shadow:0 6px 28px -4px rgba(0,0,0,.12);
  page-break-inside: avoid;
}
.rh {
  display:flex; flex-wrap:wrap; gap:24px;
  justify-content:space-between; align-items:flex-start;
}
.brand { display:flex; gap:14px; align-items:center; }
.logo {
  width:64px; height:64px;
  background:linear-gradient(135deg,var(--brand) 0%, #2b3f59 100%);
  border-radius:18px;
  display:flex; align-items:center; justify-content:center;
  font-weight:700; font-size:22px; letter-spacing:.5px;
  color:#fff; box-shadow:0 6px 18px -4px rgba(0,0,0,.35);
}
.b-meta h1 {
  margin:0; font-size:22px; font-weight:700; color:var(--brand);
  letter-spacing:.75px;
}
.b-meta .tag {
  margin:4px 0 0; font-size:12px; text-transform:uppercase;
  letter-spacing:1px; font-weight:600; color:var(--muted);
}
.info { display:grid; gap:6px; font-size:13px; min-width:220px; }
.info span { color:var(--muted); font-weight:600; margin-right:6px; display:inline-block; min-width:60px; }
.divider {
  height:1px;
  background:linear-gradient(90deg,transparent,var(--border),transparent);
  margin:22px 0 16px;
}
.customer { margin-bottom:12px; }
.c-head {
  margin:0 0 2px; font-size:11px; font-weight:700;
  text-transform:uppercase; letter-spacing:1px; color:var(--muted);
}
.c-name { margin:0 0 4px; font-weight:600; }
.c-addr { margin:0; font-size:13px; line-height:1.45; }
table.items {
  width:100%; border-collapse:collapse; margin-top:4px;
  overflow:hidden; border:1px solid var(--border); border-radius:12px;
}
table.items thead th {
  background:var(--brand); color:#fff; font-weight:600; font-size:12px;
  letter-spacing:.5px; padding:10px 12px; text-align:left;
}
table.items tbody td {
  padding:10px 12px; border-top:1px solid var(--border);
  font-size:13px; vertical-align:middle;
}
table.items tfoot td {
  padding:12px 12px; border-top:1px solid var(--border);
  font-size:13px; font-weight:600; background:#f8fafc;
}
.qty,.prc,.ln,.foot-val { text-align:right; white-space:nowrap; }
.foot-lbl { text-align:right; }
.thanks {
  margin-top:30px; font-size:12px; text-align:center;
  color:var(--muted); letter-spacing:.5px;
}
.page-break { page-break-after:always; }
@media print {
  body { background:#fff; padding:10px; }
  .receipt { box-shadow:none; margin:0 auto 24px; }
}
</style>
</head>
<body>${content}</body>
</html>`;
}

function printUsingIframe(html: string, title: string) {
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.opacity = "0";
  iframe.setAttribute("sandbox", "allow-modals allow-same-origin allow-scripts");
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument!;
  doc.open();
  doc.write(printScaffold(html, title));
  doc.close();

  const cleanup = () => setTimeout(() => iframe.remove(), 500);

  const triggerPrint = () => {
    const win = iframe.contentWindow!;
    const imgs = Array.from(doc.images);
    const pending = imgs.filter(i => !i.complete);

    if (pending.length) {
      let done = 0;
      const doneOne = () => {
        done++;
        if (done === pending.length) {
          setTimeout(() => {
            win.focus();
            win.print();
            cleanup();
          }, 60);
        }
      };
      pending.forEach(img => {
        img.addEventListener("load", doneOne, { once: true });
        img.addEventListener("error", doneOne, { once: true });
      });
    } else {
      setTimeout(() => {
        win.focus();
        win.print();
        cleanup();
      }, 60);
    }
  };

  if (doc.readyState === "complete") triggerPrint();
  else iframe.addEventListener("load", triggerPrint, { once: true });
}

function printSingle(o: Order) {
  if (!store.canPrint(o)) return;
  printUsingIframe(buildReceiptHTML(o), `Receipt ${o.orderId}`);
}
function printVisible() {
  if (!store.hasPrintable) {
    alert("No printable orders on this page.");
    return;
  }
  const html = store.printablePaged.map(buildReceiptHTML).join('<div class="page-break"></div>');
  printUsingIframe(html, "Batch Receipts");
}


function handleStatusUpdate(o: Order, next: OrderStatus) {
  store.updateOrderStatus(o._id, next).catch(err => {
    console.log("Failed to update status: " + (err?.message || "Unknown error"));
  });
}

function shipOrder(o: Order) {
  handleStatusUpdate(o, "shipped");
}


function actionStatuses(o: Order) {
  let arr = store.allowedStatusTransitions(o) as OrderStatus[];
  if (o.paymentMethod === "cod") {
    arr = arr.filter(n => n !== "paid");
  }
  arr = arr.filter(n => n !== "shipped");
  return arr;
}


const statusKeys = ["all", "pending", "paid", "shipped", "delivered", "cancelled"] as const;
type StatusKey = typeof statusKeys[number];

// Icon mapping for status navigation
function getStatusIcon(status: StatusKey) {
  const iconMap = {
    all: ClipboardDocumentListIcon,
    pending: ClockIcon,
    paid: CreditCardIcon,
    shipped: TruckIcon,
    delivered: CheckCircleIcon,
    cancelled: XCircleIcon
  };
  return iconMap[status];
}

// Get solid version of status icons for active states
function getStatusIconSolid(status: StatusKey) {
  const iconMap = {
    all: ClipboardDocumentListIcon,
    pending: ClockIcon,
    paid: CreditCardIcon,
    shipped: TruckSolidIcon,
    delivered: CheckCircleSolidIcon,
    cancelled: XCircleSolidIcon
  };
  return iconMap[status];
}

function resetExpanded() {
  expanded.value = new Set();
}

function onStatusTabClick(key: StatusKey) {
  store.setActiveStatus(key);
  store.setPage(1);
  resetExpanded();
}

function onTabKey(e: KeyboardEvent) {
  const idx = statusKeys.indexOf(store.activeStatus as StatusKey);
  if (idx === -1) return;
  
  // Handle keyboard navigation
  if (["ArrowRight", "ArrowLeft", "Home", "End", "Enter", " "].includes(e.key)) {
    e.preventDefault();
    
    // Handle activation keys
    if (e.key === "Enter" || e.key === " ") {
      return; // Let the click handler handle activation
    }
    
    let newIdx = idx;
    if (e.key === "ArrowRight") newIdx = (idx + 1) % statusKeys.length;
    if (e.key === "ArrowLeft") newIdx = (idx - 1 + statusKeys.length) % statusKeys.length;
    if (e.key === "Home") newIdx = 0;
    if (e.key === "End") newIdx = statusKeys.length - 1;
    
    onStatusTabClick(statusKeys[newIdx]);
    nextTick(() => {
      const el = document.querySelectorAll<HTMLButtonElement>(".status-tabs button")[newIdx];
      el?.focus();
      // Announce to screen readers
      el?.setAttribute('aria-live', 'polite');
      setTimeout(() => el?.removeAttribute('aria-live'), 100);
    });
  }
}

// Enhanced pagination navigation
function onPaginationKey(e: KeyboardEvent, action: 'prev' | 'next') {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    if (action === 'prev' && store.page > 1) {
      store.prevPage();
    } else if (action === 'next' && store.page < store.pageCount) {
      store.nextPage();
    }
  }
}

function toggleExpand(id: string) {
  const set = new Set(expanded.value);
  if (set.has(id)) set.delete(id);
  else set.add(id);
  expanded.value = set; // reactivity
}
function isExpanded(id: string) {
  return expanded.value.has(id);
}

function expandEnter(el: Element) {
  const e = el as HTMLElement;
  e.style.height = "0";
  e.style.opacity = "0";
  requestAnimationFrame(() => {
    e.style.transition = "height .35s ease, opacity .3s ease";
    e.style.height = e.scrollHeight + "px";
    e.style.opacity = "1";
  });
}
function expandAfterEnter(el: Element) {
  (el as HTMLElement).style.height = "auto";
}
function expandLeave(el: Element) {
  const e = el as HTMLElement;
  e.style.height = e.scrollHeight + "px";
  e.style.opacity = "1";
  requestAnimationFrame(() => {
    e.style.transition = "height .3s ease, opacity .25s ease";
    e.style.height = "0";
    e.style.opacity = "0";
  });
}

// Auto-reconnect logic
function handleReconnect() {
  if (!socket?.connected && reconnectAttempts < maxReconnectAttempts) {
    setTimeout(() => {
      console.log(`Attempting to reconnect... (${reconnectAttempts + 1}/${maxReconnectAttempts})`);
      connectSocket();
    }, 2000 * Math.pow(2, reconnectAttempts)); // Exponential backoff
  }
}

/* -------------------------------------------------------------------------------------------------
 * Filters & Search
 * ------------------------------------------------------------------------------------------------- */
function resetFilters() {
  store.resetFilters();
}

function onSearchInput(e: Event) {
  const target = e.target as HTMLInputElement;
  store.setSearch(target.value);
}

async function openAgreementChat(order: Order) {
  try {
    const fullOrder = await store.fetchSingleOrder(order._id);
    if (fullOrder) {
      activeChatOrder.value = fullOrder;
      
      // Ensure agreementMessages array exists
      if (!activeChatOrder.value.agreementMessages) {
        activeChatOrder.value.agreementMessages = [];
      }
      
      // Join the specific order room
      if (socket?.connected) {
        socket.emit('join_order', order._id);
        console.log('Joined order room:', order._id);
      }
      
      // Auto-scroll to bottom after modal opens
      await nextTick();
      scrollToBottom();
    } else {
      alert("Could not load chat history.");
    }
  } catch (error) {
    console.error("Error opening chat:", error);
    alert("Could not open chat. Please try again.");
  }
}

function closeAgreementModal() {
  if (socket?.connected && activeChatOrder.value) {
    socket.emit('leave_order', activeChatOrder.value._id);
    console.log('Left order room:', activeChatOrder.value._id);
  }
  activeChatOrder.value = null;
  newMessage.value = "";
}

async function sendAgreementMessage() {
  if (!newMessage.value.trim() || !activeChatOrder.value || isSendingMessage.value) return;

  const messageContent = newMessage.value.trim();
  const orderId = activeChatOrder.value._id;

  isSendingMessage.value = true;
  
  try {
    // Clear input immediately for better UX
    newMessage.value = "";
    
    // Send message through store (which will also emit socket event)
    await store.addAgreementMessage(orderId, messageContent);
    
    console.log('Message sent successfully');
    
    // Auto-scroll to bottom
    await nextTick();
    scrollToBottom();
    
  } catch (error) {
    console.error("Failed to send message:", error);
    alert("Could not send message. Please try again.");
    // Restore message content on error
    newMessage.value = messageContent;
  } finally {
    isSendingMessage.value = false;
  }
}

// Handle Enter key in textarea
function handleKeyDown(event: KeyboardEvent) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    sendAgreementMessage();
  }
}

</script>

<template>
  <div class="order-cards-page">
    <!-- Skip Navigation -->
    <a href="#main-content" class="skip-link">Skip to main content</a>

    <!-- Agreement Chat Modal -->
    <transition name="fade">
      <div v-if="activeChatOrder" class="agreement-modal-overlay" @click="closeAgreementModal">
        <div class="agreement-modal-container" @click.stop>
          <div class="agreement-modal-header">
            <div class="chat-header-info">
              <h3>Agreement Chat</h3>
              <div class="connection-status">
                <span v-if="isConnected" class="status-indicator connected">●</span>
                <span v-else class="status-indicator disconnected">●</span>
                <span class="status-text">{{ isConnected ? 'Connected' : 'Reconnecting...' }}</span>
              </div>
            </div>
            <button @click="closeAgreementModal" class="modal-close-btn">&times;</button>
          </div>
          
          <div class="chat-history" ref="chatHistoryRef">
            <!-- Customer's initial message -->
            <div v-if="activeChatOrder.agreementDetails" class="message-bubble customer initial">
              <p class="msg-text">{{ activeChatOrder.agreementDetails }}</p>
              <span class="msg-meta">Initial Note</span>
            </div>

            <!-- Chat messages -->
            <div v-for="(msg, index) in (activeChatOrder.agreementMessages || [])" :key="index"
              :class="['message-bubble', msg.sender]">
              <p class="msg-text">{{ msg.message }}</p>
              <span class="msg-meta">{{ dateLabel(msg.timestamp) }}</span>
            </div>
            
            <!-- Empty state -->
            <div v-if="!activeChatOrder.agreementDetails && (!activeChatOrder.agreementMessages || activeChatOrder.agreementMessages.length === 0)" class="empty-chat enhanced-empty-chat">
              <div class="empty-icon-wrapper">
                <ChatBubbleLeftEllipsisIcon class="empty-icon" />
                <div class="icon-glow"></div>
              </div>
              <div class="empty-content">
                <h3>No messages yet</h3>
                <p>Start the conversation with your customer to discuss shipping details</p>
              </div>
            </div>
          </div>
          
          <div class="chat-input-area">
            <textarea 
              v-model="newMessage" 
              placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
              @keydown="handleKeyDown"
              :disabled="isSendingMessage || !isConnected"
              ref="messageInput"
            ></textarea>
            <button 
              @click="sendAgreementMessage" 
              class="btn-send enhanced-send-btn" 
              :disabled="isSendingMessage || !newMessage.trim() || !isConnected"
              :class="{ 'sending': isSendingMessage }"
              title="Send message"
            >
              <div v-if="isSendingMessage" class="loading-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <PaperAirplaneIcon v-else class="icon mini send-icon" />
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- Page Header -->
    <header class="page-header">
      <div class="header-content">
        <h1 class="page-title">
          <ClipboardDocumentListIcon class="title-icon" />
          Orders Management
        </h1>
        <p class="page-subtitle">Track and manage your customer orders</p>
      </div>
    </header>

    <div class="status-tabs enhanced-nav" role="tablist" aria-label="Order status filter" @keydown="onTabKey">
      <button 
        v-for="(key, index) in statusKeys" 
        :key="key" 
        role="tab" 
        type="button" 
        :aria-selected="store.activeStatus === key"
        :aria-controls="`orders-panel-${key}`"
        :aria-describedby="`status-desc-${key}`"
        :tabindex="store.activeStatus === key ? 0 : -1" 
        :class="['status-chip', { active: store.activeStatus === key }]"
        :data-status="key"
        @click="onStatusTabClick(key as any)"
        @focus="($event.target as HTMLElement)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })"
      >
        <component 
          :is="store.activeStatus === key ? getStatusIconSolid(key) : getStatusIcon(key)" 
          class="status-icon" 
        />
        <span class="lbl">{{ key === 'all' ? 'All Orders' : safeStatusLabel(key as any) }}</span>
        <span class="count" :aria-label="`${store.statusCounts[key as any] ?? 0} orders`">
          {{ store.statusCounts[key as any] ?? 0 }}
        </span>
        <span :id="`status-desc-${key}`" class="sr-only">
          Filter orders by {{ key === 'all' ? 'all statuses' : key + ' status' }}
        </span>
      </button>
    </div>

    <main id="main-content">
    <div class="controls">
      <div class="search-box">
        <MagnifyingGlassIcon class="icon" />
        <input v-model="store.search" type="search" placeholder="Search order ID, customer, tracking..."
          @input="onSearchInput" />
      </div>
      <div class="right-actions">
        <button class="btn outline small" type="button" :disabled="!store.hasPrintable" @click="printVisible">
          <PrinterIcon class="icon mini" /> Print Visible
        </button>
        <button class="btn ghost small" type="button"
          @click="store.setSortDir(store.sortDir === 'asc' ? 'desc' : 'asc')">
          <ArrowPathIcon class="icon flip" />
          {{ store.sortDir === 'asc' ? 'Oldest' : 'Newest' }}
        </button>
        <button class="btn ghost small" type="button" @click="showFilters = !showFilters" :aria-expanded="showFilters">
          <FunnelIcon class="icon" />
          Filters
        </button>
      </div>
    </div>

    <transition name="fade">
      <div v-if="showFilters" class="filters-panel">
        <div class="filters-grid">
          <div class="filter-group">
            <label>Date From</label>
            <input type="date" v-model="store.filterDateFrom"
              @change="store.setFilters({ dateFrom: store.filterDateFrom })" />
          </div>
          <div class="filter-group">
            <label>Date To</label>
            <input type="date" v-model="store.filterDateTo"
              @change="store.setFilters({ dateTo: store.filterDateTo })" />
          </div>
          <div class="filter-group">
            <label>Payment Method</label>
            <select v-model="store.filterPaymentMethod"
              @change="store.setFilters({ paymentMethod: store.filterPaymentMethod })">
              <option value="all">All</option>
              <option value="wallet">Wallet</option>
              <option value="gcash">GCash</option>
              <option value="cod">COD</option>
            </select>
          </div>
          <div class="filter-group">
            <label>Payment Status</label>
            <select v-model="store.filterPaymentStatus"
              @change="store.setFilters({ paymentStatus: store.filterPaymentStatus })">
              <option value="all">All</option>
              <option value="Pending">Pending</option>
              <option value="Paid">Paid</option>
              <option value="Refunded">Refunded</option>
              <option value="Failed">Failed</option>
            </select>
          </div>
        </div>
        <div class="filters-actions">
          <button class="btn tiny outline" type="button" @click="resetFilters">Reset Filters</button>
        </div>
      </div>
    </transition>


    <div class="summary">
      <span>{{ store.sorted.length }} result<span v-if="store.sorted.length !== 1">s</span></span>
      <span class="divider">|</span>
      <span>Page {{ store.page }} / {{ store.pageCount }}</span>
    </div>


    <div class="cards-grid">
      <div v-if="store.loading" class="loading-skeleton" v-for="n in 6" :key="'skel_' + n"></div>

      <template v-else>
        <div v-for="o in store.paged" :key="o._id" :class="['order-card', { updating: store.isUpdating(o._id) }]">
          <header class="card-head">
            <div class="left">
              <h2 class="oid">{{ o.orderId }}</h2>
              <p class="created">{{ dateLabel(o.updatedAt || Date.now())  }}</p>
            </div>
            <div class="right">
              <span class="status-pill" :style="{ '--pill': safeStatusColor(o.status) }">{{ safeStatusLabel(o.status)
              }}</span>
            </div>
          </header>

          <div class="info-line">
            <span class="lbl">Customer:</span>
            <span class="val">{{ o.name }}</span>
          </div>
          <div class="info-line">
            <span class="lbl">Shipping Fee:</span>
            <span class="val strong">{{ currency(o.shippingFee) }}</span>
          </div>
          <div class="info-line">
            <span class="lbl">Shipping Mode:</span>
            <span class="val strong">
              {{o.shippingOption}}
              <button v-if="o.shippingOption === 'agreement'" class="btn-icon chat-btn" @click="openAgreementChat(o)" title="Open chat">
                <ChatBubbleLeftEllipsisIcon class="icon mini" />
                <span class="btn-tooltip">Chat</span>
              </button>
            </span>
          </div>
          <div class="info-line">
            <span class="lbl">Subtotal:</span>
            <span class="val strong">{{ currency(o.subTotal + o.shippingFee) }}</span>
          </div>
          <div class="info-line wrap">
            <span class="lbl">Payment:</span>
            <span class="val">
              {{ o.paymentMethod ? o.paymentMethod.toUpperCase() : '-' }}
              <span class="pay-badge" :class="paymentStatusClass(o.paymentStatus)">
                {{ o.paymentStatus }}
              </span>
            </span>
          </div>
          <div v-if="o.trackingNumber" class="info-line">
            <span class="lbl">Tracking:</span>
            <span class="val mono">{{ o.trackingNumber }}</span>
          </div>

          <!-- Expand Toggle -->
          <button class="expand-btn" type="button" @click="toggleExpand(o._id)" :aria-expanded="isExpanded(o._id)">
            <span>{{ isExpanded(o._id) ? 'Hide Items' : 'Show Items (' + o.items.length + ')' }}</span>
            <ChevronDownIcon v-if="!isExpanded(o._id)" class="icon mini" />
            <ChevronUpIcon v-else class="icon mini" />
          </button>

          <!-- Expandable Items -->
          <transition @enter="expandEnter" @after-enter="expandAfterEnter" @leave="expandLeave">
            <div v-show="isExpanded(o._id)" class="items-wrapper">
              <ul class="items-list">
                <li v-for="it in o.items" :key="it._id" class="item-row">
                  <img :src="it.imgUrl || 'https://via.placeholder.com/80x60?text=No+Img'" alt="" class="thumb" />
                  <div class="it-meta">
                    <p class="it-name">{{ it.name }}</p>
                    <p class="it-label">{{ it.label }}</p>
                    <p class="it-sub muted">
                      {{ it.quantity }} × {{ currency(it.price) }}
                    </p>
                  </div>
                  <div class="it-total">
                    {{ currency(it.price * it.quantity) }}
                  </div>
                </li>
              </ul>
              <div v-if="o.shippingAddress" class="ship-block">
                <p class="ship-title">Ship To</p>
                <p class="ship-addr">{{ formatAddress(o.shippingAddress) }}</p>
              </div>
            </div>
          </transition>

          <!-- Actions -->
          <div class="actions">
            <!-- Ship (pending only) -->
            <button v-if="o.status === 'pending'" class="btn tiny outline" type="button"
              :disabled="store.isUpdating(o._id)" @click="shipOrder(o)">
              <TruckIcon class="icon mini" />
              Ship
            </button>

            <!-- Other transitions (no shipped, no paid for COD) -->
            <button v-for="n in actionStatuses(o)" :key="n" class="btn tiny outline" type="button"
              :disabled="store.isUpdating(o._id)" @click="handleStatusUpdate(o, n)">
              <component
                :is="n === 'paid' ? CheckCircleIcon : n === 'shipped' ? TruckIcon : n === 'delivered' ? CheckCircleIcon : XCircleIcon"
                class="icon mini" />
              <span class="capitalize">{{ safeStatusLabel(n) }}</span>
            </button>

            <!-- Cancel -->
            <button v-if="o.status !== 'cancelled' && o.status !== 'delivered' && o.status !== 'shipped'"
              class="btn tiny danger outline" type="button" :disabled="store.isUpdating(o._id)"
              @click="handleStatusUpdate(o, 'cancelled')">
              <XCircleIcon class="icon mini" /> Cancel
            </button>

            <!-- Receipt -->
            <button v-if="store.canPrint(o)" class="btn tiny" type="button" :disabled="store.isUpdating(o._id)"
              @click="printSingle(o)">
              <PrinterIcon class="icon mini" /> Receipt
            </button>
          </div>
        </div>

        <div v-if="!store.paged.length" class="empty-state">
          <EllipsisHorizontalCircleIcon class="icon large" />
          <p>No orders found.</p>
        </div>
      </template>
    </div>

    <!-- Pagination -->
    <nav class="pagination enhanced-pagination" v-if="store.pageCount > 1" role="navigation" aria-label="Orders pagination">
      <button 
        class="btn tiny outline pagination-btn" 
        type="button" 
        :disabled="store.page === 1" 
        @click="store.prevPage"
        @keydown="onPaginationKey($event, 'prev')"
        :aria-label="`Go to previous page, currently on page ${store.page}`"
      >
        <ChevronLeftIcon class="icon mini" data-direction="prev" />
        Prev
      </button>
      
      <div class="pagination-info" role="status" aria-live="polite">
        <ClipboardDocumentListIcon class="page-icon" />
        <span class="pager-label">Page {{ store.page }} of {{ store.pageCount }}</span>
        <span class="sr-only">Currently viewing page {{ store.page }} of {{ store.pageCount }} total pages</span>
      </div>
      
      <button 
        class="btn tiny outline pagination-btn" 
        type="button" 
        :disabled="store.page === store.pageCount"
        @click="store.nextPage"
        @keydown="onPaginationKey($event, 'next')"
        :aria-label="`Go to next page, currently on page ${store.page}`"
      >
        Next
        <ChevronRightIcon class="icon mini" data-direction="next" />
      </button>
    </nav>
    </main>
  </div>
</template>

<style scoped>
/* Skip Link */
.skip-link {
  position: absolute;
  top: -40px;
  left: 6px;
  background: var(--surface);
  color: var(--text-primary);
  padding: 8px 12px;
  text-decoration: none;
  border-radius: var(--radius-sm);
  z-index: 1000;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s ease;
  border: 1px solid var(--border-primary);
}

.skip-link:focus {
  top: 6px;
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* Layout & background */
.order-cards-page {
  min-height: 100dvh;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: clamp(1rem, 3vw, 2rem);
  position: relative;
  background: transparent;
  color: var(--text-primary);
  padding-bottom: 10rem;
  animation: fadeIn 0.4s ease-out;
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

/* ============================================
   PAGE HEADER
   ============================================ */
.page-header {
  padding: 0.5rem 0 1.5rem;
  animation: slideDown 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.header-content {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 0;
  font-size: 2rem;
  font-weight: 800;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.02em;
}

.title-icon {
  width: 2rem;
  height: 2rem;
  color: var(--color-primary);
  flex-shrink: 0;
}

.page-subtitle {
  margin: 0;
  font-size: 0.95rem;
  color: var(--text-secondary);
  font-weight: 500;
  padding-left: 2.75rem;
}

.status-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: .55rem;
  padding: .4rem;
  background: var(--surface);
  backdrop-filter: blur(6px);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-xl);
  box-shadow: var(--card-shadow);
}

.status-chip {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  background: var(--bg-secondary);
  color: var(--text-secondary);
  border: 2px solid var(--border-primary);
  border-radius: 50px;
  font-size: 0.875rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.status-chip:hover {
  background: var(--surface-hover);
  border-color: #1f8b4e;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(31, 139, 78, 0.15);
}

.status-chip.active {
  background: linear-gradient(135deg, #1f8b4e 0%, #26a65b 100%);
  color: white;
  border-color: #1f8b4e;
  box-shadow: 0 4px 12px rgba(31, 139, 78, 0.3);
  transform: translateY(-2px);
}

.status-chip .count {
  font-size: .65rem;
  background: var(--bg-primary);
  color: var(--text-primary);
  padding: 2px 7px;
  border-radius: var(--radius-full);
  font-weight: 700;
  line-height: 1;
}

.status-chip.active .count {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.controls {
  display: flex;
  flex-wrap: wrap;
  gap: .8rem;
  align-items: center;
  justify-content: space-between;
}

.search-box {
  flex: 1 1 260px;
  display: flex;
  align-items: center;
  gap: .55rem;
  background: var(--input-bg);
  border: 1px solid var(--input-border);
  padding: .65rem .85rem;
  border-radius: var(--radius-md);
  transition: all 0.2s ease;
}

.search-box:focus-within {
  border-color: var(--input-border-focus);
  box-shadow: 0 0 0 3px var(--color-primary-light);
}

.search-box .icon {
  width: 18px;
  height: 18px;
  stroke-width: 2;
  color: var(--text-tertiary);
}

.search-box input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: var(--text-primary);
  font: inherit;
  font-size: .88rem;
}

.search-box input::placeholder {
  color: var(--text-tertiary);
}

.right-actions {
  display: flex;
  gap: .5rem;
  flex-wrap: wrap;
}

.filters-panel {
  padding: .9rem 1rem;
  background: var(--surface);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  font-size: .75rem;
  display: flex;
  flex-direction: column;
  gap: .75rem;
  box-shadow: var(--card-shadow);
}

.filters-grid {
  display: grid;
  gap: .75rem;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: .35rem;
}

.filter-group label {
  font-size: .55rem;
  text-transform: uppercase;
  letter-spacing: .5px;
  font-weight: 600;
  color: var(--text-tertiary);
}

.filter-group input,
.filter-group select {
  background: var(--input-bg);
  border: 1px solid var(--input-border);
  padding: .4rem .5rem;
  border-radius: var(--radius-sm);
  font-size: .65rem;
  color: var(--text-primary);
  font-family: inherit;
  outline: none;
  transition: border-color 0.2s ease;
}

.filter-group input:focus,
.filter-group select:focus {
  border-color: var(--input-border-focus);
  box-shadow: 0 0 0 3px var(--color-primary-light);
}

.filters-actions {
  display: flex;
  justify-content: flex-end;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity .25s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.summary {
  font-size: .7rem;
  display: flex;
  gap: .7rem;
  align-items: center;
  letter-spacing: .5px;
  color: var(--text-tertiary);
  text-transform: uppercase;
  font-weight: 600;
}

.summary .divider {
  opacity: .35;
}

.cards-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fill, minmax(310px, 1fr));
  align-items: start;
}

.loading-skeleton {
  height: 230px;
  border-radius: var(--radius-xl);
  background: linear-gradient(110deg, var(--bg-secondary) 25%, var(--surface-hover) 35%, var(--bg-secondary) 55%);
  background-size: 200% 100%;
  animation: shimmer 1.5s linear infinite;
}

@keyframes shimmer {
  to {
    background-position: -200% 0;
  }
}

.order-card {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background: var(--surface);
  border: 1px solid var(--border-primary);
  border-radius: 16px;
  padding: 1.25rem;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(31, 139, 78, 0.08);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.order-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #1f8b4e 0%, transparent 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.order-card:hover {
  border-color: rgba(31, 139, 78, 0.3);
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(31, 139, 78, 0.15);
}

.order-card:hover::before {
  opacity: 1;
}

.order-card.updating {
  opacity: 0.55;
  pointer-events: none;
}

.card-head {
  display: flex;
  justify-content: space-between;
  gap: .65rem;
}

.card-head .oid {
  margin: 0;
  font-size: .95rem;
  font-weight: 700;
  letter-spacing: .5px;
  color: var(--text-primary);
}

.card-head .created {
  margin: .25rem 0 0;
  font-size: .65rem;
  color: var(--text-tertiary);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  letter-spacing: .4px;
}

.status-pill {
  display: inline-block;
  font-size: .55rem;
  font-weight: 700;
  letter-spacing: .6px;
  text-transform: uppercase;
  padding: .35rem .55rem;
  border-radius: 1rem;
  background: var(--pill);
  color: #fff;
  box-shadow: 0 2px 6px -2px rgba(0, 0, 0, .4);
  white-space: nowrap;
  align-self: flex-start;
}

.info-line {
  display: flex;
  justify-content: space-between;
  font-size: .7rem;
  gap: .75rem;
  color: var(--text-primary);
  line-height: 1.25;
}

.info-line.wrap {
  flex-wrap: wrap;
}

.info-line .lbl {
  font-weight: 600;
  font-size: .65rem;
  color: var(--text-tertiary);
  letter-spacing: .4px;
  text-transform: uppercase;
}

.info-line .val {
  flex: 1;
  text-align: right;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 0.5rem;
}

.info-line .val.strong {
  font-weight: 700;
  color: var(--text-primary);
}

.mono {
  font-family: ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace;
}

.pay-badge {
  margin-left: .45rem;
  font-size: .55rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .5px;
  padding: 3px 6px;
  border-radius: var(--radius-sm);
  background: var(--bg-secondary);
  color: var(--text-secondary);
  border: 1px solid var(--border-primary);
}

.pay-badge.paid {
  background: var(--color-success);
  color: white;
  border-color: var(--color-success);
  box-shadow: 0 0 0 2px var(--color-success-light);
}

.pay-badge.pending {
  background: var(--color-warning);
  color: white;
  border-color: var(--color-warning);
  box-shadow: 0 0 0 2px var(--color-warning-light);
}

.pay-badge.refunded {
  background: var(--color-info);
  color: white;
  border-color: var(--color-info);
  box-shadow: 0 0 0 2px var(--color-info-light);
}

.pay-badge.failed {
  background: var(--color-danger);
  color: white;
  border-color: var(--color-danger);
  box-shadow: 0 0 0 2px var(--color-danger-light);
}

.expand-btn {
  margin-top: .25rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  padding: .55rem .7rem;
  border-radius: var(--radius-md);
  font: inherit;
  font-size: .65rem;
  letter-spacing: .6px;
  text-transform: uppercase;
  font-weight: 600;
  cursor: pointer;
  color: var(--text-secondary);
  transition: all 0.2s ease;
}

.expand-btn:hover {
  background: var(--surface-hover);
  border-color: var(--color-primary);
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: .5rem;
  transition: background .3s, border-color .3s;
}

.expand-btn:hover {
  background: rgba(255, 255, 255, 0.14);
  border-color: rgba(255, 255, 255, 0.3);
}

.items-wrapper {
  overflow: hidden;
  margin-top: .4rem;
}

.items-list {
  list-style: none;
  margin: 0 0 .8rem;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: .6rem;
}

.item-row {
  display: flex;
  gap: .7rem;
  align-items: center;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: .75rem;
  padding: .55rem .65rem;
}

.thumb {
  width: 70px;
  height: 52px;
  object-fit: cover;
  border-radius: .55rem;
  background: #334155;
  flex-shrink: 0;
}

.it-meta {
  flex: 1 1 auto;
}

.it-name, .it-label {
  margin: 0 0 2px;
  font-size: .7rem;
  font-weight: 600;
  letter-spacing: .25px;
  color: var(--text-primary);
}

.it-label{
  font-size: .5rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.it-sub {
  margin: 0;
  font-size: .6rem;
}

.muted {
  color: var(--text-muted);
}

.it-total {
  font-size: .65rem;
  font-weight: 600;
  white-space: nowrap;
  color: var(--text-primary);
}

.ship-block {
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  padding: .55rem .7rem .65rem;
  border-radius: .7rem;
  font-size: .6rem;
  line-height: 1.3;
  color: var(--text-primary);
  letter-spacing: .3px;
}

.ship-title {
  margin: 0 0 .3rem;
  text-transform: uppercase;
  font-weight: 600;
  font-size: .55rem;
  letter-spacing: .6px;
  color: var(--text-secondary);
}

.ship-addr {
  margin: 0;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: .45rem;
  margin-top: .4rem;
}

.btn {
  --btn-bg: linear-gradient(135deg, #1f8b4e 0%, #26a65b 100%);
  --btn-fg: white;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border: none;
  background: var(--btn-bg);
  color: var(--btn-fg);
  font: inherit;
  font-weight: 700;
  padding: 0.625rem 1rem;
  border-radius: 10px;
  font-size: 0.875rem;
  letter-spacing: 0.02em;
  cursor: pointer;
  position: relative;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 12px rgba(31, 139, 78, 0.25);
}

.btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(31, 139, 78, 0.35);
  filter: brightness(1.1);
}

.btn:active:not(:disabled) {
  transform: translateY(0);
}

.btn:disabled {
  opacity: .4;
  cursor: not-allowed;
}

.btn.outline {
  background: transparent;
  color: var(--text-primary);
  border: 1px solid var(--border-primary);
  box-shadow: none;
}

.btn.outline:hover:not(:disabled) {
  background: var(--bg-secondary);
  border-color: var(--color-primary);
}

.btn.ghost {
  background: var(--bg-secondary);
  color: var(--text-primary);
  box-shadow: none;
}

.btn.ghost:hover:not(:disabled) {
  background: var(--bg-tertiary);
}

.btn.danger {
  --btn-bg: var(--color-danger);
  --btn-fg: var(--text-inverse);
}

.btn.danger.outline {
  background: transparent;
  color: var(--color-danger);
  border: 1px solid var(--color-danger);
}

.btn.danger.outline:hover {
  background: var(--color-danger);
  color: var(--text-inverse);
}

.btn.tiny {
  padding: .4rem .55rem;
  font-size: .55rem;
  letter-spacing: .5px;
}

.btn.small {
  padding: .5rem .75rem;
  font-size: .6rem;
}

.icon {
  width: 18px;
  height: 18px;
  stroke-width: 2;
}

.icon.mini {
  width: 14px;
  height: 14px;
}

.flip {
  transform: scaleY(-1);
}

.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 3rem 1rem;
  background: var(--bg-secondary);
  border: 1px dashed var(--border-primary);
  border-radius: 1rem;
  display: flex;
  flex-direction: column;
  gap: .85rem;
  color: var(--text-secondary);
  font-size: .85rem;
  letter-spacing: .5px;
}

.empty-state .icon.large {
  width: 46px;
  height: 46px;
  stroke-width: 1.5;
  margin: 0 auto;
  opacity: .8;
  color: var(--text-muted);
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: .9rem;
  margin-top: .5rem;
  flex-wrap: wrap;
  font-size: .65rem;
  color: var(--text-secondary);
  letter-spacing: .4px;
}

.pager-label {
  font-weight: 600;
}

/* Agreement Modal Styles */
.agreement-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.agreement-modal-container {
  width: 100%;
  max-width: 500px;
  background: var(--surface);
  border: 1px solid var(--border-primary);
  border-radius: 1rem;
  box-shadow: var(--shadow-xl);
  display: flex;
  flex-direction: column;
  max-height: 80vh;
}

.agreement-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--border-primary);
  background: var(--bg-secondary);
}

.chat-header-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.agreement-modal-header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.connection-status {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.75rem;
}

.status-indicator {
  font-size: 0.6rem;
  line-height: 1;
}

.status-indicator.connected {
  color: var(--color-success);
}

.status-indicator.disconnected {
  color: var(--color-warning);
  animation: pulse 2s ease-in-out infinite;
}

.status-text {
  color: var(--text-secondary);
  font-weight: 500;
}

.modal-close-btn {
  background: none;
  border: none;
  color: var(--text-tertiary);
  font-size: 1.75rem;
  line-height: 1;
  cursor: pointer;
  transition: color 0.2s;
}

.modal-close-btn:hover {
  color: var(--text-primary);
}

.chat-history {
  flex-grow: 1;
  padding: 1rem 1.25rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  scroll-behavior: smooth;
  background: var(--bg-primary);
}

.message-bubble {
  padding: 0.75rem 1rem;
  border-radius: 1.25rem;
  max-width: 85%;
  display: flex;
  flex-direction: column;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  line-height: 1.4;
  word-wrap: break-word;
  animation: messageSlideIn 0.3s ease-out;
}

@keyframes messageSlideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message-bubble.customer {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border-bottom-left-radius: 0.25rem;
  align-self: flex-start;
  border: 1px solid var(--border-primary);
}

.message-bubble.customer.initial {
  background: var(--color-info-light);
  border: 1px solid var(--color-info);
  color: var(--text-primary);
}

.message-bubble.vendor {
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
  color: #ffffff;
  border-bottom-right-radius: 0.25rem;
  align-self: flex-end;
  border: 1px solid var(--color-primary);
}

.msg-text {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
  font-size: 0.85rem;
  color: inherit;
}

.msg-meta {
  font-size: 0.65rem;
  margin-top: 0.4rem;
  font-weight: 500;
  color: inherit;
}

.message-bubble.vendor .msg-text,
.message-bubble.vendor .msg-meta {
  color: #ffffff;
}

.message-bubble.customer .msg-meta {
  opacity: 0.85;
}

.message-bubble.customer .msg-meta {
  align-self: flex-start;
}

.message-bubble.vendor .msg-meta {
  align-self: flex-end;
}

.empty-chat {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 2rem;
  text-align: center;
  color: var(--text-secondary);
  flex-grow: 1;
}

.empty-icon {
  width: 48px;
  height: 48px;
  opacity: 0.6;
  color: var(--text-muted);
  transition: all 0.3s ease;
}

.chat-input-area {
  display: flex;
  padding: 1rem 1.25rem;
  border-top: 1px solid var(--border-primary);
  gap: 0.75rem;
  align-items: flex-end;
  background: var(--bg-secondary);
}

.chat-input-area textarea {
  flex: 1;
  background: var(--input-bg);
  border: 1px solid var(--input-border);
  border-radius: 1rem;
  padding: 0.75rem 1rem;
  color: var(--text-primary);
  font-family: inherit;
  font-size: 0.85rem;
  resize: none;
  outline: none;
  transition: all 0.2s;
  min-height: 44px;
  max-height: 120px;
  line-height: 1.4;
}

.chat-input-area textarea::placeholder {
  color: var(--text-muted);
}

.chat-input-area textarea:focus {
  border-color: var(--input-border-focus);
  box-shadow: 0 0 0 2px var(--color-primary-light);
}

.chat-input-area textarea:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-send {
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
  color: var(--text-inverse);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(31, 139, 78, 0.3);
}

.btn-send:hover:not(:disabled) {
  background: linear-gradient(135deg, var(--color-primary-hover), var(--color-primary-active));
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(31, 139, 78, 0.4);
}

.btn-send:active:not(:disabled) {
  transform: translateY(0);
}

.btn-send:disabled {
  background: var(--text-muted);
  cursor: not-allowed;
  box-shadow: none;
  transform: none;
  opacity: 0.5;
}

/* Enhanced Message Icon Styles */
.btn-icon.chat-btn {
  position: relative;
  background: linear-gradient(135deg, #10b981, #059669);
  border: none;
  border-radius: 8px;
  padding: 6px 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-left: 8px;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.2);
  overflow: hidden;
}

.btn-icon.chat-btn:hover {
  background: linear-gradient(135deg, #059669, #047857);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.btn-icon.chat-btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 6px rgba(16, 185, 129, 0.2);
}

.btn-icon.chat-btn .icon {
  color: white;
  transition: transform 0.3s ease;
}

.btn-icon.chat-btn:hover .icon {
  transform: scale(1.1);
}

/* Tooltip for chat button */
.btn-tooltip {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  background: #1f2937;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
  z-index: 1000;
  pointer-events: none;
}

.btn-tooltip::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 4px solid transparent;
  border-top-color: #1f2937;
}

.btn-icon.chat-btn:hover .btn-tooltip {
  opacity: 1;
  visibility: visible;
}

/* Enhanced Send Button */
.enhanced-send-btn {
  position: relative;
  overflow: hidden;
}

.enhanced-send-btn:not(:disabled):hover {
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  box-shadow: 0 8px 20px rgba(59, 130, 246, 0.4);
}

.enhanced-send-btn .send-icon {
  transition: all 0.3s ease;
}

.enhanced-send-btn:hover .send-icon {
  transform: rotate(15deg) scale(1.1);
}

.enhanced-send-btn.sending {
  background: linear-gradient(135deg, #6b7280, #4b5563);
  animation: pulse 2s infinite;
}

/* Loading dots animation */
.loading-dots {
  display: flex;
  gap: 3px;
  align-items: center;
  justify-content: center;
}

.loading-dots span {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: white;
  animation: loading-bounce 1.4s infinite ease-in-out both;
}

.loading-dots span:nth-child(1) { animation-delay: -0.32s; }
.loading-dots span:nth-child(2) { animation-delay: -0.16s; }
.loading-dots span:nth-child(3) { animation-delay: 0s; }

@keyframes loading-bounce {
  0%, 80%, 100% { 
    transform: scale(0.6);
    opacity: 0.5;
  } 
  40% { 
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

/* Enhanced Empty Chat State */
.enhanced-empty-chat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 32px 20px;
  text-align: center;
}

.empty-icon-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.enhanced-empty-chat .empty-icon {
  width: 64px;
  height: 64px;
  color: var(--color-success);
  opacity: 0.8;
  z-index: 2;
  position: relative;
  animation: float 3s ease-in-out infinite;
}

.icon-glow {
  position: absolute;
  inset: -8px;
  background: radial-gradient(circle, rgba(31, 139, 78, 0.2) 0%, transparent 70%);
  border-radius: 50%;
  animation: glow-pulse 2s ease-in-out infinite alternate;
}

.empty-content h3 {
  color: var(--text-primary);
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 8px 0;
}

.empty-content p {
  color: var(--text-secondary);
  font-size: 14px;
  margin: 0;
  max-width: 280px;
  line-height: 1.5;
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-8px); }
}

@keyframes glow-pulse {
  0% { opacity: 0.5; transform: scale(1); }
  100% { opacity: 0.8; transform: scale(1.1); }
}

/* Enhanced general icon styles */
.icon.mini {
  width: 16px;
  height: 16px;
  stroke-width: 2.5;
}

/* Enhanced Navigation Styles */
.enhanced-nav {
  position: relative;
  scroll-behavior: smooth;
}

.enhanced-nav .status-chip {
  position: relative;
  transition: all 0.3s ease;
  scroll-margin: 10px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* Status Icons */
.status-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  transition: all 0.3s ease;
}

.status-chip:hover .status-icon {
  transform: scale(1.1);
}

.status-chip.active .status-icon {
  transform: scale(1.05);
}

/* Status-specific icon colors */
.status-chip:not(.active) .status-icon {
  opacity: 0.7;
}

/* Color coding for different status icons */
.status-chip[data-status="all"] .status-icon {
  color: #64748b;
}

.status-chip[data-status="pending"] .status-icon {
  color: #f59e0b;
}

.status-chip[data-status="paid"] .status-icon {
  color: #10b981;
}

.status-chip[data-status="shipped"] .status-icon {
  color: #3b82f6;
}

.status-chip[data-status="delivered"] .status-icon {
  color: #22c55e;
}

.status-chip[data-status="cancelled"] .status-icon {
  color: #ef4444;
}

.status-chip.active .status-icon {
  color: rgb(21, 30, 46);
  opacity: 1;
  animation: iconPulse 0.3s ease-out;
}

@keyframes iconPulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1.05); }
}

.enhanced-nav .status-chip:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
}

.enhanced-nav .status-chip:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

.enhanced-nav .status-chip.active:focus {
  outline-color: #1d4ed8;
}

/* Screen reader only class */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Enhanced Pagination */
.enhanced-pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 1rem;
  flex-wrap: wrap;
  font-size: 0.75rem;
  color: #cbd5e1;
  letter-spacing: 0.025em;
}

.pagination-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 80px;
  justify-content: center;
  transition: all 0.3s ease;
  position: relative;
}

.pagination-btn:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
}

.pagination-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.pagination-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none !important;
}

.pagination-info {
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 0.5rem;
  min-width: 120px;
  text-align: center;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  justify-content: center;
}

.page-icon {
  width: 14px;
  height: 14px;
  opacity: 0.7;
  flex-shrink: 0;
}

/* Pagination Icon Animations */
.pagination-btn:hover .icon {
  transform: translateX(2px);
}

.pagination-btn:hover .icon[data-direction="prev"] {
  transform: translateX(-2px);
}

/* Mobile Navigation Enhancements */
@media (max-width: 768px) {
  /* Page Container */
  .order-cards-page {
    padding: 0.75rem;
    padding-bottom: 8rem;
    gap: 1rem;
    overflow-x: hidden;
  }

  /* Page Header */
  .page-header {
    padding: 0.25rem 0 1rem;
  }

  .page-title {
    font-size: 1.5rem;
    gap: 0.5rem;
  }

  .title-icon {
    width: 1.5rem;
    height: 1.5rem;
  }

  .page-subtitle {
    font-size: 0.8rem;
    padding-left: 2rem;
  }
  
  /* Navigation Tabs */
  .enhanced-nav {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: thin;
    scrollbar-color: rgba(31, 139, 78, 0.3) transparent;
  }
  
  .enhanced-nav::-webkit-scrollbar {
    height: 4px;
  }
  
  .enhanced-nav::-webkit-scrollbar-track {
    background: var(--bg-secondary);
    border-radius: 2px;
  }
  
  .enhanced-nav::-webkit-scrollbar-thumb {
    background: var(--color-primary);
    border-radius: 2px;
  }
  
  .status-tabs {
    flex-wrap: nowrap;
    min-width: max-content;
    padding: 0.5rem;
    gap: 0.4rem;
  }
  
  .status-chip {
    flex-shrink: 0;
    white-space: nowrap;
    padding: 0.5rem 0.75rem;
    font-size: 0.75rem;
    gap: 0.375rem;
  }
  
  .status-icon {
    width: 14px;
    height: 14px;
  }
  
  /* Controls & Search */
  .controls {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .search-box {
    width: 100%;
  }
  
  .right-actions {
    width: 100%;
    justify-content: space-between;
  }
  
  /* Order Cards */
  .cards-grid {
    gap: 0.875rem;
  }
  
  .order-card {
    padding: 0.875rem;
    border-radius: 12px;
    gap: 0.75rem;
  }
  
  .card-head {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .card-head .left {
    width: 100%;
  }
  
  .card-head .oid {
    font-size: 0.85rem;
    word-break: break-all;
  }
  
  .card-head .created {
    font-size: 0.6rem;
  }
  
  .status-pill {
    align-self: flex-start;
    font-size: 0.5rem;
    padding: 0.3rem 0.5rem;
  }
  
  /* Info Lines */
  .info-line {
    font-size: 0.65rem;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  
  .info-line .lbl {
    font-size: 0.6rem;
    min-width: 80px;
  }
  
  .info-line .val {
    font-size: 0.65rem;
    word-break: break-word;
  }
  
  .mono {
    font-size: 0.6rem;
    word-break: break-all;
  }
  
  .pay-badge {
    font-size: 0.5rem;
    padding: 2px 5px;
  }
  
  /* Items List */
  .items-list {
    gap: 0.625rem;
  }
  
  .item-row {
    gap: 0.625rem;
  }
  
  .thumb {
    width: 60px;
    height: 45px;
    min-width: 60px;
  }
  
  .it-name, .it-label {
    font-size: 0.65rem;
  }
  
  .it-label {
    font-size: 0.5rem;
  }
  
  .it-sub {
    font-size: 0.55rem;
  }
  
  .it-total {
    font-size: 0.6rem;
  }
  
  /* Shipping Block */
  .ship-block {
    padding: 0.5rem;
    font-size: 0.55rem;
  }
  
  .ship-title {
    font-size: 0.5rem;
  }
  
  /* Buttons */
  .actions {
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  
  .btn {
    font-size: 0.6rem;
    padding: 0.45rem 0.65rem;
  }
  
  .btn.tiny {
    padding: 0.35rem 0.5rem;
    font-size: 0.55rem;
  }
  
  .icon.mini {
    width: 12px;
    height: 12px;
  }
  
  .expand-btn {
    font-size: 0.6rem;
    padding: 0.5rem;
  }
  
  /* Pagination */
  .enhanced-pagination {
    gap: 0.5rem;
    font-size: 0.65rem;
    flex-wrap: wrap;
  }
  
  .pagination-btn {
    min-width: 60px;
    padding: 0.4rem 0.6rem;
    font-size: 0.65rem;
  }
  
  .pagination-info {
    padding: 0.4rem 0.8rem;
    min-width: 100px;
    flex-direction: column;
    gap: 0.25rem;
    font-size: 0.65rem;
  }
  
  .page-icon {
    display: none;
  }
  
  /* Chat Button */
  .btn-icon.chat-btn {
    width: 28px;
    height: 28px;
  }
  
  .btn-tooltip {
    display: none;
  }
  
  /* Agreement Modal */
  .agreement-modal-overlay {
    padding: 0.5rem;
  }
  
  .agreement-modal-container {
    max-width: 100%;
    max-height: 90vh;
  }
  
  .agreement-modal-header {
    padding: 0.75rem 1rem;
  }
  
  .agreement-modal-header h3 {
    font-size: 0.9rem;
  }
  
  .connection-status {
    font-size: 0.7rem;
  }
  
  .chat-history {
    padding: 0.75rem;
  }
  
  .message-bubble {
    max-width: 90%;
    padding: 0.625rem 0.875rem;
  }
  
  .msg-text {
    font-size: 0.8rem;
  }
  
  .msg-meta {
    font-size: 0.6rem;
  }
  
  .chat-input-area {
    padding: 0.75rem;
    gap: 0.5rem;
  }
  
  .chat-input-area textarea {
    font-size: 0.8rem;
    padding: 0.625rem 0.875rem;
    min-height: 40px;
  }
  
  .btn-send {
    width: 40px;
    height: 40px;
  }
  
  /* Enhanced Empty Chat */
  .enhanced-empty-chat {
    padding: 24px 16px;
  }
  
  .enhanced-empty-chat .empty-icon {
    width: 48px;
    height: 48px;
  }
  
  .empty-content h3 {
    font-size: 16px;
  }
  
  .empty-content p {
    font-size: 13px;
  }
  
  /* Empty State */
  .empty-state {
    padding: 2rem 1rem;
    font-size: 0.8rem;
  }
  
  .empty-state .icon.large {
    width: 40px;
    height: 40px;
  }
}

/* Extra Small Screens */
@media (max-width: 480px) {
  .order-cards-page {
    padding: 0.5rem;
  }

  .page-header {
    padding: 0.25rem 0 0.75rem;
  }

  .page-title {
    font-size: 1.25rem;
    gap: 0.4rem;
  }

  .title-icon {
    width: 1.25rem;
    height: 1.25rem;
  }

  .page-subtitle {
    font-size: 0.75rem;
    padding-left: 1.65rem;
  }
  
  .status-chip {
    padding: 0.4rem 0.6rem;
    font-size: 0.7rem;
  }
  
  .order-card {
    padding: 0.75rem;
  }
  
  .card-head .oid {
    font-size: 0.8rem;
  }
  
  .info-line {
    font-size: 0.6rem;
  }
  
  .info-line .lbl {
    min-width: 70px;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .enhanced-nav .status-chip:focus {
    outline: 3px solid;
    outline-offset: 2px;
  }
  
  .pagination-btn:focus {
    outline: 3px solid;
    outline-offset: 2px;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .enhanced-nav {
    scroll-behavior: auto;
  }
  
  .enhanced-nav .status-chip,
  .pagination-btn,
  .loading-dots span {
    transition: none;
    animation: none;
  }
}

/* Rest of existing styles remain the same */
</style>
