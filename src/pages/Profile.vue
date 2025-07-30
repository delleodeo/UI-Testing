<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
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
} from '@heroicons/vue/24/outline'
import { CheckBadgeIcon } from '@heroicons/vue/24/solid'


import { useUserStore } from '../stores/userStores'
import { useCartStore } from '../stores/cartStores'
const userStore = useUserStore()
const cartStore = useCartStore()
const userData = computed(() => userStore.userData)

const isChangeProfile = ref(false)
const fallbackAvatar =
  'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400'

const handleAvatarError = (event: Event) => {
  const target = event.target as HTMLImageElement
  target.src = fallbackAvatar
}

const formatAmount = (amount: number): string =>
  new Intl.NumberFormat('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)

const handleCashIn = () => {

  setTimeout(() => {
    console.log('Cash In clicked')

  }, 0)
}

const handleWithdraw = () => {

  setTimeout(() => {
    console.log('Withdraw clicked')

  }, 0)
}

const setActiveTab = (tabId: string) => {
  setTimeout(() => {
    console.log(`Tab clicked: ${tabId}`)
    if (tabId === 'logout') {
      console.log('Logging out...')
    }
  }, 0)
}

const changeProfile = () => {
  isChangeProfile.value = !isChangeProfile.value
}

onMounted(() => {
  userStore.fetchUser()
  // cartStore.fetchCart()
})
</script>


<template>
  <section class="user-profile">
  <VendorForm></VendorForm>
    <transition name="fade-scale">
      <ChangeProfileModal v-if="isChangeProfile" @closeModal="changeProfile"></ChangeProfileModal>
    </transition>

    <div v-if="userStore.isLoading" class="loading">Loading profile...</div>
    <div v-else>
      <div class="profile-header">
        <div class="profile-info">
          <div class="avatar-container">
            <img :src="userData?.avatar || fallbackAvatar" :alt="userData?.name || 'User Avatar'" class="avatar"
              loading="lazy" @error="handleAvatarError" />
            <button @click="changeProfile" class="change-profile">
              <CameraIcon></CameraIcon>
            </button>
          </div>

          <h1 class="user-name">
            {{ userData?.name || 'Unknown User' }}
            <InformationCircleIcon v-if="!userData?.isVerified" class="action-icon" />
            <CheckBadgeIcon v-else class="action-icon verified" />
          </h1>

          <div class="location">
            <MapPinIcon class="location-icon" />
            <span>
              {{ userData?.address?.province || 'No Address' }},
              {{ userData?.address?.city || '' }},
              {{ userData?.address?.barangay || '' }}
            </span>
          </div>
        </div>
      </div>

      <div class="content-section">
        <div class="wallet-card">
          <div class="card-header">
            <h3 class="card-title">My Wallet</h3>
            <button class="card-menu">
              <EllipsisHorizontalIcon class="menu-icon" />
            </button>
          </div>

          <div class="wallet-balances">
            <div class="balance-item">
              <div class="balance-info">
                <span class="balance-label">
                  <WalletIcon class="wallet-icon" />
                  Cash
                </span>
                <span class="balance-amount">
                  ₱{{ formatAmount(userData?.wallet?.cash || 0) }}
                </span>
              </div>
            </div>
          </div>

          <div class="wallet-actions">
            <button class="wallet-btn cash-in" @click="handleCashIn">
              <PlusIcon class="btn-icon" />
              Cash In
            </button>
            <button class="wallet-btn withdraw" @click="handleWithdraw">
              <ArrowUpTrayIcon class="btn-icon" />
              Withdraw
            </button>
          </div>
        </div>

        <div class="quick-actions-card">
          <h3 class="card-title">Quick Actions</h3>
          <div class="action-list">
            <button class="action-item" @click="setActiveTab('orders')">
              <div class="action-left">
                <LockClosedIcon class="action-icon" />
                <span class="action-label">Change Password</span>
              </div>
              <ChevronRightIcon class="chevron" />
            </button>

            <button class="action-item" @click="setActiveTab('orders')">
              <div class="action-left">
                <LockClosedIcon class="action-icon" />
                <span class="action-label">Apply For Vendor</span>
              </div>
              <ChevronRightIcon class="chevron" />
            </button>

            <button class="action-item logout" @click="setActiveTab('logout')">
              <div class="action-left">
                <ArrowRightOnRectangleIcon class="action-icon" />
                <span class="action-label">Logout</span>
              </div>
              <ChevronRightIcon class="chevron" />
            </button>
          </div>
        </div>

        <UserInfo />
      </div>
    </div>
  </section>
</template>



<style scoped>
.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-scale-enter-from,
.fade-scale-leave-to {
  opacity: 0;
  transform: scale(.9);
}

.fade-scale-enter-to,
.fade-scale-leave-from {
  opacity: 1;
  transform: scale(1);
}

.user-profile {
  min-height: 100vh;
  background: var(--background-color);
  padding-bottom: 6rem;
}

.profile-header {
  animation: fadeIn 0.3s ease-out;
  background: linear-gradient(135deg, #47b94b, var(--primary-color));
  color: white;
  padding: 1rem;
  border-radius: 0 0 24px 24px;
  position: relative;
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