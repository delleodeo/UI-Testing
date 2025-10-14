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
  background: var(--surface);
  border-top: 1px solid var(--border-primary);
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
}
.mobile-nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.75rem 0.5rem;
  text-decoration: none;
  color: var(--text-secondary);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  gap: 0.25rem;
  position: relative;
}
.mobile-nav-item:hover {
  color: var(--color-primary);
  background: var(--surface-hover);
}
.mobile-nav-item.active {
  color: var(--color-primary);
}
.mobile-nav-item.active::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--color-primary);
  border-radius: 0 0 3px 3px;
}
.mobile-nav-icon {
  width: 20px;
  height: 20px;
}
.mobile-nav-item span {
  font-size: 0.75rem;
  font-weight: 600;
}

/* ========== DESKTOP SIDEBAR ========== */
.sidebar {
  display: none;
  position: relative;
  left: 0;
  top: 0;
  width: 240px;
  background: var(--surface);
  padding: 1.5rem;
  border-right: 1px solid var(--border-primary);
  flex-shrink: 0;
  box-shadow: var(--shadow-sm);
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
  color: var(--color-primary);
}
.logo h2 {
  color: var(--text-primary);
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: -0.02em;
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
  border-radius: var(--radius-md);
  text-decoration: none;
  color: var(--text-secondary);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  gap: 0.75rem;
  font-weight: 500;
  position: relative;
}
.nav-item:hover {
  background: var(--surface-hover);
  color: var(--text-primary);
  transform: translateX(4px);
}
.nav-item.active {
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
  color: white;
  box-shadow: 0 4px 12px rgba(31, 139, 78, 0.3);
  font-weight: 600;
}
.nav-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 60%;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 0 4px 4px 0;
  box-shadow: 0 0 8px rgba(255, 255, 255, 0.5);
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
