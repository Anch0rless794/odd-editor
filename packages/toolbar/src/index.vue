<template>
  <div class="toolbar">
    <button @click="formatText('bold')">B</button>
    <button @click="formatText('italic')">I</button>
    <button @click="formatText('underline')">U</button>
    <input type="color" @change="setColor"/>
  </div>
</template>

<script>
import emitter from "packages/utils/emitter";
export default {
  name: "OddToolbar",
  methods: {
    formatText(type) {
      emitter.emit('format', { type });
    },
    setColor(event) {
      emitter.emit('format', {type: 'color', value: event.target.value});
    }
  }
};
</script>

<style>
.toolbar {
  display: flex;
  gap: 8px;
  padding: 8px;
  background: #f5f5f5;
  border-bottom: 1px solid #ddd;
}

button {
  padding: 5px;
  font-weight: bold;
  cursor: pointer;
}
</style>
