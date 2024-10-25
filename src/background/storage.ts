import { writable } from "svelte/store"

import { Storage } from "@plasmohq/storage"

const storage = new Storage()
export const filteredImages = writable<string[]>([])

// Initialize store with current storage value
storage.get("filteredImages").then((value) => {
  filteredImages.set(Array.isArray(value) ? value : [])
})

// Watch for storage changes
storage.watch({
  filteredImages: (newValue) => {
    if (Array.isArray(newValue)) {
      filteredImages.set(newValue)
    } else {
      filteredImages.set([])
    }
  }
})

export async function updateFilteredImages(images: string[]) {
  await storage.set("filteredImages", images)
  filteredImages.set(images)
}

export { storage }
