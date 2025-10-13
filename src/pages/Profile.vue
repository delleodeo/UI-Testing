<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import UserInfo from '../components/UserInfo.vue'
import ChangeProfileModal from '../components/ChangeProfileModal.vue'
import VendorForm from "../components/VendorForm.vue"
import {
  PencilSquareIcon,
  InformationCircleIcon,
  ArrowRightOnRectangleIcon,
  EllipsisHorizontalIcon,
  MapPinIcon,
  PlusIcon,
  ArrowUpTrayIcon,
  ClockIcon,
  CameraIcon,
  WalletIcon,
  ChevronRightIcon,
  LockClosedIcon,
  UserIcon,
  ShieldCheckIcon,
  BellIcon,
  CogIcon,
  ArrowLeftIcon,
  BuildingStorefrontIcon,
  StarIcon,
  ShoppingBagIcon
} from '@heroicons/vue/24/outline'
import { CheckBadgeIcon } from '@heroicons/vue/24/solid'

import { useUserStore } from '../stores/userStores'
import { useCartStore } from '../stores/cartStores'
import { useAuthStore } from '../stores/authStores'

const router = useRouter()
const userStore = useUserStore()
const cartStore = useCartStore()
const authStore = useAuthStore()
const userData = computed(() => userStore.userData)

// Profile state management
const activeTab = ref('overview')
const isChangeProfile = ref(false)
const isEditing = ref(false)
const showVendorForm = ref(false)
const isLoading = ref(false)

// Modern UI state
const isDarkTheme = ref(false)
const showNotifications = ref(false)
const notifications = ref([
  { id: 1, title: 'Profile Updated', message: 'Your profile information has been saved', type: 'success', time: '2 minutes ago' },
  { id: 2, title: 'New Order', message: 'You have received a new order #12345', type: 'info', time: '1 hour ago' },
  { id: 3, title: 'Payment Received', message: 'Payment of ₱1,250.00 has been credited', type: 'success', time: '3 hours ago' }
])

// Edit form state
const editForm = ref({
  name: '',
  email: '',
  phone: '',
  address: {
    street: '',
    barangay: '',
    city: '',
    province: '',
    zipCode: ''
  }
})

const fallbackAvatar =
  'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400'

// Tab management
const tabs = [
  { id: 'overview', label: 'Overview', icon: UserIcon },
  { id: 'personal', label: 'Personal Info', icon: InformationCircleIcon },
  { id: 'security', label: 'Security', icon: ShieldCheckIcon },
  { id: 'wallet', label: 'Wallet', icon: WalletIcon },
  { id: 'notifications', label: 'Notifications', icon: BellIcon },
  { id: 'settings', label: 'Settings', icon: CogIcon }
]

const setActiveTab = (tabId: string) => {
  activeTab.value = tabId
  if (tabId === 'logout') {
    handleLogout()
  }
}

// Utility functions
const handleAvatarError = (event: Event) => {
  const target = event.target as HTMLImageElement
  target.src = fallbackAvatar
}

