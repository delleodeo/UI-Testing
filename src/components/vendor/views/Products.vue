<script setup lang="ts">
import {
	ShoppingCartIcon,
	CubeIcon,
	StarIcon,
	EyeIcon,
	PencilSquareIcon,
	TrashIcon,
	XMarkIcon,
	PlusIcon,
} from "@heroicons/vue/24/outline";
import AddProduct from "../AddProduct.vue";
import { useVendorDashboardStore } from "../../../stores/vendor/dashboardStores";
import { computed, reactive, ref } from "vue";
import { formatToPHCurrency } from "../../../utils/currencyFormat";
import ImageCropper from "../ImageCropper.vue";
import { confirmAndDeleteVariant } from "../../composable/Alert";
import VendorProductCard from "../VendorProductCard.vue";
import VendorProductView from "../VendorProductView.vue";

const vendorDashboard = useVendorDashboardStore();
const products = computed(() => vendorDashboard.vendorProducts);

// setTimeout(() => {
//   console.table(products.value[0].imageUrls)
// }, 100)
const isAddProducts = ref(false);
const showModal = ref(false);
const selectedProduct = ref<any>(null);
const showCropper = ref(false);
const cropTargetIndex = ref<number | null>(null);
const cropImageSrc = ref("");

const fixedCategories = [
	"Native Delicacies",
	"Dried Fish & Seafood",
	"Fruits & Produce",
	"Local Snacks",
	"Herbal & Wellness Products",
	"Coffee & Cacao",
	"Honey Products",
	"Handicrafts",
	"Woodcrafts",
	"Woven Products",
	"Souvenir Items",
	"Condiments & Spices",
	"Apparel & Accessories",
];

const isLoading = ref(false);
const isSaving = ref(false);

const form = reactive({
	name: "",
	description: "",
	stock: 0,
	price: 0,
	categories: [] as string[],
	images: [] as string[],
	label: "",
});

const openEdit = (item: any) => {
	selectedProduct.value = item;
	form.name = item.name;
	form.description = item.description;
	form.stock = item.stock;
	form.price = item.price;
	form.categories = Array.isArray(item.categories) ? [...item.categories] : [];
	form.images = Array.isArray(item.imgurl) ? [...item.imgurl] : [item.imgurl];
	form.label = item.label || "";
	showModal.value = true;
};

const closeModal = () => {
	showModal.value = false;
	selectedProduct.value = null;
	resetForm();
};

const isAddingProducts = () => {
	isAddProducts.value = !isAddProducts.value;
};

const resetForm = () => {
	form.name = "";
	form.description = "";
	form.stock = 0;
	form.price = 0;
	form.categories = [];
	form.images = [];
	form.label = "";
};

const handleImageError = (event: Event) => {
	const target = event.target as HTMLImageElement;
	target.src =
		"https://images.pexels.com/photos/1638276/pexels-photo-1638276.jpeg?auto=compress&cs=tinysrgb&w=500";
};

const viewProducts = (productId: string) => {
	window.location.assign(`/product/${productId}`);
};

const deleteProduct = async (productId: string, variantId: string) => {
	const isWantToDelete = await confirmAndDeleteVariant();
	if (isWantToDelete.isConfirmed) {
		try {
			await vendorDashboard.deleteProduct(productId, variantId);
		} catch (error) {
			alert(error);
		}
	}
};

const handleFileUpload = async (e: Event) => {
	const input = e.target as HTMLInputElement;
	const files = input.files;
	if (!files || files.length === 0) return;
	isLoading.value = true;
	const isOption = selectedProduct.value.productId !== selectedProduct.value.variantId;

	const formData = new FormData();
	Array.from(files).forEach((file) => {
		formData.append("images", file);
	});

	const endpoint = "http://192.168.1.9:3001/v1/upload";

	try {
		const response = await fetch(endpoint, {
			method: "POST",
			body: formData,
		});

		if (!response.ok) {
			throw new Error(`Upload failed with status ${response.status}`);
		}

		const data = await response.json();

		if (Array.isArray(data.images)) {
			if (isOption) {
				form.images = [data.images[0].url];
				console.log("Option image uploaded:", data.images[0].url);
			} else {
				data.images.forEach((img) => form.images.push(img.url));
			}
		} else {
			throw new Error("Unexpected response format from server");
		}

		isLoading.value = false;
	} catch (error) {
		console.error("Image upload failed:", error);
		alert("Image upload failed. Please try again.");
		isLoading.value = false;
	}

	input.value = ""; // clear input
};

