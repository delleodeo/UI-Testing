<script setup>
import { onMounted, onUnmounted, ref } from 'vue';
import Analytics from '../../components/vendor/views/Analytics.vue';
import Navigation from '../../components/vendor/Navigation.vue';
import Products from '../../components/vendor/views/Products.vue';
import Orders from '../../components/vendor/views/Orders.vue';
import Inventory from '../../components/vendor/views/Inventory.vue';
import { useVendorDashboardStore } from '../../stores/vendor/dashboardStores';
import VendorProfile from '../../components/vendor/views/VendorProfile.vue';
import ThemeToggle from '../../components/ThemeToggle.vue';
const vendorDashboad = useVendorDashboardStore()
onMounted(async () => {
  await vendorDashboad.fetchVendor()
})

const active = ref(localStorage.getItem("activePageVendorDashboard") || 'Analytics')

const sample = (name) => {
  active.value = name
  localStorage.setItem("activePageVendorDashboard", name)
}

onUnmounted(() => {
  localStorage.removeItem("activePageVendorDashboard")
})
</script>
<template>
  <main>
    <section>
      <Navigation @navigate="sample"></Navigation>

      <div class="content">
        <header>
          <div class="header-left">
            <h1>{{ active }}</h1>
          </div>
          <div class="header-right">
            <ThemeToggle :showLabel="true" size="medium" />
          </div>
        </header>
        <Analytics v-if="active === 'Analytics'"></Analytics>
        <Products v-if="active === 'Products'"></Products>
        <Orders v-if="active === 'Orders'"></Orders>
        <Inventory v-if="active === 'Inventory'"></Inventory>
        <VendorProfile v-if="active === 'Profile'"></VendorProfile>
      </div>
    </section>
  </main>
</template>



<style scoped>
main {
  width: 100dvw;
  min-height: 100dvh;
  background: linear-gradient(135deg, rgba(31, 139, 78, 0.02) 0%, rgba(31, 139, 78, 0.05) 100%);
  background-color: var(--bg-primary);
  transition: background-color 0.3s ease, background 0.3s ease;
}

section {
  position: relative;
  display: flex;
  max-width: 1400px;
  margin: 0 auto;
  gap: 1rem;
  min-height: 100dvh;
}

.content {
  width: 100%;
  padding: 0;
  background-color: transparent;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  color: var(--text-primary);
  font-size: clamp(14px, 2vw, 1rem);
  background: var(--dashboard-primary);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--border-primary);
  position: sticky;
  top: 0;
  z-index: 50;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

header:hover {
  box-shadow: 0 2px 8px rgba(31, 139, 78, 0.08);
}

.header-left {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

header h1 {
  margin: 0;
  color: var(--text-primary);
  font-weight: 700;
  font-size: clamp(1.25rem, 3vw, 1.75rem);
  letter-spacing: -0.02em;
  background: linear-gradient(135deg, var(--text-primary) 0%, #1f8b4e 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Responsive layout */
@media (max-width: 1024px) {
  section {
    gap: 0;
  }
}

@media (max-width: 768px) {
  header {
    padding: 1rem;
  }
  
  header h1 {
    font-size: 1.25rem;
  }
  
  .header-right {
    gap: 0.5rem;
  }
}

@media (max-width: 480px) {
  header {
    padding: 0.875rem;
  }
  
  header h1 {
    font-size: 1.125rem;
  }
}
</style>