const formatAmount = (amount: number): string =>
  new Intl.NumberFormat('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)

// Actions
const changeProfile = () => {
  isChangeProfile.value = !isChangeProfile.value
}

const startEditing = () => {
  isEditing.value = true
  // Populate form with current data
  editForm.value = {
    name: userData.value?.name || '',
    email: userData.value?.email || '',
    phone: userData.value?.phone || '',
    address: {
      street: userData.value?.address?.street || '',
      barangay: userData.value?.address?.barangay || '',
      city: userData.value?.address?.city || '',
      province: userData.value?.address?.province || '',
      zipCode: userData.value?.address?.zipCode || ''
    }
  }
}

const cancelEditing = () => {
  isEditing.value = false
}

const saveProfile = async () => {
  try {
    isLoading.value = true
    // Here you would call the update user API
    console.log('Saving profile:', editForm.value)
    // await userStore.updateProfile(editForm.value)
    isEditing.value = false
    alert('Profile updated successfully!')
  } catch (error) {
    console.error('Failed to update profile:', error)
    alert('Failed to update profile. Please try again.')
  } finally {
    isLoading.value = false
  }
}

const handleCashIn = () => {
  console.log('Cash In clicked')
  alert('Cash In feature coming soon!')
}

const handleWithdraw = () => {
  console.log('Withdraw clicked')
  alert('Withdraw feature coming soon!')
}

const handleLogout = async () => {
  const confirmed = confirm('Are you sure you want to logout?')
  if (confirmed) {
    try {
      await authStore.logout()
      router.push('/auth')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }
}

const goBack = () => {
  router.back()
}

const toggleVendorForm = () => {
  showVendorForm.value = !showVendorForm.value
}

const toggleTheme = () => {
  isDarkTheme.value = !isDarkTheme.value
  document.documentElement.classList.toggle('dark-theme', isDarkTheme.value)
}

const toggleNotifications = () => {
  showNotifications.value = !showNotifications.value
}

const dismissNotification = (id: number) => {
  notifications.value = notifications.value.filter(n => n.id !== id)
}

// Achievement system
const userLevel = computed(() => {
  const totalOrders = 24 // This would come from userData
  if (totalOrders >= 50) return { level: 5, title: 'Elite Member', color: '#8B5CF6' }
  if (totalOrders >= 25) return { level: 4, title: 'Gold Member', color: '#F59E0B' }
  if (totalOrders >= 10) return { level: 3, title: 'Silver Member', color: '#6B7280' }
  if (totalOrders >= 5) return { level: 2, title: 'Bronze Member', color: '#CD7F32' }
  return { level: 1, title: 'New Member', color: '#10B981' }
})

// Initialize
onMounted(async () => {
  await userStore.fetchUser()
})
</script>


<template>
  <div class="profile-container" :class="{ 'dark-theme': isDarkTheme }">
    <!-- Modern Header -->
    <div class="modern-header">
      <div class="header-content">
        <button @click="goBack" class="modern-btn back-btn">
          <ArrowLeftIcon class="btn-icon" />
        </button>
        <div class="header-center">
          <h1 class="page-title-header">My Profile</h1>
          <div class="breadcrumb">
            <span class="breadcrumb-item">Dashboard</span>
            <ChevronRightIcon class="breadcrumb-separator" />
            <span class="breadcrumb-item active">Profile</span>
          </div>
        </div>
        <div class="header-actions">
          <button @click="toggleNotifications" class="modern-btn notification-btn">
            <BellIcon class="btn-icon" />
            <span v-if="notifications.length" class="notification-badge">{{ notifications.length }}</span>
          </button>
          <button @click="toggleTheme" class="modern-btn theme-btn">
            <svg v-if="!isDarkTheme" class="btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
            <svg v-else class="btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Notifications Panel -->
    <transition name="slide-down">
      <div v-if="showNotifications" class="notifications-panel">
        <div class="panel-header">
          <h3>Notifications</h3>
          <button @click="toggleNotifications" class="close-panel">
            <svg class="close-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div class="notifications-list">
          <div 
            v-for="notification in notifications" 
            :key="notification.id"
            :class="['notification-item', notification.type]"
          >
            <div class="notification-content">
              <h4 class="notification-title">{{ notification.title }}</h4>
              <p class="notification-message">{{ notification.message }}</p>
              <span class="notification-time">{{ notification.time }}</span>
            </div>
            <button @click="dismissNotification(notification.id)" class="dismiss-btn">
              <svg class="dismiss-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
           <div v-if="!notifications.length" class="empty-notifications">
            <BellIcon class="empty-icon" />
            <p>No new notifications</p>
          </div>
        </div>
      </div>
    </transition>

    <!-- Mobile Icon Nav (collapses sidebar) -->
    <nav class="mobile-nav">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        @click="setActiveTab(tab.id)"
        :class="['mobile-nav-item', { active: activeTab === tab.id }]"
        :aria-label="tab.label"
      >
        <component :is="tab.icon" class="mobile-nav-icon" />
        <span class="mobile-nav-label">{{ tab.label }}</span>
      </button>
    </nav>

    <!-- Main Layout -->
    <div class="profile-layout">
      <!-- Compact Sidebar -->
      <aside class="sidebar">
        <div class="user-profile-section">
          <div class="avatar-container">
            <img 
              :src="userData?.avatar || fallbackAvatar" 
              :alt="userData?.name || 'User Avatar'" 
              class="user-avatar"
              loading="lazy" 
              @error="handleAvatarError" 
            />
            <button @click="changeProfile" class="avatar-edit-btn">
              <CameraIcon class="camera-icon" />
            </button>
          </div>
          <div class="user-details">
            <h3 class="user-name">
              {{ userData?.name || 'Unknown User' }}
              <CheckBadgeIcon v-if="userData?.isVerified" class="verified-badge" />
            </h3>
            <p class="user-email">{{ userData?.email || 'No email' }}</p>
          </div>
        </div>
        
        <nav class="sidebar-nav">
          <button 
            v-for="tab in tabs" 
            :key="tab.id"
            @click="setActiveTab(tab.id)"
            :class="['nav-item', { active: activeTab === tab.id }]"
          >
            <component :is="tab.icon" class="nav-icon" />
            <span class="nav-label">{{ tab.label }}</span>
          </button>
          
          <div class="nav-divider"></div>

          <button @click="toggleVendorForm" class="nav-item vendor-apply">
            <BuildingStorefrontIcon class="nav-icon" />
            <span class="nav-label">Apply for Vendor</span>
          </button>
          
          <button @click="handleLogout" class="nav-item logout-btn">
            <ArrowRightOnRectangleIcon class="nav-icon" />
            <span class="nav-label">Logout</span>
          </button>
        </nav>
      </aside>

      <!-- Main Content Area -->
      <main class="main-content">
        <!-- Welcome Banner -->
        <div class="welcome-banner">
          <h2>Welcome back, {{ userData?.name?.split(' ')[0] || 'User' }}!</h2>
          <p>Here's your profile at a glance. What would you like to do today?</p>
        </div>

        <!-- Overview Tab -->
        <div v-if="activeTab === 'overview'" class="tab-content">
          <div class="content-header">
            <div>
              <h1 class="content-title">Profile Overview</h1>
              <p class="content-subtitle">Manage your account information and settings</p>
            </div>
            <button @click="startEditing" class="btn-primary edit-profile-btn">
              <PencilSquareIcon class="btn-icon" />
              Edit Profile
            </button>
          </div>

          <!-- Quick Stats -->
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-icon-wrapper" style="background: #E0F2FE;">
                <ShoppingBagIcon style="color: #0EA5E9;" />
              </div>
              <div class="stat-details">
                <span class="stat-label">Total Orders</span>
                <span class="stat-number">24</span>
              </div>
            </div>
            
            <div class="stat-card">
              <div class="stat-icon-wrapper" style="background: #FEF9C3;">
                <StarIcon style="color: #F59E0B;" />
              </div>
              <div class="stat-details">
                <span class="stat-label">Rating</span>
                <span class="stat-number">4.8</span>
              </div>
            </div>
            
            <div class="stat-card">
              <div class="stat-icon-wrapper" style="background: #ECFDF5;">
                <WalletIcon style="color: #10B981;" />
              </div>
              <div class="stat-details">
                <span class="stat-label">Balance</span>
                <span class="stat-number">₱{{ formatAmount(userData?.wallet?.cash || 0) }}</span>
              </div>
            </div>
            
            <div class="stat-card">
              <div class="stat-icon-wrapper" style="background: #DCFCE7;">
                <ShieldCheckIcon style="color: #22C55E;" />
              </div>
              <div class="stat-details">
                <span class="stat-label">{{ userLevel.title }}</span>
                <span class="stat-number">Level {{ userLevel.level }}</span>
              </div>
            </div>
          </div>

          <!-- Main Content Grid -->
          <div class="main-grid">
            <!-- Account Information -->
            <div class="info-section">
              <div class="section-header">
                <h2 class="section-title">Account Information</h2>
              </div>
              <div class="info-list">
                <div class="info-row">
                  <div class="info-label"><UserIcon class="label-icon" />Full Name</div>
                  <div class="info-value">{{ userData?.name || 'Not provided' }}</div>
                </div>
                <div class="info-row">
                  <div class="info-label"><svg class="label-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" /></svg>Email</div>
                  <div class="info-value">{{ userData?.email || 'Not provided' }}</div>
                </div>
                <div class="info-row">
                  <div class="info-label"><svg class="label-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>Phone</div>
                  <div class="info-value">{{ userData?.phone || 'Not provided' }}</div>
                </div>
                <div class="info-row">
                  <div class="info-label"><MapPinIcon class="label-icon" />Location</div>
                  <div class="info-value">{{ userData?.address?.city ? `${userData.address.city}, ${userData.address.province}` : 'Not provided' }}</div>
                </div>
              </div>
            </div>

            <!-- Wallet Section -->
            <div class="wallet-section">
              <div class="section-header">
                <h2 class="section-title">My Wallet</h2>
              </div>
              <div class="balance-display">
                <span class="balance-label">Available Balance</span>
                <div class="balance-amount">₱{{ formatAmount(userData?.wallet?.cash || 0) }}</div>
              </div>
              <div class="wallet-actions">
                <button class="wallet-btn primary" @click="handleCashIn">
                  <PlusIcon class="btn-icon" />
                  Cash In
                </button>
                <button class="wallet-btn secondary" @click="handleWithdraw">
                  <ArrowUpTrayIcon class="btn-icon" />
                  Withdraw
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Personal Info Tab (Edit Mode) -->
        <div v-else-if="activeTab === 'personal'" class="tab-content">
          <div class="content-header">
            <h1 class="content-title">Personal Information</h1>
            <button v-if="!isEditing" @click="startEditing" class="btn-primary">
              <PencilSquareIcon class="btn-icon" />
              Edit Information
            </button>
          </div>

          <div v-if="isEditing" class="edit-form">
            <div class="form-section">
              <h3 class="section-title">Basic Information</h3>
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">Full Name</label>
                  <input v-model="editForm.name" type="text" class="form-input" placeholder="Enter your full name" />
                </div>
                <div class="form-group">
                  <label class="form-label">Email</label>
                  <input v-model="editForm.email" type="email" class="form-input" placeholder="Enter your email" />
                </div>
                <div class="form-group">
                  <label class="form-label">Phone</label>
                  <input v-model="editForm.phone" type="tel" class="form-input" placeholder="Enter your phone number" />
                </div>
              </div>
            </div>

            <div class="form-section">
              <h3 class="section-title">Address Information</h3>
              <div class="form-grid">
                <div class="form-group full-width">
                  <label class="form-label">Street</label>
                  <input v-model="editForm.address.street" type="text" class="form-input" placeholder="Enter street address" />
                </div>
                <div class="form-group">
                  <label class="form-label">Barangay</label>
                  <input v-model="editForm.address.barangay" type="text" class="form-input" placeholder="Enter barangay" />
                </div>
                <div class="form-group">
                  <label class="form-label">City</label>
                  <input v-model="editForm.address.city" type="text" class="form-input" placeholder="Enter city" />
                </div>
                <div class="form-group">
                  <label class="form-label">Province</label>
                  <input v-model="editForm.address.province" type="text" class="form-input" placeholder="Enter province" />
                </div>
                <div class="form-group">
                  <label class="form-label">ZIP Code</label>
                  <input v-model="editForm.address.zipCode" type="text" class="form-input" placeholder="Enter ZIP code" />
                </div>
              </div>
            </div>

            <div class="form-actions">
              <button @click="cancelEditing" class="btn-secondary">Cancel</button>
              <button @click="saveProfile" class="btn-primary" :disabled="isLoading">
                <span v-if="isLoading">Saving...</span>
                <span v-else">Save Changes</span>
              </button>
            </div>
          </div>

          <div v-else class="view-mode">
            <UserInfo />
          </div>
        </div>

        <!-- Other Tabs Placeholder -->
        <div v-else class="tab-content">
          <div class="placeholder-content">
            <div class="placeholder-icon">
              <component :is="tabs.find(t => t.id === activeTab)?.icon" class="icon" />
            </div>
            <h3>{{ tabs.find(t => t.id === activeTab)?.label || 'Feature' }} Coming Soon</h3>
            <p>This section is under development and will be available in a future update.</p>
          </div>
        </div>
      </main>
    </div>

    <!-- Modals -->
    <transition name="fade-scale">
      <ChangeProfileModal v-if="isChangeProfile" @closeModal="changeProfile" />
    </transition>
    <transition name="fade-scale">
      <VendorForm v-if="showVendorForm" @close="toggleVendorForm" />
    </transition>

    <!-- Loading Overlay -->
    <div v-if="userStore.isLoading" class="loading-overlay">
      <div class="spinner"></div>
      <p>Loading profile...</p>
    </div>
  </div>
</template>



<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

/* CSS Variables */
:root {
  /* Theme Colors */
  --primary-color: #10b981;
  --accent-color: #8b5cf6;
  --primary-gradient: linear-gradient(135deg, #10b981 0%, #8b5cf6 100%);
  --primary-light: #d1fae5;
  --primary-dark: #047857;
  
  /* Gray Scale */
  --gray-50: #f9fafb;
  --gray-100: #f3f4f6;
  --gray-200: #e5e7eb;
  --gray-300: #d1d5db;
  --gray-500: #6b7280;
  --gray-700: #374151;
  --gray-900: #111827;
  
  /* Design System */
  --radius-8: 8px;
  --radius-16: 16px;
  --radius-24: 24px;
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.1);
  --shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 25px rgba(0, 0, 0, 0.15);
  
  /* Glassmorphism */
  --glass-background: rgba(255, 255, 255, 0.8);
  --glass-border: rgba(148, 163, 184, 0.2);
  --blur-strength: 12px;
  --shadow-color: rgba(2, 6, 23, 0.15);
  
  /* Spacing (8px scale) */
  --space-1: 8px;
  --space-2: 16px;
  --space-3: 24px;
  --space-4: 32px;
}

.dark-theme {
  --gray-50: #1f2937;
  --gray-100: #374151;
  --gray-200: #4b5563;
  --gray-500: #9ca3af;
  --gray-700: #d1d5db;
  --gray-900: #f9fafb;
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.3);
  --shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  --shadow-lg: 0 10px 25px rgba(0, 0, 0, 0.4);
}

/* Transitions */
.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-scale-enter-from,
.fade-scale-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

.fade-scale-enter-to,
.fade-scale-leave-from {
  opacity: 1;
  transform: scale(1);
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-down-enter-from {
  opacity: 0;
  transform: translateY(-20px) scale(0.95);
}

.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-20px) scale(0.95);
}