const removeImage = (index: number) => {
	form.images.splice(index, 1);
};

const toggleCategory = (category: string) => {
	const index = form.categories.indexOf(category);

	if (index !== -1) {
		form.categories.splice(index, 1);
	} else {
		if (form.categories.length >= 4) return;
		form.categories.push(category);
	}
};

const openCropper = (index: number) => {
	cropImageSrc.value = form.images[index];
	cropTargetIndex.value = index;
	showCropper.value = true;
};

const applyCroppedImage = (croppedImage: string) => {
	if (cropTargetIndex.value !== null) {
		form.images[cropTargetIndex.value] = croppedImage;
	}
	closeCropper();
};

const closeCropper = () => {
	showCropper.value = false;
	cropTargetIndex.value = null;
	cropImageSrc.value = "";
};

// const saveProduct = async () => {
//   if (!selectedProduct.value) return
//   isSaving.value = true
//   const productId = selectedProduct.value.productId

//   if (selectedProduct.value.productId === selectedProduct.value.variantId) {
//     const updatedNotOptionedProduct = {
//       name: form.name,
//       description: form.description,
//       stock: form.stock,
//       price: form.price,
//       categories: form.categories,
//       imageUrls: form.images,
//     }
//     // await vendorDashboard.updateNotOptionedProduct(productId, updatedNotOptionedProduct)

//   } else if (selectedProduct.value.productId !== selectedProduct.value.variantId) {
//     const updatedOptionedProduct = {
//       label: form.label || "N/A",
//       stock: form.stock,
//       price: form.price,
//       imageUrl: form.images[0]
//     }

//     const updatedNotOptionedProduct = {
//       name: form.name,
//       description: form.description,
//       categories: form.categories,
//     }

//     await vendorDashboard.updateOptionedProduct(productId, selectedProduct.value.variantId, updatedOptionedProduct);
//     await vendorDashboard.updateNotOptionedProduct(productId, updatedNotOptionedProduct)
//   }

//   isSaving.value = false

//   closeModal()
// }

// const products = ref([
//   {
//     _id: '1',
//     vendorId: 'vendor1',
//     name: 'Premium Coffee Beans',
//     description: 'High-quality arabica coffee beans from local farms',
//     price: 25.99,
//     stock: 50,
//     sold: 125,
//     option: [
//       {
//         _id: 'opt1',
//         imageUrl: 'https://images.pexels.com/photos/1695052/pexels-photo-1695052.jpeg?auto=compress&cs=tinysrgb&w=300',
//         price: 25.99,
//         label: '250g Bag',
//         isHot: true,
//         stock: 30,
//         sold: 85
//       },
//       {
//         _id: 'opt2',
//         price: 45.99,
//         label: '500g Bag',
//         isHot: false,
//         stock: 20,
//         sold: 40
//       }
//     ],
//     categories: ['beverages', 'coffee'],
//     isOption: false,
//     imageUrls: ['https://images.pexels.com/photos/1695052/pexels-photo-1695052.jpeg?auto=compress&cs=tinysrgb&w=400'],
//     isNew: true,
//     isHot: true,
//     isApproved: true,
//     reviews: [],
//     averageRating: 4.5,
//     numReviews: 89,
//     createdAt: new Date('2024-01-15'),
//     municipality: 'San Francisco'
//   },
//   {
//     _id: '2',
//     vendorId: 'vendor1',
//     name: 'Organic Honey',
//     description: 'Pure organic honey from local beekeepers',
//     price: 18.50,
//     stock: 30,
//     sold: 67,
//     option: [],
//     categories: ['food', 'organic'],
//     isOption: false,
//     imageUrls: ['https://images.pexels.com/photos/1638731/pexels-photo-1638731.jpeg?auto=compress&cs=tinysrgb&w=400'],
//     isNew: false,
//     isHot: false,
//     isApproved: true,
//     reviews: [],
//     averageRating: 4.8,
//     numReviews: 42,
//     createdAt: new Date('2024-02-01'),
//     municipality: 'San Francisco'
//   },
//   {
//     _id: '3',
//     vendorId: 'vendor1',
//     name: 'Handcrafted Soap Set',
//     description: 'Natural handmade soaps with essential oils',
//     price: 32.00,
//     stock: 25,
//     sold: 34,
//     option: [
//       {
//         _id: 'opt3',
//         price: 12.00,
//         label: 'Lavender',
//         isHot: false,
//         stock: 15,
//         sold: 20
//       },
//       {
//         _id: 'opt4',
//         price: 12.00,
//         label: 'Tea Tree',
//         isHot: true,
//         stock: 10,
//         sold: 14
//       }
//     ],
//     categories: ['beauty', 'handmade'],
//     isOption: false,
//     imageUrls: ['https://images.pexels.com/photos/4465831/pexels-photo-4465831.jpeg?auto=compress&cs=tinysrgb&w=400'],
//     isNew: true,
//     isHot: false,
//     isApproved: true,
//     reviews: [],
//     averageRating: 4.2,
//     numReviews: 18,
//     createdAt: new Date('2024-01-28'),
//     municipality: 'San Francisco'
//   }
// ])

