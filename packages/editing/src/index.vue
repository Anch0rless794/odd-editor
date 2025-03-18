<template>
  <div class="odd-editing">
    <div ref="editingRef" class="odd-editing-area" contenteditable="true" @input="onInput"></div>
    <div class="odd-placeholder" v-show="showPlaceholder">Type Here...</div>
  </div>
</template>

<script>
import emitter from "packages/utils/emitter";

export default {
  name: "OddEditing",
  data() {
    return {
      showPlaceholder: true,
    };
  },
  methods: {
    getRef() {
      return this.$refs.editingRef;
    },
    onInput() {
      const $el = this.getRef();
      this.showPlaceholder = ($el.innerText.trim() === '');
    },
    applyFormat({type, value}) {
      const selection = window.getSelection();
      const range = selection.rangeCount ? selection.getRangeAt(0) : null;

      if (range && !range.collapsed) {
        // **选中情况：直接应用格式**
        const span = document.createElement('span');
        this.updateStyle(span, type, value);
        span.appendChild(range.extractContents());
        range.insertNode(span);
        selection.removeAllRanges();
        range.selectNodeContents(span);
        range.collapse(false); // **光标移动到新内容之后**
        selection.addRange(range);
      } else {
        // **未选中文本：更新 activeStyle，并插入样式 span**
        const editor = this.$refs.editingRef;
        const span = document.createElement('span');
        this.updateStyle(span, null, null); // 应用 activeStyle
        span.innerHTML = '&#8203;'; // **插入零宽空格，防止 span 消失**

        // **特殊情况处理：如果 `editor` 为空**
        if (editor.childNodes.length === 0) {
          editor.appendChild(span);
        } else {
          // **正常情况：在当前光标位置插入 span**
          const newRange = document.createRange();
          newRange.setStartAfter(editor.lastChild);
          newRange.setEndAfter(editor.lastChild);
          newRange.insertNode(span);
        }
        // **确保光标进入 span 内部的最后**
        const newSelection = window.getSelection();
        const newRange = document.createRange();
        newRange.selectNodeContents(span);
        newRange.collapse(false); // **将光标放在 span 内部末尾**
        newSelection.removeAllRanges();
        newSelection.addRange(newRange);
      }
    },
    applyActiveStyle() {
      const editor = this.$refs.editingRef;
      const lastNode = editor.lastChild;

      if (lastNode && lastNode.nodeType === Node.TEXT_NODE) {
        // 创建一个 span 包裹最后输入的文字，并应用 activeStyle
        const span = document.createElement('span');
        this.updateStyle(span, null, null);
        span.textContent = lastNode.textContent;
        editor.replaceChild(span, lastNode);

        // **确保光标在新插入的 span 内部的末尾**
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(span);
        range.collapse(false); // **光标放到 span 内部最后**
        selection.removeAllRanges();
        selection.addRange(range);
      }
    },
    updateStyle(element, type, value) {
      if (type === 'bold') {
        element.style.fontWeight = 'bold';
        this.activeStyle.fontWeight = 'bold';
      } else if (type === 'italic') {
        element.style.fontStyle = 'italic';
        this.activeStyle.fontStyle = 'italic';
      } else if (type === 'underline') {
        element.style.textDecoration = 'underline';
        this.activeStyle.textDecoration = 'underline';
      } else if (type === 'color') {
        element.style.color = value;
        this.activeStyle.color = value;
      }

      // **应用已有的 activeStyle**
      Object.assign(element.style, this.activeStyle);
    }
  },
  mounted() {
    emitter.on('format', this.applyFormat);
    this.getRef().innerHTML = ''
  }
};
</script>

<style scoped lang="less">
.odd-editing {
  --p: 5px;
  --border-color: #e1e3e5;
  --border-radius: 4px;
  position: relative;

  .odd-editing-area {
    position: relative;
    padding: var(--p);
    min-height: 80px;
    border: 1px solid var(--border-color);
    border-radius: 0 0 var(--border-radius) var(--border-radius);
    outline: none;
    z-index: 9;
  }

  .odd-placeholder {
    position: absolute;
    left: var(--p);
    top: var(--p);
    color: #d4d4d4;
    font-style: italic;
    user-select: none;
    pointer-events: none;
    z-index: 0;
  }
}
</style>

