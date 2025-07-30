<script setup>
import { onMounted, onUnmounted, ref } from 'vue';
import Analytics from '../../components/vendor/views/Analytics.vue';
import Navigation from '../../components/vendor/Navigation.vue';
import Products from '../../components/vendor/views/Products.vue';
import Orders from '../../components/vendor/views/Orders.vue';
import Inventory from '../../components/vendor/views/Inventory.vue';
import { useVendorDashboardStore } from '../../stores/vendor/dashboardStores';
import VendorProfile from '../../components/vendor/views/VendorProfile.vue';
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
          <h1>{{ active }}</h1>
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
  background-color: rgb(12, 24, 46);
}

section {
  position: relative;
  display: flex;
  max-width: 1200px;
  margin: 0 auto;

  gap: 10px;
}

.content {
  width: 100%;
  padding: 0 8px;
  background-color: var(--dashboard-primary);
  height: 100dvh;
  display: flex;
  flex-direction: column;

}

header {

  padding: 1rem 10px;
  color: white;
  font-size: clamp(14px, 2vw, 1rem);
  background-color: var(--dashboard-primary);
}
</style>