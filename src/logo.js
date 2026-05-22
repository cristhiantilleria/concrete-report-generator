// HRF Services Corp logo. At dev/runtime it's served from /hrf-logo.jpg
// (place the JPG in /public). For docx generation we fetch the same URL
// and convert it to an ArrayBuffer.
export const HRF_LOGO_URL = '/hrf-logo.jpeg'

export async function getHrfLogoArrayBuffer() {
  const res = await fetch(HRF_LOGO_URL)
  if (!res.ok) throw new Error(`Logo not found at ${HRF_LOGO_URL} (status ${res.status}). Drop the file into /public/hrf-logo.jpg.`)
  return res.arrayBuffer()
}
