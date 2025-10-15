<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, defineEmits, computed, watch } from "vue";
import { useProductsStore } from "../stores/productStores";
const productStore = useProductsStore()
import {
    ChevronDownIcon,
    MapPinIcon,
    TagIcon,
    AdjustmentsHorizontalIcon,
} from "@heroicons/vue/24/outline";
import { CategorySelectedEvent } from "../types/product";
import { useTheme } from "../composables/useTheme";

const emits = defineEmits(['scrollTop'])
const { isDark } = useTheme();
const openDropdown = ref<string | null>(null);
const selectedMunicipality = ref("By Municipality");
const selectedProduct = ref("By Product");
const selectedFilter = ref("Filter");

const hanldecScroll = () => {
    emits('scrollTop')
}


const municipalities = [
    "All",
    "Baco",
    "Bansud",
    "Bongabong",
    "Bulalacao",
    "Calapan City",     // the capital and only city
    "Gloria",
    "Mansalay",
    "Naujan",
    "Pinamalayan",
    "Pola",
    "Puerto Galera",
    "Roxas",
    "San Teodoro",
    "Socorro",
    "Victoria"
].sort();


const products = [
    "All",
    "Native Delicacies",         // e.g. Suman sa Lihiya, Kalamay
    "Dried Fish & Seafood",      // e.g. Danggit, Dilis, Pusit
    "Fruits & Produce",          // e.g. Mangosteen, Banana Chips, Kalamansi
    "Local Snacks",              // e.g. Uraro cookies, Banana Chips
    "Herbal & Wellness Products",// e.g. Virgin Coconut Oil, Herbal Liniments
    "Coffee & Cacao",            // e.g. Local brewed coffee, tablea
    "Honey Products",            // e.g. Pure Mindoro honey
    "Handicrafts",               // e.g. Nito crafts, bamboo items
    "Woodcrafts",                // e.g. Souvenir carvings, trays
    "Woven Products",            // e.g. Baskets, bayong, banig
    "Souvenir Items",            // e.g. Keychains, T-shirts, Mugs
    "Condiments & Spices",       // e.g. Native vinegar, chili oil
    "Apparel & Accessories"      // e.g. Shirts with Mindoro prints, beadwork
].sort();

const filters = [
    "Price: Low to High",
    "Price: High to Low",
    "Most Sold",
    "Best Rating",
];

const toggleDropdown = (dropdown: string | null) => {
    openDropdown.value = openDropdown.value === dropdown ? null : dropdown;
};

const selectMunicipality = (city: string) => {
    selectedMunicipality.value = city;
    handleCategorySelected({ type: "municipality", value: city });
    openDropdown.value = null;
    hanldecScroll()
    console.table(city)
};

const selectProduct = (product: string) => {
    selectedProduct.value = product;
    handleCategorySelected({ type: "product", value: product });
    openDropdown.value = null;
    hanldecScroll()
};

const selectFilter = (filter: string) => {
    selectedFilter.value = filter;
    handleCategorySelected({ type: "filter", value: filter });
    openDropdown.value = null;
    hanldecScroll()
};

const handleCategorySelected = async (payload: CategorySelectedEvent) => {
    productStore.isFetched = false
    if (payload.type === "product")
        productStore.filterByCategory(payload.value);
    if (payload.type === "filter")
        productStore.filterProducts(selectedFilter.value)
    if (payload.type === "municipality")
        productStore.filterByMunicilipality(selectedMunicipality.value)


    // await productStore.fetchProductsByCategory(payload.value, selectedFilter.value, true);
};


const dropdownContainer = ref<HTMLDivElement | null>(null);

const handleClickOutside = (event: MouseEvent) => {
    if (dropdownContainer.value && !dropdownContainer.value.contains(event.target as Node)) {
        openDropdown.value = null;
    }
};

onMounted(() => {
    document.addEventListener("click", handleClickOutside);
});

onBeforeUnmount(() => {
    document.removeEventListener("click", handleClickOutside);
});




// watch([selectFilter, selectProduct], ([newVal1, oldVal1], [newVal2, oldVal2]) => {
//     productStore.filter = String(newVal1);
//      productStore.selectedCategory = String(newVal2);
// })
</script>


