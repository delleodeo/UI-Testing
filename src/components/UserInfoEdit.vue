<script setup lang="ts">
import { defineEmits } from 'vue'
import { useUserStore } from '../stores/userStores'
import { Alert } from './composable/Alert'
const userStore = useUserStore()

const form = userStore.userData

const emits = defineEmits(['handleCloseAfterSave'])

const handleFormClose = () => {
  emits('handleCloseAfterSave')
}

const handleSubmit = async () => {
  console.table(form)
  handleFormClose();
  try {
    await userStore.updateUser(form)
    Alert("User profile updated successfully!", "success", "var(--primary-color)")
  } catch (error) {
    console.error("Update failed:", error)
    Alert("Failed to update user profile.", "error", "var(--secondary-color)")
  }
}

</script>
<template>
  <form class="user-edit-form" @submit.prevent="handleSubmit">

    <div class="form-group">
      <label for="name">Name</label>
      <input id="name" v-model="form.name" type="text" required />
    </div>

    <div class="form-group">
      <label for="email">Email</label>
      <input id="email" v-model="form.email" type="email" required disabled aria-disabled="true"/>
    </div>

    <div class="form-group">
      <label for="phone">Phone</label>
      <input id="phone" v-model="form.phone" type="tel" disabled/>
    </div>

    <fieldset class="address-group">
      <legend>Address</legend>

      <div class="form-group">
        <label for="street">Street</label>
        <input id="street" v-model="form.address.street" type="text" />
      </div>

      <div class="form-group">
        <label for="barangay">Barangay</label>
        <input id="barangay" v-model="form.address.barangay" type="text" />
      </div>

      <div class="form-group">
        <label for="city">City</label>
        <input id="city" v-model="form.address.city" type="text" />
      </div>

      <div class="form-group">
        <label for="province">Province</label>
        <input id="province" v-model="form.address.province" type="text" />
      </div>

      <div class="form-group">
        <label for="zipCode">Zip Code</label>
        <input id="zipCode" v-model="form.address.zipCode" type="text" />
      </div>
    </fieldset>


    <button type="submit" class="submit-btn">Save Changes</button>

  </form>
</template>

<style scoped>
.user-edit-form {
  width: 100%;
  background: transparent;
  border-radius: 12px;
  animation: fadeIn .3s ease-out;
}


.form-group {
  display: flex;
  flex-direction: column;
  margin-bottom: 1rem;
}

.btn-container {
  display: flex;
  gap: 10px;
}

label {
  font-size: 1rem;
  font-weight: 500;
  color: #1a1a1a;
}

input {
  padding: 0.6rem;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 1rem;
  transition: border 0.2s ease;
}

input:focus {
  border: 2px solid var(--primary-color);
  outline: none;
}

.address-group {
  border: 1px dashed #1a1a1a;
  padding: 1rem;
  margin-top: 1rem;
  border-radius: 8px;
}

.address-group legend {
  font-weight: bold;
  color: #1a1a1a;
  padding: 0 0.5rem;
}

.submit-btn {
  margin-top: 1rem;
  background: var(--primary-color);
  color: white;
  padding: 0.8rem 1.2rem;
  border: none;
  font-size: 1rem;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.3s ease;
}

.submit-btn:hover {
  background: #176c3c;
}

/* Responsive */
@media (max-width: 480px) {

  input {
    font-size: 0.95rem;
  }
}
</style>
