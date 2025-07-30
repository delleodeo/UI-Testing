<script setup>
import { ref } from 'vue'
import {
  ChartBarIcon,
  CubeIcon,
  ShoppingBagIcon,
  CogIcon,
  UserCircleIcon
} from '@heroicons/vue/24/outline'

const emits = defineEmits(['navigate'])

const current =  ref(localStorage.getItem("activePageVendorDashboard") || 'Analytics')

const navItems = [
  { name: 'Analytics', icon: ChartBarIcon },
  { name: 'Products', icon: CubeIcon },
  { name: 'Orders', icon: ShoppingBagIcon },
  { name: 'Inventory', icon: CogIcon },
  { name: 'Profile', icon: UserCircleIcon }
]

function select(name) {
  current.value = name
  emits('navigate', name)
}
</script>

<template>
  <!-- Desktop Sidebar -->
  <aside class="sidebar">
    <div class="sidebar-con">
      <div class="logo">
        <ChartBarIcon class="logo-icon" />
        <h2>Dashboard</h2>
      </div>
      <nav class="nav-menu">
        <a
          v-for="item in navItems"
          :key="item.name"
          href="#"
          class="nav-item"
          :class="{ active: current === item.name }"
          @click.prevent="select(item.name)"
        >
          <component :is="item.icon" class="nav-icon" />
          <span>{{ item.name }}</span>
        </a>
      </nav>
    </div>
  </aside>

  <!-- Mobile Bottom Nav -->
  <nav class="mobile-nav">
    <a
      v-for="item in navItems"
      :key="item.name"
      href="#"
      class="mobile-nav-item"
      :class="{ active: current === item.name }"
      @click.prevent="select(item.name)"
    >
      <component :is="item.icon" class="mobile-nav-icon" />
      <span>{{ item.name }}</span>
    </a>
  </nav>
</template>

<style scoped>
/* ========== MOBILE NAV ========== */
.mobile-nav {
  display: flex;
  background: #1e293b;
  border-top: 1px solid #334155;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
}
.mobile-nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.75rem 0.5rem;
  text-decoration: none;
  color: #ffffff;
  transition: color 0.2s;
  gap: 0.25rem;
}
.mobile-nav-item:hover,
.mobile-nav-item.active {
  color: var(--primary-color);
}
.mobile-nav-icon {
  width: 20px;
  height: 20px;
}
.mobile-nav-item span {
  font-size: 0.75rem;
  font-weight: 500;
}

/* ========== DESKTOP SIDEBAR ========== */
.sidebar {
  display: none;
  position: relative;
  left: 0;
  top: 0;
  width: 240px;
  background: #1e293b;
  padding: 1.5rem;
  border-right: 1px solid #334155;
  flex-shrink: 0;
}
.sidebar-con {
  position: fixed;
}
.logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 2rem;
}
.logo-icon {
  width: 32px;
  height: 32px;
  color: #3b82f6;
}
.logo h2 {
  color: white;
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
}
.nav-menu {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.nav-item {
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  text-decoration: none;
  color: #94a3b8;
  transition: all 0.2s;
  gap: 0.75rem;
}
.nav-item:hover {
  background: #334155;
  color: white;
}
.nav-item.active {
  background: #3b82f6;
  color: white;
}
.nav-icon {
  width: 20px;
  height: 20px;
}

/* ========== RESPONSIVE RULES ========== */
@media (min-width: 1024px) {
  .mobile-nav {
    display: none;
  }

  .sidebar {
    display: block;
  }
}
</style>