/* Base Styles */
.profile-container {
  min-height: 100vh;
  background-color: var(--gray-50);
  font-family: 'Inter', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
}

/* Modern Header */
.modern-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: white;
  border-bottom: 1px solid var(--gray-200);
  box-shadow: var(--shadow-sm);
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.header-center {
  text-align: center;
  flex: 1;
}

.page-title-header {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--gray-900);
  margin: 0 0 0.25rem 0;
}

.breadcrumb {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--gray-500);
}

.breadcrumb-item.active {
  color: var(--primary-color);
  font-weight: 500;
}

.breadcrumb-separator {
  width: 16px;
  height: 16px;
}

.header-actions {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.modern-btn {
  background: var(--gray-100);
  border: none;
  border-radius: var(--radius-8);
  padding: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modern-btn:hover {
  background: var(--gray-200);
  transform: translateY(-1px);
}

.btn-icon {
  width: 20px;
  height: 20px;
  color: var(--gray-500);
}

.notification-btn {
  position: relative;
}

.notification-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background: #ef4444;
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 18px;
  text-align: center;
}

/* Notifications Panel */
.notifications-panel {
  position: absolute;
  top: 80px;
  right: 1rem;
  width: 360px;
  max-height: 500px;
  background: var(--glass-background);
  backdrop-filter: blur(var(--blur-strength));
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-16);
  box-shadow: var(--shadow-lg);
  z-index: 1000;
  overflow: hidden;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--glass-border);
}

