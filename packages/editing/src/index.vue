<template>
  <div class="odd-editing">
    <div ref="editingRef" class="odd-editing-area" contenteditable="true" @beforeinput="onBeforeInput"></div>
    <!--    <div class="odd-placeholder" v-show="showPlaceholder">Type Here...</div>-->
  </div>
</template>

<script>

export default {
  name: "OddEditing",
  data() {
    return {
      showPlaceholder: true,
      history: [],
      historyIndex: -1,
    };
  },
  methods: {
    getRef() {
      return this.$refs.editingRef;
    },
    /**
     * @description 使用 p 标签包裹内容,确保 editor 不会为空
     * */
    ensureEditorNotEmpty() {
      const $el = this.getRef()
      if (!$el.innerHTML.trim()) {
        const paragraph = document.createElement("p");
        paragraph.append(document.createElement("br"))
        $el.append(paragraph)
      }
    },
    /**
     * @description 移动光标到指定位置
     * */
    moveRange(range, element, offset) {
      range.setStart(element, offset);
      range.setEnd(element, offset);
      window.getSelection().removeAllRanges();
      window.getSelection().addRange(range);
    },
    /**
     * @description 处理文本输入
     *
     * @param {Range} range
     * @param {String} data
     * */
    insertText(range, data) {
      const {startContainer, startOffset} = range
      const paragraph = startContainer.nodeType === Node.TEXT_NODE ? startContainer.parentNode : startContainer;

      if (!paragraph.textContent) {
        paragraph.append(document.createTextNode(""));
      }

      const textContent = paragraph.textContent;
      paragraph.textContent = textContent.slice(0, startOffset) + data + textContent.slice(startOffset);

      this.moveRange(range, paragraph.firstChild, startOffset + data.length)
    },
    /**
     * @description 插入新行
     *
     * @param {Range} range
     * */
    insertParagraph(range) {
      const {startContainer, startOffset} = range
      const paragraph = startContainer.nodeType === Node.TEXT_NODE ? startContainer.parentNode : startContainer;

      if (!paragraph || paragraph === this.getRef()) return;

      const newParagraph = paragraph.cloneNode(false);
      const text = paragraph.textContent;
      const beforeText = text.slice(0, startOffset);
      const afterText = text.slice(startOffset);

      if (beforeText) {
        paragraph.textContent = beforeText;
      } else {
        paragraph.replaceChildren(document.createElement("br"))
        // paragraph.innerHTML = "<br />";
      }

      if (afterText) {
        newParagraph.textContent = afterText;
      } else {
        newParagraph.append(document.createElement("br"));
      }

      paragraph.after(newParagraph);

      this.moveRange(range, newParagraph, 0);
    },
    /**
     * @description
     *
     * @param {Range} range
     * */
    deleteContent(range) {
      // TODO: 光标在行首时，删除则合并行，并移动光标位置
      if (range.collapsed) {
        range.setStart(range.startContainer, Math.max(0, range.startOffset - 1));
        range.deleteContents();

        const {startContainer, startOffset} = range

        const paragraph = startContainer.nodeType === Node.TEXT_NODE ? startContainer.parentNode : startContainer;

        if (paragraph) {


          if (this.isBrParagraph(paragraph)) {
            const prevParagraph = paragraph.previousElementSibling
            if (prevParagraph) {
              const lastNode = prevParagraph.lastChild
              if (lastNode?.nodeType === Node.TEXT_NODE) {
                range.setStart(lastNode, lastNode.textContent.length);
                this.moveRange(range, lastNode, lastNode.textContent.length);
              } else if (lastNode?.tagName === "BR") {
                range.setStartBefore(lastNode)
              }
              paragraph.remove();
            }
          }


          if (this.isEmptyParagraph(paragraph)) {
            paragraph.append(document.createElement("br"))
            this.moveRange(range, paragraph, 0)
          }

          if (startOffset === 0) { // 光标在行首
            const prevParagraph = paragraph.previousElementSibling
            if (prevParagraph) {
              const lastNode = prevParagraph.lastChild;

              while (paragraph.firstChild) {
                prevParagraph.append(paragraph.firstChild)
              }

              paragraph.remove();
              this.setCaretToEnd(lastNode || prevParagraph);
            }
          }

        }
      } else {
        range.deleteContents();
        const $el = this.getRef();
        // 可能时全选或者部分选中
        const {startContainer, endContainer, startOffset, endOffset} = range;
        let startBlock, endBlock

        if (startContainer === $el) {
          startBlock = $el.children[Math.min(startOffset, endOffset - 1)];
        }

        if (endContainer === $el) {
          endBlock = $el.children[Math.max(startOffset, endOffset - 1)];
        }

        if (startBlock && endBlock && startBlock !== endBlock) {
          const startBlockOffset = startBlock.textContent.length;
          range.deleteContents(); // 删除选区

          while (endBlock.firstChild) {
            startBlock.appendChild(endBlock.firstChild);
          }

          endBlock.remove();

          this.setCaretToPosition(startBlock, startBlockOffset)
        }
        const children = Array.from($el.children)
        const emptyChildren = children.filter(this.isEmptyParagraph);

        if (emptyChildren.length === children.length) {
          const paragraph = document.createElement("p");
          paragraph.append(document.createElement("br"))
          $el.replaceChildren(paragraph)
          this.moveRange(range, paragraph, 0);
        }
      }
    },
    isEmptyParagraph(paragraph) {
      return (!paragraph.textContent.trim() && paragraph.children.length === 0)
    },
    isBrParagraph(paragraph) {
      return paragraph.children.length === 1 && paragraph.children[0].tagName === "BR"
    },
    setCaretToPosition(element, offset) {
      const range = document.createRange();
      const selection = window.getSelection();

      let node = element.firstChild;
      let charCount = 0;

      // **遍历子节点，找到正确的偏移点**
      while (node) {
        if (node.nodeType === Node.TEXT_NODE) {
          if (charCount + node.length >= offset) {
            range.setStart(node, offset - charCount);
            break;
          }
          charCount += node.length;
        }
        node = node.nextSibling;
      }

      if (!node) {
        // **如果 element 为空，插入 <br> 并选中**
        const br = document.createElement("br");
        element.appendChild(br);
        range.setStart(element, 0);
      }

      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    },
    setCaretToEnd(element, prevRange = null) {
      const range = document.createRange();
      const selection = window.getSelection();

      let node = element;
      while (node && node.lastChild) {
        node = node.lastChild;
      }

      if (node.nodeType === Node.TEXT_NODE) {
        range.setStart(node, node.textContent.length);
      } else {
        range.setStart(element, element.childNodes.length);
      }

      // **光标重置**
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    },
    onBeforeInput(e) {
      e.preventDefault();
      const {inputType, data} = e
      const selection = window.getSelection()
      if (!selection.rangeCount) return

      const range = selection.getRangeAt(0)

      switch (inputType) {
        case "insertText":
          this.insertText(range, data);
          break;
        case "insertParagraph":
          this.insertParagraph(range)
          break;
        case "deleteContentBackward":
          this.deleteContent(range)
          break;
      }
    }
  },
  mounted() {
    this.ensureEditorNotEmpty()
  }
};
</script>

<style>
p {
  margin: 0;
}
</style>

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

