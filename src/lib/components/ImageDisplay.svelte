<script lang="ts">
  export let images: string[] = []
  export let theme: "light" | "dark"
</script>

<div
  class="carousel carousel-center rounded-box max-w-md space-x-4 p-4"
  class:bg-base-200={theme === "light"}
  class:bg-base-300={theme === "dark"}>
  {#each images as image}
    <div class="carousel-item">
      <img
        src={image}
        alt="A Top/Bottom Garment"
        class="rounded-box w-full h-auto max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl" />
    </div>
  {/each}
</div>
