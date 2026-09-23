import { partyDetails } from '~/utils/partyDetails'

const WIDTH = 1400
const STUB = 188
const PAD_X = 64
const PAD_Y = 56

export async function downloadAcceptedTicket(guestName: string, code: string) {
  const files = await createTicketFiles(guestName, code)
  const base = `la-vida-loca-${code}`
  saveBlob(files.png, `${base}.png`)
  await wait(350)
  saveBlob(files.pdf, `${base}.pdf`)
}

export async function createTicketFiles(guestName: string, code: string) {
  const canvas = await drawTicket(guestName, code)
  const png = await canvasToBlob(canvas, 'image/png')
  const jpeg = await canvasToBlob(canvas, 'image/jpeg', 0.92)
  const pdf = jpegToPdf(new Uint8Array(await jpeg.arrayBuffer()), canvas.width, canvas.height)
  return { png, pdf }
}

async function drawTicket(guestName: string, code: string) {
  await Promise.all([
    document.fonts.load('110px Italianno'),
    document.fonts.load('600 78px Caveat'),
    document.fonts.load('28px "Courier Prime"'),
    document.fonts.ready,
  ])

  const textWidth = WIDTH - STUB - PAD_X * 2
  const measure = document.createElement('canvas').getContext('2d')
  if (!measure) throw new Error('Could not draw the ticket.')
  measure.font = '28px "Courier Prime", monospace'
  const evening = wrapText(measure, partyDetails.evening, textWidth)
  const idCheck = wrapText(measure, partyDetails.idCheck, textWidth)
  const height = PAD_Y + 92 + 50 + 88 + 3 * 46 + evening.length * 42 + 18 + idCheck.length * 42 + PAD_Y

  const canvas = document.createElement('canvas')
  canvas.width = WIDTH
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not draw the ticket.')

  const paper = ctx.createLinearGradient(0, 0, 0, height)
  paper.addColorStop(0, '#f7f1e2')
  paper.addColorStop(1, '#efe2c6')
  ctx.fillStyle = paper
  ctx.fillRect(0, 0, WIDTH, height)

  const stain = ctx.createRadialGradient(40, 20, 0, 80, 40, 460)
  stain.addColorStop(0, 'rgba(120, 70, 24, 0.16)')
  stain.addColorStop(1, 'rgba(120, 70, 24, 0)')
  ctx.fillStyle = stain
  ctx.fillRect(0, 0, WIDTH - STUB, height)

  ctx.fillStyle = 'rgba(120, 70, 24, 0.06)'
  ctx.fillRect(WIDTH - STUB, 0, STUB, height)

  ctx.save()
  ctx.strokeStyle = 'rgba(90, 48, 20, 0.45)'
  ctx.lineWidth = 3
  ctx.setLineDash([10, 12])
  ctx.beginPath()
  ctx.moveTo(WIDTH - STUB, 28)
  ctx.lineTo(WIDTH - STUB, height - 28)
  ctx.stroke()
  ctx.restore()

  let y = PAD_Y
  ctx.fillStyle = '#6a3014'
  ctx.font = '110px Italianno, cursive'
  ctx.textBaseline = 'top'
  ctx.fillText('La Vida Loca', PAD_X, y)
  y += 92

  ctx.fillStyle = '#3a2414'
  ctx.font = '26px "Courier Prime", monospace'
  ctx.fillText('ACCEPTED', PAD_X, y)
  y += 50

  ctx.font = '600 78px Caveat, cursive'
  ctx.fillText(fitText(ctx, guestName, textWidth, '600 78px Caveat, cursive'), PAD_X, y)
  y += 88

  ctx.font = '28px "Courier Prime", monospace'
  ctx.fillStyle = '#3a2414'
  for (const line of [code, `${partyDetails.day}  ·  ${partyDetails.arrival}`, partyDetails.place]) {
    ctx.fillText(line, PAD_X, y)
    y += 46
  }

  ctx.fillStyle = 'rgba(90, 48, 20, 0.78)'
  for (const line of evening) {
    ctx.fillText(line, PAD_X, y)
    y += 42
  }
  y += 18
  for (const line of idCheck) {
    ctx.fillText(line, PAD_X, y)
    y += 42
  }

  ctx.save()
  ctx.translate(WIDTH - STUB / 2, height / 2)
  ctx.rotate(Math.PI / 2)
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = '#3a2414'
  ctx.font = '26px "Courier Prime", monospace'
  ctx.fillText(code, 0, -36)
  ctx.fillText('ADMIT ONE', 0, 36)
  ctx.restore()

  return canvas
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const lines: string[] = []
  let line = ''
  for (const word of text.split(' ')) {
    const next = line ? `${line} ${word}` : word
    if (line && ctx.measureText(next).width > maxWidth) {
      lines.push(line)
      line = word
    }
    else {
      line = next
    }
  }
  if (line) lines.push(line)
  return lines
}

function fitText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, font: string) {
  ctx.font = font
  if (ctx.measureText(text).width <= maxWidth) return text
  let fitted = text
  while (fitted.length > 1 && ctx.measureText(`${fitted}…`).width > maxWidth) {
    fitted = fitted.slice(0, -1)
  }
  return `${fitted}…`
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('Could not save the ticket.'))
    }, type, quality)
  })
}

export function jpegToPdf(jpeg: Uint8Array, imageWidth: number, imageHeight: number) {
  const pageWidth = 540
  const pageHeight = Math.round((pageWidth * imageHeight) / imageWidth)
  const encoder = new TextEncoder()
  const content = encoder.encode(`q\n${pageWidth} 0 0 ${pageHeight} 0 0 cm\n/Im0 Do\nQ\n`)

  const objects = [
    encoder.encode('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n'),
    encoder.encode('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n'),
    encoder.encode(`3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Contents 4 0 R /Resources << /XObject << /Im0 5 0 R >> >> >>\nendobj\n`),
    concatBytes([
      encoder.encode(`4 0 obj\n<< /Length ${content.length} >>\nstream\n`),
      content,
      encoder.encode('endstream\nendobj\n'),
    ]),
    concatBytes([
      encoder.encode(`5 0 obj\n<< /Type /XObject /Subtype /Image /Width ${imageWidth} /Height ${imageHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`),
      jpeg,
      encoder.encode('\nendstream\nendobj\n'),
    ]),
  ]

  const header = encoder.encode('%PDF-1.4\n')
  const offsets = [0]
  let cursor = header.length
  for (const object of objects) {
    offsets.push(cursor)
    cursor += object.length
  }

  let xref = `xref\n0 ${objects.length + 1}\n`
  xref += '0000000000 65535 f \n'
  for (let index = 1; index < offsets.length; index += 1) {
    xref += `${String(offsets[index]).padStart(10, '0')} 00000 n \n`
  }
  xref += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${cursor}\n%%EOF`
  const bytes = concatBytes([header, ...objects, encoder.encode(xref)])
  return new Blob([bytes], { type: 'application/pdf' })
}

function concatBytes(parts: Uint8Array[]) {
  const total = parts.reduce((sum, part) => sum + part.length, 0)
  const out = new Uint8Array(total)
  let offset = 0
  for (const part of parts) {
    out.set(part, offset)
    offset += part.length
  }
  return out
}

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.append(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1500)
}

function wait(ms: number) {
  return new Promise(resolve => window.setTimeout(resolve, ms))
}
