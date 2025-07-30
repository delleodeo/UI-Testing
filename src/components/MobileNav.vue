<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'

import {
  HomeIcon,
  ChatBubbleLeftIcon,
  UserIcon,
  ShoppingBagIcon,
  ShoppingCartIcon
} from '@heroicons/vue/24/outline'

import {
  HomeIcon as HomeIconSolid,
  ChatBubbleLeftIcon as ChatBubbleLeftIconSolid,
  UserIcon as UserIconSolid,
  ShoppingBagIcon as ShoppingBagIconSolid,
  ShoppingCartIcon as ShoppingCartIconSolid
} from '@heroicons/vue/24/solid'

interface NavItem {
  id: string
  label: string
  icon: any
  activeIcon: any
  navigate: string
}




const router = useRouter()
const route = useRoute()

const active = ref('home')

const navItems: NavItem[] = [
  { id: 'home', navigate: '/products', label: 'Home', icon: HomeIcon, activeIcon: HomeIconSolid },
  { id: 'cart', navigate: '/cart', label: 'Cart', icon: ShoppingCartIcon, activeIcon: ShoppingCartIconSolid },
  // { id: 'message', navigate: '/message', label: 'Message', icon: ChatBubbleLeftIcon, activeIcon: ChatBubbleLeftIconSolid },
  { id: 'orders', navigate: '/orders', label: 'Orders', icon: ShoppingBagIcon, activeIcon: ShoppingBagIconSolid },
  { id: 'profile', navigate: '/user/me', label: 'Profile', icon: UserIcon, activeIcon: UserIconSolid }
]

const shouldShowNav = computed(() =>
  navItems.some(item => route.path.startsWith(item.navigate) && item.id !== 'message')
)

// Update active state on route change
const updateActiveFromRoute = () => {
  const match = navItems.find(item => route.path.startsWith(item.navigate))
  active.value = match?.id || 'home'
}

onMounted(() => {
  updateActiveFromRoute()
})

watch(() => route.path, updateActiveFromRoute)


const navigateTo = (itemId: string, path: string) => {
  if (route.path === path && itemId === 'home') {
    window.location.assign(path)
  } else {
    router.push(path)
  }
  active.value = itemId
}
</script>

<template>
  <nav v-if="shouldShowNav" class="mobile-nav">
    <div class="nav-container">
      <button v-for="item in navItems" :key="item.id" class="nav-item" :class="{ active: active === item.id }"
        @click="navigateTo(item.id, item.navigate)">
        <component :is="active === item.id ? item.activeIcon : item.icon" class="nav-icon" />
        <span v-if="active === item.id" class="nav-label">{{ item.label }}</span>
      </button>
    </div>
  </nav>
</template>


<style scoped>
.mobile-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  padding: 0;
  background: transparent;
  pointer-events: none;
}

.nav-container {
  background-color: var(--background-color, #fcfaf5);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-top: 1px solid rgba(218, 213, 213, 0.4);
  display: flex;
  justify-content: space-around;
  align-items: center;
  pointer-events: all;
  width: 100%;
  padding: 0.5rem 10px;
}

.nav-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.4rem;
  background: none;
  border: none;
  cursor: pointer;
  border-radius: 14px;
  transition: all 0.3s ease;
  flex: 1;
  justify-content: center;
  padding: 0.5rem 0.25rem;
}

.nav-icon {
  width: 24px;
  height: 24px;
  color: rgba(0, 0, 0, 0.6);
  transition: all 0.2s ease;
}

.nav-item.active {
  background-color: var(--primary-color-2, #094a25);
  transform: translateY(-2px);
  border-radius: .8rem;
  padding: 0.6rem 0.7rem;
}

.nav-item.active .nav-icon {
  color: white;
}

.nav-label {
  font-size: 0.85rem;
  font-weight: 500;
  display: none;
  color: white;
}

.nav-item.active .nav-label {
  display: block;
}

/* Hide nav bar on large screen */
@media (min-width: 841px) {
  .mobile-nav {
    display: none;
  }
}
</style>
