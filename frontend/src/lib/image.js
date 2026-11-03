async function decode(file) {
  try {
    return await createImageBitmap(file)
  } catch {
    // Some formats (e.g. HEIC on Safari) decode through <img> but not createImageBitmap.
    const url = URL.createObjectURL(file)
    try {
      const img = new Image()
      img.src = url
      await img.decode()
      return img
    } finally {
      URL.revokeObjectURL(url)
    }
  }
}

/** Shrinks a phone photo to a JPEG of at most `maxSide` px so uploads stay small and fast. */
export async function resizeImage(file, maxSide = 1280, quality = 0.82) {
  const source = await decode(file)
  const width = source.width || source.naturalWidth
  const height = source.height || source.naturalHeight
  const scale = Math.min(1, maxSide / Math.max(width, height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(width * scale)
  canvas.height = Math.round(height * scale)
  canvas.getContext('2d').drawImage(source, 0, 0, canvas.width, canvas.height)
  source.close?.()
  return new Promise((resolve, reject) => {
    canvas.toBlob(b => (b ? resolve(b) : reject(new Error('Could not process this photo'))), 'image/jpeg', quality)
  })
}