.panel-header h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.close-panel {
  background: none;
  border: none;
  padding: 0.5rem;
  border-radius: var(--radius-8);
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.close-panel:hover {
  background: rgba(0, 0, 0, 0.05);
}

.close-icon {
  width: 20px;
  height: 20px;
  color: #64748b;
}

.notifications-list {
  max-height: 400px;
  overflow-y: auto;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--glass-border);
  transition: background-color 0.2s ease;
}

.notification-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.notification-item.success {
  border-left: 4px solid #10b981;
}

.notification-item.info {
  border-left: 4px solid #3b82f6;
}

.notification-content {
  flex: 1;
}

.notification-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.25rem 0;
}

.notification-message {
  font-size: 0.8125rem;
  color: #64748b;
  margin: 0 0 0.5rem 0;
  line-height: 1.4;
}

.notification-time {
  font-size: 0.75rem;
  color: #94a3b8;
}

.dismiss-btn {
  background: none;
  border: none;
  padding: 0.25rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.dismiss-btn:hover {
  background: rgba(0, 0, 0, 0.05);
}

.dismiss-icon {
  width: 16px;
  height: 16px;
  color: #94a3b8;
}

.empty-notifications {
  padding: 2rem;
  text-align: center;
  color: var(--gray-500);
}

.empty-icon {
  width: 48px;
  height: 48px;
  margin: 0 auto 1rem;
  color: var(--gray-300);
}

/* Mobile Navigation */
.mobile-nav {
  display: none;
  position: sticky;
  top: 80px;
  z-index: 90;
  background: white;
  border-top: 1px solid var(--gray-200);
  border-bottom: 1px solid var(--gray-200);
  padding: 0.5rem;
  gap: 0.25rem;
  justify-content: space-around;
}

.mobile-nav-item {
  background: transparent;
  border: none;
  padding: 0.75rem 0.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: var(--gray-700);
  flex: 1;
  cursor: pointer;
  transition: color 0.2s ease;
}

.mobile-nav-item.active { 
  color: var(--primary-color); 
}

.mobile-nav-icon { 
  width: 22px; 
  height: 22px; 
}

.mobile-nav-label { 
  font-size: 0.7rem;
  font-weight: 500;
}

/* Layout */
.profile-layout {
  display: flex;
  min-height: calc(100vh - 80px);
}

/* Sidebar */
.sidebar {
  width: 280px;
  background: white;
  border-right: 1px solid var(--gray-200);
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
}

.user-profile-section {
  padding: 2rem 1.5rem;
  border-bottom: 1px solid var(--gray-100);
}

.avatar-container {
  text-align: center;
  margin-bottom: 1rem;
  position: relative;
  display: inline-block;
}

.user-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid var(--gray-100);
  box-shadow: var(--shadow-sm);
}

