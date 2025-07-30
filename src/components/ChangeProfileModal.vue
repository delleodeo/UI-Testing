<script setup lang="ts">
import ImageCropper from './ImageCropper.vue';
import { XMarkIcon } from '@heroicons/vue/24/outline';
import { defineEmits } from 'vue';

const emits = defineEmits(['closeModal']);

const hanldeClose = () =>    {
  emits('closeModal');
}

</script>
<template>
  <div class="image-cropper">
    <button @click="hanldeClose">
      <XMarkIcon></XMarkIcon>
    </button>
    <ImageCropper></ImageCropper>
  </div>

</template>
<style scoped>
.image-cropper {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 10000;
  height: 100dvh;
  width: 100dvw;
  background-color: rgba(0, 0, 0, 0.562);
  backdrop-filter: blur(3px);
  display: flex;
  justify-content: center;
  align-items: center;
  
}

button{
  position: absolute;
  top: 10px;
  right: 10px;
  height: 2rem;
  aspect-ratio: 1;
  background-color: transparent;
  border: 0;
  color: rgb(255, 145, 0);
}
</style>