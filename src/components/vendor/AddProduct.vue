<script setup lang="ts">
import { reactive, ref } from 'vue'
import ImageCropper from './ImageCropper.vue'
import { useVendorDashboardStore } from '../../stores/vendor/dashboardStores'
import { Alert } from '../composable/Alert'
import { formToJSON } from 'axios'

/* ------------------------------------------------------------------ */
/* Constants / Stores                                                 */
/* ------------------------------------------------------------------ */
const categories = [
  'Native Delicacies', 'Dried Fish & Seafood', 'Fruits & Produce', 'Local Snacks',
  'Herbal & Wellness Products', 'Coffee & Cacao', 'Honey Products', 'Handicrafts',
  'Woodcrafts', 'Woven Products', 'Souvenir Items', 'Condiments & Spices', 'Apparel & Accessories'
]

const dashboardStore = useVendorDashboardStore()
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

const isUploading = ref(false)
const isSubmitting = ref(false)

const showCropper = ref(false)
const showImagePreview = ref(false)

const currentImageSrc = ref('')
const currentImageType = ref<'main' | 'option'>('main')
const currentOptionIndex = ref(0)

/** images waiting to be cropped/uploaded (data URLs) */
const pendingImages = ref<string[]>([])

/** index in pendingImages currently being cropped */
const pendingIndex = ref<number>(-1)

// Replace the compression settings
const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB max after compression (increased from 50MB)
const COMPRESSION_QUALITY = 0.8 // 80% quality
const MAX_DIMENSION = 2560 // Max width/height (increased for better quality with large images)

/* ------------------------------------------------------------------ */
/* Form State                                                         */
/* ------------------------------------------------------------------ */
const form = reactive({
  name: '',
  description: '',
  price: 0,
  stock: 0,
  imageUrls: [] as string[],
  municipality: '',
  categories: [] as string[],
  isOption: false,
  option: [] as {
    label: string
    price: number
    stock: number
    imageUrl: string | any,
    isHot?: boolean
  }[]
})

/* ------------------------------------------------------------------ */
/* Image Compression Function                                         */
/* ------------------------------------------------------------------ */
function compressImage(file: File, maxSizeKB = 1024, quality = COMPRESSION_QUALITY): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    const img = new Image()
    
    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img
      const maxDim = MAX_DIMENSION
      
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height / width) * maxDim)
          width = maxDim
        } else {
          width = Math.round((width / height) * maxDim)
          height = maxDim
        }
      }
      
      canvas.width = width
      canvas.height = height
      
      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height)
      
      // Try different quality levels to get under size limit
      const tryCompress = (currentQuality: number) => {
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Failed to compress image'))
            return
          }
          
          // If size is still too large and quality can be reduced further
          if (blob.size > maxSizeKB * 1024 && currentQuality > 0.2) {
            console.log(`Compression at quality ${currentQuality} resulted in ${(blob.size/1024/1024).toFixed(2)}MB, trying lower quality`)
            // Try a lower quality
            tryCompress(Math.max(0.2, currentQuality - 0.1))
          } else {
            console.log(`Final compression: ${(blob.size/1024/1024).toFixed(2)}MB at quality ${currentQuality}`)
            resolve(blob)
          }
        }, file.type || 'image/jpeg', currentQuality)
      }
      
      tryCompress(quality)
    }
    
    img.onerror = () => {
      reject(new Error('Failed to load image'))
    }
    
    img.src = URL.createObjectURL(file)
  })
}

/* ------------------------------------------------------------------ */
/* File Size Validation                                               */
/* ------------------------------------------------------------------ */
function validateFileSize(file: File): boolean {
  const maxSize = 100 * 1024 * 1024 // 100MB original file limit
  if (file.size > maxSize) {
    Alert(`File "${file.name}" is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum allowed: 100MB`, 'warning', 'var(--secondary-color)', 3000)
    return false
  }
  return true
}

/* ------------------------------------------------------------------ */
/* Category Toggle (mutate instead of reassign reactive array)        */
/* ------------------------------------------------------------------ */
function toggleCategory(cat: string) {
  const idx = form.categories.indexOf(cat)
  if (idx > -1) {
    form.categories.splice(idx, 1)
  } else if (form.categories.length < 3) {
    form.categories.push(cat)
  }
}

