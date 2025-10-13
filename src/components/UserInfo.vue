<script setup lang="ts">
import { computed, ref } from 'vue';
import { PencilSquareIcon, XMarkIcon } from '@heroicons/vue/24/outline';
import UserInfoEdit from './UserInfoEdit.vue';
import { useUserStore } from '../stores/userStores';
const userStore = useUserStore()
const user = computed(() => userStore.userData)

const isEdit = ref(true)

const handleInformationButton = () => {
  isEdit.value = !isEdit.value
  return
}

const closeAfterSave = () => {
  isEdit.value = !isEdit.value
}
</script>

<template>
  <div class="user-info-card">
    <div class="card-header">
      <h3 class="card-title">{{ !isEdit ? "Edit Personal Information" : "Personal Information" }}</h3>
      <button class="edit-btn" @click="handleInformationButton">
        <PencilSquareIcon v-if="isEdit" class="edit-icon" />
        <XMarkIcon v-else class="close-icon" />
      </button>
    </div>

    <UserInfoEdit v-if="!isEdit" @handleCloseAfterSave="closeAfterSave" />
    
    <div class="content" v-if="isEdit">
      <div class="info-grid">
        <div class="info-section">
          <div class="info-item">
            <label class="info-label">Full Name</label>
            <span class="info-value">{{ user?.name || "Not provided" }}</span>
          </div>
          <div class="info-item">
            <label class="info-label">Email Address</label>
            <span class="info-value">{{ user?.email || 'Not provided' }}</span>
          </div>
          <div class="info-item">
            <label class="info-label">Phone Number</label>
            <span class="info-value">{{ user?.phone || 'Not provided' }}</span>
          </div>
        </div>

        <div class="address-section">
          <h4 class="section-title">Address Information</h4>
          <div class="address-grid">
            <div class="address-item">
              <label class="info-label">Street</label>
              <span class="info-value">{{ user?.address?.street || 'Not provided' }}</span>
            </div>
            <div class="address-item">
              <label class="info-label">Barangay</label>
              <span class="info-value">{{ user?.address?.barangay || 'Not provided' }}</span>
            </div>
            <div class="address-item">
              <label class="info-label">City</label>
              <span class="info-value">{{ user?.address?.city || 'Not provided' }}</span>
            </div>
            <div class="address-item">
              <label class="info-label">Province</label>
              <span class="info-value">{{ user?.address?.province || 'Not provided' }}</span>
            </div>
            <div class="address-item">
              <label class="info-label">ZIP Code</label>
              <span class="info-value">{{ user?.address?.zipCode || 'Not provided' }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>


<style scoped>
.user-info-card {
  background: white;
  border-radius: 16px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  animation: fadeIn 0.3s ease-out;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #f3f4f6;
  background: #f9fafb;
}

.card-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.edit-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: transparent;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.edit-btn:hover {
  background: #f3f4f6;
  border-color: #10b981;
}

.edit-icon,
.close-icon {
  width: 18px;
  height: 18px;
  color: #6b7280;
}

.edit-btn:hover .edit-icon,
.edit-btn:hover .close-icon {
  color: #10b981;
}

.content {
  padding: 1.5rem;
  animation: fadeIn 0.3s ease-out;
}

.info-grid {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.info-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid #f3f4f6;
}

.info-item:last-child {
  border-bottom: none;
}

.info-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280;
  min-width: 120px;
}

.info-value {
  font-size: 0.9375rem;
  font-weight: 600;
  color: #111827;
  text-align: right;
}

.address-section {
  border-top: 1px solid #f3f4f6;
  padding-top: 1.5rem;
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 1rem 0;
}

.address-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.address-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.75rem;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #f3f4f6;
}

.address-item .info-label {
  min-width: auto;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #9ca3af;
}

.address-item .info-value {
  text-align: left;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Responsive */
@media (max-width: 768px) {
  .card-header {
    padding: 1rem;
  }
  
  .content {
    padding: 1rem;
  }
  
  .info-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }
  
  .info-label {
    min-width: auto;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  .info-value {
    text-align: left;
    font-size: 0.875rem;
  }
  
  .address-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .card-header {
    padding: 0.75rem;
  }
  
  .content {
    padding: 0.75rem;
  }
  
  .card-title {
    font-size: 1rem;
  }
}
</style>
