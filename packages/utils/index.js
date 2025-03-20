export function isNode(node) {
  return node && node instanceof Node;
}

export function isNodeWithType(node, type) {
  return isNode(node) && node.nodeType === type;
}

export function isTextNode(node) {
  return isNodeWithType(node, Node.TEXT_NODE);
}

export function isElementNode(node) {
  return isNodeWithType(node, Node.ELEMENT_NODE);
}
export function isEmptyNode(node) {
  if (!node) return true;

  // 文本节点，检查是否为空白
  if (node.nodeType === Node.TEXT_NODE) {
    return !node.nodeValue.trim();
  }

  // 元素节点，检查是否无子节点或仅包含 `<br>`
  if (node.nodeType === Node.ELEMENT_NODE) {
    if (node.tagName === "IMG") {
      return false
    }
    return (
      !node.textContent.trim() &&
      (node.children.length === 0 ||
        (node.children.length === 1 && node.children[0].tagName === "BR"))
    );
  }

  return false;
}

/**
 * @description 判断是否为空行
 *
 * @param {Node} paragraph
 * @returns {Boolean}
 */
export function isEmptyParagraph(paragraph) {
  return !paragraph.textContent && paragraph.children.length === 0;
}

/**
 * @description 判断是否为新行
 *
 * @param {Node} paragraph
 * @returns {Boolean}
 */
export function isBrParagraph(paragraph) {
  return paragraph.children.length === 1 && paragraph.children[0].tagName === "BR";
}

/**
 * @description 判断当前光标所在位置 与 给定 node 的关系 => 这里判断是否在 node 开始
 *
 * @param {Range} range
 * @param {Node} node
 * @returns {Boolean}
 */
export function isCareAtStart(range, node) {
  if (!node) return false;

  const { startContainer, startOffset } = range;

  if (startContainer === node) {
    const startRange = document.createRange();
    startRange.setStart(node, 0);
    startRange.collapse(false);

    return range.compareBoundaryPoints(Range.START_TO_END, startRange) === 0;
  }

  if (isTextNode(startContainer)) {
    const parent = startContainer.parentNode;
    return startOffset === 0 && (parent === node || parent === node.firstChild);
  }
}

/**
 * @description 判断当前光标所在位置 与 给定 node 的关系 => 这里判断是否在 node 末尾
 *
 * @param {Range} range
 * @param {Node} node
 * @returns {Boolean}
 */
export function isCareAtEnd(range, node) {
  if (!node) return false;

  const { startContainer, startOffset } = range;

  if (startContainer === node) {
    const endRange = document.createRange();
    endRange.setEnd(node, node.children.length);
    endRange.collapse(false);
    return range.compareBoundaryPoints(Range.END_TO_END, endRange) === 0;
  }

  if (isTextNode(startContainer)) {
    const parent = startContainer.parentNode;
    console.log(parent === node);
    console.log(parent === node.lastChild);
    return startOffset === startContainer.length && (parent === node || parent === node.lastChild);
  }
}

/**
 * @description 移动光标到指定节点末尾
 *
 * @param {Node} element
 */
export function setCaretToEnd(element) {
  const range = document.createRange();
  const selection = window.getSelection();

  let node = element;

  while (node && node.lastChild) {
    node = node.lastChild;
  }

  if (isTextNode(node)) {
    range.setStart(node, node.textContent.length);
  } else {
    range.setStart(element, element.childNodes.length);
  }

  // **光标重置**
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);
}

/**
 * @description 移动光标到指定节点位置
 *
 * @param {Node} element
 * @param {Number} offset
 */
export function setCaretToPosition(element, offset) {
  const range = document.createRange();
  const selection = window.getSelection();

  let node = element.firstChild;
  let charCount = 0;

  // **遍历子节点，找到正确的偏移点**
  while (node) {
    if (isTextNode(node)) {
      if (charCount + node.length >= offset) {
        range.setStart(node, offset - charCount);
        break;
      }
      charCount += node.length;
    }
    node = node.nextSibling;
  }

  if (!node) {
    element.appendChild(document.createElement("br"));
    range.setStart(element, 0);
  }

  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);
}