.avatar-edit-btn {
  position: absolute;
  bottom: 0;
  right: 0;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border: 2px solid white;
  box-shadow: var(--shadow-sm);
  transition: all 0.2s ease;
}

.avatar-edit-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(16, 185, 129, 0.35);
}

.camera-icon {
  width: 14px;
  height: 14px;
}

.user-details {
  text-align: center;
}

.user-name {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0 0 0.25rem 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.verified-badge {
  width: 16px;
  height: 16px;
  color: var(--primary-color);
}

.user-email {
  font-size: 0.875rem;
  color: var(--gray-500);
  margin: 0 0 0.5rem 0;
}

.user-level {
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Navigation */
.sidebar-nav {
  flex: 1;
  padding: 0;
}

.nav-item {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 1rem 1.5rem;
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
  color: var(--gray-700);
  font-weight: 500;
  gap: 0.75rem;
}

.nav-item:hover {
  background: var(--gray-50);
  color: var(--primary-color);
  transform: translateX(2px);
}

.nav-item.active {
  background: var(--primary-light);
  color: var(--primary-color);
  border-right: 3px solid var(--primary-color);
  position: relative;
}

.nav-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: var(--primary-gradient);
}

.nav-item.vendor-apply {
  color: var(--accent-color);
}

.nav-item.vendor-apply:hover {
  background: #faf5ff;
}

.nav-item.logout-btn {
  color: #ef4444;
  margin-top: 1rem;
}

.nav-item.logout-btn:hover {
  background: #fef2f2;
}

.nav-divider {
  height: 1px;
  background: var(--gray-200);
  margin: 1rem 1.5rem;
}

.nav-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.nav-label {
  flex-grow: 1;
  font-weight: 500;
  font-size: 0.875rem;
}

/* Main Content */
.main-content {
  flex: 1;
  padding: 0;
  overflow-y: auto;
  background: var(--gray-50);
}

/* Welcome Banner */
.welcome-banner {
  max-width: 1200px;
  margin: 1rem auto 0;
  background: linear-gradient(135deg, rgba(16,185,129,0.08), rgba(139,92,246,0.08));
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-16);
  box-shadow: var(--shadow-sm);
  padding: 1.25rem 1.5rem;
}

