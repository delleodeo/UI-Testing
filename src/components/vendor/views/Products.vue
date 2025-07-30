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
			<button class="add-product-btn" @click="isAddingProducts">
				<div>
					<PlusIcon class="add-icon"></PlusIcon>
				</div>
			</button>
			<div class="products-grid">
				<VendorProductCard v-for="product in products" :key="product?._id" :product="product"
					@view-product="openModal" />
			</div>
			<div class="space">
			</div>
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
section {
	display: flex;
	height: 100dvh;
	max-height: 100dvh;
	flex-direction: column;
	width: 100%;
	position: relative;
	background-color: var(--dashboard-primary);

}

section .container {
	max-height: 100dvh;
	overflow: auto;

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
	background-color: rgba(39, 39, 39, 0.582);
	backdrop-filter: blur(5px);
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
	background-color: rebeccapurple;
	overflow: auto;
	left: 0;
	top: 0;
	display: flex;
	align-items: center;

	z-index: 10000;
}

.add-product-btn {
	position: absolute;
	height: 3.5rem;
	aspect-ratio: 1;
	right: 10px;
	bottom: 10rem;
	padding: 5px;
	border-radius: 50rem;
	border: 1px solid white;
	background-color: rgba(173, 252, 173, 0.815);
	color: white;
	display: flex;
	align-items: center;
	box-shadow: 0 0 10px rgb(56, 56, 56);
	z-index: 10000;
}

.add-product-btn div {
	background-color: var(--primary-color);
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 50rem;
	height: 100%;
	aspect-ratio: 1;
}

.add-product-btn div .add-icon {
	height: 1.5rem;
	aspect-ratio: 1;
}

.category-list {
	display: flex;
	flex-wrap: wrap;
	gap: 0.5rem;
}

.category-btn {
	padding: 0.5rem 0.8rem;
	border: 1px solid #ccc;
	background-color: #f9f9f9;
	border-radius: 6px;
	cursor: pointer;
	transition: 0.2s;
}

.modal-crop {
	width: 100dvw;
	height: 100dvh;
	position: fixed;
	z-index: 700000;
	background-color: red;
}

.category-btn:hover {
	background-color: #eee;
}

.category-btn.active {
	background-color: var(--primary-color);
	color: white;
}

.desktop-header {
	padding: 1rem 10px;
	color: white;
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
	background: #f1f1f1;
	border-radius: 4px;
	cursor: pointer;
	font-size: 0.85rem;
}

.category-item.active {
	background-color: #094a25;
	color: #fff;
}

.modal-backdrop {
	position: fixed;
	inset: 0;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	z-index: 1000;

	overflow: auto;
	backdrop-filter: blur(3px);
	scroll-behavior: smooth !important;
}

.edit-modal {
	background-color: rgba(4, 19, 31, 0.747);
	backdrop-filter: blur(4px);
}

.modal {
	background: rgba(255, 255, 255, 0.911);
	max-height: 80dvh;
	overflow: auto;
	width: 90%;
	backdrop-filter: blur(5px);
	max-width: 500px;
	padding: 10px;
	border-radius: 1.3rem;
	position: relative;
	border-top: 10px solid var(--primary-color);
	padding-bottom: 0;
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
	border: 1px solid #ccc;
	border-radius: 8px;
}

.modal-body input:focus,
.modal-body textarea:focus {
	outline: 2px solid var(--primary-color);
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
	border-radius: 0.8rem;
	padding: 3rem 1rem;
	background-color: rgb(255, 255, 255);
	outline: 1px dashed grey;
	border: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-direction: column;
	transition: all 150ms ease-in-out;
	cursor: pointer;
}

.upload-area label:hover {
	background-color: rgb(194, 194, 250);
	transform: scale(102%);
}

.upload-area label:focus {
	outline: 2px dashed black;
}

label button {
	height: 3rem;
	aspect-ratio: 1;
	background-color: transparent;
	border: 0;
	color: rgb(83, 83, 83);
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
	border-radius: 10px;
	border: 1px solid rgb(206, 206, 206);
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
	border: 1px solid grey;
	border-radius: 5px;
	font-size: 12px;
}

.action-delete {
	background-color: rgb(255, 136, 0);
	color: rgb(255, 255, 255);
}

.action-icon-edit .w-4 {
	height: 1rem;
}

.add-btn {
	background: #f0f0f0;
	padding: 0.3rem 0.5rem;
	border: 1px dashed #ccc;
	border-radius: 4px;
	cursor: pointer;
	display: flex;
	align-items: center;
	gap: 0.3rem;
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
	background-color: white;
	position: sticky;
	bottom: 0;
	gap: 1rem;
	margin-top: 1rem;
	padding: 10px 0;
}

.modal-footer button {
	padding: 10px 12px;
	border-radius: 10px;
	border: 0;
}

.modal-footer button.disable-btn {
	background-color: rgb(230, 230, 230);
}

.modal-footer button.save-btn {
	background-color: var(--primary-color);
	color: white;
}

.modal-footer button.cancel-btn {
	border: 1px solid rgb(189, 189, 189);
}

.save {
	background: #094a25;
	color: white;
	padding: 0.4rem 1rem;
	border: none;
	border-radius: 4px;
	cursor: pointer;
}

.product-list-container {
	width: 100%;
	height: fit-content;
	max-height: 100dvh;
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
	gap: 10px;
	max-height: 100dvh;
	overflow: auto;
	padding: 10px 8px;
	padding-bottom: 10rem !important;
}

.product-card {
	border: 1px solid #334155;
	background: #1e293b;
	height: fit-content;
	border-radius: 1rem;
	padding: 10px;
	display: flex;
	flex-direction: column;
	gap: 5px;
}

.product-details {
	display: flex;
	width: 100%;
	gap: 5px;
}

.product-details .img-container {
	height: 120px;
	aspect-ratio: 4/3;
	border: 1px solid rgba(78, 82, 100, 0.5);
	border-radius: 10px;
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
	color: rgb(248, 248, 248);
	border-radius: 10px;
	font-size: clamp(12px, 2vw, 1rem);
	justify-content: space-around;
}

.stats span {
	display: flex;
	align-items: center;
	gap: 5px;
}

.stats .icon {
	height: 1rem;
	aspect-ratio: 1;
	margin-bottom: 3px;
}

.stats h3 {
	margin: 0;
	padding: 0;
	font-size: clamp(0.9rem, 2vw, 1.1rem);
	line-height: 1.2;
	max-width: 22ch;
	word-break: break-word;
}

.name {
	padding: 10px 8px;
	color: rgb(241, 252, 255);
	font-weight: 600;
	border-radius: 10px;
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
	color: rgb(161, 161, 161);
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
	gap: 5px;
	border: 0;
	border-radius: 10px;
	background-color: #ffffff;
}

.btn span {
	font-size: clamp(12px, 2vw, 14px);
}

.btn .action-icon {
	height: 1.1rem;
	aspect-ratio: 1;
}

.btn:last-child {
	background-color: var(--secondary-color);
	color: white;
}

@media (min-width: 620px) {
	.product-list-container {
		padding-left: 1rem;
		padding-right: 1rem;
	}
}

.products-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(250px, 400px));
	gap: 1rem;
	height: fit-content;
	
}

.products-grid img {
	width: 100%;
	height: 10rem;
}

@media (max-width: 768px) {
	.products-grid {
		grid-template-columns: 1fr 1fr;
		gap: 8px;
	}

	.header h1 {
		font-size: 2rem;
	}
}

@media (max-width: 400px) {
	.products-grid {
		grid-template-columns: 1fr;
		gap: 8px;
	}
}
</style>
