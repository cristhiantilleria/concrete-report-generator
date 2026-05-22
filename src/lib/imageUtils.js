export function formatBytes(b) {
  if (b < 1024) return b + ' B'
  if (b < 1024 * 1024) return (b / 1024).toFixed(1) + ' KB'
  return (b / 1024 / 1024).toFixed(2) + ' MB'
}

export function guessCaption(filename) {
  const n = filename.toLowerCase()
  if (n.includes('rebar') || n.includes('reinf')) return 'Reinforcement detail'
  if (n.includes('hole') || n.includes('opening')) return 'Reinforcement on holes'
  if (n.includes('slab') && n.includes('thick')) return 'Slab thickness and distance between bars'
  if (n.includes('slab')) return 'Slab condition'
  if (n.includes('pour') && n.includes('complete')) return 'Concrete pour complete'
  if (n.includes('pour')) return 'Concrete pour in progress'
  if (n.includes('stair')) return 'Stairs A & B – 3rd to 4th floor'
  if (n.includes('panor')) return 'Panoramic view'
  if (n.includes('ticket') || n.includes('batch')) return 'Batch ticket'
  if (n.includes('mix') || n.includes('design')) return "Concrete mix design fc' 5,000 psi"
  if (n.includes('billboard') || n.includes('sign')) return 'Job-site billboard'
  if (n.includes('rs03') || n.includes('drawing') || n.includes('plan')) return 'Reference drawing'
  return 'Site photo'
}

export function compressImage(file, maxDim = 1200, quality = 0.75) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        let { width, height } = img
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width)
            width = maxDim
          } else {
            width = Math.round((width * maxDim) / height)
            height = maxDim
          }
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(img, 0, 0, width, height)
        const dataUrl = canvas.toDataURL('image/jpeg', quality)
        canvas.toBlob(
          (blob) => {
            blob.arrayBuffer().then((buf) => {
              resolve({ dataUrl, arrayBuffer: buf, size: blob.size, width, height })
            })
          },
          'image/jpeg',
          quality,
        )
      }
      img.onerror = reject
      img.src = e.target.result
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export async function processImageFiles(files, onProgress) {
  const results = []
  for (let i = 0; i < files.length; i++) {
    if (onProgress) onProgress(`Compressing ${i + 1} of ${files.length}: ${files[i].name}`)
    try {
      const compressed = await compressImage(files[i])
      results.push({
        id: Date.now() + '_' + i + '_' + Math.random().toString(36).slice(2, 7),
        dataUrl: compressed.dataUrl,
        arrayBuffer: compressed.arrayBuffer,
        width: compressed.width,
        height: compressed.height,
        caption: guessCaption(files[i].name),
        originalSize: files[i].size,
        compressedSize: compressed.size,
        fileName: files[i].name,
      })
    } catch (err) {
      console.error(err)
    }
  }
  return results
}
