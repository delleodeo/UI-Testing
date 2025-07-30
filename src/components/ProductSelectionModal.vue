<script setup lang="ts">
import { ref, defineProps, watch, defineEmits, nextTick } from "vue";
import { Alert } from "./composable/Alert.js";
import { XMarkIcon } from '@heroicons/vue/24/solid';
import type { ProductOption, SelectedItems } from '../types/product';
import { useProductsStore } from "../stores/productStores";
import { useCartStore } from "../stores/cartStores";

const productStore = useProductsStore()
const cartStore = useCartStore()
const props = defineProps<{
  isOpen: boolean;
  optData: any;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

// Selected option ID as string to match ProductOption._id
const selectedOptionId = ref<string>("");

// Selected item details for UI
const selectedItem = ref<SelectedItems>({
  price: 0,
  label: "",
  img: "",
  productId: "",
  optionId: ""
});

const closeModal = () => emit('close');

// When modal opens, initialize selection with first option
watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen && props.optData?.option?.length) {
      const firstOption = props.optData.option[0];
      updateSelectedItem(firstOption);
    }
  },
  { immediate: true }
);

// Change selected option
const updateSelectedItem = (option: ProductOption) => {
  selectedItem.value = {
    price: option.price,
    label: option.label,
    img: option.imageUrl,
    optionId: option._id,
    productId: props.optData._id
  };
  selectedOptionId.value = option._id;
};

const handleOptionChange = (option: ProductOption) => {
  updateSelectedItem(option);
};

const addToCart = async () => {
  if (!selectedOptionId.value) {
    Alert("Please select a product option first.", "warning", "#c56c00");
    return;
  }
  await productStore.addToCart(selectedItem.value.optionId, selectedItem.value.productId)

  closeModal()
  cartStore.isFetched = false
  await cartStore.fetchCart();
  await nextTick();
  cartStore.itemCount();
  return
}

</script>


<template>
  <transition name="fade-scale">
    <div v-if="isOpen" class="backdrop" @click.self="closeModal">
      <div class="modal" @click.stop>
        <button @click="closeModal" class="close-btn">
          <XMarkIcon class="icon" />
        </button>

        <h4>Options Selection</h4>
        <div class="content">
          <div class="options display">
            <div class="img-container">
              <img :src="selectedItem.img" alt="" />
            </div>
            <div class="name-price">
              <p class="name">{{ selectedItem.label }}</p>
              <p class="price">${{ selectedItem.price.toFixed(2) }}</p>
            </div>
          </div>

          <div class="select">
            <template v-for="(opt, oIndex) in optData.option" :key="opt._id">
              <div v-if="opt.stock > 0" @click="handleOptionChange(opt)"
                :class="['items', { active: selectedOptionId === opt._id }]">
                <div class="select-img-container">
                  <img :src="opt.imageUrl || selectedItem.img" alt="" />
                </div>
                <p class="label">{{ opt.label }}</p>
              </div>
            </template>
          </div>


          <div v-if="productStore.isLoading" class="custom-loader-container">
            <div class="wave-loader">
              <div class="wave-circle"></div>
              <div class="wave-circle"></div>
              <div class="wave-circle"></div>
            </div>
          </div>

          <button v-if="!productStore.isLoading" @click="addToCart" class="add-cart-btn">
            <p>Add to Cart : <span>${{ selectedItem.price.toFixed(2) }}</span></p>
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>


<style scoped>
/* Backdrop styling */
.backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100dvh;
  background-color: rgba(0, 0, 0, 0.5);
  /* dark overlay */
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

/* Modal box styling */

/* Buttons */
.add-cart-btn {
  border: none;
  background-color: var(--primary-color);
  color: white;
  height: 2.8rem;
  border-radius: 10px;
  cursor: pointer;
  transition: var(--transition-fast);
}

.add-cart-btn span {
  font-weight: 600;
}

.add-cart-btn:hover {
  opacity: .8;
}

/* Vue transition classes for fade & scale */
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

.modal {
  padding: 20px;
  border-radius: 1rem;
  width: clamp(340px, 95vw, 400px);
  max-width: 90%;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  gap: 10px;
  background-color: var(--background-color);
  position: relative;
  transition: all 100ms;
  border-top: 5px solid var(--primary-color);
  border-bottom: 5px solid var(--primary-color);
}

.content {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
}

.display {
  width: 100%;
  height: fit-content;
  display: flex;
  gap: 10px;
  border: 1px dashed var(--secondary-color);
  padding: 5px;
  border-radius: 5px;
}

.img-container {
  height: 5rem;
  aspect-ratio: 1;
}

.img-container img {
  height: 100%;
  aspect-ratio: 1;
  background-color: rebeccapurple;
  border-radius: 5px;
  object-fit: fill;
  background-position: center;
}

.name-price {
  display: flex;
  flex-direction: column;
  gap: 5px;
  font-weight: 600;
  flex: 1;
}

.name-price .price {
  color: var(--secondary-color);
}

.name-price .name {
  font-size: clamp(12px, 3vw, 16px);
  max-width: 90%;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  padding-top: 5px;
  width: 100%;
}

.select {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(calc(50% - 10px), 0.5fr));
  gap: 10px;
  height: fit-content;
  max-height: 12rem;
  overflow-y: scroll;
  scrollbar-width: thin;
  min-height: 4rem;
}

.select-img-container {
  height: 3rem;
  aspect-ratio: 1;
}

.select-img-container img {
  height: 100%;
  aspect-ratio: 1;
  background-color: var(--primary-color);
  border-radius: 3px;
}

.items {
  height: fit-content;
  background-color: rgba(243, 236, 212, 0.568);
  border-radius: 5px;
  display: flex;
  padding: 3px;
  border: 1px solid rgb(221, 221, 221);
  gap: 5px;
  transition: all 100ms;
  cursor: pointer;
}

.items:not(.active):hover {
  opacity: .7;
}

.items .label {
  font-size: clamp(10px, 2vw, 14px);
  max-width: 80%;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  height: 100%;
  padding-top: 5px;
}

.details-con .description {
  font-size: clamp(var(--font-size-sm), 3vw, var(--font-size-base));
}

.items.active {
  border: 1px dashed var(--secondary-color);
  background-color: wheat;
}

.close-btn {
  position: absolute;
  right: 10px;
  top: 10px;
  aspect-ratio: 1;
  background-color: transparent;
  border: 0;
  outline: 0;

}

.close-btn .icon {
  height: 1.5rem;
  cursor: pointer;
  transition: all 100ms;
  color: black;
}

.close-btn .icon:hover {
  opacity: .8;
}

.custom-loader-container {
  width: 100%;
  aspect-ratio: 1;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  background-color: rgba(226, 214, 214, 0.377);
  height: 40px;

}

.wave-loader {
  position: relative;

  height: 20px;
  aspect-ratio: 1;
}

.wave-circle {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border: 4px solid var(--primary-color, #4f46e5);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  animation: ripple 1.5s infinite;
  opacity: 0;
}

.wave-circle:nth-child(2) {
  animation-delay: 0.5s;
}

.wave-circle:nth-child(3) {
  animation-delay: 1s;
}

@keyframes ripple {
  0% {
    width: 0;
    height: 0;
    opacity: 1;
  }

  100% {
    width: 70px;
    height: 70px;
    opacity: 0;
  }
}

/* Dark mode support
@media (prefers-color-scheme: dark) {
  .custom-loader-container {
    background: rgba(0, 0, 0, 0.6);
  }
} */
</style>
