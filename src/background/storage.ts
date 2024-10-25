import { writable } from "svelte/store"

import { Storage } from "@plasmohq/storage"

const storage = new Storage()
export const filteredImages = writable<string[]>([])

async function initializeStore() {
  const storedImages = await storage.get("filteredImages")
  filteredImages.set(Array.isArray(storedImages) ? storedImages : [])
}

storage.watch({
  filteredImages: (newValue) => {
    if (Array.isArray(newValue)) {
      filteredImages.set(newValue)
    } else {
      filteredImages.set([])
    }
  }
})

initializeStore()

export { storage }
