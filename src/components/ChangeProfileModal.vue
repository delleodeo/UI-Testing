<script setup lang="ts">
import ImageCropper from './ImageCropper.vue';
import { XMarkIcon } from '@heroicons/vue/24/outline';
import { defineEmits } from 'vue';

const emits = defineEmits(['closeModal']);

const hanldeClose = () =>    {
  emits('closeModal');
}

</script>
<template>
  <div class="modal-overlay" @click.self="hanldeClose">
    <div class="modal-container">
      <div class="modal-header">
        <h3 class="modal-title">Change Profile Picture</h3>
        <button @click="hanldeClose" class="close-btn">
          <XMarkIcon class="close-icon" />
        </button>
      </div>
      <div class="modal-content">
        <ImageCropper />
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 10000;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(12px);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem;
  animation: fadeIn 0.3s ease-out;
}

.modal-container {
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow: hidden;
  animation: slideUp 0.3s ease-out;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.close-btn {
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

.close-btn:hover {
  background: #f3f4f6;
  border-color: #10b981;
}

.close-icon {
  width: 20px;
  height: 20px;
  color: #6b7280;
}

.close-btn:hover .close-icon {
  color: #10b981;
}

.modal-content {
  padding: 1.5rem;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

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

/* Responsive */
@media (max-width: 768px) {
  .modal-overlay {
    padding: 0.5rem;
  }
  
  .modal-container {
    max-height: 95vh;
  }
  
  .modal-header {
    padding: 1rem;
  }
  
  .modal-content {
    padding: 1rem;
  }
  
  .modal-title {
    font-size: 1.125rem;
  }
}
</style>