const openModal = (product) => {
	selectedProduct.value = product;
};
const addOption = (productId, newOption) => {
	const product = products.value.find((p) => p._id === productId);
	if (product) {
		const option = {
			...newOption,
			_id: Date.now().toString(),
		};
		product.option.push(option);

		// Update selected product if it's the same
		if (selectedProduct.value && selectedProduct.value._id === productId) {
			selectedProduct.value = { ...product };
		}
	}
};
</script>

<template>
	<section>
		<div class="container">
			<!-- Header Section -->
			<div class="page-header">
				<div class="header-content">
					<h1 class="page-title">
						<CubeIcon class="title-icon" />
						My Products
					</h1>
					<p class="page-subtitle">Manage your product catalog and inventory</p>
				</div>
				<div class="header-stats">
					<div class="stat-card">
						<span class="stat-label">Total Products</span>
						<span class="stat-value">{{ products.length }}</span>
					</div>
					<div class="stat-card">
						<span class="stat-label">In Stock</span>
						<span class="stat-value">{{ products.filter(p => p.stock > 0).length }}</span>
					</div>
				</div>
			</div>

			<!-- Products Grid -->
			<div class="products-grid">
				<VendorProductCard v-for="product in products" :key="product?._id" :product="product"
					@view-product="openModal" />
			</div>
			
			<!-- Empty State -->
			<div v-if="products.length === 0" class="empty-state">
				<CubeIcon class="empty-icon" />
				<h3>No products yet</h3>
				<p>Start building your catalog by adding your first product</p>
				<button class="btn-primary" @click="isAddingProducts">
					<PlusIcon class="icon-sm" />
					Add Your First Product
				</button>
			</div>

			<div class="space"></div>

			<!-- Floating Add Button -->
			<button class="add-product-btn" @click="isAddingProducts" aria-label="Add new product">
				<div class="btn-inner">
					<PlusIcon class="add-icon"></PlusIcon>
				</div>
			</button>
		</div>
		<VendorProductView v-if="selectedProduct" :product="selectedProduct" @close="closeModal" @add-option="addOption" />
	</section>
	<div v-if="showCropper" class="modal-backdrop edit-modal">
		<div class="modal">
			<div class="modal-header">
				<h3>Crop Image</h3>
				<button @click="closeCropper" class="close-btn">
					<XMarkIcon class="w-5 h-5" />
				</button>
			</div>
			<div class="modal-body">
				<ImageCropper :image-src="cropImageSrc" @cancel="closeCropper" />
			</div>
		</div>
	</div>
	<Transition name="fade-scale">
		<div v-if="isAddProducts" class="add-product-form">
			<AddProduct></AddProduct>
			<button class="close-form" @click="isAddingProducts">
				<XMarkIcon></XMarkIcon>
			</button>
		</div>
	</Transition>
</template>

<style scoped>
/* ============================================
   MAIN SECTION & ANIMATIONS
   ============================================ */
