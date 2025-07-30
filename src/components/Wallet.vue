<script setup lang="js">
import { defineEmits } from 'vue';
import {
  WalletIcon,
  ArrowDownCircleIcon,
  ArrowUpCircleIcon,

} from '@heroicons/vue/24/outline';

const emit = defineEmits(['closeWallet'])

const handleClose = () => {
  emit("closeWallet")
}

</script>

<template>
  <aside class="wallet-sidebar">
    <h2 class="sidebar-title">
      <WalletIcon class="icon"></WalletIcon>
      <span>My Wallet</span>
    </h2>
    <nav class="wallet-container">
      <div class="cash-display">
        <div class="label">
          <span>Balance</span>
        </div>
        <h4>$4099.67</h4>
      </div>
      <div class="action">
        <button>
          <ArrowUpCircleIcon class="icon"></ArrowUpCircleIcon>
          <span>Cash In</span>
        </button>
        <button>
          <ArrowDownCircleIcon class="icon"></ArrowDownCircleIcon>
          <span>Withdraw</span>
        </button>
      </div>
      <button @click="handleClose" class="close-wallet">
        <span>Close</span>
      </button>
    </nav>
  </aside>
</template>

<style scoped>
.wallet-sidebar {
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
  z-index: 5;
  border-bottom: 5px solid var(--primary-color);
  height: fit-content;
}

.sidebar-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-dark);
  border-bottom: 2px solid #e5e7eb;
  padding-bottom: 0.5rem;
  margin-bottom: 1rem;
  display: flex;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.sidebar-title .icon {
  height: 2rem;
  aspect-ratio: 1;
}

.wallet-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.cash-display {
  width: 100%;
  height: fit-content;
  padding: 10px;
  border-radius: 1rem;
  background-color: var(--background-color);
  padding-bottom: 1.5rem;
  border: 1px solid rgba(128, 128, 128, 0.288);
  border-top: 5px solid var(--primary-color);
  box-shadow: 0 0 10px rgba(151, 148, 148, 0.397);
}

.label {
  display: flex;
  width: 100%;
  font-size: 14px;
}

.cash-display h4 {
  font-size: 18px;
  margin-top: 10px;
}

.action {
  width: 100%;
  height: fit-content;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 5px;
}

.action button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 8px;
  border: 0;
  border-radius: 8px;
  background-color: var(--primary-color);
  color: white;
  cursor: pointer;
  font-size: 14px;
  transition: all 150ms;
}

.action button:hover {
  opacity: .8;
}

.action button .icon {
  height: 1.4rem;
  aspect-ratio: 1;
}

.close-wallet {
  padding: 7px;
  font-size: 14px;
  border-radius: 6px;
  border: 0;
  background-color: rgba(0, 0, 0, 0.178);
  color: rgb(0, 0, 0);
  transition: all 100ms;
  cursor: pointer;
}

.close-wallet:hover {
  opacity: .5;
}

@media (max-width: 820px) {
  .wallet-sidebar {
    top: 4.2rem;
  }
}

@media (max-width: 540px) {
  .wallet-sidebar {
    display: none;
  }
}
</style>
