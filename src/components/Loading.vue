<template>
  <div class="loading-card">
    <div class="loading-img skeleton"></div>
    <div class="loading-details">
      <div class="loading-line skeleton short"></div>
      <div class="loading-line skeleton long"></div>
      <div class="loading-rating skeleton"></div>
      <div class="loading-price skeleton"></div>
    </div>
  </div>
</template>

<style scoped>
.loading-card {
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 12rem;
  border: 1px solid rgba(219, 217, 207, 0.521);
  box-shadow: 0 0 1px rgba(0, 0, 0, 0.2);
  animation: pulse 1.5s infinite;
  background: #f6f7f8;
}

.loading-img {
  width: 100%;
  aspect-ratio: 1;
}

.loading-details {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding: 8px;
}

.loading-line {
  height: 12px;
  border-radius: 4px;
}

.loading-line.short {
  width: 50%;
}

.loading-line.long {
  width: 80%;
}

.loading-rating,
.loading-price {
  height: 12px;
  width: 40%;
  border-radius: 4px;
}

.skeleton {
  background: linear-gradient(
    90deg,
    #eeeeee 25%,
    #dddddd 50%,
    #eeeeee 75%
  );
  background-size: 400% 100%;
}

@keyframes pulse {
  0% {
    background-position: 100% 0;
  }
  100% {
    background-position: -100% 0;
  }
}
</style>