/* ------------------------------------------------------------------ */
/* Options                                                            */
/* ------------------------------------------------------------------ */
function addOption() {
  form.option.push({ label: '', price: 0, stock: 0, imageUrl: '', isHot: false })
}
function removeOption(index: number) {
  form.option.splice(index, 1)
}
function removeImage(index: number) {
  form.imageUrls.splice(index, 1)
}

/* ------------------------------------------------------------------ */
/* File Selection with Enhanced Large File Handling                  */
/* ------------------------------------------------------------------ */
async function handleFileSelect(files: FileList | null, type: 'main' | 'option', optionIndex?: number) {
  if (!files || files.length === 0) return

  currentImageType.value = type
  if (optionIndex !== undefined) currentOptionIndex.value = optionIndex

  // Enhanced file validation for large files
  const validFiles = Array.from(files).filter(file => {
    // Check file type first
    if (!file.type.startsWith('image/')) {
      Alert(`"${file.name}" is not a valid image file.`, 'warning', 'var(--secondary-color)', 3000)
      return false
    }
    
    // Check file size (increased limit)
    const maxSize = 100 * 1024 * 1024 // 100MB original file limit
    if (file.size > maxSize) {
      Alert(`File "${file.name}" is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum allowed: 100MB`, 'warning', 'var(--secondary-color)', 3000)
      return false
    }
    
    // Log file info for debugging
    console.log(`Processing file: ${file.name}, Size: ${(file.size / 1024 / 1024).toFixed(2)}MB, Type: ${file.type}`)
    return true
  })

  if (validFiles.length === 0) {
    Alert('No valid images selected. Please try again.', 'warning', 'var(--secondary-color', 2000)
    return
  }

  try {
    isUploading.value = true
    Alert(`Processing ${validFiles.length} image(s)...`, 'info', 'var(--primary-color)', 2000)
    
    const imagePromises = validFiles.map(async (file, index) => {
      try {
        Alert(`Compressing image ${index + 1}/${validFiles.length}...`, 'info', 'var(--primary-color)', 1000)
        
        // Use more aggressive compression for very large files
        const targetSizeKB = file.size > 10 * 1024 * 1024 ? 512 : 1024 // 512KB for files > 10MB
        const compressedBlob = await compressImage(file, targetSizeKB)
        
        console.log(`Compressed ${file.name}: ${(file.size / 1024 / 1024).toFixed(2)}MB → ${(compressedBlob.size / 1024 / 1024).toFixed(2)}MB`)

        // Convert compressed blob to data URL with error handling
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = e => resolve(e.target?.result as string)
          reader.onerror = () => reject(new Error(`Failed to read compressed file: ${file.name}`))
          reader.readAsDataURL(compressedBlob)
        })
      } catch (error) {
        console.error('Error compressing image:', error)
        Alert(`Failed to compress "${file.name}". Using original file.`, 'warning', 'var(--secondary-color)', 2000)
        // Fallback to original file if compression fails
        return fileToDataUrl(file)
      }
    })
    
    const images = await Promise.all(imagePromises)
    pendingImages.value = images
    showImagePreview.value = true
    pendingIndex.value = -1
    
    Alert(`Successfully processed ${images.length} image(s)!`, 'success', 'var(--primary-color)', 1500)
  } catch (error) {
    console.error('Error processing images:', error)
    Alert('Error processing images. Please try again with smaller files.', 'error', 'var(--secondary-color)', 3000)
  } finally {
    isUploading.value = false
  }
}

async function handleMainImageUpload(e: Event) {
  const files = (e.target as HTMLInputElement).files
  await handleFileSelect(files, 'main')
}

async function handleOptionImageUpload(e: Event, index: number) {
  const files = (e.target as HTMLInputElement).files
  await handleFileSelect(files, 'option', index)
}

/* ------------------------------------------------------------------ */
/* Choose Image → Crop                                                */
/* ------------------------------------------------------------------ */
function selectImageToCrop(imageSrc: string) {
  const idx = pendingImages.value.indexOf(imageSrc)
  pendingIndex.value = idx
  currentImageSrc.value = imageSrc
  showImagePreview.value = false
  showCropper.value = true
}

/* ------------------------------------------------------------------ */
/* Skip Cropping → Upload all raw                                     */
/* ------------------------------------------------------------------ */
async function skipCropping() {
  try {
    isUploading.value = true
    await uploadImagesDirectly()
  } catch (err) {
    console.error(err)
    Alert('Failed to upload images. Please try again.', 'error', 'var(--secondary-color)', 2000)
  } finally {
    isUploading.value = false
  }
}