.welcome-banner h2 {
  margin: 0 0 4px;
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--gray-900);
}

.welcome-banner p {
  margin: 0;
  color: var(--gray-500);
  font-size: 0.9375rem;
  line-height: 1.5;
}

/* Tab Content */
.tab-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  gap: 1rem;
}

.content-title {
  font-size: 1.875rem;
  font-weight: 700;
  color: var(--gray-900);
  margin: 0 0 0.5rem 0;
}

.content-subtitle {
  font-size: 0.9375rem;
  color: var(--gray-500);
  margin: 0;
}

/* Buttons */
.btn-primary {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: var(--radius-16);
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: var(--shadow-sm);
}

.btn-primary:hover {
  background: var(--primary-dark);
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(16, 185, 129, 0.35);
}

.btn-secondary {
  padding: 0.75rem 1.5rem;
  background: var(--gray-100);
  color: var(--gray-700);
  border: none;
  border-radius: var(--radius-16);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  background: var(--gray-200);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.btn-icon {
  width: 16px;
  height: 16px;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  border-radius: var(--radius-16);
  border: 1px solid var(--gray-200);
  box-shadow: var(--shadow-sm);
  padding: 1.25rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: all 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.stat-icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-icon-wrapper svg {
  width: 24px;
  height: 24px;
}

.stat-details {
  flex: 1;
}

.stat-label {
  font-size: 0.8125rem;
  color: var(--gray-500);
  margin-bottom: 2px;
  font-weight: 500;
}

.stat-number {
  display: block;
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--gray-900);
  letter-spacing: -0.01em;
  line-height: 1.2;
}

/* Main Grid */
.main-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
  gap: 1.5rem;
}

/* Info Section */
.info-section {
  background: white;
  border-radius: var(--radius-16);
  border: 1px solid var(--gray-200);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

.section-header {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--gray-100);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--gray-900);
  margin: 0;
}

.section-action {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: transparent;
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-8);
  color: var(--gray-500);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.section-action:hover {
  background: var(--gray-50);
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.action-icon {
  width: 14px;
  height: 14px;
}

.info-list {
  padding: 1.5rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 0;
  border-bottom: 1px solid var(--gray-100);
}

.info-row:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.info-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: var(--gray-500);
  font-size: 0.875rem;
  font-weight: 500;
}

