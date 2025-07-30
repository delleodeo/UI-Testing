<template>
  <div class="edit-form-container">
    <h2>Edit Product</h2>

    <form @submit.prevent="handleSubmit">
      <div class="form-group">
        <label>Product Name</label>
        <input v-model="form.name" type="text" required />
      </div>

      <div class="form-group">
        <label>Description</label>
        <textarea v-model="form.description" required></textarea>
      </div>

      <div v-if="!hasOption">
        <div class="form-group">
          <label>Price</label>
          <input v-model.number="form.price" type="number" required />
        </div>

        <div class="form-group">
          <label>Stock</label>
          <input v-model.number="form.stock" type="number" required />
        </div>
      </div>

      <div v-else>
        <h3>Options</h3>
        <div v-for="(opt, index) in form.option" :key="index" class="option-group">
          <div class="form-group">
            <label>Label</label>
            <input v-model="opt.label" type="text" required />
          </div>

          <div class="form-group">
            <label>Price</label>
            <input v-model.number="opt.price" type="number" required />
          </div>

          <div class="form-group">
            <label>Stock</label>
            <input v-model.number="opt.stock" type="number" required />
          </div>

          <div class="form-group">
            <label>Image URL</label>
            <input v-model="opt.imageUrl" type="text" />
          </div>

          <button type="button" class="remove-button" @click="removeOption(index)">Remove Option</button>
        </div>

        <button type="button" class="add-button" @click="addOption">Add Option</button>
      </div>

      <button type="submit" class="submit-button">Save Changes</button>
    </form>
  </div>
</template>

<script setup>
import { reactive, toRefs } from 'vue'

const props = defineProps({
  product: Object
})

const hasOption = !!props.product.option?.length

const form = reactive({
  name: props.product.name,
  description: props.product.description,
  price: props.product.price || 0,
  stock: props.product.stock || 0,
  option: hasOption ? JSON.parse(JSON.stringify(props.product.option)) : []
})

const addOption = () => {
  form.option.push({ label: '', price: 0, stock: 0, imageUrl: '', isHot: false, sold: 0 })
}

const removeOption = (index) => {
  form.option.splice(index, 1)
}

const handleSubmit = () => {
  // Emit or save logic here
  console.log('Submitted form:', form)
}
</script>

<style scoped>
.edit-form-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 1rem;
  background-color: #fff;
  border: 1px solid #ddd;
  border-radius: 6px;
}

h2, h3 {
  margin-bottom: 1rem;
  font-size: 1.5rem;
}

.form-group {
  margin-bottom: 1rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: bold;
}

input[type="text"],
input[type="number"],
textarea {
  width: 100%;
  padding: 0.5rem;
  font-size: 1rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}

textarea {
  min-height: 100px;
  resize: vertical;
}

button {
  padding: 0.5rem 1rem;
  font-size: 1rem;
  border: none;
  cursor: pointer;
  border-radius: 4px;
}

.submit-button {
  background-color: #0d6efd;
  color: #fff;
}

.add-button {
  background-color: #198754;
  color: #fff;
  margin-bottom: 1rem;
}

.remove-button {
  background-color: #dc3545;
  color: #fff;
  margin-top: 0.5rem;
}

.option-group {
  border: 1px dashed #ccc;
  padding: 1rem;
  margin-bottom: 1rem;
  border-radius: 4px;
}
</style>
