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
  <div class="wallet-card">
    <div class="wallet-header">
      <div class="header-content">
        <WalletIcon class="wallet-icon" />
        <h2 class="wallet-title">My Wallet</h2>
      </div>
      <button @click="handleClose" class="close-btn">
        <svg class="close-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
    
    <div class="wallet-content">
      <div class="balance-section">
        <span class="balance-label">Available Balance</span>
        <div class="balance-amount">₱4,099.67</div>
        <div class="balance-subtitle">Updated just now</div>
      </div>
      
      <div class="wallet-actions">
        <button class="action-btn primary">
          <ArrowUpCircleIcon class="btn-icon" />
          <span>Cash In</span>
        </button>
        <button class="action-btn secondary">
          <ArrowDownCircleIcon class="btn-icon" />
          <span>Withdraw</span>
        </button>
      </div>
      
      <div class="recent-activity">
        <h3 class="activity-title">Recent Activity</h3>
        <div class="activity-list">
          <div class="activity-item">
            <div class="activity-icon cash-in">
              <ArrowUpCircleIcon />
            </div>
            <div class="activity-details">
              <span class="activity-type">Cash In</span>
              <span class="activity-date">2 hours ago</span>
            </div>
            <span class="activity-amount positive">+₱500.00</span>
          </div>
          <div class="activity-item">
            <div class="activity-icon withdraw">
              <ArrowDownCircleIcon />
            </div>
            <div class="activity-details">
              <span class="activity-type">Purchase</span>
              <span class="activity-date">Yesterday</span>
            </div>
            <span class="activity-amount negative">-₱150.50</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.wallet-card {
  background: white;
  border-radius: 16px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  animation: slideIn 0.3s ease-out;
  max-width: 400px;
  width: 100%;
}

.wallet-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  background: linear-gradient(135deg, rgba(16,185,129,0.05), rgba(139,92,246,0.05));
  border-bottom: 1px solid #f3f4f6;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.wallet-icon {
  width: 24px;
  height: 24px;
  color: #10b981;
}

.wallet-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.close-btn {
  width: 32px;
  height: 32px;
  background: transparent;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s ease;
}

.close-btn:hover {
  background: rgba(0, 0, 0, 0.05);
}

.close-icon {
  width: 18px;
  height: 18px;
  color: #6b7280;
}

.wallet-content {
  padding: 1.5rem;
}

.balance-section {
  text-align: center;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, rgba(16,185,129,0.08), rgba(139,92,246,0.08));
  border-radius: 12px;
  border: 1px solid #f3f4f6;
}

.balance-label {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
  display: block;
  margin-bottom: 0.5rem;
}

.balance-amount {
  font-size: 2rem;
  font-weight: 800;
  color: #111827;
  letter-spacing: -0.02em;
  margin-bottom: 0.25rem;
}

.balance-subtitle {
  font-size: 0.75rem;
  color: #9ca3af;
}

.wallet-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  margin-bottom: 2rem;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.875rem 1rem;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn.primary {
  background: #10b981;
  color: white;
}

.action-btn.primary:hover {
  background: #059669;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.35);
}

.action-btn.secondary {
  background: #f3f4f6;
  color: #374151;
}

.action-btn.secondary:hover {
  background: #e5e7eb;
  transform: translateY(-1px);
}

.btn-icon {
  width: 18px;
  height: 18px;
}

.recent-activity {
  border-top: 1px solid #f3f4f6;
  padding-top: 1.5rem;
}

.activity-title {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 1rem 0;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #f3f4f6;
}

.activity-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.activity-icon.cash-in {
  background: #dcfce7;
  color: #16a34a;
}

.activity-icon.withdraw {
  background: #fef3c7;
  color: #d97706;
}

.activity-icon svg {
  width: 18px;
  height: 18px;
}

.activity-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.activity-type {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.activity-date {
  font-size: 0.75rem;
  color: #9ca3af;
}

.activity-amount {
  font-size: 0.875rem;
  font-weight: 600;
}

.activity-amount.positive {
  color: #16a34a;
}

.activity-amount.negative {
  color: #dc2626;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 480px) {
  .wallet-card {
    max-width: none;
    border-radius: 0;
  }
  
  .wallet-header {
    padding: 1rem;
  }
  
  .wallet-content {
    padding: 1rem;
  }
  
  .balance-section {
    padding: 1rem;
    margin-bottom: 1.5rem;
  }
  
  .balance-amount {
    font-size: 1.75rem;
  }
  
  .wallet-actions {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }
}
</style>
