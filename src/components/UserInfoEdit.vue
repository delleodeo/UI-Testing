<script setup lang="ts">
import { defineEmits, ref } from 'vue'
import { useUserStore } from '../stores/userStores'
import { Alert } from './composable/Alert'
import { 
  UserIcon, 
  EnvelopeIcon, 
  PhoneIcon, 
  MapPinIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/vue/24/outline'

const userStore = useUserStore()
const form = userStore.userData
const isSubmitting = ref(false)

const emits = defineEmits(['handleCloseAfterSave'])

const handleFormClose = () => {
  emits('handleCloseAfterSave')
}

const handleSubmit = async () => {
  if (isSubmitting.value) return
  
  isSubmitting.value = true
  console.table(form)
  
  try {
    await userStore.updateUser(form)
    Alert("User profile updated successfully!", "success", "var(--primary-color)")
    handleFormClose()
  } catch (error) {
    console.error("Update failed:", error)
    Alert("Failed to update user profile.", "error", "var(--secondary-color)")
  } finally {
    isSubmitting.value = false
  }
}

</script>
<template>
  <div class="edit-form-container">
    <!-- Form Header -->
    <div class="form-header">
      <div class="header-content">
        <div class="header-icon">
          <UserIcon class="icon" />
        </div>
        <div class="header-text">
          <h3 class="form-title">Edit Profile Information</h3>
          <p class="form-subtitle">Update your personal details and address information</p>
        </div>
      </div>
      <button 
        type="button" 
        class="close-button" 
        @click="handleFormClose"
        :disabled="isSubmitting"
      >
        <XMarkIcon class="close-icon" />
      </button>
    </div>

    <!-- Form Content -->
    <form class="user-edit-form" @submit.prevent="handleSubmit">
      <!-- Personal Information Section -->
      <div class="form-section">
        <div class="section-header">
          <UserIcon class="section-icon" />
          <h4 class="section-title">Personal Information</h4>
        </div>
        
        <div class="form-grid">
          <div class="form-group">
            <label for="name" class="form-label">
              <UserIcon class="label-icon" />
              Full Name *
            </label>
            <div class="input-wrapper">
              <input 
                id="name" 
                v-model="form.name" 
                type="text" 
                class="form-input"
                placeholder="Enter your full name"
                required 
                :disabled="isSubmitting"
              />
            </div>
          </div>

          <div class="form-group">
            <label for="email" class="form-label">
              <EnvelopeIcon class="label-icon" />
              Email Address
            </label>
            <div class="input-wrapper disabled">
              <input 
                id="email" 
                v-model="form.email" 
                type="email" 
                class="form-input disabled"
                placeholder="Email cannot be changed"
                disabled
                aria-disabled="true"
              />
              <div class="disabled-overlay">
                <span class="disabled-text">Email cannot be modified</span>
              </div>
            </div>
          </div>

          <div class="form-group">
            <label for="phone" class="form-label">
              <PhoneIcon class="label-icon" />
              Phone Number
            </label>
            <div class="input-wrapper disabled">
              <input 
                id="phone" 
                v-model="form.phone" 
                type="tel" 
                class="form-input disabled"
                placeholder="Phone number cannot be changed"
                disabled
              />
              <div class="disabled-overlay">
                <span class="disabled-text">Contact support to update phone</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Address Section -->
      <div class="form-section">
        <div class="section-header">
          <MapPinIcon class="section-icon" />
          <h4 class="section-title">Address Information</h4>
        </div>
        
        <div class="address-grid">
          <div class="form-group span-full">
            <label for="street" class="form-label">Street Address</label>
            <input 
              id="street" 
              v-model="form.address.street" 
              type="text" 
              class="form-input"
              placeholder="House/Unit number, Street name"
              :disabled="isSubmitting"
            />
          </div>

          <div class="form-group">
            <label for="barangay" class="form-label">Barangay</label>
            <input 
              id="barangay" 
              v-model="form.address.barangay" 
              type="text" 
              class="form-input"
              placeholder="Enter barangay"
              :disabled="isSubmitting"
            />
          </div>

          <div class="form-group">
            <label for="city" class="form-label">City</label>
            <input 
              id="city" 
              v-model="form.address.city" 
              type="text" 
              class="form-input"
              placeholder="Enter city"
              :disabled="isSubmitting"
            />
          </div>

          <div class="form-group">
            <label for="province" class="form-label">Province</label>
            <input 
              id="province" 
              v-model="form.address.province" 
              type="text" 
              class="form-input"
              placeholder="Enter province"
              :disabled="isSubmitting"
            />
          </div>

          <div class="form-group">
            <label for="zipCode" class="form-label">ZIP Code</label>
            <input 
              id="zipCode" 
              v-model="form.address.zipCode" 
              type="text" 
              class="form-input"
              placeholder="Enter ZIP code"
              :disabled="isSubmitting"
            />
          </div>
        </div>
      </div>

      <!-- Form Actions -->
      <div class="form-actions">
        <button 
          type="button" 
          class="button-secondary" 
          @click="handleFormClose"
          :disabled="isSubmitting"
        >
          Cancel
        </button>
        <button 
          type="submit" 
          class="button-primary" 
          :disabled="isSubmitting"
        >
          <CheckCircleIcon v-if="!isSubmitting" class="button-icon" />
          <div v-else class="loading-spinner"></div>
          {{ isSubmitting ? 'Saving Changes...' : 'Save Changes' }}
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.edit-form-container {
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  animation: slideUp 0.3s ease-out;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
}

/* Form Header */
.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  background: linear-gradient(135deg, #10b981 0%, #8b5cf6 100%);
  color: white;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-icon {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.header-icon .icon {
  width: 24px;
  height: 24px;
}

.header-text {
  flex: 1;
}

.form-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 4px 0;
  line-height: 1.2;
}

.form-subtitle {
  font-size: 14px;
  margin: 0;
  opacity: 0.9;
  font-weight: 400;
}

.close-button {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 8px;
  padding: 8px;
  cursor: pointer;
  color: white;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-button:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.05);
}

.close-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.close-icon {
  width: 20px;
  height: 20px;
}

/* Form Content */
.user-edit-form {
  padding: 24px;
}

/* Form Sections */
.form-section {
  margin-bottom: 32px;
}

.form-section:last-child {
  margin-bottom: 0;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid #f1f5f9;
}

.section-icon {
  width: 20px;
  height: 20px;
  color: #10b981;
  flex-shrink: 0;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

/* Form Grids */
.form-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
}

.address-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.span-full {
  grid-column: 1 / -1;
}

/* Form Groups */
.form-group {
  display: flex;
  flex-direction: column;
}

.form-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
}