/**
 * Upload all pending images without cropping.
 * - For main images: upload every pending.
 * - For option: upload only first (user selected just one file per option).
 */
async function uploadImagesDirectly() {
  try {
    const imagesToUpload =
      currentImageType.value === 'main'
        ? [...pendingImages.value]
        : [pendingImages.value[0]]

    for (const imageSrc of imagesToUpload) {
      const blob = dataUrlToBlob(imageSrc)
      
      // Double-check blob size before upload
      if (blob.size > MAX_FILE_SIZE) {
        console.warn('Image still too large after compression:', blob.size / 1024 / 1024, 'MB')
        // Try additional compression
        const img = new Image()
        
        const compressedBlob = await new Promise<Blob>((resolve, reject) => {
          img.onload = () => {
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')!
            
            // Reduce dimensions if needed
            let { width, height } = img
            const scaleFactor = Math.sqrt(MAX_FILE_SIZE / blob.size) * 0.9
            
            width = Math.floor(width * scaleFactor)
            height = Math.floor(height * scaleFactor)
            
            canvas.width = width
            canvas.height = height
            
            ctx.drawImage(img, 0, 0, width, height)
            canvas.toBlob(
              newBlob => {
                if (newBlob) resolve(newBlob)
                else reject(new Error('Failed to compress image'))
              },
              'image/jpeg',
              0.7 // Lower quality for final attempt
            )
          }
          
          img.onerror = () => reject(new Error('Failed to load image for final compression'))
          img.src = imageSrc
        })
        
        const url = await uploadBlob(compressedBlob, 'compressed-image.jpg')
        updateFormWithImage(url)
      } else {
        const url = await uploadBlob(blob, 'image.jpg')
        updateFormWithImage(url)
      }
    }
  } catch (error) {
    console.error('Failed to upload images:', error)
    Alert(`Upload failed: ${error.message || 'Unknown error'}. Try a smaller file or different format.`, 'error', 'var(--secondary-color)', 3000)
    throw error
  } finally {
    pendingImages.value = []
    showImagePreview.value = false
  }
}

function updateFormWithImage(url: string) {
  if (currentImageType.value === 'main') {
    form.imageUrls.push(url)
  } else {
    form.option[currentOptionIndex.value].imageUrl = url
  }
}

/* ------------------------------------------------------------------ */
/* Crop Result Type                                                   */
/* ------------------------------------------------------------------ */
type CropResult =
  | string
  | {
    blob: Blob
    url: string
    width: number
    height: number
    format?: string
  }

/* ------------------------------------------------------------------ */
/* Handle Crop Complete (child emits)                                 */
/* ------------------------------------------------------------------ */
async function handleCropComplete(cropped: CropResult) {
  let blob: Blob
  let tempUrl: string | null = null
  let filename = 'cropped-image.jpg'

  try {
    // Normalize incoming payload
    if (typeof cropped === 'string') {
      tempUrl = cropped
      const resp = await fetch(cropped)
      blob = await resp.blob()
      filename = inferFilenameFromType(blob.type) ?? filename
    } else {
      blob = cropped.blob
      tempUrl = cropped.url
      filename =
        inferFilenameFromType(cropped.blob.type) ??
        inferFilenameFromType(cropped.format) ??
        filename
    }

    // Additional compression for cropped images if they're too large
    if (blob.size > MAX_FILE_SIZE) {
      const compressedBlob = await compressImage(new File([blob], filename), 1024, 0.7)
      blob = compressedBlob
    }

    // Ensure correct filename for server
    if (!filename.endsWith('.jpg') && blob.type === 'image/jpeg') {
      filename = 'cropped-image.jpg'
    } else if (!filename.endsWith('.png') && blob.type === 'image/png') {
      filename = 'cropped-image.png'
    }

    // Upload to server
    const uploadedUrl = await uploadBlob(blob, filename)

    // Update form with uploaded image URL
    updateFormWithImage(uploadedUrl)

    // Remove processed image from pending queue
    if (pendingIndex.value > -1) {
      pendingImages.value.splice(pendingIndex.value, 1)
    } else {
      const rmIdx = pendingImages.value.indexOf(currentImageSrc.value)
      if (rmIdx > -1) pendingImages.value.splice(rmIdx, 1)
    }

    // Move to next image or close preview
    if (currentImageType.value === 'main' && pendingImages.value.length > 0) {
      showImagePreview.value = true
    } else {
      pendingImages.value = []
      showImagePreview.value = false
    }

    currentImageSrc.value = ''
    pendingIndex.value = -1
    showCropper.value = false
    
    Alert('Image uploaded successfully!', 'success', 'var(--primary-color)', 1500)
  } catch (error) {
    console.error('Failed to upload cropped image:', error)
    Alert('Failed to upload image. Please try again.', 'error', 'var(--secondary-color)', 2000)
  } finally {
    if (tempUrl?.startsWith('blob:')) URL.revokeObjectURL(tempUrl)
  }
}

