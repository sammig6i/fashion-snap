<script context="module" lang="ts">
  import "./plasmo-overlay.css"

  import cssText from "data-text:~/contents/plasmo-overlay.css"
  import type { PlasmoCSConfig } from "plasmo"

  import DraggableExtension from "~/lib/components/DraggableExtension.svelte"
  import Popup from "~popup.svelte"

  export const config: PlasmoCSConfig = {
    matches: ["<all_urls>"]
  }

  export const getStyle = () => {
    const style = document.createElement("style")
    style.textContent = cssText
    return style
  }
</script>

<script lang="ts">
  let isActive = true

  function closeExtension() {
    isActive = false
  }
</script>

{#if isActive}
  <DraggableExtension onClose={closeExtension}>
    <Popup />
  </DraggableExtension>
{/if}