<template>
    <section ref="dropdownContainer" class="category-filter-dropdown">
        <div class="con">
            <div class="category">
                <div class="dropdown">
                    <button class="dropdown-btn" @click="toggleDropdown('municipality')">
                        <MapPinIcon class="icon" />
                        <span class="dropdown-text">{{ selectedMunicipality }}</span>
                        <ChevronDownIcon class="icon-chevron"
                            :class="{ 'rotate-180': openDropdown === 'municipality' }" />
                    </button>
                    <ul v-if="openDropdown === 'municipality'" class="dropdown-menu">
                        <li v-for="city in municipalities" :key="city" @click="selectMunicipality(city)">
                            {{ city }}
                        </li>
                    </ul>
                </div>

                <!-- Product -->
                <div class="dropdown">
                    <button class="dropdown-btn" @click="toggleDropdown('product')">
                        <TagIcon class="icon" />
                        <span class="dropdown-text">{{ selectedProduct }}</span>
                        <ChevronDownIcon class="icon-chevron" :class="{ 'rotate-180': openDropdown === 'product' }" />
                    </button>
                    <ul v-if="openDropdown === 'product'" class="dropdown-menu">
                        <li v-for="product in products" :key="product" @click="selectProduct(product)">
                            {{ product }}
                        </li>
                    </ul>
                </div>
            </div>

            <!-- Filter -->
            <div class="dropdown">
                <button class="dropdown-btn" @click="toggleDropdown('filter')">
                    <AdjustmentsHorizontalIcon class="icon" />
                    <span class="dropdown-text">{{ selectedFilter }}</span>
                    <ChevronDownIcon class="icon-chevron" :class="{ 'rotate-180': openDropdown === 'filter' }" />
                </button>
                <ul v-if="openDropdown === 'filter'" class="dropdown-menu">
                    <li v-for="filter in filters" :key="filter" @click="selectFilter(filter)">
                        {{ filter }}
                    </li>
                </ul>
            </div>
        </div>
    </section>
</template>

<style scoped>
.category-filter-dropdown {
    width: 100%;
    background-color: var(--bg-primary);
    z-index: 66;
    transition: background-color var(--transition-fast);
}


.con {
    animation: fadeIn 0.17s ease-out;
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    justify-content: space-between;
    align-items: center;
    max-width: 1200px;
    margin: 0 auto;
    padding: 5px 8px;
}

.dropdown {
    position: relative;

}

.category {
    display: flex;
    height: fit-content;
    gap: 5px;
    flex: 1 1 auto;
}

.dropdown-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background-color: var(--surface);
    color: var(--text-primary);
    border: 1px solid var(--border-color);
    border-radius: 0.5rem;
    padding: 10px 10px;
    cursor: pointer;
    transition: all var(--transition-fast);
    min-width: 180px;
    max-width: 100%;
    font-size: 16px;
}

.dropdown-btn:hover {
    box-shadow: var(--shadow-small);
    background-color: var(--surface-hover);
}

.dropdown-text {
    flex-grow: 1;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
}

.icon,
.icon-chevron {
    flex-shrink: 0;
    width: 20px;
    height: 20px;
}

.icon-chevron {
    margin-left: auto;
    transition: transform 0.3s ease;
}

.rotate-180 {
    transform: rotate(180deg);
}

.dropdown-menu {
    position: absolute;
    top: 110%;
    left: 0;
    right: 0;
    background-color: var(--surface);
    border: 1px solid var(--border-color);
    border-radius: 0.5rem;
    box-shadow: var(--shadow-medium);
    z-index: 20;
    list-style: none;
    padding: 0.5rem 3px;
    padding-bottom: 0;
    max-height: 22rem;
    overflow: auto;
    scrollbar-width: thin;
    font-size: clamp(14px, 2vw, 16px);
    transition: all var(--transition-fast);
}

.dropdown-menu li {
    padding: 10px 5px;
    cursor: pointer;
    transition: all var(--transition-fast);
    border-bottom: 1px solid var(--border-color);
    color: var(--text-primary);
}

.dropdown-menu li:hover {
    background-color: var(--surface-hover);
    color: var(--primary-color);
}

@media (max-width: 640px) {
    .dropdown-btn {
        min-width: 120px !important;
        justify-content: flex-start;
        padding: 8px 10px;
    }

    .dropdown-text {
        font-size: 12px;
        max-width: 12ch;
    }
}

@media (max-width: 540px) {
    .dropdown-text {
        font-size: 10.78px;
        max-width: 7ch;
    }

    .dropdown-btn {
        padding: 5px 10px;
    }
}
</style>