/* ------------------------------------------------------------------ */
/* Cancel Cropping                                                    */
/* ------------------------------------------------------------------ */
function handleCropCancel() {
  showCropper.value = false
  currentImageSrc.value = ''
  pendingIndex.value = -1

  if (currentImageType.value === 'main' && pendingImages.value.length > 0) {
    showImagePreview.value = true
  } else {
    pendingImages.value = []
    showImagePreview.value = false
  }
}

function cancelImageSelection() {
  pendingImages.value = []
  showImagePreview.value = false
  currentImageSrc.value = ''
  pendingIndex.value = -1
}

async function uploadBlob(blob: Blob, filename: string): Promise<string> {
  const formData = new FormData()
  formData.append('images', blob, filename)

  try {
    const uploadResponse = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      body: formData,
      // Add timeout and proper headers
      signal: AbortSignal.timeout(30000), // 30 second timeout
    })

    if (!uploadResponse.ok) {
      const serverText = await uploadResponse.text().catch(() => '')
      throw new Error(
        `Upload failed (${uploadResponse.status} ${uploadResponse.statusText})${serverText ? `: ${serverText}` : ''}`
      )
    }

    const data = await uploadResponse.json()
    const uploadedUrl: string | undefined = data?.images?.[0]?.url ?? data?.url
    if (!uploadedUrl) throw new Error('Upload succeeded but response missing image URL.')
    return uploadedUrl
  } catch (error) {
    if (error.name === 'TimeoutError') {
      throw new Error('Upload timed out. Please check your connection and try again.')
    }
    throw error
  }
}

function inferFilenameFromType(mime?: string | null): string | null {
  if (!mime) return null;
  switch (mime.toLowerCase()) {
    case 'image/png': return 'cropped-image.png';
    case 'image/webp': return 'cropped-image.webp';
    case 'image/avif': return 'cropped-image.avif';
    case 'image/jpeg':
    case 'image/jpg': return 'cropped-image.jpg';
    default: return 'cropped-image.jpg';
  }
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise(resolve => {
    const reader = new FileReader()
    reader.onload = e => resolve(e.target?.result as string)
    reader.readAsDataURL(file)
  })
}

/** Faster + safer than fetch() on a data URL */
function dataUrlToBlob(dataUrl: string): Blob {
  // data:[mime];base64,...
  const [header, base64] = dataUrl.split(',')
  const mimeMatch = header.match(/data:(.*?);base64/)
  const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream'
  const binary = atob(base64)
  const len = binary.length
  const arr = new Uint8Array(len)
  for (let i = 0; i < len; i++) arr[i] = binary.charCodeAt(i)
  return new Blob([arr], { type: mime })
}

