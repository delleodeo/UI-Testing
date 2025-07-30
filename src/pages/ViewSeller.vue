<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import {
	MapPinIcon,
	ChatBubbleLeftEllipsisIcon,
	StarIcon,
	PlusIcon,
	ShoppingBagIcon,
	UserIcon,
	ChevronDownIcon,
	ArrowLeftIcon
} from "@heroicons/vue/24/outline";

import { useRoute, useRouter } from "vue-router";
import type { Seller } from "../types/seller";
import ProductCard from "../components/ProductCard.vue";
import Loading from "../components/Loading.vue"
import { useVendorStore } from "../stores/vendorStores";

const vendorStore = useVendorStore()

const route = useRoute()
const router = useRouter()

const seller = computed<Seller>(() => vendorStore.vendorData);
const vendorId = route.params.id

const loading = ref(false);
const currentSort = ref("newest");
const isDropdownOpen = ref(false);
const dropdownRef = ref<HTMLElement>();

const fallbackImage =
	"https://images.pexels.com/photos/1300972/pexels-photo-1300972.jpeg?auto=compress&cs=tinysrgb&w=400";

const sortOptions = [
	{ value: "newest", label: "Newest First" },
	{ value: "price-low", label: "Price: Low to High" },
	{ value: "price-high", label: "Price: High to Low" },
	{ value: "most-sold", label: "Most Sold" },
];

const toggleFollow = async () => {
	await vendorStore.toggleFollow(vendorId)
}
const currentSortLabel = computed(() => {
	const option = sortOptions.find((opt) => opt.value === currentSort.value);
	return option?.label || "Sort by";
});

const goBack = () => {
	router.back()
}

const handleMessage = () => {
	window.location.href = `/chat?vendorId=${seller.value.storeName}`;
};

const toggleDropdown = () => {
	isDropdownOpen.value = !isDropdownOpen.value;
};

const selectSort = (sortOption) => {
	loading.value = true;
	currentSort.value = sortOption;
	isDropdownOpen.value = false;
};

const handleClickOutside = (event: MouseEvent) => {
	if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
		isDropdownOpen.value = false;
	}
};

const handleSellerImageError = (event: Event) => {
	const target = event.target as HTMLImageElement;
	target.src = fallbackImage;
};

// const handleProductImageError = (event: Event) => {
// 	const target = event.target as HTMLImageElement;
// 	target.src = productFallbackImage;
// };

onMounted(async () => {

	await vendorStore.fetchSellerInfo(String(vendorId))
	await vendorStore.fetchVendorProducts(String(vendorId));
	await vendorStore.isFollowing()
	await vendorStore.followerCount()
	document.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
	vendorStore.vendorProducts = [];
	document.removeEventListener("click", handleClickOutside);
});
</script>

