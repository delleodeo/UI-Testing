<template>
  <div v-if="false" class="modal-overlay" @click.self="closeModal">
    <div class="modal-content">
      <h2 class="modal-title">Apply as a Vendor</h2>

      <form @submit.prevent="handleSubmit">
        <!-- Store Info -->
        <div class="form-section">
          <label>Store Name *</label>
          <input v-model="form.storeName" required />

          <label>Description</label>
          <textarea v-model="form.description" rows="2"></textarea>
        </div>

        <!-- Document Upload -->
        <div class="form-section">
          <h3>Upload Required Documents</h3>
          <ul class="requirements">
            <li>✅ Valid Government-issued ID</li>
            <li>✅ Business Permit / DTI Certificate</li>
            <li>✅ FDA Certificate (if selling food or medicine)</li>
          </ul>

          <div
            class="file-dropzone"
            @click="triggerFileInput"
            @dragover.prevent
            @drop.prevent="handleDrop"
          >
            <span class="upload-icon">📁</span>
            <p>Click or drag image files here to upload</p>
            <small>Accepted: JPG, PNG • Max size: 5MB each</small>
            <input
              type="file"
              multiple
              accept="image/png,image/jpeg"
              ref="fileInput"
              @change="handleFileUpload"
            />
          </div>

          <!-- Previews -->
          <div class="file-previews" v-if="previews.length">
            <div
              v-for="(item, i) in previews"
              :key="item.url"
              class="file-preview"
            >
              <img :src="item.url" :alt="item.name" />
              <button class="remove-btn" type="button" @click.stop="removeFile(i)">×</button>
            </div>
          </div>
        </div>

        <!-- Submit -->
        <div class="form-actions">
          <button type="submit" :disabled="isUploading">
            {{ isUploading ? 'Uploading...' : 'Submit Application' }}
          </button>
          <button type="button" class="secondary" @click="closeModal">Cancel</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch, onBeforeUnmount } from 'vue'
import axios from 'axios'

const emits = defineEmits(['close', 'create'])

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

const fileInput = ref(null)
const isUploading = ref(false)

const form = reactive({
  storeName: '',
  description: '',
  documents: []
})

const previews = ref([])

function triggerFileInput() {
  fileInput.value?.click()
}

function handleDrop(e) {
  const dropped = Array.from(e.dataTransfer.files)
  processFiles(dropped)
}

function handleFileUpload(e) {
  const files = Array.from(e.target.files)
  processFiles(files)
  e.target.value = ''
}

function processFiles(files) {
  for (const file of files) {
    if (!file.type.startsWith('image/')) continue
    if (file.size > 5 * 1024 * 1024) {
      alert(`${file.name} is too large (max 5MB).`)
      continue
    }
    if (form.documents.find(f => f.name === file.name)) continue

    const url = URL.createObjectURL(file)
    previews.value.push({ url, name: file.name })
    form.documents.push(file)
  }
}

function removeFile(index) {
  URL.revokeObjectURL(previews.value[index].url)
  previews.value.splice(index, 1)
  form.documents.splice(index, 1)
}

async function uploadToCloudinary(file) {
  const formData = new FormData()
  formData.append('images', file)

  try {

    const res = await axios.post(`${API_BASE_URL}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return res.data.images
  } catch (err) {
    throw new Error(`Failed to upload ${file.name}`)
  }
}

async function handleSubmit() {
  if (!form.storeName.trim()) {
    alert('Store name is required.')
    return
  }
  if (!form.documents.length) {
    alert('At least one document is required.')
    return
  }

  try {
    isUploading.value = true

    const uploadedUrls = await Promise.all(
      form.documents.map(uploadToCloudinary)
    )

    console.log(uploadedUrls)
   uploadedUrls.flatMap(item => {
    console.log(item[0].url)
   })

    // const vendorData = {
    //   storeName: form.storeName,
    //   description: form.description,
    //   documents: uploadedUrls
    // }

    // emits('create', vendorData)
    closeModal()
  } catch (error) {
    alert(error.message || 'Upload failed.')
  } finally {
    isUploading.value = false
  }
}

function cleanupPreviews() {
  previews.value.forEach(p => URL.revokeObjectURL(p.url))
  previews.value = []
}

function closeModal() {
  cleanupPreviews()
  form.storeName = ''
  form.description = ''
  form.documents = []
  emits('close')
}

onBeforeUnmount(() => cleanupPreviews())
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000000;
}

.modal-content {
  background: #fff;
  padding: 2rem;
  width: 95%;
  max-width: 650px;
  border-radius: 10px;
  animation: fadeIn 0.3s ease;
  overflow-y: auto;
  max-height: 95vh;
}

.modal-title {
  margin-top: 0;
  margin-bottom: 1rem;
  font-size: 1.6rem;
  font-weight: bold;
  color: #333;
}

.form-section {
  margin-bottom: 1.5rem;
  display: flex;
  flex-direction: column;
}

label {
  font-weight: 600;
  margin-bottom: 0.3rem;
}

input,
textarea {
  padding: 0.6rem;
  border: 1px solid #ccc;
  border-radius: 6px;
  margin-bottom: 0.5rem;
  font-size: 1rem;
  width: 100%;
}

textarea {
  resize: vertical;
}

.upload-icon {
  font-size: 2rem;
  margin-bottom: 0.3rem;
}

.file-dropzone {
  border: 2px dashed #aaa;
  padding: 2rem;
  border-radius: 10px;
  background-color: #f9f9f9;
  text-align: center;
  cursor: pointer;
  transition: background-color 0.2s ease;
  margin-bottom: 1rem;
  position: relative;
}

.file-dropzone:hover {
  background-color: #eef5ff;
  border-color: #2c7be5;
}

.file-dropzone input[type='file'] {
  display: none;
}

.requirements {
  font-size: 0.9rem;
  margin-bottom: 0.8rem;
  color: #444;
  padding-left: 1rem;
}
.requirements li {
  list-style: none;
}

.file-previews {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin: 1rem 0;
}

.file-preview {
  width: 90px;
  height: 90px;
  border: 1px solid #ddd;
  border-radius: 6px;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #fafafa;
  position: relative;
}

.file-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-btn {
  position: absolute;
  top: -6px;
  right: -6px;
  background: #d33;
  color: white;
  border: none;
  border-radius: 50%;
  width: 22px;
  height: 22px;
  font-size: 16px;
  cursor: pointer;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

button {
  padding: 0.5rem 1.2rem;
  border: none;
  background-color: #2c7be5;
  color: white;
  font-weight: 600;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
}

button.secondary {
  background-color: #6c757d;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