.label-icon {
  width: 16px;
  height: 16px;
  color: var(--gray-300);
}

.info-value {
  color: var(--gray-900);
  font-weight: 600;
  font-size: 0.9375rem;
}

/* Wallet Section */
.wallet-section {
  background: white;
  border-radius: var(--radius-16);
  border: 1px solid var(--gray-200);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

.balance-display {
  padding: 1.5rem;
  text-align: center;
  background: linear-gradient(135deg, rgba(16,185,129,0.05), rgba(139,92,246,0.05));
}

.balance-label {
  font-size: 0.875rem;
  color: var(--gray-500);
  margin-bottom: 0.5rem;
}

.balance-amount {
  font-size: 2rem;
  font-weight: 800;
  color: var(--gray-900);
  letter-spacing: -0.02em;
}

.wallet-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
  margin-top: 1rem;
}

.wallet-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem;
  border: none;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.wallet-btn.primary {
  background: var(--primary-color);
  color: white;
}

.wallet-btn.secondary {
  background: var(--gray-100);
  color: var(--gray-700);
}

.wallet-btn:hover {
  transform: translateY(-1px);
}

.wallet-btn.primary:hover {
  background: var(--primary-dark);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.35);
}

.wallet-btn.secondary:hover {
  background: var(--gray-200);
}

/* Form Styles */
.edit-form {
  background: white;
  border-radius: var(--radius-16);
  padding: 2rem;
  box-shadow: var(--shadow-sm);
}

.form-section {
  margin-bottom: 2rem;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-label {
  font-weight: 500;
  color: var(--gray-700);
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
}

.form-input {
  padding: 0.75rem 1rem;
  border: 1px solid var(--gray-300);
  border-radius: var(--radius-8);
  font-size: 1rem;
  transition: all 0.2s ease;
  background: white;
}

.form-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  padding-top: 2rem;
  border-top: 1px solid var(--gray-200);
}

/* View Mode */
.view-mode {
  background: white;
  border-radius: var(--radius-16);
  padding: 2rem;
  box-shadow: var(--shadow-sm);
}

/* Placeholder Content */
.placeholder-content {
  background: white;
  border-radius: var(--radius-16);
  padding: 4rem 2rem;
  text-align: center;
  box-shadow: var(--shadow-sm);
}

.placeholder-icon {
  width: 64px;
  height: 64px;
  background: var(--gray-100);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
}

.placeholder-icon .icon {
  width: 32px;
  height: 32px;
  color: var(--gray-300);
}

.placeholder-content h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--gray-900);
  margin: 0 0 0.5rem 0;
}

.placeholder-content p {
  color: var(--gray-500);
  margin: 0;
}

/* Loading Overlay */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  animation: fadeIn 0.3s ease;
}

.spinner {
  width: 60px;
  height: 60px;
  border: 4px solid rgba(255, 255, 255, 0.2);
  border-top: 4px solid var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1.5rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-overlay p {
  color: white;
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Responsive Design */
@media (max-width: 1200px) {
  .main-grid {
    grid-template-columns: 1fr;
  }
  
  .stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  }
}

@media (max-width: 1024px) {
  .profile-layout {
    flex-direction: column;
  }
  
  .sidebar {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid var(--gray-200);
  }
  
  .user-profile-section {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.5rem;
  }
  
  .user-details {
    text-align: left;
  }
  
  .sidebar-nav {
    display: flex;
    flex-direction: row;
    overflow-x: auto;
    padding: 0.5rem;
  }
  
  .nav-item {
    white-space: nowrap;
    min-width: auto;
  }
}

@media (max-width: 768px) {
  .mobile-nav { 
    display: flex; 
  }
  
  .sidebar { 
    display: none; 
  }
  
  .main-content {
    padding: 0;
  }
  
  .tab-content {
    padding: 1rem;
  }
  
  .header-content {
    padding: 1rem;
  }
  
  .header-center {
    margin: 0 1rem;
  }
  
  .page-title-header {
    font-size: 1.25rem;
  }
  
  .content-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .content-title {
    font-size: 1.5rem;
  }
  
  .stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 1rem;
  }
  
  .stat-card {
    flex-direction: column;
    text-align: center;
    padding: 1rem;
  }
  
  .stat-icon-wrapper {
    margin-bottom: 0.5rem;
  }
  
  .notifications-panel {
    left: 0.5rem;
    right: 0.5rem;
    width: auto;
  }
  
  .form-grid {
    grid-template-columns: 1fr;
  }
  
  .form-actions {
    flex-direction: column-reverse;
  }
  
  .btn-secondary,
  .btn-primary {
    width: 100%;
    justify-content: center;
  }
  
  .welcome-banner {
    margin: 0.5rem;
  }
  
  .main-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}

