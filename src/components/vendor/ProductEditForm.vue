<script setup lang="ts">
import { reactive, ref, onMounted } from "vue";
import axios from "axios";
import CropperModal from "./ImageCropper.vue";
import { useVendorDashboardStore } from "../../stores/vendor/dashboardStores";
import { dataUrlToFile } from "../../utils/convertToFile";

const vendorDashboardStore = useVendorDashboardStore();

interface CropPayload {
  blob: Blob;
  url: string;
  width: number;
  height: number;
  format: string;
}

interface Product {
  _id: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  imageUrls: string[];
  isNew: boolean;
  isHot: boolean;
  municipality: string;
}

interface ProductFormData {
  name: string;
  description: string;
  price: number;
  stock: number;
  imageUrls: string[];
  municipality: string;
}

const props = defineProps<{ product: Product }>();
const emit = defineEmits<{
  submit: [product: Partial<Product>];
  cancel: [];
  successfullUpdate: [];
}>();

const form = reactive<ProductFormData>({
  name: "",
  description: "",
  price: 0,
  stock: 0,
  imageUrls: [],
  municipality: "",
});

const originalImageUrls = ref<string[]>([]);
const isUpdating = ref(false);
const uploadProgress = ref(0);
const cropperVisible = ref(false);
const cropImageSrc = ref("");
let currentCropIndex: number | null = null;

onMounted(() => {
  Object.assign(form, {
    name: props.product.name,
    description: props.product.description || "",
    price: props.product.price,
    stock: props.product.stock,
    imageUrls: [...props.product.imageUrls],
    municipality: props.product.municipality,
  });
  originalImageUrls.value = [...props.product.imageUrls];
});

const isExisting = (url: string): boolean =>
  originalImageUrls.value.includes(url) || /^https?:\/\//i.test(url);

function onImageChange(event: Event) {
  const files = (event.target as HTMLInputElement).files;
  if (!files) return;

  Array.from(files).forEach((file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) form.imageUrls.push(result);
    };
    reader.readAsDataURL(file);
  });

  (event.target as HTMLInputElement).value = "";
}

function openCropper(index: number) {
  currentCropIndex = index;
  cropImageSrc.value = form.imageUrls[index];
  cropperVisible.value = true;
}

function applyCrop(payload: CropPayload) {
  const reader = new FileReader();
  reader.onload = () => {
    if (currentCropIndex !== null) {
      form.imageUrls[currentCropIndex] = reader.result as string;
    }
    cropperVisible.value = false;
    currentCropIndex = null;
  };
  reader.readAsDataURL(payload.blob);
}

function removeImage(index: number) {
  form.imageUrls.splice(index, 1);
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const endpoint = `${API_BASE_URL}/upload`;

async function uploadNewImagesIfAny(): Promise<string[]> {
  const newImages = form.imageUrls.filter(
    (url) => !isExisting(url) && (url.startsWith("data:") || url.startsWith("blob:"))
  );

  if (newImages.length === 0) {
    uploadProgress.value = 100;
    return form.imageUrls;
  }

  const formData = new FormData();
  let index = 0;

  for (const src of newImages) {
    if (src.startsWith("data:")) {
      formData.append("images", dataUrlToFile(src, index++));
    } else {
      const blob = await fetch(src).then((res) => res.blob());
      const ext = blob.type.split("/")[1] || "jpg";
      formData.append(
        "images",
        new File([blob], `upload-${Date.now()}-${index++}.${ext}`, { type: blob.type })
      );
    }
  }

  uploadProgress.value = 0;
  try {
    const response = await axios.post(endpoint, formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (evt) => {
        if (evt.total) {
          uploadProgress.value = Math.round((evt.loaded / evt.total) * 100);
        }
      },
    });

    const uploadedUrls = response.data.images?.map((i: any) => i.url) || response.data.urls || [];
    return [...form.imageUrls.filter(isExisting), ...uploadedUrls];
  } catch (error: any) {
    console.error("Upload failed:", error);
    throw new Error(error.response?.data?.message || "Upload failed");
  }
}

