<script lang="ts">
  import { createEventDispatcher, onMount, setContext } from "svelte"
  import { writable } from "svelte/store"

  export let onClose: () => void

  let isVisible = true
  let isExpanded = false
  const createPositionStore = () => {
    const storageKey = "extensionPosition"
    const { subscribe, set, update } = writable({
      top: 0,
      side: "right" as "left" | "right"
    })

    let value = { top: 0, side: "right" as "left" | "right" }

    return {
      subscribe,
      set: (newValue: { top: number; side: "left" | "right" }) => {
        value = newValue
        set(newValue)
        localStorage.setItem(storageKey, JSON.stringify(newValue))
      },
      update,
      get: () => value
    }
  }

  const position = createPositionStore()

  let extensionElement: HTMLElement
  let isDragging = false
  let showDots = false
  let startY: number
  let side: "left" | "right"

  let previousPosition = { top: 0, side: "right" as "left" | "right" }
  const expandedPosition = { top: 100, [side]: $position.side }

  function debounce(func: Function, wait: number) {
    let timeout: ReturnType<typeof setTimeout>
    let lastCallTime = 0
    return function executedFunction(...args: any[]) {
      const now = Date.now()
      const later = () => {
        lastCallTime = now
        func(...args)
      }
      if (now - lastCallTime >= wait) {
        clearTimeout(timeout)
        later()
      } else {
        clearTimeout(timeout)
        timeout = setTimeout(later, wait)
      }
    }
  }

  function startDragging(e: MouseEvent | TouchEvent) {
    isDragging = true
    let rect = extensionElement.getBoundingClientRect()
    startY =
      (e instanceof MouseEvent ? e.clientY : e.touches[0].clientY) - rect.top
    document.body.style.userSelect = "none"
    document.body.style.cursor = "grabbing"
    addHighlight()
  }

  function stopDragging() {
    isDragging = false
    document.body.style.userSelect = ""
    document.body.style.cursor = ""
    removeHighlight()
    savePosition()
  }

  const debouncedSavePosition = debounce(() => {
    const currentPosition = JSON.stringify(position.get())
    const savedPosition = localStorage.getItem("extensionPosition")
    if (currentPosition !== savedPosition) {
      localStorage.setItem("extensionPosition", currentPosition)
    }
  }, 2000)

  function savePosition() {
    debouncedSavePosition()
  }

  function drag(e: MouseEvent | TouchEvent) {
    if (isDragging && !isExpanded) {
      let clientY = e instanceof MouseEvent ? e.clientY : e.touches[0].clientY
      let newTop = clientY - startY
      newTop = Math.max(
        0,
        Math.min(newTop, window.innerHeight - extensionElement.offsetHeight)
      )
      position.set({ ...$position, top: newTop })
      updateElementPosition()
    }
  }

  function dragHorizontal(e: MouseEvent | TouchEvent) {
    if (isDragging && !isExpanded) {
      let clientX = e instanceof MouseEvent ? e.clientX : e.touches[0].clientX
      const newSide = clientX < window.innerWidth / 2 ? "left" : "right"
      position.set({ ...$position, side: newSide })
      updateElementPosition()
    }
  }

  function toggleExpand() {
    if (!isExpanded) {
      previousPosition = { top: $position.top, side: $position.side }
      localStorage.setItem("previousPosition", JSON.stringify(previousPosition))
      position.set({ top: expandedPosition.top, side: $position.side })
      isExpanded = true
    } else {
      closeExtension()
    }
    updateElementPosition()
    localStorage.setItem("isExpanded", JSON.stringify(isExpanded))
  }

  function addHighlight() {
    const leftHighlight = document.createElement("div")
    const rightHighlight = document.createElement("div")

    const highlightStyle = `
      position: fixed;
      top: 0;
      width: 5px;
      height: 100%;
      background-color: #3777FF;
      z-index: 9998;
      pointer-events: none;
    `

    leftHighlight.id = "extension-highlight-left"
    leftHighlight.style.cssText = highlightStyle + "left: 0;"

    rightHighlight.id = "extension-highlight-right"
    rightHighlight.style.cssText = highlightStyle + "right: 0;"

    document.body.appendChild(leftHighlight)
    document.body.appendChild(rightHighlight)
  }

  function removeHighlight() {
    const leftHighlight = document.getElementById("extension-highlight-left")
    const rightHighlight = document.getElementById("extension-highlight-right")
    if (leftHighlight) document.body.removeChild(leftHighlight)
    if (rightHighlight) document.body.removeChild(rightHighlight)
  }

  function updateElementPosition() {
    if (extensionElement) {
      if (isExpanded) {
        extensionElement.style.transform = `translate(0, ${expandedPosition.top}px)`
        extensionElement.style.left =
          $position.side === "left"
            ? `${expandedPosition[$position.side]}px`
            : "auto"
        extensionElement.style.right =
          $position.side === "right"
            ? `${expandedPosition[$position.side]}px`
            : "auto"
      } else {
        extensionElement.style.transform = `translate(0, ${$position.top}px)`
        extensionElement.style.left =
          $position.side === "left" ? "20px" : "auto"
        extensionElement.style.right =
          $position.side === "right" ? "20px" : "auto"
      }
    }
  }

  function closeExtension() {
    isExpanded = false
    const savedPreviousPosition = JSON.parse(
      localStorage.getItem("previousPosition")
    )
    if (savedPreviousPosition) {
      position.set(savedPreviousPosition)
    } else {
      position.set(previousPosition)
    }
    updateElementPosition()
    localStorage.setItem("isExpanded", JSON.stringify(isExpanded))
    localStorage.setItem("extensionPosition", JSON.stringify(position.get()))
  }

  function handleCloseClick() {
    onClose()
  }

  function handleCloseFromPopup() {
    closeExtension()
  }

  setContext("closeExtension", closeExtension)
  setContext("handleCloseClick", handleCloseClick)

  onMount(() => {
    const initializePosition = () => {
      const savedPosition = JSON.parse(
        localStorage.getItem("extensionPosition")
      ) as {
        top: number
        side: "left" | "right"
      } | null
      const savedIsExpanded = JSON.parse(localStorage.getItem("isExpanded"))
      const savedPreviousPosition = JSON.parse(
        localStorage.getItem("previousPosition")
      )

      if (savedPosition) {
        position.set(savedPosition)
      }

      if (savedPreviousPosition) {
        previousPosition = savedPreviousPosition
      }

      isExpanded = savedIsExpanded || false
      if (isExpanded) {
        position.set({ top: expandedPosition.top, side: $position.side })
      }

      updateElementPosition()
      isVisible = true
    }

    initializePosition()

    document.addEventListener("mousemove", handleMove)
    document.addEventListener("mouseup", stopDragging)
    document.addEventListener("touchmove", handleMove)
    document.addEventListener("touchend", stopDragging)

    window.addEventListener("closeExtension", handleCloseFromPopup)

    return () => {
      document.removeEventListener("mousemove", handleMove)
      document.removeEventListener("mouseup", stopDragging)
      document.removeEventListener("touchmove", handleMove)
      document.removeEventListener("touchend", stopDragging)
      window.removeEventListener("closeExtension", handleCloseFromPopup)
    }
  })

  function handleMove(e: MouseEvent | TouchEvent) {
    drag(e)
    dragHorizontal(e)
  }

  $: side = $position.side
