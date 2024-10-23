<script lang="ts">
  import { createEventDispatcher, onMount, setContext } from "svelte"
  import { quintOut } from "svelte/easing"
  import { writable } from "svelte/store"
  import { fly } from "svelte/transition"

  import Logo from "~lib/assets/logo.svelte"

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
  let isHovering = false
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

  let dragStartTime: number
  const CLICK_THRESHOLD = 200 // milliseconds

  function startDragging(e: MouseEvent | TouchEvent) {
    isDragging = true
    dragStartTime = Date.now()
    let rect = extensionElement.getBoundingClientRect()
    startY =
      (e instanceof MouseEvent ? e.clientY : e.touches[0].clientY) - rect.top
    document.body.style.userSelect = "none"
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
        extensionElement.style.left = $position.side === "left" ? "0" : "auto"
        extensionElement.style.right = $position.side === "right" ? "0" : "auto"
      } else {
        extensionElement.style.transform = `translate(0, ${$position.top}px)`
        extensionElement.style.left = $position.side === "left" ? "0" : "auto"
        extensionElement.style.right = $position.side === "right" ? "0" : "auto"
      }
    }
  }

  function closeExtension() {
    isExpanded = false
    isHovered = false // Reset hover state when closing
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

  function handleClick(e: MouseEvent) {
    const dragDuration = Date.now() - dragStartTime
    if (dragDuration < CLICK_THRESHOLD) {
      toggleExpand()
    }
  }

  $: side = $position.side

  let isHovered = false
</script>

<div
  bind:this={extensionElement}
  class="extension {isExpanded ? 'expanded' : ''} {$position.side}"
  class:visible={isVisible}
  class:dragging={isDragging}
  on:mouseenter={() => (isHovered = true)}
  on:mouseleave={() => (isHovered = false)}
  role="button"
  tabindex="0"
  aria-label="Draggable extension">
  {#if !isExpanded}
    <div class="icon-container bg-[#3777FF] rounded-lg shadow-lg">
      <button
        class="icon flex items-center justify-between w-full h-full px-2 py-2"
        class:flex-row-reverse={$position.side === "left"}
        on:mousedown={startDragging}
        on:touchstart={startDragging}
        on:mouseup={stopDragging}
        on:touchend={stopDragging}
        on:click={handleClick}
        aria-label="Toggle extension"
        aria-expanded={isExpanded}>
        <Logo />
        {#if isHovered && !isExpanded}
          <div class="dots-container">
            <div class="dots">
              <div class="dot"></div>
              <div class="dot"></div>
              <div class="dot"></div>
              <div class="dot"></div>
              <div class="dot"></div>
              <div class="dot"></div>
            </div>
          </div>
        {/if}
      </button>
      <button
        class="close-btn btn btn-circle btn-xs absolute -top-1 bg-white text-[#3777FF] border-[#3777FF] hover:bg-[#3777FF] hover:text-white"
        class:-left-1={$position.side === "right"}
        class:-right-1={$position.side === "left"}
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
    width: 56px;
    height: 56px;
    z-index: 9999;
    will-change: transform;
    opacity: 0;
    pointer-events: none;
  }

  .extension.visible {
    opacity: 1;
    pointer-events: auto;
  }

  .extension:hover {
    width: 80px;
  }

  .extension.left {
    left: 0;
  }

  .extension.right {
    right: 0;
  }

  .extension.expanded {
    width: 400px;
    height: auto;
    border-radius: 10px;
    background-color: transparent;
    padding: 0;
    overflow: hidden;
  }

  .icon-container {
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    overflow: hidden;
  }

  .icon {
    cursor: pointer;
  }

  .icon:active {
    cursor: pointer;
  }

  .dots-container {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: grab;
    transform: rotate(90deg);
    position: relative;
  }

  .dots-container:hover {
    cursor: grab;
  }

  .dots-container:hover::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
  }

  .extension.dragging,
  .extension.dragging .icon-container,
  .extension.dragging .icon,
  .extension.dragging .dots-container {
    cursor: grabbing !important;
  }

  .dots {
    display: flex;
    flex-wrap: wrap;
    width: 18px;
    height: 18px;
  }

  .dot {
    width: 4px;
    height: 4px;
    background-color: white;
    border-radius: 50%;
    margin: 1px;
  }

  .content {
    width: 100%;
    height: 100%;
  }

  .close-btn {
    opacity: 0;
    transition: opacity 0.2s ease-in-out;
  }

  .extension:hover .close-btn {
    opacity: 1;
  }

  .extension.left .icon-container {
    border-radius: 0 8px 8px 0;
  }

  .extension.right .icon-container {
    border-radius: 8px 0 0 8px;
  }
</style>
