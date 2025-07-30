<script setup lang="ts">
import { reactive, ref, defineProps } from 'vue'
import axios from 'axios'
import CropperModal from './ImageCropper.vue'
import { useVendorDashboardStore } from '../../stores/vendor/dashboardStores'


const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
const endpoint = `${API_BASE_URL}/upload`
const vendorDashboardStore = useVendorDashboardStore()

const props = defineProps({
  productId: String
})

interface OptionFormData {
  imageUrl: string
  price: number
  label: string
  stock: number
}

const emit = defineEmits<{
  submit: [option: OptionFormData]
  cancel: []
}>()

const form = reactive<OptionFormData>({
  imageUrl: '',
  price: 0,
  label: '',
  stock: 0,
})

const cropperVisible = ref(false)
const isUploading = ref(false)
const uploadProgress = ref(0)

function onImageChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = ev => (form.imageUrl = ev.target?.result as string)
  reader.readAsDataURL(file)
    ; (e.target as HTMLInputElement).value = ''
}

function removeImage() {
  form.imageUrl = ''
}

function openCropper() {
  cropperVisible.value = true
}

function applyCrop(payload: { blob: Blob; url: string }) {
  const reader = new FileReader()
  reader.onload = () => {
    form.imageUrl = reader.result as string
    cropperVisible.value = false
  }
  reader.readAsDataURL(payload.blob)
}


// async function uploadImageToCloudinary(): Promise<any> {
//   if (!form.imageUrl.startsWith('data:')) return form.imageUrl
//   const file = dataUrlToFile(form.imageUrl, `option-${Date.now()}.png`)
//   const formData = new FormData()
//   formData.append('images', file)
//   try {
//     isUploading.value = true
//     const response = await axios.post(endpoint, formData, {
//       headers: { 'Content-Type': 'multipart/form-data' }
//     })
//     return response.data
//   } catch (err: any) {
//     console.error('Upload failed:', err)
//     throw new Error(err.message || 'Upload failed')
//   } finally {
//     isUploading.value = false
//   }
// }

console.log()

async function handleSubmit() {
  if (form.price <= 0) return alert('Please enter a valid price greater than 0')
  try {
     isUploading.value = true
    await vendorDashboardStore.addOption(props.productId || '', form)
    Object.assign(form, { imageUrl: '', price: 0, label: '', stock: 0 })
  } catch (e: any) {
    alert(e.message || 'Failed to add option')
  }finally{
      isUploading.value = false
  }
}
</script>



<template>
  <div class="option-form">
    <h4>Add New Option</h4>
    <form @submit.prevent="handleSubmit">
      <!-- Option Label -->
      <div class="form-group">
        <label for="label">Option Label</label>
        <input id="label" v-model="form.label" type="text" placeholder="e.g., Large Size, Blue Color"
          class="form-input" />
      </div>

      <!-- Price -->
      <div class="form-group">
        <label for="price">Price *</label>
        <input id="price" v-model.number="form.price" type="number" step="0.01" min="0" required placeholder="0.00"
          class="form-input" />
      </div>

      <!-- Stock and Sold -->
   
        <div class="form-group">
          <label for="stock">Stock</label>
          <input id="stock" v-model.number="form.stock" type="number" min="0" placeholder="0" class="form-input" />
        </div>
        <!-- <div class="form-group">
          <label for="sold">Sold</label>
          <input id="sold" v-model.number="form.sold" type="number" min="0" placeholder="0" class="form-input" />
        </div> -->


      <!-- Image Upload + Preview -->
      <div class="form-group">
        <label>Option Image</label>
        <input type="file" accept="image/*" @change="onImageChange" class="form-input" />
        <div v-if="form.imageUrl" class="image-preview">
          <img :src="form.imageUrl" alt="Preview" class="preview-img" />
          <div class="image-actions">
            <button type="button" class="crop-btn" @click="openCropper">Crop</button>
            <button type="button" class="remove-btn" @click="removeImage">Delete</button>
          </div>
        </div>
      </div>

      <div class="form-actions">
        <button type="button" @click="$emit('cancel')" class="btn btn-cancel">Cancel</button>
        <button type="submit" class="btn btn-primary" :disabled="isUploading">
          <span v-if="!isUploading">Add Option</span>
          <span v-else>Uploading...</span>
        </button>
      </div>
    </form>
  </div>

  <!-- Crop Modal -->
  <div v-if="cropperVisible" class="modal-backdrop edit-modal">
    <div class="modal">
      <div class="modal-header">
        <h3>Crop Image</h3>
        <button @click="cropperVisible = false" class="close-btn">✖</button>
      </div>
      <div class="modal-body">
        <CropperModal :imageSrc="form.imageUrl" @crop="applyCrop" @cancel="cropperVisible = false" />
      </div>
    </div>
  </div>
</template>


<style scoped>
.modal-backdrop.edit-modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, .45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 60;
}

.modal {
  background: #fff;
  border-radius: 12px;
  width: 100%;
  max-width: 640px;
  padding: 1rem 1.25rem 1.5rem;
  box-shadow: 0 10px 32px -4px rgba(0, 0, 0, .25);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: .75rem;
}

.close-btn {
  background: transparent;
  border: none;
  font-size: 1rem;
  cursor: pointer;
}

.modal-body {
  max-height: 70vh;
  overflow: auto;
}

.option-form {
  background: #fdfffd;
  border: 1px solid #e2f0e7;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.option-form h4 {
  margin: 0 0 1.5rem 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #1E293B;
}

.form-group {
  margin-bottom: 1rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #374151;
  font-size: 0.875rem;
}

.form-input {
  padding: 16px;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.2s ease;
  background: #ffffff;
  color: #1f2937;
  line-height: 1.5;
  animation: fadeIn .4s ease-out;
  width: 100%;
}

.form-input:focus {
  outline: none;
  border-color: green;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  transform: translateY(-1px);
}

.form-input:invalid {
  border-color: #EF4444;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  margin-bottom: 0;
}


.form-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid #E5E7EB;
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn-primary {
  background: var(--primary-color);
  color: #fff;
}

.btn-primary:hover {
  background: green;
}

.btn-cancel {
  background: #9c9ea1;
  color: #fff;
}

.btn-cancel:hover {
  background: #4B5563;
}

.image-preview {
  position: relative;
  margin-top: 10px;
  width: 150px;
}

.preview-img {
  width: 100%;
  height: 100px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid #ddd;
}

.image-actions {
  display: flex;
  gap: 5px;
  margin-top: 5px;
}

.crop-btn,
.remove-btn {
  padding: 3px 8px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  color: #fff;
}

.crop-btn {
  background: #0ea5e9;
}

.crop-btn:hover {
  background: #0284c7;
}

.remove-btn {
  background: #ef4444;
}

.remove-btn:hover {
  background: #b91c1c;
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }

  .form-actions button {
    width: 50%;
  }
}
</style>