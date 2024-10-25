<script lang="ts">
  import "./style.css"

  import { onMount } from "svelte"

  import { filteredImages } from "~/background/storage"
  import ImageUploader from "~/lib/components/ImageUploader.svelte"
  import ImageDisplay from "~lib/components/ImageDisplay.svelte"
  import ThemeSwitcher from "~lib/components/ThemeSwitcher.svelte"

  let theme: "light" | "dark" = "light"
  let container: HTMLDivElement

  onMount(() => {
    const savedTheme = localStorage.getItem("popupTheme") as
      | "light"
      | "dark"
      | null
    theme = savedTheme || "light"
    applyTheme(theme)
  })

  function handleThemeChange(newTheme: "light" | "dark") {
    theme = newTheme
    applyTheme(theme)
    localStorage.setItem("popupTheme", theme)
  }

  function applyTheme(newTheme: "light" | "dark") {
    if (container) {
      container.setAttribute("data-theme", newTheme)
    }
  }

  function closeExtension() {
    window.close()
  }
</script>

<div
  bind:this={container}
  class="w-[400px] h-auto bg-base-100 text-base-content flex flex-col">
  <ThemeSwitcher
    {theme}
    onThemeChange={handleThemeChange}
    onClose={closeExtension} />
  <ImageUploader {theme} />
  <ImageDisplay {theme} images={$filteredImages} />
</div>
