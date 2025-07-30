<script setup lang="ts">
import { reactive, ref, onMounted, defineProps } from 'vue'
import axios from 'axios'
import ImageCropper from './ImageCropper.vue'
import { ProductOption } from '../../types/product'
import { dataUrlToFile } from '../../utils/convertToFile'
import { useVendorDashboardStore } from '../../stores/vendor/dashboardStores'
// import Alert from '../composable/Alert'

const vendorDashboard = useVendorDashboardStore()

interface OptionFormData {
  imageUrl: string
  price: number
  label: string | null
  stock: number
  croppedBlob?: Blob | null
}

interface CropPayload {
  blob: Blob
  url: string
  width: number
  height: number
  format: string
}

const props = defineProps<{ option: ProductOption, productId: string }>()


// console.log("product id: " + props.productId + "variant: " + props.option._id)
const emit = defineEmits<{
  (e: 'submit'): void
  (e: 'cancel'): void
}>()


const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''
const UPLOAD_ENDPOINT = `${API_BASE_URL}/upload`

const form = reactive<OptionFormData>({
  imageUrl: '',
  price: 0,
  label: '',
  stock: 0,
  croppedBlob: null
})

const showCropper = ref(false)
const cropImageSrc = ref<string>('')

const isUploading = ref(false)
const submitting = ref(false)
const uploadError = ref<string>('')

// ---------------- Lifecycle ----------------
onMounted(() => {
  form.imageUrl = props.option.imageUrl || ''
  form.price = props.option.price
  form.label = props.option.label || null
  form.stock = props.option.stock
})


// ---------------- File & Crop Handling ----------------
function handleFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (event) => {
    const dataUrl = event.target?.result as string

    form.imageUrl = dataUrl
  }
  reader.readAsDataURL(file)
    ; (e.target as HTMLInputElement).value = ''
}

function reCrop() {
  if (!form.imageUrl) return
  cropImageSrc.value = form.imageUrl
  showCropper.value = true
}

function applyCroppedImage(payload: CropPayload) {
  form.croppedBlob = payload.blob
  const reader = new FileReader()
  reader.onload = () => {
    form.imageUrl = reader.result as string
  }
  reader.readAsDataURL(payload.blob)
  closeCropper()
}

function closeCropper() {
  showCropper.value = false
  cropImageSrc.value = ''
}

function clearImage() {
  form.imageUrl = ''
  form.croppedBlob = null
}


async function handleSubmit() {
  if (submitting.value || isUploading.value) return
  if (form.price <= 0) {
    alert('Please enter a valid price > 0')
    return
  }
  submitting.value = true
  uploadError.value = ''

  const payload: Partial<ProductOption> = {
    imageUrl: form.imageUrl,
    price: form.price,
    label: form.label?.trim() || null,
    stock: form.stock,
  }

  await vendorDashboard.updateOptionedProduct(props?.productId, props.option._id, payload)

  submitting.value = false
  emit("submit")
}

function handleImageError(e: Event) {
  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=No+Image'
}
</script>

<template>
  <div class="option-edit-form">
    <h5>Edit Option</h5>
    <form @submit.prevent="handleSubmit">
      <div class="form-group">
        <label for="edit-label">Option Label</label>
        <input id="edit-label" v-model="form.label" type="text" placeholder="e.g., Large Size, Blue Color"
          class="form-input" />
      </div>

      <div class="form-group">
        <label for="edit-price">Price *</label>
        <input id="edit-price" v-model.number="form.price" type="number" step="0.01" min="0" required placeholder="0.00"
          class="form-input" />
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="edit-stock">Stock</label>
          <input id="edit-stock" v-model.number="form.stock" type="number" min="0" placeholder="0" class="form-input" />
        </div>
      </div>

      <input type="file" accept="image/*" @change="handleFileChange" :disabled="isUploading || submitting" />

      <div class="form-group">
        <label>Option Image</label>

        <div v-if="form.imageUrl" class="image-preview">
          <img :src="form.imageUrl" alt="Option Preview" @error="handleImageError" />
          <div class="image-buttons">
            <button type="button" class="btn btn-cancel btn-sm" @click="reCrop" :disabled="isUploading || submitting">
              Re-Crop
            </button>
            <button type="button" class="btn btn-sm danger" @click="clearImage" :disabled="isUploading || submitting">
              Remove
            </button>
          </div>
        </div>

        <small v-if="isUploading">Uploading image...</small>
        <small v-if="uploadError" style="color: #d33;">{{ uploadError }}</small>
      </div>

      <div class="form-actions">
        <button type="button" @click="$emit('cancel')" class="btn-update btn-cancel"
          :disabled="submitting || isUploading">
          Cancel
        </button>
        <button type="submit" class="btn-update btn-primary" :disabled="submitting || isUploading">
          <span v-if="!submitting && !isUploading">Update Option</span>
          <span v-else>Saving…</span>
        </button>
      </div>
    </form>

    <div v-if="showCropper" class="modal-backdrop edit-modal">
      <div class="modal">
        <div class="modal-header">
          <h3>Crop Image</h3>
          <button @click="closeCropper" class="close-btn">✖</button>
        </div>
        <div class="modal-body">
          <ImageCropper :image-src="cropImageSrc" @crop="applyCroppedImage" @cancel="closeCropper" />
        </div>
      </div>
    </div>
  </div>
</template>


<style scoped>
.option-edit-form {
  background: #fdfffe;
  border: 1px solid #e2f0e7;
  border-radius: 12px;
  padding: 1.5rem;
  width: 100%;
}

.option-edit-form h5 {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: #92400E;
}

.form-group {
  margin-bottom: 0.75rem;
}

.form-row {
  display: flex;
  gap: 0.75rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.25rem;
  font-weight: 500;
  color: #374151;
  font-size: 0.75rem;
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
  gap: 0.375rem;
  cursor: pointer;
  margin-bottom: 0;
}

.checkbox {
  width: 0.875rem;
  height: 0.875rem;
  accent-color: #F59E0B;
}

.checkbox-text {
  font-size: 0.75rem;
  color: #374151;
}

.form-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  margin-top: 1rem;
  padding-top: 0.75rem;
  border-top: 1px solid #E5E7EB;
}


.btn-update {
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
  background: #D97706;
}

.btn-cancel {
  background: #9c9ea1;
  color: #fff;
}

.btn-cancel:hover {
  background: #4B5563;
}

.btn-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.65rem;
}

.btn-sm.danger {
  background: var(--secondary-color);
  color: white;
}

.btn-sm.danger:hover {
  background: #dd7c0d;

}

.image-preview {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin-bottom: .5rem;
}

.image-preview img {
  width: 130px;
  aspect-ratio: 4/3;
  object-fit: cover;
  border: 1px solid #ddd;
  border-radius: 6px;
  margin-bottom: .5rem;
}

.image-buttons {
  display: flex;
  gap: .5rem;
}

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


@media (max-width: 768px) {
  .form-actions button {
    width: 50%;
  }
}
</style>
