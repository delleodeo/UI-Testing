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
	ArrowLeftIcon,
	HeartIcon,
	BuildingStorefrontIcon,
	CheckBadgeIcon,
	CalendarDaysIcon,
	ShareIcon,
	PhoneIcon,
	EnvelopeIcon,
	EllipsisVerticalIcon,
	CheckIcon,
	XMarkIcon
} from "@heroicons/vue/24/outline";
import { 
	StarIcon as StarSolidIcon,
	HeartIcon as HeartSolidIcon 
} from "@heroicons/vue/24/solid";

import { useRoute, useRouter } from "vue-router";
import type { Seller } from "../types/seller";
import ProductCard from "../components/ProductCard.vue";
import Loading from "../components/Loading.vue"
import { useVendorStore } from "../stores/vendorStores";
import { Alert } from "../components/composable/Alert";

const vendorStore = useVendorStore()
const route = useRoute()
const router = useRouter()

// Component state
const seller = computed<Seller>(() => vendorStore.vendorData);
const vendorId = route.params.id

// UI state
const loading = ref(false);
const followLoading = ref(false);
const currentSort = ref("newest");
const isDropdownOpen = ref(false);
const showShareModal = ref(false);
const showContactModal = ref(false);
const dropdownRef = ref<HTMLElement>();
const contactDropdownRef = ref<HTMLElement>();

// Fallback data
const fallbackImage = "https://images.pexels.com/photos/1300972/pexels-photo-1300972.jpeg?auto=compress&cs=tinysrgb&w=400";

const sortOptions = [
	{ value: "newest", label: "Newest First", icon: CalendarDaysIcon },
	{ value: "price-low", label: "Price: Low to High", icon: ArrowLeftIcon },
	{ value: "price-high", label: "Price: High to Low", icon: ArrowLeftIcon },
	{ value: "most-sold", label: "Most Sold", icon: StarSolidIcon },
	{ value: "name-az", label: "Name: A-Z", icon: ArrowLeftIcon },
];

// Computed properties
const isFollowing = computed(() => vendorStore.isFollows);
const followersCount = computed(() => vendorStore.followersCount || 2);
const currentUrl = computed(() => typeof window !== 'undefined' ? window.location.href : '');
const sortedProducts = computed(() => {
	const products = [...vendorStore.vendorProducts];
	
	switch (currentSort.value) {
		case "price-low":
			return products.sort((a, b) => a.price - b.price);
		case "price-high":
			return products.sort((a, b) => b.price - a.price);
		case "name-az":
			return products.sort((a, b) => a.name.localeCompare(b.name));
		case "most-sold":
			return products.sort((a, b) => (b.sold || 0) - (a.sold || 0));
		case "newest":
		default:
			return products.sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
	}
});

// Computed labels and icons
const currentSortLabel = computed(() => {
	const option = sortOptions.find((opt) => opt.value === currentSort.value);
	return option?.label || "Sort by";
});

const currentSortIcon = computed(() => {
	const option = sortOptions.find((opt) => opt.value === currentSort.value);
	return option?.icon || ChevronDownIcon;
});

// Navigation methods
const goBack = () => {
	if (window.history.length > 1) {
		router.back();
	} else {
		router.push('/products');
	}
};

// Follow functionality
const toggleFollow = async () => {
	if (followLoading.value) return;
	
	followLoading.value = true;
	try {
		await vendorStore.toggleFollow(vendorId);
		const message = isFollowing.value ? 
			`You are now following ${seller.value?.storeName || 'this seller'}!` :
			`You unfollowed ${seller.value?.storeName || 'this seller'}`;
		
		Alert(message, "success", "#10b981");
	} catch (error) {
		console.error('Failed to toggle follow:', error);
		Alert("Failed to update follow status. Please try again.", "error", "#ef4444");
	} finally {
		followLoading.value = false;
	}
};