<template>
	<div class="seller-shop-page">
		<div class="container">
			<!-- Seller Info Section -->
			<div class="seller-info">

				<div class="profile-header">
					<div class="profile-image">
						<img :src="seller?.imageUrl || fallbackImage" :alt="seller.storeName" @error="handleSellerImageError" />
					</div>

					<div class="profile-details">
						<h1 class="store-name">{{ seller?.storeName }}</h1>
						<p class="location">
							<MapPinIcon class="location-icon" />
							{{ seller.address?.province }}, {{ seller.address?.city }}
						</p>
						<p class="location">

						</p>
					</div>

					<button class="follow-btn" :class="{ following: vendorStore.isFollows }"
						@click="vendorStore.toggleFollow(vendorId)">
						<PlusIcon v-if="!vendorStore.isFollows" class="icon"></PlusIcon> {{ vendorStore.isFollows ? "Following" :
							"Follow" }}
					</button>
					<button class="action-icon" @click="handleMessage" title="Message">
						<ChatBubbleLeftEllipsisIcon class="icon" />
					</button>
				</div>

				<div class="stats-row">
					<div class="stats-container">
						<div class="stat">
							<span class="stat-number">{{ seller.rating || 0 }}</span>
							<span class="stat-label">
								<StarIcon class="icon"></StarIcon> Ratings
							</span>
						</div>

						<div class="stat">
							<span class="stat-number">{{ seller?.totalProducts || 0 }}</span>
							<span class="stat-label">
								<ShoppingBagIcon class="icon"></ShoppingBagIcon> Products
							</span>
						</div>

						<div class="stat">
							<span class="stat-number">{{ vendorStore.followersCount || 0 }}</span>
							<span class="stat-label">
								<UserIcon class="icon"></UserIcon> Followers
							</span>
						</div>
					</div>
				</div>

				<!-- <div class="action-icons">
                              <button class="action-icon" @click="handleMessage" title="Message">
                                    <ChatBubbleLeftEllipsisIcon class="icon" />
                              </button>
                              <button class="action-icon" title="Call">
                                    <PhoneIcon class="icon" />
                              </button>
                              <button class="action-icon" title="Video Call">
                                    <VideoCameraIcon class="icon" />
                              </button>
                              <button class="action-icon" title="More">
                                    <EllipsisHorizontalIcon class="icon" />
                              </button>
                        </div> -->
			</div>

			<!-- Products Section -->
			<div class="products-section">
				<div class="section-header">
					<h2> <button class="back" @click="goBack">
							<ArrowLeftIcon class="icon"></ArrowLeftIcon>
						</button>Products</h2>

					<!-- Sort Dropdown
					<div class="sort-dropdown" ref="dropdownRef">
						<button class="sort-button" @click="toggleDropdown" :class="{ active: isDropdownOpen }">
							<span>{{ currentSortLabel }}</span>
							<ChevronDownIcon class="chevron" :class="{ rotated: isDropdownOpen }" />
						</button>

						<div v-if="isDropdownOpen" class="dropdown-menu">
							<button v-for="option in sortOptions" :key="option.value" class="dropdown-item"
								:class="{ active: currentSort === option.value }" @click="selectSort(option.value)">
								{{ option.label }}
							</button>
						</div>
					</div> -->
				</div>

				<!-- Product Grid -->
				<div v-if="vendorStore.vendorProducts.length > 0" class="product-grid">
					<ProductCard v-if="!vendorStore.isLoading" typesOfProductList="VendorProducts"></ProductCard>
					<Loading v-if="vendorStore.isLoading"></Loading>
				</div>
				<div v-if="vendorStore.vendorProducts.length <= 0" class="no-product">
					No Product Available
				</div>
			</div>

		</div>
	</div>
</template>

<style scoped>
.seller-shop-page {
	min-height: 100vh;
	background-color: var(--background-color);
}

.container {
	max-width: 1200px;
	margin: 0 auto;
}

.back {
	padding: 10px 8px;
	background-color: transparent;
	border: 0;
	outline: 0;
	display: flex;

}


.back .icon {
	color: rgb(3, 3, 3);
	width: clamp(1.3rem, 2.5vw, 2rem);
	aspect-ratio: 1;
}

/* Seller Info Styles */
.seller-info {
	background: var(--primary-color-2);
	border-radius: 0 0 16px 16px;
	padding: 1rem 0.8rem;
	box-shadow: var(--card-shadow);
	/* max-width: 400px; */
	position: relative;
	padding-top: 5px;

}

.profile-header {
	display: flex;
	align-items: flex-start;
	padding-top: 1rem;
	gap: 1rem;
	margin-bottom: 1.5rem;
	min-width: 360px;
	background-color: ;
	width: fit-content;
}

.profile-image img {
	width: 60px;
	aspect-ratio: 1;
	border-radius: 50%;
	object-fit: cover;
	border: 2px solid var(--secondary-color);
}

.profile-details {
	flex: 1;
}

.store-name {
	font-size: 1.25rem;
	font-weight: 700;
	color: var(--text-white);
	margin-bottom: 0.25rem;
}

.location {
	display: flex;
	align-items: center;
	gap: 0.25rem;
	font-size: clamp(.7rem, 2vw, .85rem);
	color: var(--text-light-2);
	min-width: fit-content;
	width: 100%;
	margin-left: -5px;
}



.location-icon {
	width: 14px;
	height: 14px;
}

.follow-btn {
	padding: 0.5rem 1rem;
	background-color: var(--secondary-color);
	color: white;
	border: none;
	border-radius: 20px;
	font-size: clamp(10px, 2vw, 14px);
	font-weight: 600;
	cursor: pointer;
	transition: all 0.2s ease;
	flex-shrink: 0;
	display: flex;
	gap: 5px;
}

.follow-btn .icon {
	height: 0.9rem;
}

.follow-btn:hover {
	transform: translateY(-1px);
}

.follow-btn.following {
	background-color: var(--primary-color-2);
	color: white;
	border: 1px solid rgb(228, 228, 228);
}

