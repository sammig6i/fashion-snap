import type { PlasmoMessaging } from "@plasmohq/messaging"

import { storage } from "../storage"

const handler: PlasmoMessaging.MessageHandler<{ images: string[] }> = async (
  req,
  res
) => {
  const storedImages = (await storage.get("filteredImages")) || []
  res.send({
    images: storedImages
  })
}

export default handler