.label-icon {
  width: 16px;
  height: 16px;
  color: #6b7280;
}

/* Input Styling */
.input-wrapper {
  position: relative;
}

.form-input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 16px;
  font-family: inherit;
  transition: all 0.2s ease;
  background: white;
}

.form-input:focus {
  outline: none;
  border-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
}

.form-input::placeholder {
  color: #9ca3af;
  font-weight: 400;
}

/* Disabled Input Styling */
.input-wrapper.disabled {
  position: relative;
}

.form-input.disabled {
  background: #f9fafb;
  border-color: #e5e7eb;
  color: #6b7280;
  cursor: not-allowed;
}

.disabled-overlay {
  position: absolute;
  top: 0;
  right: 0;
  height: 100%;
  display: flex;
  align-items: center;
  padding-right: 16px;
  pointer-events: none;
}

.disabled-text {
  font-size: 12px;
  color: #9ca3af;
  font-weight: 500;
  background: #f9fafb;
  padding: 4px 8px;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

/* Form Actions */
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid #f1f5f9;
}

.button-primary,
.button-secondary {
  padding: 12px 24px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: inherit;
  min-width: 140px;
  justify-content: center;
}

.button-primary {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
}

.button-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
}

.button-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.button-secondary {
  background: #6b7280;
  color: white;
}

.button-secondary:hover:not(:disabled) {
  background: #4b5563;
  transform: translateY(-2px);
}

.button-secondary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.button-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* Animations */
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Responsive Design */
@media (max-width: 768px) {
  .edit-form-container {
    border-radius: 0;
    box-shadow: none;
  }

  .form-header {
    padding: 20px;
  }

  .header-content {
    gap: 12px;
  }

  .form-title {
    font-size: 18px;
  }

  .form-subtitle {
    font-size: 13px;
  }

  .user-edit-form {
    padding: 20px;
  }

  .form-section {
    margin-bottom: 24px;
  }

  .section-header {
    margin-bottom: 16px;
  }

  .section-title {
    font-size: 16px;
  }

  .form-grid,
  .address-grid {
    gap: 16px;
  }

  .address-grid {
    grid-template-columns: 1fr;
  }

  .form-actions {
    flex-direction: column-reverse;
    margin-top: 24px;
    padding-top: 20px;
  }

  .button-primary,
  .button-secondary {
    width: 100%;
    min-width: unset;
  }
}

@media (max-width: 480px) {
  .form-header {
    padding: 16px;
  }

  .header-icon {
    padding: 8px;
  }

  .header-icon .icon {
    width: 20px;
    height: 20px;
  }

  .user-edit-form {
    padding: 16px;
  }

  .form-input {
    padding: 10px 14px;
    font-size: 15px;
  }

  .form-actions {
    gap: 8px;
  }
}

/* Focus and Accessibility */
.form-input:focus-visible,
.button-primary:focus-visible,
.button-secondary:focus-visible,
.close-button:focus-visible {
  outline: 2px solid #10b981;
  outline-offset: 2px;
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .form-input {
    border-width: 2px;
  }
  
  .disabled-text {
    border-width: 2px;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .edit-form-container {
    animation: none;
  }
  
  .loading-spinner {
    animation: none;
  }
  
  .button-primary,
  .button-secondary,
  .close-button {
    transition: none;
  }
}
</style>