async function handleSubmit() {
  if (isUpdating.value) return;
  if (!form.name.trim()) return alert("Product name required");
  if (!form.municipality.trim()) return alert("Municipality required");
  if (form.price <= 0) return alert("Price must be > 0");

  try {
    isUpdating.value = true;
    uploadProgress.value = 0;

    const finalImageUrls = await uploadNewImagesIfAny();
    const payload: Partial<Product> = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: form.price,
      stock: form.stock,
      imageUrls: finalImageUrls,
      municipality: form.municipality.trim(),
    };

    emit("submit", payload);
    await vendorDashboardStore.updateBaseProduct(props.product._id, payload);

    emit("successfullUpdate");
    uploadProgress.value = 100;
  } catch (err: any) {
    console.error(err);
    alert(err.message || "Failed to update product");
  } finally {
    isUpdating.value = false;
  }
}
</script>

<template>
  <div class="product-edit-card">
    <h3>Edit Product</h3>
    <form @submit.prevent="handleSubmit" class="form-container">
      <!-- Name -->
      <div class="form-group">
        <label for="name">Product Name *</label>
        <input id="name" v-model="form.name" type="text" required class="form-input" />
      </div>

      <!-- Description -->
      <div class="form-group">
        <label for="description">Description</label>
        <textarea id="description" v-model="form.description" rows="3" class="form-textarea"></textarea>
      </div>

      <!-- Municipality -->
      <div class="form-group">
        <label for="municipality">Municipality *</label>
        <input id="municipality" v-model="form.municipality" type="text" required class="form-input" />
      </div>

      <!-- Images -->
      <div class="form-group">
        <label>Product Images</label>
        <input type="file" accept="image/*" multiple @change="onImageChange" class="form-input" />
        <div class="image-preview-grid">
          <div v-for="(img, idx) in form.imageUrls" :key="idx" class="image-preview-item">
            <img :src="img" alt="Preview" class="preview-img" />
            <div class="image-buttons">
              <button type="button" class="btn btn-sm btn-secondary" @click="openCropper(idx)">Re-Crop</button>
              <button type="button" class="btn btn-sm btn-danger" @click="removeImage(idx)">Remove</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="form-actions">
        <button type="button" @click="$emit('cancel')" class="btn btn-secondary" :disabled="isUpdating">Cancel</button>
        <button type="submit" class="btn btn-primary" :disabled="isUpdating">
          <span v-if="!isUpdating">Update Product</span>
          <span v-else>Updating… {{ uploadProgress > 0 ? uploadProgress + '%' : '' }}</span>
        </button>
      </div>
    </form>

    <!-- Crop Modal -->
    <div v-if="cropperVisible" class="modal-backdrop">
      <div class="modal">
        <div class="modal-header">
          <h3>Crop Image</h3>
          <button @click="cropperVisible = false" class="close-btn">✖</button>
        </div>
        <div class="modal-body">
          <CropperModal :imageSrc="cropImageSrc" @crop="applyCrop" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.product-edit-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.05);
}

h3 {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  color: #0C4A6E;
  text-align: center;
}

.form-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group label {
  font-weight: 500;
  margin-bottom: 0.5rem;
  display: block;
  color: #374151;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  font-size: 0.95rem;
  transition: 0.2s;
}

.form-input:focus,
.form-textarea:focus {
  border-color: var(--primary-color);
  outline: none;
}

.image-preview-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 0.5rem;
}

.image-preview-item {
  position: relative;
}

.preview-img {
  width: 130px;
  height: 100px;
  object-fit: cover;
  border: 1px solid #ddd;
  border-radius: 8px;
}

.image-buttons {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.3rem;
  justify-content: center;
}

.btn {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: 0.2s;
}

.btn-primary {
  background: var(--primary-color);
  color: white;
}

.btn-secondary {
  background: #6b7280;
  color: white;
}

.btn-danger {
  background: #ef4444;
  color: white;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
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
  box-shadow: 0 10px 32px -4px rgba(0, 0, 0, 0.25);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.close-btn {
  background: transparent;
  border: none;
  font-size: 1rem;
  cursor: pointer;
}
</style>
