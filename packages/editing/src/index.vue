<template>
  <div class="odd-editing">
    <div
      ref="editingRef"
      class="odd-editing-area"
      contenteditable="true"
      @beforeinput="onBeforeInput"
    ></div>
    <!--    <div class="odd-placeholder" v-show="showPlaceholder">Type Here...</div>-->
  </div>
</template>

<script>
import {
  isTextNode,
  isElementNode,
  isEmptyNode,
  isEmptyParagraph,
  isBrParagraph,
  isCareAtStart,
  isCareAtEnd,
  setCaretToPosition,
  setCaretToEnd,
} from "packages/utils/index.js";

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
    setHtml(html) {
      const $el = this.getRef();
      $el.replaceChildren();
      $el.insertAdjacentHTML("afterbegin", html);
    },
    getRootParagraph(node) {
      const $el = this.getRef();

      while (node && node !== $el) {
        if (node.parentNode === $el) {
          return node;
        }
        node = node.parentNode;
      }

      return null;
    },
    /**
     * @description 使用 p 标签包裹内容,确保 editor 不会为空
     * */
    ensureEditorNotEmpty() {
      const $el = this.getRef();
      if (isEmptyParagraph($el)) {
        const paragraph = document.createElement("p");
        paragraph.append(document.createElement("br"));
        $el.append(paragraph);
        return paragraph;
      }
      return null;
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
      // 插入 &nbsp; 代替空格，多个空格会被浏览器忽略
      const inputText = data === " " ? "\u00a0" : data ?? "";
      const inputTextNode = document.createTextNode(inputText);

      const { startContainer, startOffset } = range;

      if (isElementNode(startContainer)) {
        // ** 新行输入时替换 br 标签 **
        if (isBrParagraph(startContainer)) {
          startContainer.replaceChildren(inputTextNode);
        } else {
          const child = startContainer.childNodes[startOffset];
          if (child) {
            startContainer.insertBefore(inputTextNode, child);
          } else {
            startContainer.append(inputTextNode);
          }
        }
        range.setStart(inputTextNode, inputText.length);
      }

      if (isTextNode(startContainer)) {
        const textContent = startContainer.textContent;
        const beforeText = textContent.slice(0, startOffset);
        const afterText = textContent.slice(startOffset);

        const newTextNode = document.createTextNode(
          beforeText + inputText + afterText
        );

        startContainer.replaceWith(newTextNode);

        range.setStart(newTextNode, beforeText.length + 1);
      }
    },
    /**
     * @description 插入新行
     *
     * @param {Range} range
     * */
    insertParagraph(range) {
      const { startContainer, startOffset } = range;
      const paragraph =
        startContainer.nodeType === Node.TEXT_NODE
          ? startContainer.parentNode
          : startContainer;

      if (!paragraph || paragraph === this.getRef()) return;

      const newParagraph = paragraph.cloneNode(false);
      const text = paragraph.textContent;
      const beforeText = text.slice(0, startOffset);
      const afterText = text.slice(startOffset);

      if (beforeText) {
        paragraph.textContent = beforeText;
      } else {
        paragraph.replaceChildren(document.createElement("br"));
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
      const { startContainer, endContainer, startOffset, endOffset } = range;
      const rootParagraph = this.getRootParagraph(startContainer);

      if (!range.collapsed) {
        range.deleteContents();

        const startRoot = this.getRootParagraph(startContainer);
        const endRoot = this.getRootParagraph(endContainer);

        if (startRoot !== endRoot) {
          const fragment = document.createDocumentFragment();

          while (endRoot.firstChild) {
            // 可能是空标签
            const firstChild = endRoot.firstChild;

            if (isEmptyNode(firstChild)) {
              firstChild.remove();
            } else {
              fragment.append(firstChild);
            }
          }

          endRoot.remove();

          if (isBrParagraph(startRoot)) {
            startRoot.replaceChildren(fragment);
          } else {
            startRoot.append(fragment);
          }

          const newRange = document.createRange();

          const startBlock = isTextNode(startContainer)
            ? startContainer.parentNode
            : startContainer;

          const firstChild = startBlock.firstChild;

          if (isTextNode(firstChild)) {
            newRange.selectNodeContents(firstChild);
            newRange.setStart(firstChild, firstChild.length);
          } else {
            setCaretToEnd(firstChild);
          }

          newRange.collapse(false);
          window.getSelection().removeAllRanges();
          window.getSelection().addRange(newRange);

          if (isEmptyParagraph(startRoot)) {
            startRoot.append(document.createElement("br"));
          }
        }

        if (startRoot === endRoot) {
          const children = Array.from(startRoot.childNodes);
          const notEmptyNode = children.filter((child) => !isEmptyNode(child));

          startRoot.replaceChildren(...notEmptyNode);

          if (isEmptyParagraph(startRoot)) {
            startRoot.append(document.createElement("br"));
          }
        }
      } else {
        // ** 行首删除 **
        if (isCareAtStart(range, rootParagraph)) {
          console.log("** 行首删除 **");
          const prevParagraph = rootParagraph.previousElementSibling;
          if (!prevParagraph) return;
          const fragment = document.createDocumentFragment();

          if (!isBrParagraph(rootParagraph)) {
            fragment.replaceChildren(...rootParagraph.childNodes);
          }

          rootParagraph.remove();

          const isBr = isBrParagraph(prevParagraph);

          const newRange = document.createRange();
          if (isBr) {
            prevParagraph.replaceChildren(fragment);
            newRange.setStartBefore(prevParagraph.firstChild);
          } else {
            const offset = prevParagraph.childNodes.length;
            prevParagraph.append(fragment);
            newRange.setStart(prevParagraph, offset);
          }

          newRange.collapse();
          window.getSelection().removeAllRanges();
          window.getSelection().addRange(newRange);
        }
        // ** 文本删除 **
        else if (isTextNode(startContainer)) {
          console.log("** 文本删除 **");

          range.setStart(startContainer, Math.max(0, startOffset - 1));
          range.deleteContents();

          if (isEmptyParagraph(startContainer.parentNode)) {
            if (startContainer.parentNode === rootParagraph) {
              startContainer.parentNode.append(document.createElement("br"));
            } else {
              startContainer.parentNode.remove();
            }
          }

          if (isEmptyParagraph(rootParagraph)) {
            rootParagraph.append(document.createElement("br"));
          }
        }
        // ** 节点删除 **
        else if (isElementNode(startContainer)) {
          console.log("** 节点删除 **", startContainer);
          let prevNode = startContainer.childNodes[startOffset - 1];
          let previousSiblingNode;

          if (prevNode) {
            previousSiblingNode = prevNode.previousSibling;
            prevNode.remove();
          }

          if (previousSiblingNode) {
            if (isTextNode(previousSiblingNode)) {
              range.selectNodeContents(previousSiblingNode);
              range.collapse(false);
            }
          }

          if (isEmptyParagraph(startContainer)) {
            startContainer.append(document.createElement("br"));
          }
        }
      }
    },
    isEmptyParagraph(paragraph) {
      return !paragraph.textContent.trim() && paragraph.children.length === 0;
    },
    isBrParagraph(paragraph) {
      return (
        paragraph.children.length === 1 &&
        paragraph.children[0].tagName === "BR"
      );
    },
    onBeforeInput(e) {
      e.preventDefault();
      const { inputType, data } = e;
      const selection = window.getSelection();
      if (!selection.rangeCount) return;

      const range = selection.getRangeAt(0);

      switch (inputType) {
        case "insertText":
          this.insertText(range, data);
          break;
        case "insertParagraph":
        case "insertLineBreak":
          this.insertParagraph(range);
          break;
        case "deleteContentBackward":
          this.deleteContent(range);
          break;
      }
    },
  },
  mounted() {
    this.ensureEditorNotEmpty();
    this.setHtml(
      `<p>heeloVue</p><p><span>a</span><img src="https://images.jdycdn.com/e8b06573-7f7e-47c6-af8e-a2fe7bd72029" style="max-width: 100%; width: 25%;">asd<img src="https://images.jdycdn.com/e8b06573-7f7e-47c6-af8e-a2fe7bd72029" style="max-width: 100%; width: 25%;"><span>1245</span></p>`
    );
  },
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