function capitalizeWords(str) {
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

async function submitProduct() {
  console.log(form, formToJSON)
  if (form.imageUrls.length <= 0 && form.option.length <= 0) {
    Alert('Please add atleast one image!', 'warning', 'var(--secondary-color)', 1500)
    return
  }

  form.municipality = capitalizeWords(form.municipality)

  isSubmitting.value = true

  const payload = {
    ...form,
    price: form.isOption ? form.option[0].price : form.price,
    stock: form.isOption ? 0 : form.stock,
    option: form.isOption ? form.option : []
  }

  try {
    await dashboardStore.uploadProducts(payload)
    Alert('Product successfully created!', 'success', 'var(--primary-color)', 1500)
    Object.assign(form, {
      name: '',
      description: '',
      price: 0,
      stock: 0,
      imageUrls: [],
      municipality: '',
      categories: [],
      isOption: false,
      option: []
    })
  } catch (error) {
    Alert('Product failed to create!', 'error', 'var(--secondary-color)', 1500)
    console.error(error)
  } finally {
    isSubmitting.value = false
  }
}
</script>


<template>

  <div class="prod">
    <div class="add-product-container">
      <div class="form-header">
        <h1 class="form-title">Add New Product</h1>
        <p class="form-subtitle">Create a new product listing for your marketplace</p>
      </div>

      <form @submit.prevent="submitProduct" class="product-form">
        <!-- Basic Information Section -->
        <div class="form-section">

          <div class="form-grid">
            <div class="form-field">
              <label class="field-label">Product Name</label>
              <input v-model="form.name" type="text" class="field-input" placeholder="Enter product name" required />
            </div>

            <div class="form-field">
              <label class="field-label">Municipality</label>
              <input v-model="form.municipality" type="text" class="field-input" placeholder="e.g. Naujan" />
            </div>
          </div>

          <div class="form-field">
            <label class="field-label">Description</label>
            <textarea v-model="form.description" class="field-textarea" placeholder="Describe your product in detail"
              rows="4"></textarea>
          </div>

          <div class="form-field">
            <div class="checkbox-container">
              <input type="checkbox" v-model="form.isOption" id="isOption" class="field-checkbox" />
              <label for="isOption" class="checkbox-label">
                This product has multiple variants/options
                <span class="checkbox-description">Enable this if your product comes in different sizes, colors, or
                  variations</span>
              </label>
            </div>
          </div>
        </div>

        <!-- Categories Section -->
        <div class="form-section">
          <h2 class="section-title">Categories</h2>
          <p class="section-description">Select up to 3 categories that best describe your product</p>

          <div class="category-grid">
            <button v-for="cat in categories" :key="cat" type="button" @click="toggleCategory(cat)"
              :class="['category-pill', { 'category-active': form.categories.includes(cat) }]"
              :disabled="!form.categories.includes(cat) && form.categories.length >= 3">
              {{ cat }}

            </button>
          </div>

          <div v-if="form.categories.length > 0" class="selected-categories">
            <p class="selected-label">Selected Categories ({{ form.categories.length }}/3):</p>
            <div class="selected-list">
              <span v-for="cat in form.categories" :key="cat" class="selected-tag">
                {{ cat }}
              </span>
            </div>
          </div>
        </div>

        <!-- Pricing & Inventory Section (for non-option products) -->
        <div class="form-section" v-if="!form.isOption">
          <h2 class="section-title">Pricing & Inventory</h2>

          <div class="form-grid">
            <div class="form-field">
              <label class="field-label">Price (₱)</label>
              <input v-model.number="form.price" type="number" min="0" step="0.01" class="field-input"
                placeholder="0.00" />
            </div>

            <div class="form-field">
              <label class="field-label">Stock Quantity</label>
              <input v-model.number="form.stock" type="number" min="0" class="field-input" placeholder="0" />
            </div>
          </div>
        </div>

        <!-- Image Upload Section (for non-option products) -->
        <div class="form-section" v-if="!form.isOption">
          <h2 class="section-title">Product Images</h2>
          <p class="section-description">Upload high-quality images of your product</p>

          <div class="upload-area">
            <input 
              type="file" 
              multiple 
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/bmp,image/tiff" 
              @change="handleMainImageUpload" 
              class="upload-input"
              id="main-images" 
            />
            <label for="main-images" class="upload-label">
              <div class="upload-icon">📸</div>
              <div class="upload-text">
                <p class="upload-primary">Click to upload images</p>
                <p class="upload-secondary">or drag and drop here</p>
              </div>
            </label>
          </div>

          <div v-if="form.imageUrls.length" class="image-grid">
            <div v-for="(img, index) in form.imageUrls" :key="index" class="image-item">
              <img :src="img" :alt="`Product image ${index + 1}`" class="preview-image" />
              <button type="button" @click="removeImage(index)" class="remove-image-btn">
                ✕
              </button>
            </div>
          </div>
        </div>

        <!-- Product Options Section -->
        <div class="form-section" v-if="form.isOption">
          <h2 class="section-title">Product Variants</h2>
          <p class="section-description">Add different options for your product (e.g., sizes, colors, flavors)</p>

          <div class="options-container">
            <div v-for="(opt, index) in form.option" :key="index" class="option-card">
              <div class="option-header">
                <h3 class="option-title">Variant {{ index + 1 }}</h3>
                <button type="button" @click="removeOption(index)" class="remove-option-btn">
                  ✕
                </button>
              </div>

              <div class="option-form">
                <div class="form-field">
                  <label class="field-label">Variant Name</label>
                  <input v-model="opt.label" type="text" class="field-input" placeholder="e.g. Large, Red, Spicy" />
                </div>

                <div class="form-grid">
                  <div class="form-field">
                    <label class="field-label">Price (₱)</label>
                    <input v-model.number="opt.price" type="number" min="0" step="0.01" class="field-input"
                      placeholder="0.00" />
                  </div>

                  <div class="form-field">
                    <label class="field-label">Stock</label>
                    <input v-model.number="opt.stock" type="number" min="1" class="field-input" placeholder="0" />
                  </div>
                </div>

                <div class="form-field">
                  <label class="field-label">Variant Image</label>
                  <div class="upload-area variant-upload">
                    <input 
                      type="file" 
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/bmp,image/tiff" 
                      @change="(e) => handleOptionImageUpload(e, index)"
                      class="upload-input" 
                      :id="`option-image-${index}`" 
                    />
                    <label :for="`option-image-${index}`" class="upload-label variant-label">
                      <div v-if="!opt.imageUrl" class="upload-content">
                        <div class="upload-icon">📷</div>
                        <span class="upload-text">Upload Image</span>
                      </div>
                      <div v-else class="image-preview">
                        <img :src="opt.imageUrl" :alt="`Variant ${index + 1}`" class="preview-image" />
                        <div class="image-overlay">Change Image</div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <button type="button" @click="addOption" class="add-option-btn">
              <span class="btn-icon">+</span>
              Add Another Variant
            </button>
          </div>
        </div>

        <!-- Submit Section -->
        <div class="submit-section">

          <button type="submit" class="submit-btn" :disabled="isSubmitting">
            <span v-if="!isSubmitting" class="btn-content">
              <span class="btn-icon">✓</span>
              Create Product
            </span>
            <span v-else class="btn-content">
              <span class="spinner"></span>
              Creating...
            </span>
          </button>
        </div>
      </form>
    </div>

  </div>
  <!-- Image Preview Modal -->
  <div v-if="showImagePreview" class="cropper">
    <div class="cropper-overlay" @click="cancelImageSelection"></div>
    <div class="cropper-modal-content image-preview-modal">
      <div class="cropper-header">
        <h3 class="cropper-title">Select Images to Crop</h3>
        <button @click="cancelImageSelection" class="close-btn">✕</button>
      </div>

      <div class="image-preview-content">
        <p class="preview-description">
          Choose which images you'd like to crop, or skip cropping to use them as-is.
        </p>

        <div class="preview-image-grid">
          <div v-for="(imageSrc, index) in pendingImages" :key="index" class="preview-image-item">
            <img :src="imageSrc" :alt="`Preview ${index + 1}`" class="preview-thumbnail" />
            <div class="preview-actions">
              <button @click="selectImageToCrop(imageSrc)" class="crop-image-btn">
                ✂️ Crop
              </button>
            </div>
          </div>
        </div>

        <div class="preview-modal-actions">
          <button @click="cancelImageSelection" class="cancel-btn">Cancel</button>
          <button @click="skipCropping" class="skip-crop-btn">
            <span v-if="!isUploading">
              Skip & Upload All
            </span>
            <span v-else class="btn-content">
              <span class="spinner"></span>
              Uploading...
            </span>
          </button>
        </div>
      </div>
    </div>
  </div>
  <!-- Image Cropper Modal -->
  <div v-if="showCropper" class="cropper">
    <div class="cropper-overlay" @click="handleCropCancel"></div>
    <div class="cropper-modal-content">
      <div class="cropper-header">
        <h3 class="cropper-title">Crop Image</h3>
        <button @click="handleCropCancel" class="close-btn">✕</button>
      </div>

      <ImageCropper :imageSrc="currentImageSrc" @crop="handleCropComplete" @cancel="handleCropCancel" />
    </div>
  </div>

</template>




<style scoped>
section {
  position: relative;
}

.add-product-container {
  max-width: 700px;
  margin: 0 auto;
  padding: 24px;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: var(--bg-primary);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  width: 100%;
}


.crop {
  width: 100dvw;
  height: 100dvh;
  background-color: rebeccapurple;
  z-index: 20000;
  position: fixed;
  top: 0;
  left: 0;
}

.prod {
  position: fixed;
  z-index: 1000;
  overflow: auto;
  width: 100dvw;
  height: 100dvh;
}

.form-header {
  text-align: center;
  margin-bottom: 40px;
  position: relative;
  animation: fadeIn .3s ease-out;
}



.form-title {
  font-size: 2.5rem;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0 0 8px 0;
  line-height: 1.2;
  letter-spacing: -0.02em;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.form-subtitle {
  font-size: 1.125rem;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.5;
  font-weight: 500;
}

.product-form {
  background: var(--surface);
  border-radius: 20px;
  padding: 40px;
  box-shadow: var(--shadow-xl);
  border: 1px solid var(--border-primary);
  width: 100%;
  animation: fadeIn .3s ease-out;
}



.form-section {
  margin-bottom: 48px;
  padding-bottom: 48px;
  border-bottom: 2px solid #f1f5f9;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.section-description {
  color: #64748b;
  margin: 0 0 24px 0;
  line-height: 1.5;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field-label {
  font-weight: 700;
  color: var(--text-primary);
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.field-input,
.field-textarea {
  padding: 16px;
  border: 2px solid var(--input-border);
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.2s ease;
  background: var(--input-bg);
  color: var(--text-primary);
  line-height: 1.5;
  animation: fadeIn .4s ease-out;
  width: 100%;
}

.field-input::placeholder,
.field-textarea::placeholder {
  color: var(--input-placeholder);
}

.field-input:focus,
.field-textarea:focus {
  outline: none;
  border-color: var(--input-border-focus);
  box-shadow: 0 0 0 3px var(--color-primary-light);
  transform: translateY(-1px);
}

.field-textarea {
  resize: vertical;
  min-height: 120px;
  font-family: inherit;
}

.checkbox-container {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 12px;
  border: 2px solid #e2e8f0;
  transition: all 0.2s ease;
  animation: fadeIn .4s ease-out;
}

.checkbox-container:hover {
  border-color: #cbd5e1;
  background: #f1f5f9;
}

.field-checkbox {
  width: 20px;
  height: 20px;
  margin: 0;
  cursor: pointer;
  accent-color: rgb(0, 185, 0);
}

.checkbox-label {
  flex: 1;
  font-weight: 500;
  color: var(--text-primary);
  cursor: pointer;
  margin: 0;
  line-height: 1.5;
}

.checkbox-description {
  display: block;
  font-weight: 400;
  color: var(--text-secondary);
  font-size: 0.875rem;
  margin-top: 4px;
}

.category-grid {
  display: flex;
  max-width: 100%;
  flex-wrap: wrap;
  gap: 8px;
}



.category-pill {
  position: relative;
  padding: 12px 20px;
  background: var(--surface);
  border: 2px solid var(--border-primary);
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
  color: var(--text-primary);
  text-align: left;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: clamp(12px, 2vw, 14px);
}

.category-pill:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(31, 139, 78, 0.15);
  border-color: var(--color-primary);
}

.category-pill:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.category-active {
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
  border-color: var(--color-primary);
  color: white;
  box-shadow: 0 4px 12px rgba(31, 139, 78, 0.3);
  font-weight: 600;
}


.selected-categories {
  margin-top: 24px;
  padding: 20px;
  background: var(--color-primary-light);
  border-radius: 12px;
  border: 2px solid var(--color-primary);
}

.selected-label {
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 12px 0;
}

.selected-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.selected-tag {
  padding: 6px 12px;
  background: var(--primary-color);
  color: #ffffff;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
}

.upload-area {
  position: relative;
  margin-bottom: 24px;
}

.upload-input {
  position: absolute;
  opacity: 0;
  width: 100%;
  height: 100%;
  cursor: pointer;
}

.upload-label {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  border: 3px dashed #cbd5e1;
  border-radius: 16px;
  background: #fafafa;
  cursor: pointer;
  transition: all 0.2s ease;
}

.upload-label:hover {
  border-color: #3b82f6;
  background: #eff6ff;
}

.upload-icon {
  font-size: 3rem;
  margin-bottom: 16px;
}

.upload-text {
  text-align: center;
}

.upload-primary {
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 4px 0;
  font-size: 1.125rem;
}

.upload-secondary {
  color: #6b7280;
  margin: 0;
  font-size: 0.875rem;
}

.variant-upload {
  margin-bottom: 0;
}

.variant-label {
  padding: 24px;
  min-height: 120px;
}

.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.image-preview {
  position: relative;
  width: 100%;

}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  opacity: 0;
  transition: opacity 0.2s ease;
  border-radius: 12px;
}

.image-preview:hover .image-overlay {
  opacity: 1;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 16px;
}

.image-item {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  width: 130px;
  aspect-ratio: 4/3;
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

.remove-image-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 28px;
  height: 28px;
  background: rgba(239, 68, 68, 0.9);
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: 700;
  transition: all 0.2s ease;
}

.remove-image-btn:hover {
  background: #dc2626;
  transform: scale(1.1);
}

.options-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.option-card {
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 16px;
  padding: 24px;
  transition: all 0.2s ease;
}

.option-card:hover {
  border-color: #cbd5e1;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.option-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.option-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.remove-option-btn {
  width: 32px;
  height: 32px;
  background:var(--secondary-color);
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  transition: all 0.2s ease;
}

.remove-option-btn:hover {
  background: #dc2626;
  transform: scale(1.1);
}

.option-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.add-option-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.close-fomr {
  position: absolute;
  top: 0;
  left: 0;
  height: 2rem;
}

.submit-btn {
  width: 100%;
  padding: 20px 32px;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-hover) 100%);
  color: white;
  font-weight: 700;
  font-size: 1.125rem;
  border: none;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 8px 15px -3px rgba(31, 139, 78, 0.4);
  position: relative;
  overflow: hidden;
  min-width: 200px;
}


