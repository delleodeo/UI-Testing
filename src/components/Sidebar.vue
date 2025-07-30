<script setup lang="js">
import { ref, defineEmits} from 'vue';
import {
  HomeIcon,
  ChatBubbleLeftIcon,
  WalletIcon,
  ClipboardDocumentListIcon,
  HeartIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/vue/24/outline';

const emit = defineEmits(['handleClick'])

const handleCl = () => {
  emit('handleClick')
  activeTab.value = "wallet"
}
const activeTab = ref('dashboard');

const handleLogout = () => {
  console.log('Logging out...');
  // Redirect or perform logout logic here
};
</script>

<template>
  <aside class="account-sidebar">
    <h2 class="sidebar-title">My Account</h2>
    <nav class="sidebar-nav">
      <button class="sidebar-link" :class="{ active: activeTab === 'dashboard' }" @click="activeTab = 'dashboard'">
        <HomeIcon class="sidebar-icon" />
        Dashboard
      </button>

      <button class="sidebar-link" :class="{ active: activeTab === 'orders' }" @click="activeTab = 'orders'">
        <ClipboardDocumentListIcon class="sidebar-icon" />
        Orders
      </button>

      <!-- <button class="sidebar-link" :class="{ active: activeTab === 'message' }" @click="activeTab = 'message'">
        <ChatBubbleLeftIcon class="sidebar-icon" />
        Message
      </button> -->

      <button @click="handleCl" class="sidebar-link" :class="{ active: activeTab === 'wallet' }">
        <WalletIcon class="sidebar-icon"/>
        Wallets
      </button>

      <!-- <button class="sidebar-link" :class="{ active: activeTab === 'wishlist' }" @click="activeTab = 'wishlist'">
        <HeartIcon class="sidebar-icon" />
        Wishlist
      </button> -->

      <button class="sidebar-link" :class="{ active: activeTab === 'settings' }" @click="activeTab = 'settings'">
        <Cog6ToothIcon class="sidebar-icon" />
        Update My Info
      </button>

      <button class="sidebar-link logout" @click="handleLogout">
        <ArrowRightOnRectangleIcon class="sidebar-icon" />
        Logout
      </button>
    </nav>
  </aside>
</template>

<style scoped>
.account-sidebar {
  width: 100%;
  max-width: 18rem;
  min-width: 18rem;
  background-color: var(--background-color);
  border-radius: 0 0 1rem 1rem;
  box-shadow: 0 10px 30px rgba(128, 128, 128, 0.548);
  padding: 1.5rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  z-index: 10;
  border-bottom: 5px solid var(--primary-color);

}

.sidebar-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-dark);
  border-bottom: 2px solid #e5e7eb;
  padding-bottom: 0.5rem;
  margin-bottom: 1rem;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.sidebar-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  font-size: 1rem;
  color: var(--text-dark);
  background-color: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  text-align: left;
}

.sidebar-link:hover {
  background-color: rgba(0, 0, 0, 0.05);
  transform: translateX(4px);
}

.sidebar-link.active {
  background-color: var(--primary-color);
  color: var(--text-white);
  font-weight: 600;
}

.sidebar-link.logout {
  margin-top: 1rem;
  color: #dc2626;
  /* Tailwind red-600 */
}

.sidebar-link.logout:hover {
  background-color: rgba(220, 38, 38, 0.1);
}

.sidebar-icon {
  width: 1.5rem;
  height: 1.5rem;
  flex-shrink: 0;
}

@media (max-width: 820px) {

  .account-sidebar {
    top: 4.2rem;
  }
}

@media (max-width: 540px) {
  .account-sidebar {
    display: none;
  }
}
</style>