.stats-row {
	display: flex;
	bottom: -40%;
	left: 0;
	justify-content: space-evenly;
	margin-bottom: 1.5rem;
	padding: 0 1rem;
	width: fit-content;
	min-width: 400px;
	position: absolute;
	left: 50%;
	transform: translateX(-50%);
}

.stats-container {
	display: flex;
	width: 100%;
	padding: 10px 8px;
	background-color: var(--primary-color-2);
	border-radius: 1.5rem;
	border: 5px solid var(--background-color);
}

.stat {
	display: flex;
	flex-direction: column;
	align-items: center;
	text-align: center;
	flex: 1;
}

.stat:not(:last-child) {
	border-right: 1px solid rgba(199, 199, 199, 0.801);
}

.stat-number {
	font-size: 1.1rem;
	font-weight: 700;
	color: white;
	margin-bottom: 0.25rem;
}

.stat-label {
	font-size: 0.8rem;
	color: var(--text-light-2);
	text-transform: capitalize;
	display: flex;
	gap: 0.2rem;
	align-items: center;
}

.stat-label .icon {
	height: 1rem;
	margin-top: -3px;
}

.action-icons {
	display: flex;
	justify-content: space-around;
	gap: 1rem;
	width: fit-content;
	min-width: 360px;
}

.action-icon {
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 8px;
	background: var(--secondary-color);
	color: white;
	border: none;
	border-radius: 50%;
	cursor: pointer;
	transition: all 0.2s ease;
}

.action-icon:hover {
	background: #e9ecef;
	transform: translateY(-2px);
}

.action-icon .icon {
	width: 18px;
	aspect-ratio: 1;
	color: white;
}

/* Products Section Styles */
.products-section {
	padding: 10px 8px;
}

.section-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin: 1rem 0;
}

.section-header h2 {
	font-size: clamp(1.2rem, 2vw, 2rem);
	font-weight: 700;
	color: var(--text-primary);
	display: flex;
	align-items: center;
}

/* Sort Dropdown Styles */
.sort-dropdown {
	position: relative;
}

.sort-button {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.65rem 0.8rem;
	background: var(--accent-color);
	border: 1px solid var(--border-color);
	border: 1px solid rgba(128, 128, 128, 0.452);
	border-radius: 8px;
	cursor: pointer;
	font-size: clamp(11px, 2vw, 1rem);
	font-weight: 500;
	color: var(--text-primary);
	transition: all 0.2s ease;
	width: clamp(120px, 25vw, 180px);
	justify-content: space-between;
}

.sort-button span {
	overflow: hidden;
	/* required for ellipsis */
	white-space: nowrap;
	/* prevent wrapping */
	text-overflow: ellipsis;
}


.chevron {
	width: clamp(15px, 2vw, 20px);
	aspect-ratio: 1;
	transition: transform 0.2s ease;
}

.chevron.rotated {
	transform: rotate(180deg);
}

.dropdown-menu {
	position: absolute;
	top: 100%;
	left: 0;
	right: 0;
	border: 1px solid var(--border-color);
	border-radius: 8px;
	box-shadow: var(--hover-shadow);
	z-index: 10;
	margin-top: 0.25rem;
	overflow: hidden;
}

.dropdown-item {
	width: 100%;
	padding: 0.5rem 1rem;
	background: none;
	border: none;
	text-align: left;
	cursor: pointer;
	font-size: 0.9rem;
	color: var(--text-primary);
	transition: background-color 0.2s ease;
	background-color: #fff;
}

.dropdown-item:hover {
	background-color: #f8f9fa;
}

.dropdown-item.active {
	background-color: var(--primary-color-2);
	color: white;
}

/* Product Grid Styles */
.product-grid {
	min-height: 400px;
}

.no-product {
	text-align: center;
	color: var(--text-light);
	flex: 1 1 auto;
	display: flex;
	min-height: 400px;
	justify-content: center;
	align-items: center;
	width: 100%;
}

.products-grid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
	gap: 1.5rem;
}

@media (max-width: 1195px) {
	.seller-info {
		border-radius: 0;
	}
}

@media (max-width: 768px) {
	.seller-info {
		max-width: 100%;
		margin: 0 0 2rem;
		padding-bottom: 3rem;
	}

	.profile-header {
		gap: 0.75rem;
	}

	.store-name {
		font-size: 1.1rem;
	}

	.stats-row {
		padding: 0;
	}
}

@media (max-width: 640px) {
	.profile-header {
		max-width: 100%;
		width: 100%;
	}

	.stats-row {
		max-width: 90%;
		width: 100%;
	}
}
</style>
