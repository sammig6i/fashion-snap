import { Storage } from "@plasmohq/storage"

const storage = new Storage()

storage.get("filteredImages").then((value) => {
  if (!value) {
    storage.set("filteredImages", [])
  }
})

export {}