.submit-btn:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: 0 12px 20px -3px rgba(59, 130, 246, 0.5);
}

.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.btn-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Cropper Modal Styles */
.cropper {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--modal-backdrop);
  backdrop-filter: blur(8px);
  width: 100vw !important;
}

.cropper-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.cropper-modal-content {
  position: relative;
  background: var(--surface);
  border-radius: 16px;
  padding: 24px;
  max-width: 90vw;
  max-height: 90vh;
  overflow: auto;
  box-shadow: var(--shadow-xl);
  border: 1px solid var(--border-primary);
}

.cropper-header {
  animation: fadeIn 0.2s ease-out;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-primary);
}

.cropper-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.close-btn {
  width: 32px;
  height: 32px;
  background: var(--bg-secondary);
  border: none;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  color: #6b7280;
  transition: all 0.2s;
}

.close-btn:hover {
  background: var(--surface-hover);
  color: var(--text-primary);
}

/* Image Preview Modal Styles */
.image-preview-modal {
  max-width: 800px;
  width: 90vw;
}

.image-preview-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.preview-description {
  animation: fadeIn 0.2s ease-out;
  color: var(--text-secondary);
  text-align: center;
  margin: 0;
  font-size: 1rem;
  line-height: 1.5;
}

.preview-image-grid {
  animation: fadeIn 0.3s ease-out;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  max-height: 400px;
  overflow-y: auto;
  padding: 16px;
  border: 2px solid var(--border-primary);
  border-radius: 12px;
  background: var(--bg-secondary);
}