</script>

<div
  bind:this={extensionElement}
  class="extension {isExpanded ? 'expanded' : ''} {$position.side}"
  class:visible={isVisible}
  on:mouseenter={() => (showDots = true)}
  on:mouseleave={() => (showDots = false)}
  role="button"
  tabindex="0"
  aria-label="Draggable extension">
  {#if !isExpanded}
    <div class="icon-container">
      <button
        class="icon"
        on:mousedown={startDragging}
        on:touchstart={startDragging}
        on:click={toggleExpand}
        aria-label="Toggle extension"
        aria-expanded={isExpanded}>
        {#if showDots}
          <div class="dots">
            <div class="dot"></div>
            <div class="dot"></div>
            <div class="dot"></div>
            <div class="dot"></div>
            <div class="dot"></div>
            <div class="dot"></div>
          </div>
        {/if}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          width="24"
          height="24"
          class="fill-current">
          <path fill="none" d="M0 0h24v24H0z" />
          <path
            d="M3 3h18v18H3V3zm16 16V5H5v14h14zM11 7h2v2h-2V7zm0 4h2v2h-2V7zm0 4h2v2h-2v-2z" />
        </svg>
      </button>
      <button
        class="close-btn btn btn-circle btn-xs"
        on:click={handleCloseClick}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  {:else}
    <div class="content">
      <slot {closeExtension}></slot>
    </div>
  {/if}
</div>

<style>
  .extension {
    position: fixed;
    top: 0;
    transform: translateY(50vh);
    width: 40px;
    height: 40px;
    background-color: var(--base-100);
    border-radius: 50%;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    z-index: 9999;
    will-change: transform;
    opacity: 0;
    pointer-events: none;
  }

  .extension.visible {
    opacity: 1;
    pointer-events: auto;
  }

  .extension.left {
    left: 20px;
    right: auto;
  }

  .extension.right {
    right: 20px;
    left: auto;
  }

  .extension.expanded {
    width: 400px;
    height: auto;
    border-radius: 10px;
    background-color: transparent;
    padding: 0;
    overflow: hidden;
  }

  .icon {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    cursor: grab;
    position: relative;
  }

  .dots {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    grid-gap: 2px;
    padding: 8px;
    border-radius: 50%;
    background-color: rgba(0, 0, 0, 0.1);
  }

  .dot {
    width: 4px;
    height: 4px;
    background-color: var(--base-content);
    border-radius: 50%;
  }

  .content {
    width: 100%;
    height: 100%;
  }

  .extension:active {
    cursor: grabbing;
  }

  :global(.extension) .card {
    background-color: transparent !important;
    box-shadow: none !important;
  }

  :global(.extension) .card-body {
    padding: 0 !important;
  }

  :global(.extension) .file-input {
    border-color: #4b5563;
    background-color: #374151;
    color: #e2e8f0;
  }

  :global(.extension) .btn-primary {
    background-color: #3b82f6;
    border-color: #3b82f6;
  }

  :global(.extension) .btn-primary:hover {
    background-color: #2563eb;
    border-color: #2563eb;
  }

  .icon-container {
    position: relative;
    width: 100%;
    height: 100%;
  }

  .close-btn {
    position: absolute;
    top: -8px;
    right: -8px;
    background-color: var(--base-100);
    border: 1px solid var(--base-content);
    opacity: 0;
    transition: opacity 0.2s ease-in-out;
  }

  .extension:hover .close-btn {
    opacity: 1;
  }

  .close-btn:hover {
    background-color: var(--base-200);
  }
</style>
