/**
 * Share utilities for saving results and sharing to social media
 */

/**
 * Generate a shareable image from game results
 * Returns a canvas element that can be converted to image
 */
export async function generateResultImage(result: {
  totalScore: number
  accuracy: number
  maxStreak: number
  correctAnswers: number
  totalRounds: number
  mode: string
}): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas')
  canvas.width = 1200
  canvas.height = 630 // Instagram Story size
  const ctx = canvas.getContext('2d')
  
  if (!ctx) throw new Error('Could not get canvas context')

  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
  gradient.addColorStop(0, '#121212')
  gradient.addColorStop(1, '#1a1a1a')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // Title
  ctx.fillStyle = '#1DB954'
  ctx.font = 'bold 72px Poppins, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('LZRS Player', canvas.width / 2, 100)

  // Score
  ctx.fillStyle = '#FFFFFF'
  ctx.font = 'bold 96px Poppins, sans-serif'
  ctx.fillText(`${result.totalScore} pts`, canvas.width / 2, 250)

  // Stats
  ctx.font = '48px Poppins, sans-serif'
  ctx.fillText(
    `${result.correctAnswers}/${result.totalRounds} correct • ${result.accuracy.toFixed(1)}% accuracy`,
    canvas.width / 2,
    350
  )

  // Streak
  ctx.fillStyle = '#FFD700'
  ctx.font = 'bold 48px Poppins, sans-serif'
  ctx.fillText(`🔥 ${result.maxStreak} streak`, canvas.width / 2, 420)

  // Mode
  ctx.fillStyle = '#888888'
  ctx.font = '36px Poppins, sans-serif'
  ctx.fillText(result.mode.toUpperCase() + ' MODE', canvas.width / 2, 500)

  return canvas
}

/**
 * Convert canvas to blob
 */
export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob)
      } else {
        reject(new Error('Failed to convert canvas to blob'))
      }
    }, 'image/png')
  })
}

/**
 * Save image to device (camera roll on mobile, download on desktop)
 */
export async function saveImageToDevice(canvas: HTMLCanvasElement, filename: string = 'lzrs-result.png'): Promise<void> {
  try {
    const blob = await canvasToBlob(canvas)
    const url = URL.createObjectURL(blob)

    // Check if we're on mobile (has share API)
    if (navigator.share && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
      const file = new File([blob], filename, { type: 'image/png' })
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'LZRS Player Result',
          files: [file],
        })
        URL.revokeObjectURL(url)
        return
      }
    }

    // Desktop: download file
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Error saving image:', error)
    throw error
  }
}

/**
 * Share to Instagram Story (opens Instagram app with image)
 * Note: Instagram doesn't have a direct API, so we use a workaround
 */
export async function shareToInstagramStory(canvas: HTMLCanvasElement): Promise<void> {
  try {
    const blob = await canvasToBlob(canvas)
    const file = new File([blob], 'lzrs-result.png', { type: 'image/png' })

    // On mobile, try to use native share which may include Instagram
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        title: 'LZRS Player Result',
        files: [file],
      })
    } else {
      // Fallback: copy image to clipboard and show instructions
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ])
      alert(
        'Image copied to clipboard!\n\n' +
        'Open Instagram Stories, tap the sticker icon, and paste the image.'
      )
    }
  } catch (error) {
    console.error('Error sharing to Instagram:', error)
    // Fallback to save
    await saveImageToDevice(canvas)
  }
}

/**
 * Share to Instagram DM (opens Instagram app)
 */
export function shareToInstagramDM(): void {
  // Instagram doesn't have a direct API for DMs
  // We can only open the app and let user manually share
  const instagramUrl = 'instagram://'
  const instagramWebUrl = 'https://www.instagram.com/'
  
  // Try to open Instagram app
  window.location.href = instagramUrl
  
  // Fallback to web after a delay
  setTimeout(() => {
    window.open(instagramWebUrl, '_blank')
  }, 500)
}