.preview-image-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.preview-image-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.preview-thumbnail {
  width: 100%;
  max-width: 250px;
  aspect-ratio: 4/3;
  object-fit: cover;
  border-radius: 8px;
  border: 2px solid #e5e7eb;
}

.preview-actions {
  width: 100%;
}

.crop-image-btn {
  width: 100%;
  padding: 10px 16px;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.875rem;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.crop-image-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.preview-modal-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
}

.skip-crop-btn {
  padding: 12px 24px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

.skip-crop-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.cancel-btn {
  padding: 12px 24px;
  background: #f9fafb;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  transition: all 0.2s ease;
}

.cancel-btn:hover {
  background: #f3f4f6;
  border-color: #9ca3af;
}

/* Responsive Design */
@media (max-width: 768px) {
  .add-product-container {
    padding: 16px;
  }

  .product-form {
    padding: 24px;
  }

  .form-title {
    font-size: 2rem;
  }

  .form-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .category-grid {
    grid-template-columns: 1fr;
  }

  .image-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  }

  .option-header {

    align-items: flex-start;
    gap: 12px;
  }

  .submit-btn {
    font-size: 1rem;
    padding: 18px 24px;
  }

  .cropper-modal-content {
    margin: 16px;
    padding: 16px;
  }

  .preview-image-grid {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 12px;
  }

}

@media (max-width: 480px) {
  .form-header {
    margin-bottom: 24px;
  }

  .form-title {
    font-size: 1.75rem;
  }

  .form-subtitle {
    font-size: 1rem;
  }

  .form-section {
    margin-bottom: 32px;
    padding-bottom: 32px;
  }

  .category-pill {
    padding: 10px 16px;
  }

  .upload-label {
    padding: 32px 16px;
  }

  .upload-icon {
    font-size: 2rem;
  }
}
</style>