import type { PlasmoMessaging } from "@plasmohq/messaging"
import { Storage } from "@plasmohq/storage"

const storage = new Storage()

const handler: PlasmoMessaging.MessageHandler<{ images: string[] }> = async (
  req,
  res
) => {
  const images = req.body.images

  if (!images || images.length === 0) {
    console.error("No images to send to server")
    res.send({ error: "No images provided" })
    return
  }

  try {
    const response = await fetch("http://localhost:8000/filter_images", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ images })
    })
    const data = await response.json()

    await storage.set("filteredImages", data.filteredImages)
    // TODO - update UI to display the filtered images that are sent from model

    console.log("Filtered images:", data.filteredImages)
    res.send({ filteredImages: data.filteredImages })
  } catch (error) {
    console.error("Error:", error)
    res.send({ error: error.message })
  }
}

export default handler