section {
	display: flex;
	height: 100dvh;
	max-height: 100dvh;
	flex-direction: column;
	width: 100%;
	position: relative;
	background: var(--bg-primary);
	animation: fadeIn 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes fadeIn {
	from {
		opacity: 0;
		transform: translateY(16px);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}

section .container {
	max-height: 100dvh;
	overflow: auto;
	padding: clamp(1.5rem, 3vw, 2.5rem);
	scroll-behavior: smooth;
}

/* ============================================
   PAGE HEADER
   ============================================ */
.page-header {
	margin-bottom: 2rem;
	animation: slideDown 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes slideDown {
	from {
		opacity: 0;
		transform: translateY(-20px);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}

.header-content {
	margin-bottom: 1.5rem;
}

.page-title {
	display: flex;
	align-items: center;
	gap: 0.75rem;
	font-size: clamp(1.75rem, 4vw, 2.25rem);
	font-weight: 800;
	color: var(--text-primary);
	margin: 0 0 0.5rem 0;
	letter-spacing: -0.02em;
}

.title-icon {
	height: 2rem;
	width: 2rem;
	color: var(--color-primary);
	stroke-width: 2.5;
}

.page-subtitle {
	color: var(--text-secondary);
	font-size: 0.95rem;
	margin: 0;
	font-weight: 500;
}

.header-stats {
	display: flex;
	gap: 1rem;
	flex-wrap: wrap;
}

.stat-card {
	display: flex;
	flex-direction: column;
	gap: 0.25rem;
	padding: 1rem 1.5rem;
	background: var(--surface);
	border: 1px solid var(--border-primary);
	border-radius: var(--radius-lg);
	box-shadow: var(--shadow-sm);
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	min-width: 140px;
}

.stat-card:hover {
	transform: translateY(-2px);
	box-shadow: var(--shadow-md);
	border-color: var(--color-primary);
}

.stat-label {
	font-size: 0.75rem;
	font-weight: 600;
	text-transform: uppercase;
	letter-spacing: 0.05em;
	color: var(--text-secondary);
	opacity: 0.9;
}

.stat-value {
	font-size: 1.75rem;
	font-weight: 800;
	color: var(--color-primary);
	line-height: 1;
}

.fade-scale-enter-active,
.fade-scale-leave-active {
	transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-scale-enter-from,
.fade-scale-leave-to {
	opacity: 0;
	transform: scale(0.9);
}

.fade-scale-enter-to,
.fade-scale-leave-from {
	opacity: 1;
	transform: scale(1);
}

.space {
	width: 100%;
	height: 10rem;
}

.add-product-form {
	position: fixed;
	height: 100dvh;
	width: 100dvw;
	display: flex;
	align-items: center;
	justify-content: center;
	top: 0;
	background-color: var(--modal-overlay);
	backdrop-filter: blur(8px);
	z-index: 10000;
	max-width: 1200px;
	left: 50%;
	transform: translate(-50%);
}

.close-form {
	cursor: pointer;
	height: 2rem;
	aspect-ratio: 1;
	position: absolute;
	right: 8px;
	top: 10px;
	padding: 7px;
	background-color: var(--secondary-color);
	border-radius: 50rem;
	border: 0;
	color: white;
	z-index: 30000;
	transition: all 150ms;
}

.close-form:hover {
	opacity: 0.8;
}

.add-product-container {
	position: fixed;
	width: 100dvw;
	max-height: 100dvh;
	height: 100dvh;
	background-color: var(--modal-overlay);
	overflow: auto;
	left: 0;
	top: 0;
	display: flex;
	align-items: center;
	backdrop-filter: blur(8px);
	z-index: 10000;
}

/* ============================================
   FLOATING ADD BUTTON
   ============================================ */
.add-product-btn {
	position: fixed;
	height: 3.75rem;
	width: 3.75rem;
	right: clamp(1.5rem, 4vw, 2.5rem);
	bottom: clamp(2rem, 8vh, 6rem);
	padding: 0;
	border-radius: 50%;
	border: none;
	background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-hover) 100%);
	color: white;
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 8px 24px rgba(31, 139, 78, 0.4), 0 4px 8px rgba(31, 139, 78, 0.2);
	z-index: 1000;
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	cursor: pointer;
	animation: float 3s ease-in-out infinite;
}

@keyframes float {
	0%, 100% {
		transform: translateY(0);
	}
	50% {
		transform: translateY(-8px);
	}
}

.add-product-btn:hover {
	transform: scale(1.15) rotate(90deg);
	box-shadow: 0 12px 32px rgba(31, 139, 78, 0.5), 0 6px 12px rgba(31, 139, 78, 0.3);
	animation: none;
}

.add-product-btn:active {
	transform: scale(1.05) rotate(90deg);
	box-shadow: 0 6px 16px rgba(31, 139, 78, 0.35);
}

.add-product-btn::before {
	content: '';
	position: absolute;
	inset: -4px;
	border-radius: 50%;
	background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
	opacity: 0;
	transition: opacity 0.3s ease;
	z-index: -1;
	filter: blur(8px);
}

.add-product-btn:hover::before {
	opacity: 0.5;
}

.btn-inner {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 100%;
	height: 100%;
}

.add-icon {
	width: 1.75rem;
	height: 1.75rem;
	stroke-width: 2.5;
	transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.add-product-btn:hover .add-icon {
	transform: rotate(90deg);
}

@media (max-width: 768px) {
	.add-product-btn {
		height: 3.25rem;
		width: 3.25rem;
		right: 1.25rem;
		bottom: 5rem;
	}

	.add-icon {
		width: 1.5rem;
		height: 1.5rem;
	}
}

.category-list {
	display: flex;
	flex-wrap: wrap;
	gap: 0.5rem;
}

.category-btn {
	padding: 0.625rem 1rem;
	border: 2px solid var(--border-primary);
	background-color: var(--bg-secondary);
	color: var(--text-primary);
	border-radius: 10px;
	cursor: pointer;
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	font-weight: 600;
	font-size: 0.875rem;
	letter-spacing: 0.01em;
}

.modal-crop {
	width: 100dvw;
	height: 100dvh;
	position: fixed;
	z-index: 700000;
	background-color: var(--modal-overlay);
	backdrop-filter: blur(12px);
}

.category-btn:hover {
	background-color: var(--surface-hover);
	border-color: #1f8b4e;
	transform: translateY(-2px);
	box-shadow: 0 4px 12px rgba(31, 139, 78, 0.15);
}

.category-btn.active {
	background: linear-gradient(135deg, #1f8b4e 0%, #26a65b 100%);
	color: white;
	border-color: #1f8b4e;
	box-shadow: 0 4px 12px rgba(31, 139, 78, 0.3);
	transform: translateY(-2px);
}

.desktop-header {
	padding: 1rem 10px;
	color: var(--text-primary);
}

.h-5 {
	height: 1rem;
	aspect-ratio: 1;
}

.category-list {
	display: flex;
	flex-wrap: wrap;
	gap: 0.4rem;
	margin-bottom: 0.5rem;
}

.category-item {
	padding: 0.3rem 0.6rem;
	background: var(--bg-secondary);
	color: var(--text-primary);
	border: 1px solid var(--border-primary);
	border-radius: var(--radius-sm);
	cursor: pointer;
	font-size: 0.85rem;
	transition: all 0.2s ease;
	font-weight: 500;
}

.category-item:hover {
	background: var(--surface-hover);
	border-color: var(--color-primary);
}

.category-item.active {
	background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
	color: white;
	border-color: var(--color-primary);
	box-shadow: 0 0 0 2px var(--color-primary-light);
}

.modal-backdrop {
	position: fixed;
	inset: 0;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	z-index: 1000;
	background: var(--modal-overlay);
	overflow: auto;
	backdrop-filter: blur(8px);
	scroll-behavior: smooth !important;
}

.edit-modal {
	background-color: var(--modal-overlay);
	backdrop-filter: blur(8px);
}

.modal {
	background: var(--surface);
	max-height: 80dvh;
	overflow: auto;
	width: 90%;
	max-width: 500px;
	padding: 10px;
	border-radius: var(--radius-xl);
	position: relative;
	border-top: 6px solid var(--color-primary);
	padding-bottom: 0;
	box-shadow: var(--shadow-xl);
	border: 1px solid var(--border-primary);
}

.modal-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 10px;
}

.form-group label {
	padding: 0px 5px;
	font-weight: 600;
}

.modal-body {
	display: flex;
	flex-direction: column;
	gap: 10px;
	margin-top: 1rem;
	padding: 5px;
}

.modal-body input,
.modal-body textarea {
	width: 100%;
	padding: 10px 12px;
	border: 1px solid var(--input-border);
	background: var(--input-bg);
	color: var(--text-primary);
	border-radius: var(--radius-md);
	transition: all 0.2s ease;
	font-family: inherit;
}

.modal-body input:focus,
.modal-body textarea:focus {
	outline: none;
	border-color: var(--input-border-focus);
	box-shadow: 0 0 0 3px var(--color-primary-light);
}

.image-list {
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
	margin-top: 10px;
}

.upload-area {
	display: flex;
	flex-direction: column;
}

.upload-area h1 {
	width: 100%;
	text-align: center;
	padding: 1rem;
}

.upload-area label {
	width: 100%;
	border-radius: 16px;
	padding: 3rem 1rem;
	background-color: var(--bg-secondary);
	border: 3px dashed var(--border-primary);
	display: flex;
	align-items: center;
	justify-content: center;
	flex-direction: column;
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	cursor: pointer;
	gap: 0.75rem;
}

.upload-area label:hover {
	background: linear-gradient(135deg, rgba(31, 139, 78, 0.05) 0%, rgba(31, 139, 78, 0.02) 100%);
	border-color: #1f8b4e;
	transform: translateY(-2px);
	box-shadow: 0 8px 24px rgba(31, 139, 78, 0.12);
}

.upload-area label:focus {
	outline: 3px solid rgba(31, 139, 78, 0.3);
	outline-offset: 2px;
}

label button {
	height: 3rem;
	aspect-ratio: 1;
	background-color: transparent;
	border: 0;
	color: var(--text-secondary);
}

.upload-area input {
	display: none;
}

.image-item {
	display: flex;
	gap: 0.5rem;
	align-items: center;
}

.image-item img {
	height: 80px !important;
	aspect-ratio: 16/9;
	border-radius: var(--radius-md);
	border: 1px solid var(--border-primary);
	box-shadow: var(--shadow-sm);
	transition: transform 0.2s ease;
}

.image-item img:hover {
	transform: scale(1.05);
}

.image-actions {
	display: flex;
	gap: 5px;
	flex-direction: column;
}

.action-icon-edit {
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 4px 5px;
	border: 1px solid var(--border-primary);
	background: var(--bg-secondary);
	color: var(--text-primary);
	border-radius: var(--radius-sm);
	font-size: 12px;
	transition: all 0.2s ease;
	cursor: pointer;
}

.action-icon-edit:hover {
	background: var(--surface-hover);
	border-color: var(--color-primary);
}

.action-delete {
	background: linear-gradient(135deg, var(--color-warning), var(--color-warning-dark));
	color: white;
	border-color: var(--color-warning);
}

.action-delete:hover {
	background: linear-gradient(135deg, var(--color-danger), var(--color-danger-dark));
	border-color: var(--color-danger);
}

.action-icon-edit .w-4 {
	height: 1rem;
}

.add-btn {
	background: var(--bg-secondary);
	padding: 0.3rem 0.5rem;
	border: 1px dashed var(--border-primary);
	border-radius: var(--radius-sm);
	cursor: pointer;
	display: flex;
	align-items: center;
	gap: 0.3rem;
	color: var(--text-primary);
	transition: all 0.2s ease;
}

.add-btn:hover {
	background: var(--surface-hover);
	border-color: var(--color-primary);
	transform: translateY(-1px);
}

.image-list {
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
}

.image-item {
	display: flex;
	gap: 0.5rem;
	align-items: center;
}

/* .image-item img {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 4px;
  border: 1px solid #ccc;
} */

.upload-input {
	padding: 0.5rem 0;
	font-size: 0.9rem;
}

.modal-footer {
	display: flex;
	justify-content: center;
	width: 100%;
	background: var(--surface);
	border-top: 1px solid var(--border-primary);
	position: sticky;
	bottom: 0;
	gap: 1rem;
	margin-top: 1rem;
	padding: 10px 0;
}

.modal-footer button {
	padding: 10px 20px;
	border-radius: var(--radius-md);
	border: 1px solid transparent;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-footer button:active {
	transform: scale(0.97);
}

.modal-footer button.disable-btn {
	background-color: var(--bg-secondary);
	color: var(--text-tertiary);
	cursor: not-allowed;
	opacity: 0.6;
}

.modal-footer button.save-btn {
	background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
	color: white;
	box-shadow: var(--shadow-md);
}

.modal-footer button.save-btn:hover:not(:disabled) {
	box-shadow: var(--shadow-lg);
	transform: translateY(-2px);
}

.modal-footer button.cancel-btn {
	border: 1px solid var(--border-primary);
	background: var(--bg-secondary);
	color: var(--text-primary);
}

.modal-footer button.cancel-btn:hover {
	background: var(--surface-hover);
	border-color: var(--color-danger);
	color: var(--color-danger);
}

.save {
	background: linear-gradient(135deg, #1f8b4e 0%, #26a65b 100%);
	color: white;
	padding: 0.75rem 1.5rem;
	border: none;
	border-radius: 10px;
	cursor: pointer;
	font-weight: 700;
	box-shadow: 0 4px 12px rgba(31, 139, 78, 0.3);
	transition: all 0.3s ease;
}

.save:hover {
	transform: translateY(-2px);
	box-shadow: 0 6px 20px rgba(31, 139, 78, 0.4);
}

.product-list-container {
	width: 100%;
	height: fit-content;
	max-height: 100dvh;
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(min(100%, 380px), 1fr));
	gap: 1.5rem;
	max-height: 100dvh;
	overflow: auto;
	padding: clamp(1rem, 3vw, 2rem);
	padding-bottom: 10rem !important;
}

.product-card {
	border: 1px solid var(--border-primary);
	background: var(--surface);
	height: fit-content;
	border-radius: 16px;
	padding: 1.25rem;
	display: flex;
	flex-direction: column;
	gap: 1rem;
	box-shadow: 0 4px 16px rgba(31, 139, 78, 0.08);
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	position: relative;
	overflow: hidden;
}

.product-card::before {
	content: '';
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	height: 3px;
	background: linear-gradient(90deg, #1f8b4e 0%, transparent 100%);
	opacity: 0;
	transition: opacity 0.3s ease;
}

.product-card:hover {
	border-color: rgba(31, 139, 78, 0.3);
	transform: translateY(-4px);
	box-shadow: 0 8px 24px rgba(31, 139, 78, 0.15);
}

.product-card:hover::before {
	opacity: 1;
}

.product-details {
	display: flex;
	width: 100%;
	gap: 5px;
}

.product-details .img-container {
	height: 120px;
	aspect-ratio: 4/3;
	border: 1px solid var(--border-primary);
	border-radius: var(--radius-md);
	overflow: hidden;
	background: var(--bg-secondary);
}

.img-container img {
	height: 100%;
	aspect-ratio: 4/2.7;
	border-radius: 10px;
	object-fit: fill;
	background-position: center;
}

.stats {
	flex: 1 1 auto;
	display: flex;
	flex-direction: column;
	padding: 5px 10px;
	color: var(--text-primary);
	border-radius: var(--radius-md);
	font-size: clamp(12px, 2vw, 1rem);
	justify-content: space-around;
}

.stats span {
	display: flex;
	align-items: center;
	gap: 5px;
	color: var(--text-secondary);
}

.stats .icon {
	height: 1rem;
	aspect-ratio: 1;
	margin-bottom: 3px;
	color: var(--color-primary);
}

.stats h3 {
	margin: 0;
	padding: 0;
	font-size: clamp(0.9rem, 2vw, 1.1rem);
	line-height: 1.2;
	max-width: 22ch;
	word-break: break-word;
	color: var(--text-primary);
	font-weight: 700;
}

.name {
	padding: 10px 8px;
	color: var(--text-primary);
	font-weight: 600;
	border-radius: var(--radius-md);
	font-size: clamp(0.9rem, 2vw, 1rem);
}

.name p {
	max-width: 40ch;
	overflow: hidden;
	white-space: nowrap;
	text-overflow: ellipsis;
}

.name .label {
	font-size: 12px;
	color: var(--text-tertiary);
	text-transform: uppercase;
	letter-spacing: 0.05em;
}

.no-option {
	color: transparent !important;
}

.actions {
	display: flex;
	gap: 1rem;
	padding: 5px 8px;
}

.btn {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 0.5rem;
	border: 2px solid var(--border-primary);
	border-radius: 10px;
	background-color: var(--bg-secondary);
	color: var(--text-primary);
	padding: 0.625rem 1rem;
	cursor: pointer;
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	font-weight: 600;
	font-size: 0.875rem;
}

.btn:hover {
	background: linear-gradient(135deg, rgba(31, 139, 78, 0.1) 0%, rgba(31, 139, 78, 0.05) 100%);
	border-color: #1f8b4e;
	color: #1f8b4e;
	transform: translateY(-2px);
	box-shadow: 0 4px 12px rgba(31, 139, 78, 0.15);
}

.btn span {
	font-size: clamp(12px, 2vw, 14px);
}

.btn .action-icon {
	height: 1.1rem;
	aspect-ratio: 1;
}

.btn:last-child {
	background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
	color: white;
	border-color: #dc2626;
	box-shadow: 0 4px 12px rgba(220, 38, 38, 0.25);
}

.btn:last-child:hover {
	background: linear-gradient(135deg, #b91c1c 0%, #dc2626 100%);
	box-shadow: 0 6px 20px rgba(220, 38, 38, 0.35);
	border-color: #b91c1c;
}

@media (min-width: 620px) {
	.product-list-container {
		padding-left: 1rem;
		padding-right: 1rem;
	}
}

/* ============================================
   PRODUCTS GRID
   ============================================ */
.products-grid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
	gap: 1.5rem;
	animation: fadeInUp 0.7s cubic-bezier(0.4, 0, 0.2, 1);
	animation-delay: 0.1s;
	animation-fill-mode: backwards;
}

@keyframes fadeInUp {
	from {
		opacity: 0;
		transform: translateY(20px);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}

/* ============================================
   EMPTY STATE
   ============================================ */
.empty-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 4rem 2rem;
	text-align: center;
	gap: 1.5rem;
	min-height: 400px;
}

.empty-icon {
	width: 5rem;
	height: 5rem;
	color: var(--text-muted);
	stroke-width: 1.5;
	opacity: 0.5;
}

.empty-state h3 {
	font-size: 1.5rem;
	font-weight: 700;
	color: var(--text-primary);
	margin: 0;
}

.empty-state p {
	font-size: 1rem;
	color: var(--text-secondary);
	margin: 0;
	max-width: 400px;
}

.btn-primary {
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.875rem 1.75rem;
	background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-hover) 100%);
	color: white;
	border: none;
	border-radius: var(--radius-lg);
	font-weight: 600;
	font-size: 0.95rem;
	cursor: pointer;
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	box-shadow: 0 4px 12px rgba(31, 139, 78, 0.25);
}

.btn-primary:hover {
	transform: translateY(-2px);
	box-shadow: 0 8px 20px rgba(31, 139, 78, 0.35);
}

.btn-primary:active {
	transform: translateY(0);
}

.icon-sm {
	width: 1.25rem;
	height: 1.25rem;
	stroke-width: 2.5;
}

/* ============================================
   RESPONSIVE DESIGN
   ============================================ */
@media (max-width: 1200px) {
	.products-grid {
		grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
		gap: 1.25rem;
	}
}

@media (max-width: 768px) {
	section .container {
		padding: 1.25rem;
	}

	.page-header {
		margin-bottom: 1.5rem;
	}

	.page-title {
		font-size: 1.5rem;
	}

	.title-icon {
		height: 1.5rem;
		width: 1.5rem;
	}

	.header-stats {
		gap: 0.75rem;
	}

	.stat-card {
		padding: 0.75rem 1rem;
		min-width: 120px;
	}

	.stat-value {
		font-size: 1.5rem;
	}

	.products-grid {
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: 1rem;
	}
}

@media (max-width: 480px) {
	.products-grid {
		grid-template-columns: 1fr;
		gap: 1rem;
	}

	.header-stats {
		width: 100%;
	}

	.stat-card {
		flex: 1;
		min-width: 0;
	}
}
</style>
