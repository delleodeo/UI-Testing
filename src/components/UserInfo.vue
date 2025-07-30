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
  <div class="user-card">
    <button class="edit-info" @click="handleInformationButton">
      <PencilSquareIcon v-if="isEdit" class="edit-icon"></PencilSquareIcon>
      <XMarkIcon v-else class="close-icon"></XMarkIcon>
    </button>
    <h3 class="card-title">{{ !isEdit ? "Edit Personal Information" : "Personal Information" }}</h3>

    <UserInfoEdit v-if="!isEdit" @handleCloseAfterSave="closeAfterSave"></UserInfoEdit>
    <div class="content" v-if="isEdit">
      <div class="email-card">
        <h3>Name</h3>
        <div>
          <p class="user-email">{{ user?.name || "No Name" }}</p>
        </div>
        <h3>Email</h3>
        <div>
          <p class="user-email">{{ user?.email || 'N/A'}}</p>
        </div>
      </div>
      <div class="info-section">
        <div class="info-item">
          <h3>Phone Number</h3>
          <div>
            <p class="value">{{ user?.phone || 'N/A' }}</p>
          </div>
        </div>
      </div>
      <div class="address-section">
        <h3>Address</h3>
        <div>
          <p>{{ user?.address?.street || 'N/A'}}</p>
          <p>{{ user?.address?.barangay || 'N/A'}}</p>
          <p>{{ user?.address?.city || 'N/A'}}, {{ user?.address?.province || 'N/A'}}</p>
          <p v-if="user?.address?.zipCode">Zip: {{ user?.address.zipCode || 'N/A'}}</p>
        </div>
      </div>
    </div>
  </div>
</template>


<style scoped>
h3 {
  font-size: 1rem;
  font-weight: 500;
  color: #1a1a1a;
}

.card-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1a1a1a;
}


.user-card {
  animation: fadeIn .3s ease-out;
  width: 100%;
  padding: 1.5rem;
  margin: 1rem auto;
  border-radius: 12px;
  background-color: #ffffff;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  color: #333;
  transition: all 0.3s ease-in-out;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  position: relative;
}

.content {
  animation: fadeIn .3s ease-out;
}

.edit-info {
  height: 1.4rem;
  aspect-ratio: 1;
  position: absolute;
  top: 16px;
  right: 16px;
  border: 0;
  background-color: transparent;
}

.edit-icon,
.close-icon {
  height: 1.4rem;
  aspect-ratio: 1;
}

.close-icon {
  color: var(--secondary-color);
  height: 1.8rem;
  aspect-ratio: 1;
}

.user-email {
  color: #555;
  font-size: 0.95rem;
  margin-bottom: .5rem;
}

.info-section,
.address-section {
  margin-top: .5rem;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 0.4rem 0;

}

.address-section div,
.info-item div,
.email-card div {
  width: 100%;
}



p {
  padding: 8px 0;
  color: #383737;
  margin: 0.2rem 0;
  font-size: 0.95rem;

  width: 100%;
  border-bottom: 1px solid #e0e0e0;
}

.address-section div p:last-child {
  border: 0;
}


/* Responsive */
@media (max-width: 480px) {

  .user-card {

    margin: 0;
  }

  .info-item {
    flex-direction: column;
    align-items: flex-start;
  }

}
</style>