@media (max-width: 480px) {
  .header-actions {
    gap: 0.5rem;
  }
  
  .modern-btn {
    padding: 0.625rem;
  }
  
  .btn-icon {
    width: 18px;
    height: 18px;
  }
  
  .stat-card {
    padding: 0.75rem;
  }
  
  .stat-number {
    font-size: 1.25rem;
  }
  
  .balance-amount {
    font-size: 1.75rem;
  }
}


.profile-info {
  text-align: center;
  margin-bottom: 2rem;
}

.avatar-container {
  margin-bottom: 1rem;
  position: relative;
  width: fit-content;
  margin: 0 auto;
}

.avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  background-position: center;
  border: 3px solid white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.change-profile {
  height: 1.8rem;
  aspect-ratio: 1;
  position: absolute;
  bottom: 7px;
  right: 0px;
  padding: 2px;
  background-color: white;

  border-radius: 50rem;
  color: black;
  border: 2px solid var(--primary-color);
}

.user-name {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
}

.user-name .action-icon {
  color: rgb(255, 196, 0);
  height: 1.35rem;
  width: 1.35rem;
}

.user-name .verified {
  color: rgb(184, 223, 238);
}

.user-tagline {
  font-size: 0.9rem;
  opacity: 0.9;
  margin-bottom: 0.75rem;
}

.location {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  font-size: 0.85rem;
  opacity: 0.9;
  margin-bottom: 1rem;
}

.location-icon {
  width: 14px;
  height: 14px;
}

.btn-container {
  display: flex;
  align-items: center;
  justify-content: center;
  border-right: 1px solid rgba(227, 236, 227, 0.589);
}

.edit-btn {
  background: white;
  color: #4CAF50;
  border: none;
  padding: .8rem 3rem;
  border-radius: 1rem;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
  max-width: 200px;
  margin-right: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
}

.edit-btn .edit-icon {
  height: 1.2rem;
  aspect-ratio: 1;
}

.edit-btn:hover {
  background: #f0f0f0;
  transform: translateY(-1px);
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  margin-bottom: 1.5rem;
  padding: 0 2rem;
}

.stat {
  text-align: center;
}

.stat-number {
  display: block;
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
}

.stat-label {
  font-size: 0.8rem;
  opacity: 0.9;
}

/* Content Section */
.content-section {
  padding: 1.5rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Wallet Card */
.wallet-card {
  animation: fadeIn 0.4s ease-out;
  background: rgb(255, 255, 255);
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.card-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1a1a1a;
}

.card-menu {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
}

.card-menu:hover {
  background: #f5f5f5;
}

.wallet-balances {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.balance-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 12px;
}

.balance-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.balance-label {
  font-size: 0.9rem;
  color: #666;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 5px;
  margin-bottom: 5px;
}

.wallet-icon {
  height: 1.4rem;
  aspect-ratio: 1;
}

.balance-amount {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1a1a1a;
}

.wallet-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.wallet-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.wallet-btn.cash-in {
  background: var(--primary-color);
  color: white;
}

.wallet-btn.cash-in:hover {
  background: var(--primary-color);
  transform: translateY(-1px);
}

.wallet-btn.withdraw {
  background: var(--secondary-color);
  color: white;
}

.wallet-btn.withdraw:hover {
  background: var(--secondary-color);
  transform: translateY(-1px);
}

.btn-icon {
  width: 18px;
  height: 18px;
}

/* Quick Actions Card */
.quick-actions-card {
  animation: fadeIn 0.45s ease-out;
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.action-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.action-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background: none;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
}

.action-item:hover {
  background: #f8f9fa;
}

.action-item.logout {
  color: #dc3545;
}

.action-item.logout:hover {
  background: #f8d7da;
}

.action-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.action-icon {
  width: 20px;
  height: 20px;
  color: black;
}

.action-item.logout .action-icon {
  color: #dc3545;
}

.action-label {
  font-size: 1rem;
  font-weight: 500;
  color: #1a1a1a;
}

.action-item.logout .action-label {
  color: #dc3545;
}

.chevron {
  width: 16px;
  height: 16px;
  color: #999;
}

@media (min-width: 840px) {
  .user-profile {
    display: none;
  }
}

/* Responsive Design */
@media (max-width: 480px) {
  .profile-header {
    padding: 0.75rem;
  }

  .stats-row {
    padding: 0 1rem;
  }



  .content-section {
    padding: 1rem 0.75rem;
  }

  .wallet-card,
  .quick-actions-card {
    padding: 1.25rem;
  }
}
</style>