// Message functionality
const handleMessage = () => {
	if (!seller.value?.storeName) {
		Alert("Unable to start conversation. Please try again later.", "error", "#ef4444");
		return;
	}
	
	// Try to navigate to chat page, fallback to external link
	try {
		router.push(`/chat/${vendorId}`);
	} catch (error) {
		window.location.href = `/chat?vendorId=${seller.value.storeName}`;
	}
};

// Share functionality
const handleShare = async () => {
	const shareUrl = window.location.href;
	const shareText = `Check out ${seller.value?.storeName || 'this amazing seller'} on DoroShop!`;
	
	if (navigator.share) {
		try {
			await navigator.share({
				title: seller.value?.storeName || 'DoroShop Seller',
				text: shareText,
				url: shareUrl,
			});
			Alert("Thanks for sharing!", "success", "#10b981");
		} catch (error) {
			if (error.name !== 'AbortError') {
				copyToClipboard(shareUrl);
			}
		}
	} else {
		copyToClipboard(shareUrl);
	}
};

const copyToClipboard = async (text: string) => {
	try {
		await navigator.clipboard.writeText(text);
		Alert("Link copied to clipboard!", "success", "#10b981");
	} catch (error) {
		showShareModal.value = true;
	}
};

// Contact methods
const handleCall = () => {
	// Placeholder phone number - would come from seller data in real implementation
	const phoneNumber = "+63 912 345 6789";
	window.location.href = `tel:${phoneNumber}`;
	showContactModal.value = false;
	Alert("Calling seller...", "info", "#10b981");
};

const handleEmail = () => {
	// Placeholder email - would come from seller data in real implementation
	const email = `contact@${seller.value?.storeName?.toLowerCase().replace(/\s+/g, '') || 'seller'}.com`;
	window.location.href = `mailto:${email}`;
	showContactModal.value = false;
	Alert("Opening email client...", "info", "#10b981");
};

// Sorting functionality
const toggleDropdown = () => {
	isDropdownOpen.value = !isDropdownOpen.value;
};

const selectSort = (sortOption: string) => {
	if (currentSort.value === sortOption) {
		isDropdownOpen.value = false;
		return;
	}
	
	loading.value = true;
	currentSort.value = sortOption;
	isDropdownOpen.value = false;
	
	// Simulate loading delay for better UX
	setTimeout(() => {
		loading.value = false;
		Alert(`Products sorted by ${currentSortLabel.value}`, "info", "#10b981");
	}, 300);
};

// Event handlers
const handleClickOutside = (event: MouseEvent) => {
	const target = event.target as Node;
	
	// Close sort dropdown if clicked outside
	if (dropdownRef.value && !dropdownRef.value.contains(target)) {
		isDropdownOpen.value = false;
	}
	
	// Close contact dropdown if clicked outside
	if (contactDropdownRef.value && !contactDropdownRef.value.contains(target)) {
		showContactModal.value = false;
	}
};

const handleSellerImageError = (event: Event) => {
	const target = event.target as HTMLImageElement;
	target.src = fallbackImage;
};

// Utility methods
const formatJoinDate = (date: string | Date) => {
	if (!date) return 'Recently joined';
	const joinDate = new Date(date);
	const now = new Date();
	const diffYears = now.getFullYear() - joinDate.getFullYear();
	
	if (diffYears === 0) return 'Joined this year';
	if (diffYears === 1) return 'Joined last year';
	return `Joined ${diffYears} years ago`;
};

