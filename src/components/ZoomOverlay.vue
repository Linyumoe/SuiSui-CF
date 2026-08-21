<script setup lang="ts">
defineProps<{ url: string }>()
const emit = defineEmits<{ close: [] }>()
</script>

<template>
  <teleport to="body">
    <div class="zoom-overlay" @click="emit('close')">
      <button class="zoom-close-btn" @click.stop="emit('close')">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
      </button>
      <img :src="url" alt="" class="zoom-img" @click.stop />
    </div>
  </teleport>
</template>

<style scoped>
.zoom-overlay {
  position: fixed; inset: 0; z-index: 9999;
  background: rgba(0,0,0,0.8);
  display: flex; align-items: center; justify-content: center;
  cursor: zoom-out;
  animation: zoomFadeIn 0.25s ease;
}
.zoom-img {
  max-width: 90vw; max-height: 90vh;
  border-radius: 8px; object-fit: contain; cursor: default;
}
.zoom-close-btn {
  position: fixed; top: 16px; right: 16px;
  width: 36px; height: 36px; border-radius: 50%; border: none;
  background: rgba(255,255,255,0.15); color: #fff;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: background 0.2s; z-index: 10000;
}
.zoom-close-btn:hover { background: rgba(255,255,255,0.3); }
@keyframes zoomFadeIn { from { opacity: 0 } to { opacity: 1 } }
</style>
