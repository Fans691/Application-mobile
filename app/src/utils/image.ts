/**
 * Redimensionne et compresse une image côté client, puis la renvoie en data URL JPEG.
 * L'image est stockée directement dans le document Firestore (limite 1 Mo par document),
 * ce qui évite d'avoir besoin de Firebase Storage (plan Blaze).
 */
export async function compresserImage(
  file: File,
  maxSize = 900,
  maxBytes = 350_000,
): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Le fichier sélectionné n’est pas une image.')
  }

  const bitmap = await chargerImage(file)
  const ratio = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * ratio)
  const height = Math.round(bitmap.height * ratio)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Impossible de traiter l’image.')
  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, width, height)
  context.drawImage(bitmap, 0, 0, width, height)

  let quality = 0.8
  let dataUrl = canvas.toDataURL('image/jpeg', quality)
  while (dataUrl.length > maxBytes && quality > 0.3) {
    quality -= 0.1
    dataUrl = canvas.toDataURL('image/jpeg', quality)
  }
  return dataUrl
}

function chargerImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Image illisible.'))
    }
    image.src = url
  })
}