const closeModals = () => {
	showShareModal.value = false;
	showContactModal.value = false;
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
		<!-- Hero Section with Seller Profile -->
		<div class="hero-section">
			<div class="hero-background">
				<div class="gradient-overlay"></div>
			</div>
			
			<div class="container">
				<!-- Back Button -->
				<button class="back-button" @click="goBack">
					<ArrowLeftIcon class="back-icon" />
					<span>Back</span>
				</button>

				<!-- Profile Header -->
				<div class="profile-header">
					<div class="profile-avatar">
						<img 
							:src="seller?.imageUrl || fallbackImage" 
							:alt="seller.storeName" 
							@error="handleSellerImageError" 
							class="avatar-image"
						/>
						<div class="verified-badge">
							<CheckBadgeIcon class="verified-icon" />
						</div>
					</div>

					<div class="profile-info">
						<div class="store-header">
							<h1 class="store-name">{{ seller?.storeName || 'DoroShop Store' }}</h1>
							<div class="store-meta">
								<div class="location-info">
									<MapPinIcon class="location-icon" />
									<span>{{ seller?.address?.city || 'Philippines' }}, {{ seller?.address?.province || 'Metro Manila' }}</span>
								</div>
								<div class="join-date">
									<CalendarDaysIcon class="calendar-icon" />
									<span>Joined 2024</span>
								</div>
							</div>
						</div>

						<!-- Store Description -->
						<p class="store-description" v-if="seller?.description">
							{{ seller.description }}
						</p>
						<p class="store-description" v-else>
							Welcome to our store! We offer quality products with excellent customer service.
						</p>

						<!-- Action Buttons -->
						<div class="action-buttons">
							<button 
								class="follow-button" 
								:class="{ following: isFollowing, loading: followLoading }"
								@click="toggleFollow"
								:disabled="followLoading"
							>
								<div v-if="followLoading" class="loading-spinner"></div>
								<PlusIcon v-else-if="!isFollowing" class="button-icon" />
								<HeartSolidIcon v-else class="button-icon" />
								{{ followLoading ? "Loading..." : (isFollowing ? "Following" : "Follow") }}
							</button>
							
							<button class="message-button" @click="handleMessage">
								<ChatBubbleLeftEllipsisIcon class="button-icon" />
								Message
							</button>

							<button class="share-button" @click="handleShare">
								<ShareIcon class="button-icon" />
								Share
							</button>

							<div class="more-actions" ref="contactDropdownRef">
								<button class="more-button" @click="showContactModal = !showContactModal">
									<EllipsisVerticalIcon class="button-icon" />
								</button>
								
								<!-- Contact Dropdown -->
								<transition name="dropdown">
									<div v-if="showContactModal" class="contact-dropdown">
										<button @click="handleCall" class="contact-item">
											<PhoneIcon class="contact-icon" />
											Call Seller
										</button>
										<button @click="handleEmail" class="contact-item">
											<EnvelopeIcon class="contact-icon" />
											Email Seller
										</button>
									</div>
								</transition>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Stats Section -->
		<div class="stats-section">
			<div class="container">
				<div class="stats-container">
					<div class="stat-card clickable" @click="Alert('Rating details would show here', 'info', '#10b981')">
						<div class="stat-icon rating">
							<StarSolidIcon class="icon" />
						</div>
						<div class="stat-content">
							<span class="stat-number">{{ seller?.rating?.toFixed(1) || '4.8' }}</span>
							<span class="stat-label">Rating</span>
							<div class="rating-stars">
								<StarSolidIcon v-for="n in 5" :key="n" 
									class="star" 
									:class="{ filled: n <= Math.round(seller?.rating || 4.8) }" 
								/>
							</div>
						</div>
					</div>

					<div class="stat-card clickable" @click="Alert('Product catalog would show here', 'info', '#10b981')">
						<div class="stat-icon products">
							<ShoppingBagIcon class="icon" />
						</div>
						<div class="stat-content">
							<span class="stat-number">{{ seller?.totalProducts || vendorStore.vendorProducts?.length || 12 }}</span>
							<span class="stat-label">Products</span>
							<span class="stat-subtext">Active listings</span>
						</div>
					</div>

					<div class="stat-card clickable" @click="Alert('Follower list would show here', 'info', '#10b981')">
						<div class="stat-icon followers">
							<UserIcon class="icon" />
						</div>
						<div class="stat-content">
							<span class="stat-number">{{ followersCount }}</span>
							<span class="stat-label">Followers</span>
							<span class="stat-subtext">{{ isFollowing ? 'Including you' : 'Join them!' }}</span>
						</div>
					</div>

					<div class="stat-card clickable" @click="Alert('Order history would show here', 'info', '#10b981')">
						<div class="stat-icon store">
							<BuildingStorefrontIcon class="icon" />
						</div>
						<div class="stat-content">
							<span class="stat-number">{{ 156 }}</span>
							<span class="stat-label">Orders</span>
							<span class="stat-subtext">Successfully completed</span>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Products Section -->
		<div class="products-section">
			<div class="container">
				<div class="section-header">
					<div class="section-title">
						<h2>Store Products</h2>
						<p class="section-subtitle">Discover amazing products from this seller</p>
					</div>

					<!-- Sort & Filter Controls -->
					<div class="controls-section">
						<div class="products-count">
							<span class="count-text">{{ sortedProducts.length }} products found</span>
						</div>
						
						<div class="sort-dropdown" ref="dropdownRef">
							<button class="sort-button" @click="toggleDropdown" :class="{ active: isDropdownOpen }">
								<component :is="currentSortIcon" class="sort-icon" />
								<span>{{ currentSortLabel }}</span>
								<ChevronDownIcon class="chevron" :class="{ rotated: isDropdownOpen }" />
							</button>

							<transition name="dropdown">
								<div v-if="isDropdownOpen" class="dropdown-menu">
									<button 
										v-for="option in sortOptions" 
										:key="option.value" 
										class="dropdown-item"
										:class="{ active: currentSort === option.value }" 
										@click="selectSort(option.value)"
									>
										<component :is="option.icon" class="dropdown-icon" />
										<span>{{ option.label }}</span>
										<CheckIcon v-if="currentSort === option.value" class="check-icon" />
									</button>
								</div>
							</transition>
						</div>
					</div>
				</div>

				<!-- Product Grid -->
				<div v-if="loading" class="loading-section">
					<Loading></Loading>
					<p class="loading-text">Sorting products...</p>
				</div>
				<div v-else-if="sortedProducts.length > 0" class="product-grid">
					<ProductCard typesOfProductList="VendorProducts"></ProductCard>
				</div>
				<div v-else-if="!vendorStore.isLoading" class="empty-products">
					<div class="empty-icon">
						<ShoppingBagIcon class="icon" />
					</div>
					<h3>No Products Available</h3>
					<p>This seller hasn't added any products yet. Check back later!</p>
					<button class="contact-seller-btn" @click="handleMessage">
						<ChatBubbleLeftEllipsisIcon class="btn-icon" />
						Contact Seller
					</button>
				</div>
			</div>
		</div>

		<!-- Share Modal -->
		<transition name="modal">
			<div v-if="showShareModal" class="modal-overlay" @click="closeModals">
				<div class="modal-content" @click.stop>
					<div class="modal-header">
						<h3>Share this seller</h3>
						<button @click="closeModals" class="close-btn">
							<XMarkIcon class="close-icon" />
						</button>
					</div>
					<div class="modal-body">
						<p>Copy this link to share {{ seller?.storeName || 'this seller' }}</p>
						<div class="link-container">
							<input :value="currentUrl" readonly class="link-input">
							<button @click="copyToClipboard(currentUrl)" class="copy-btn">
								Copy
							</button>
						</div>
					</div>
				</div>
			</div>
		</transition>
	</div>
</template>

<style scoped>
.seller-shop-page {
	min-height: 100vh;
	background: #f8fafc;
	font-family: 'Inter', system-ui, -apple-system, sans-serif;
}

.container {
	max-width: 1200px;
	margin: 0 auto;
	padding: 0 16px;
}

/* Hero Section */
.hero-section {
	position: relative;
	background: linear-gradient(135deg, #10b981 0%, #8b5cf6 100%);
	padding: 24px 0 40px;
	overflow: hidden;
}

.hero-background {
	position: absolute;
	inset: 0;
	background-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="50" cy="50" r="1" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
}

.gradient-overlay {
	position: absolute;
	inset: 0;
	background: linear-gradient(135deg, rgba(16, 185, 129, 0.9) 0%, rgba(139, 92, 246, 0.9) 100%);
}

/* Back Button */
.back-button {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 8px 16px;
	background: rgba(255, 255, 255, 0.2);
	border: none;
	border-radius: 12px;
	color: white;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.2s ease;
	margin-bottom: 24px;
	backdrop-filter: blur(10px);
}

.back-button:hover {
	background: rgba(255, 255, 255, 0.3);
	transform: translateY(-2px);
}

.back-icon {
	width: 20px;
	height: 20px;
}

/* Profile Header */
.profile-header {
	position: relative;
	z-index: 2;
	display: flex;
	align-items: flex-start;
	gap: 24px;
	color: white;
}

/* Profile Avatar */
.profile-avatar {
	position: relative;
	flex-shrink: 0;
}

.avatar-image {
	width: 100px;
	height: 100px;
	border-radius: 50%;
	object-fit: cover;
	border: 4px solid rgba(255, 255, 255, 0.3);
	box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.verified-badge {
	position: absolute;
	bottom: 4px;
	right: 4px;
	background: #10b981;
	border-radius: 50%;
	padding: 4px;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.verified-icon {
	width: 16px;
	height: 16px;
	color: white;
}

/* Profile Info */
.profile-info {
	flex: 1;
	min-width: 0;
}

.store-header {
	margin-bottom: 16px;
}

.store-name {
	font-size: 28px;
	font-weight: 700;
	margin: 0 0 8px 0;
	line-height: 1.2;
}

.store-meta {
	display: flex;
	flex-wrap: wrap;
	gap: 16px;
	font-size: 14px;
	opacity: 0.9;
}

.location-info,
.join-date {
	display: flex;
	align-items: center;
	gap: 6px;
}



.location-icon,
.calendar-icon {
	width: 16px;
	height: 16px;
	flex-shrink: 0;
}

.store-description {
	font-size: 16px;
	line-height: 1.5;
	margin: 0 0 24px 0;
	opacity: 0.9;
	max-width: 500px;
}

/* Action Buttons */
.action-buttons {
	display: flex;
	gap: 12px;
	flex-wrap: wrap;
}

.follow-button,
.message-button {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 12px 24px;
	border: none;
	border-radius: 12px;
	font-size: 16px;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.2s ease;
	backdrop-filter: blur(10px);
}

.follow-button {
	background: rgba(255, 255, 255, 0.2);
	color: white;
	border: 2px solid rgba(255, 255, 255, 0.3);
}

.follow-button:hover {
	background: rgba(255, 255, 255, 0.3);
	transform: translateY(-2px);
}

.follow-button.following {
	background: rgba(239, 68, 68, 0.2);
	border-color: rgba(239, 68, 68, 0.3);
}

.message-button {
	background: rgba(0, 0, 0, 0.2);
	color: white;
	border: 2px solid rgba(255, 255, 255, 0.2);
}

.message-button:hover {
	background: rgba(0, 0, 0, 0.3);
	transform: translateY(-2px);
}

.button-icon {
	width: 20px;
	height: 20px;
}

/* New Action Buttons */
.share-button {
	background: rgba(59, 130, 246, 0.2);
	border: 2px solid rgba(59, 130, 246, 0.3);
}

.share-button:hover {
	background: rgba(59, 130, 246, 0.3);
}

.more-actions {
	position: relative;
}

.more-button {
	background: rgba(107, 114, 128, 0.2);
	border: 2px solid rgba(107, 114, 128, 0.3);
	padding: 12px;
	border-radius: 12px;
}

.more-button:hover {
	background: rgba(107, 114, 128, 0.3);
}

.contact-dropdown {
	position: absolute;
	top: calc(100% + 8px);
	right: 0;
	background: white;
	border-radius: 12px;
	box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
	border: 2px solid #e5e7eb;
	overflow: hidden;
	z-index: 100;
	min-width: 160px;
}

.contact-item {
	width: 100%;
	padding: 12px 16px;
	background: none;
	border: none;
	text-align: left;
	cursor: pointer;
	font-size: 14px;
	color: #374151;
	transition: all 0.2s ease;
	font-weight: 500;
	display: flex;
	align-items: center;
	gap: 8px;
}

.contact-item:hover {
	background: #f9fafb;
	color: #10b981;
}

.contact-icon {
	width: 16px;
	height: 16px;
}

.loading-spinner {
	width: 20px;
	height: 20px;
	border: 2px solid transparent;
	border-top: 2px solid currentColor;
	border-radius: 50%;
	animation: spin 1s linear infinite;
}

/* Stats Section */
.stats-section {
	margin-top: -20px;
	position: relative;
	z-index: 3;
	padding: 0 0 40px;
}

.stats-container {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
	gap: 16px;
	max-width: 800px;
	margin: 0 auto;
}

.stat-card {
	background: white;
	border-radius: 16px;
	padding: 24px;
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	display: flex;
	align-items: center;
	gap: 16px;
	transition: all 0.2s ease;
}

.stat-card:hover {
	transform: translateY(-2px);
	box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.stat-icon {
	width: 48px;
	height: 48px;
	border-radius: 12px;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
}

.stat-icon.rating {
	background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
}

.stat-icon.products {
	background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.stat-icon.followers {
	background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
}

.stat-icon.store {
	background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
}

.stat-icon .icon {
	width: 24px;
	height: 24px;
	color: white;
}

.stat-content {
	display: flex;
	flex-direction: column;
}

.stat-number {
	font-size: 24px;
	font-weight: 700;
	color: #1f2937;
	line-height: 1.2;
}

.stat-label {
	font-size: 14px;
	color: #6b7280;
	font-weight: 500;
}

.stat-subtext {
	font-size: 12px;
	color: #9ca3af;
	font-weight: 400;
	margin-top: 2px;
}

.stat-card.clickable {
	cursor: pointer;
}

.stat-card.clickable:hover {
	transform: translateY(-4px);
	box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2);
}

.rating-stars {
	display: flex;
	gap: 2px;
	margin-top: 4px;
}

.rating-stars .star {
	width: 12px;
	height: 12px;
	color: #d1d5db;
	transition: color 0.2s ease;
}

.rating-stars .star.filled {
	color: #fbbf24;
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

/* Products Section */
.products-section {
	padding: 40px 0;
	background: white;
}

.section-header {
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	margin-bottom: 32px;
	gap: 24px;
}

.section-title h2 {
	font-size: 32px;
	font-weight: 700;
	color: #1f2937;
	margin: 0 0 8px 0;
}

.section-subtitle {
	font-size: 16px;
	color: #6b7280;
	margin: 0;
}

/* Controls Section */
.controls-section {
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 16px;
	flex-wrap: wrap;
}

.products-count {
	color: #6b7280;
	font-size: 14px;
	font-weight: 500;
}

.count-text {
	padding: 8px 12px;
	background: #f3f4f6;
	border-radius: 8px;
}

/* Sort Dropdown */
.sort-dropdown {
	position: relative;
	flex-shrink: 0;
}

.sort-button {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 12px 16px;
	background: white;
	border: 2px solid #e5e7eb;
	border-radius: 12px;
	cursor: pointer;
	font-size: 14px;
	font-weight: 600;
	color: #374151;
	transition: all 0.2s ease;
	min-width: 180px;
}

.sort-icon {
	width: 16px;
	height: 16px;
	color: #10b981;
}

.sort-button:hover {
	border-color: #10b981;
	box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
}

.sort-button.active {
	border-color: #10b981;
	background: #f0fdf4;
}

.chevron {
	width: 16px;
	height: 16px;
	transition: transform 0.2s ease;
	flex-shrink: 0;
}

.chevron.rotated {
	transform: rotate(180deg);
}

.dropdown-menu {
	position: absolute;
	top: calc(100% + 8px);
	left: 0;
	right: 0;
	background: white;
	border: 2px solid #e5e7eb;
	border-radius: 12px;
	box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
	z-index: 100;
	overflow: hidden;
}

.dropdown-item {
	width: 100%;
	padding: 12px 16px;
	background: none;
	border: none;
	text-align: left;
	cursor: pointer;
	font-size: 14px;
	color: #374151;
	transition: all 0.2s ease;
	font-weight: 500;
}

.dropdown-item:hover {
	background: #f9fafb;
}

.dropdown-item.active {
	background: #10b981;
	color: white;
}

.dropdown-item {
	display: flex;
	align-items: center;
	gap: 8px;
}

.dropdown-icon {
	width: 16px;
	height: 16px;
}

.check-icon {
	width: 16px;
	height: 16px;
	margin-left: auto;
}

/* Dropdown Transitions */
.dropdown-enter-active,
.dropdown-leave-active {
	transition: all 0.2s ease;
}

.dropdown-enter-from {
	opacity: 0;
	transform: translateY(-10px);
}

.dropdown-leave-to {
	opacity: 0;
	transform: translateY(-10px);
}

/* Product Grid */
.product-grid {
	min-height: 400px;
}

.empty-products {
	text-align: center;
	padding: 60px 20px;
	color: #6b7280;
}

.empty-icon {
	width: 80px;
	height: 80px;
	margin: 0 auto 24px;
	background: #f3f4f6;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
}

.empty-icon .icon {
	width: 40px;
	height: 40px;
	color: #9ca3af;
}

.empty-products h3 {
	font-size: 24px;
	font-weight: 600;
	color: #374151;
	margin: 0 0 12px 0;
}

.empty-products p {
	font-size: 16px;
	margin: 0;
	max-width: 400px;
	margin-left: auto;
	margin-right: auto;
}

/* Responsive Design */
@media (max-width: 768px) {
	.container {
		padding: 0 12px;
	}

	.hero-section {
		padding: 16px 0 32px;
	}

	.profile-header {
		flex-direction: column;
		align-items: center;
		text-align: center;
		gap: 16px;
	}

	.store-name {
		font-size: 24px;
	}

	.store-description {
		text-align: center;
	}

	.action-buttons {
		justify-content: center;
	}

	.stats-container {
		grid-template-columns: repeat(2, 1fr);
		gap: 12px;
	}

	.stat-card {
		padding: 16px;
		flex-direction: column;
		text-align: center;
		gap: 8px;
	}

	.stat-icon {
		width: 40px;
		height: 40px;
	}

	.stat-icon .icon {
		width: 20px;
		height: 20px;
	}

	.stat-number {
		font-size: 20px;
	}

	.section-header {
		flex-direction: column;
		align-items: stretch;
		gap: 16px;
	}

	.section-title {
		text-align: center;
	}

	.section-title h2 {
		font-size: 24px;
	}

	.sort-dropdown {
		align-self: center;
	}
}

@media (max-width: 480px) {
	.stats-container {
		grid-template-columns: 1fr;
	}

	.back-button {
		padding: 6px 12px;
		font-size: 14px;
	}

	.avatar-image {
		width: 80px;
		height: 80px;
	}

	.store-name {
		font-size: 20px;
	}

	.store-meta {
		justify-content: center;
		gap: 12px;
	}

	.action-buttons {
		flex-direction: column;
		width: 100%;
	}

	.follow-button,
	.message-button {
		justify-content: center;
		width: 100%;
	}
}

/* Focus and Accessibility */
.back-button:focus-visible,
.follow-button:focus-visible,
.message-button:focus-visible,
.sort-button:focus-visible {
	outline: 2px solid #10b981;
	outline-offset: 2px;
}

/* High contrast mode support */
@media (prefers-contrast: high) {
	.stat-card {
		border: 2px solid #e5e7eb;
	}
	
	.sort-button {
		border-width: 2px;
	}
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
	.stat-card,
	.back-button,
	.follow-button,
	.message-button,
	.sort-button {
		transition: none;
	}
	
	.chevron {
		transition: none;
	}
}
</style>
