import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Camera,
  CameraOff,
  RefreshCw,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Ruler as RulerIcon,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input, Label } from '@/components/ui/Input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
import { cn } from '@/lib/utils'

/**
 * Camera-based measurement.
 *
 * Browsers have no depth sensor, so true 3D dimensions aren't possible from
 * RGB alone. The reliable workaround: ask the user to place a reference
 * object of known size (a credit card is ideal — 85.6mm × 53.98mm by ISO
 * 7810 ID-1) in the same plane as the thing they want to measure, then tap
 * two endpoints of the reference and two endpoints of the measurement.
 * From the reference pixel distance we compute mm-per-pixel and apply it.
 *
 * Accuracy notes:
 *  - The reference and the object must lie in the same plane (i.e. flat on
 *    the same surface) and the camera must be roughly perpendicular to that
 *    plane. Tilted shots introduce perspective error.
 *  - Closer to the camera = bigger reference = more precise.
 *  - For very small or very large objects, accuracy drops; treat results as
 *    estimates.
 */

interface CameraMeasureProps {
  onCapture: (result: { lengthMm: number; lengthCm: number }) => void
  onCancel: () => void
}

type Point = { x: number; y: number } // in *display* coords (CSS pixels of the video element)
type Phase = 'reference' | 'measurement' | 'done'

const REFERENCES: Record<string, { label: string; mm: number }> = {
  'credit-card-long': { label: 'Credit card (long edge, 85.6 mm)', mm: 85.6 },
  'credit-card-short': {
    label: 'Credit card (short edge, 53.98 mm)',
    mm: 53.98,
  },
  'us-quarter': { label: 'US quarter coin (24.26 mm)', mm: 24.26 },
  'us-dollar-long': { label: 'US dollar bill (long edge, 156 mm)', mm: 156 },
  'a4-long': { label: 'A4 paper (long edge, 297 mm)', mm: 297 },
  'a4-short': { label: 'A4 paper (short edge, 210 mm)', mm: 210 },
  custom: { label: 'Custom reference', mm: 100 },
}

export function CameraMeasure({ onCapture, onCancel }: CameraMeasureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const overlayRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [error, setError] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const [needsUserGesture, setNeedsUserGesture] = useState(false)
  const [debugLog, setDebugLog] = useState<string[]>([])
  const log = useCallback((msg: string) => {
    // eslint-disable-next-line no-console
    console.log('[CameraMeasure]', msg)
    setDebugLog((l) => [
      `${new Date().toLocaleTimeString()} ${msg}`,
      ...l,
    ].slice(0, 8))
  }, [])
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>(
    'environment',
  )
  const [refKey, setRefKey] = useState<keyof typeof REFERENCES>(
    'credit-card-long',
  )
  const [customMm, setCustomMm] = useState<number>(100)
  const [refPoints, setRefPoints] = useState<Point[]>([])
  const [objPoints, setObjPoints] = useState<Point[]>([])
  const [phase, setPhase] = useState<Phase>('reference')

  const referenceMm =
    refKey === 'custom' ? customMm : REFERENCES[refKey].mm

  // ---------- camera lifecycle ----------
  const startCamera = useCallback(async () => {
    setError(null)
    setReady(false)
    setNeedsUserGesture(false)
    log(`startCamera (facing=${facingMode})`)

    // Pre-flight: API availability
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      const msg =
        !window.isSecureContext
          ? `getUserMedia is unavailable because this page isn't a secure context. Open the app via http://localhost:5173 (not an http:// LAN IP). isSecureContext=${window.isSecureContext}, protocol=${location.protocol}`
          : 'navigator.mediaDevices.getUserMedia is not available in this browser.'
      log('FAIL ' + msg)
      setError(msg)
      return
    }

    try {
      // Stop any existing stream first
      if (streamRef.current) {
        log('stopping previous stream')
        streamRef.current.getTracks().forEach((t) => t.stop())
      }
      log('calling getUserMedia…')
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: facingMode } },
        audio: false,
      })
      log(
        `got stream: ${stream.getVideoTracks().length} video track(s) (${stream
          .getVideoTracks()
          .map((t) => t.label || 'unnamed')
          .join(', ')})`,
      )
      streamRef.current = stream
      // Retry binding the stream to the video element. The element may not be
      // mounted on the very first effect run if the camera section just opened.
      for (let attempt = 0; attempt < 20; attempt++) {
        if (videoRef.current) break
        await new Promise((r) => setTimeout(r, 50))
      }
      if (!videoRef.current) {
        log('videoRef.current still null after 1s — aborting')
        setError('Internal: video element never mounted.')
        return
      }

      const v = videoRef.current
      v.srcObject = stream
      v.muted = true
      v.playsInline = true
      // Wait for metadata so we know the intrinsic dimensions are available
      await new Promise<void>((resolve) => {
        if (v.readyState >= 1) return resolve()
        const onMeta = () => {
          v.removeEventListener('loadedmetadata', onMeta)
          resolve()
        }
        v.addEventListener('loadedmetadata', onMeta)
      })
      log(
        `loadedmetadata: ${v.videoWidth}×${v.videoHeight}, readyState=${v.readyState}`,
      )
      try {
        await v.play()
        log('video.play() resolved')
        setReady(true)
      } catch (playErr: any) {
        const playName = playErr?.name ?? 'Error'
        log(
          `video.play() rejected: ${playName} ${playErr?.message ?? ''} — needs user gesture`,
        )
        // Autoplay was blocked. The video element has the stream attached, we
        // just need a tap to call play() again from a user gesture.
        setNeedsUserGesture(true)
      }
    } catch (e: any) {
      const name = e?.name ?? 'Error'
      const msg = e?.message ?? String(e)
      log(`FAIL ${name}: ${msg}`)
      if (name === 'NotAllowedError') {
        setError(
          'Camera permission denied. Click the camera icon in your browser bar to enable it, then retry.',
        )
      } else if (name === 'NotFoundError' || name === 'OverconstrainedError') {
        setError(
          `No camera matches the request (facingMode=${facingMode}). Try the Flip button, or connect a webcam.`,
        )
      } else if (name === 'NotReadableError') {
        setError(
          'Camera is in use by another application. Close any other apps using the camera and retry.',
        )
      } else if (name === 'SecurityError') {
        setError(
          'Camera blocked by the browser security policy. Make sure you opened the app via http://localhost or https://, not http:// on a LAN IP.',
        )
      } else {
        setError(`${name}: ${msg}`)
      }
    }
  }, [facingMode, log])

  useEffect(() => {
    startCamera()
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }, [startCamera])

  // ---------- canvas drawing ----------
  const draw = useCallback(() => {
    const canvas = overlayRef.current
    const video = videoRef.current
    if (!canvas || !video) return
    const rect = video.getBoundingClientRect()
    if (canvas.width !== rect.width || canvas.height !== rect.height) {
      canvas.width = rect.width
      canvas.height = rect.height
    }
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    drawSegment(ctx, refPoints, '#22c55e', 'REF')
    drawSegment(ctx, objPoints, '#3b82f6', 'OBJ')
  }, [refPoints, objPoints])

  useEffect(() => {
    let id = 0
    const loop = () => {
      draw()
      id = requestAnimationFrame(loop)
    }
    loop()
    return () => cancelAnimationFrame(id)
  }, [draw])

  // ---------- tap handling ----------
  function handleVideoTap(e: React.PointerEvent<HTMLDivElement>) {
    if (!ready) return
    const target = e.currentTarget.getBoundingClientRect()
    const p: Point = {
      x: e.clientX - target.left,
      y: e.clientY - target.top,
    }
    if (phase === 'reference') {
      const next = refPoints.length >= 2 ? [p] : [...refPoints, p]
      setRefPoints(next)
      if (next.length === 2) setPhase('measurement')
    } else if (phase === 'measurement') {
      const next = objPoints.length >= 2 ? [p] : [...objPoints, p]
      setObjPoints(next)
      if (next.length === 2) setPhase('done')
    }
  }

  // ---------- computation ----------
  const refPx =
    refPoints.length === 2
      ? distance(refPoints[0], refPoints[1])
      : null
  const objPx =
    objPoints.length === 2
      ? distance(objPoints[0], objPoints[1])
      : null
  const mmPerPx = refPx && referenceMm > 0 ? referenceMm / refPx : null
  const measuredMm = objPx && mmPerPx ? objPx * mmPerPx : null
  const measuredCm = measuredMm != null ? measuredMm / 10 : null

  function reset() {
    setRefPoints([])
    setObjPoints([])
    setPhase('reference')
  }

  function flipCamera() {
    setFacingMode((m) => (m === 'environment' ? 'user' : 'environment'))
  }

  return (
    <div className="flex max-h-[85vh] flex-col gap-4">
      {/* Step instructions */}
      <div className="rounded-lg border bg-muted/40 p-3 text-sm">
        <div className="flex items-center gap-2 font-medium">
          <RulerIcon className="h-4 w-4 text-primary" />
          {phase === 'reference' && '① Tap the two ends of the reference object'}
          {phase === 'measurement' &&
            '② Now tap the two ends of what you want to measure'}
          {phase === 'done' && '✓ Measured — review below or reset to redo'}
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          Keep the reference and the object flat in the same plane and shoot
          roughly straight-down for best accuracy.
        </div>
      </div>

      {/* Reference picker */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Reference object</Label>
          <Select
            value={refKey}
            onValueChange={(v) => {
              setRefKey(v as keyof typeof REFERENCES)
              reset()
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(REFERENCES).map(([k, v]) => (
                <SelectItem key={k} value={k}>
                  {v.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {refKey === 'custom' && (
          <div className="space-y-1.5">
            <Label>Custom reference length (mm)</Label>
            <Input
              type="number"
              min={1}
              step="0.1"
              value={customMm}
              onChange={(e) => {
                setCustomMm(Number(e.target.value) || 0)
                reset()
              }}
            />
          </div>
        )}
      </div>

      {/* Camera viewport */}
      <div className="relative overflow-hidden rounded-lg border bg-black">
        {error ? (
          <div className="flex aspect-video flex-col items-center justify-center gap-3 p-6 text-center text-white">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-amber-500/20">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
            </div>
            <div className="max-w-md text-sm">{error}</div>
            <Button variant="secondary" onClick={startCamera}>
              <RefreshCw className="h-4 w-4" /> Retry
            </Button>
          </div>
        ) : (
          <div
            className="relative aspect-video min-h-[280px] cursor-crosshair bg-black"
            onPointerDown={handleVideoTap}
          >
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className="absolute inset-0 h-full w-full bg-black object-cover"
            />
            <canvas
              ref={overlayRef}
              className="pointer-events-none absolute inset-0 h-full w-full"
            />
            {!ready && !needsUserGesture && (
              <div className="absolute inset-0 grid place-items-center bg-black/60 text-sm text-white">
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Starting camera…
                </div>
              </div>
            )}
            {needsUserGesture && (
              <button
                type="button"
                onClick={async () => {
                  try {
                    await videoRef.current?.play()
                    setNeedsUserGesture(false)
                    setReady(true)
                    log('manual play() succeeded')
                  } catch (e: any) {
                    log(`manual play() failed: ${e?.name}`)
                  }
                }}
                className="absolute inset-0 grid place-items-center bg-black/70 text-sm text-white"
              >
                <div className="rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground shadow-lg">
                  ▶ Tap to start camera
                </div>
              </button>
            )}
            {/* Phase chips */}
            <div className="absolute left-3 top-3 flex gap-2">
              <Chip active={phase === 'reference'} color="emerald">
                1. Reference
              </Chip>
              <Chip active={phase === 'measurement'} color="blue">
                2. Object
              </Chip>
            </div>
          </div>
        )}
      </div>

      {/* Result + controls */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border bg-card p-3 text-sm">
          <div className="text-xs text-muted-foreground">
            Reference (green)
          </div>
          <div className="font-medium">
            {refPx ? `${refPx.toFixed(0)} px = ${referenceMm} mm` : '—'}
          </div>
        </div>
        <div className="rounded-lg border bg-card p-3 text-sm">
          <div className="text-xs text-muted-foreground">
            Measured (blue)
          </div>
          <div
            className={cn(
              'text-lg font-bold',
              measuredMm != null ? 'text-primary' : 'text-muted-foreground',
            )}
          >
            {measuredMm != null
              ? `${measuredMm.toFixed(1)} mm · ${measuredCm!.toFixed(2)} cm`
              : '—'}
          </div>
        </div>
      </div>

      {/* Debug log (last 8 events) — useful when camera misbehaves */}
      {(error || debugLog.length > 0) && (
        <details className="rounded-md border bg-muted/30 p-2 text-xs">
          <summary className="cursor-pointer select-none font-medium text-muted-foreground">
            Camera diagnostics ({debugLog.length})
          </summary>
          <div className="mt-2 space-y-1 font-mono text-[11px] text-muted-foreground">
            <div>
              secureContext: <b>{String(window.isSecureContext)}</b> ·
              protocol: <b>{location.protocol}</b> · host: <b>{location.host}</b>
            </div>
            <div>
              mediaDevices: <b>{String(!!navigator.mediaDevices)}</b> ·
              getUserMedia:{' '}
              <b>{String(!!navigator.mediaDevices?.getUserMedia)}</b>
            </div>
            {debugLog.map((l, i) => (
              <div key={i}>{l}</div>
            ))}
          </div>
        </details>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={reset}>
            <Trash2 className="h-4 w-4" /> Reset points
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={flipCamera}
            title="Switch between front and back camera"
          >
            <Camera className="h-4 w-4" /> Flip
          </Button>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onCancel}>
            <CameraOff className="h-4 w-4" /> Cancel
          </Button>
          <Button
            disabled={measuredMm == null}
            onClick={() =>
              measuredMm != null &&
              onCapture({
                lengthMm: round(measuredMm, 1),
                lengthCm: round(measuredMm / 10, 2),
              })
            }
          >
            <CheckCircle2 className="h-4 w-4" /> Use measurement
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

function Chip({
  children,
  active,
  color,
}: {
  children: React.ReactNode
  active: boolean
  color: 'emerald' | 'blue'
}) {
  return (
    <span
      className={cn(
        'rounded-full px-2.5 py-1 text-xs font-medium backdrop-blur',
        active
          ? color === 'emerald'
            ? 'bg-emerald-500 text-white'
            : 'bg-blue-500 text-white'
          : 'bg-black/40 text-white/70',
      )}
    >
      {children}
    </span>
  )
}

function drawSegment(
  ctx: CanvasRenderingContext2D,
  pts: Point[],
  color: string,
  label: string,
) {
  if (pts.length === 0) return
  ctx.lineWidth = 2
  ctx.strokeStyle = color
  ctx.fillStyle = color
  if (pts.length === 2) {
    ctx.beginPath()
    ctx.moveTo(pts[0].x, pts[0].y)
    ctx.lineTo(pts[1].x, pts[1].y)
    ctx.stroke()
    // midpoint label
    const mid = {
      x: (pts[0].x + pts[1].x) / 2,
      y: (pts[0].y + pts[1].y) / 2,
    }
    ctx.font = 'bold 12px ui-sans-serif, system-ui, sans-serif'
    const text = label
    const w = ctx.measureText(text).width + 8
    ctx.fillRect(mid.x - w / 2, mid.y - 18, w, 16)
    ctx.fillStyle = '#fff'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, mid.x, mid.y - 10)
  }
  ctx.fillStyle = color
  for (const p of pts) {
    ctx.beginPath()
    ctx.arc(p.x, p.y, 7, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(p.x, p.y, 3, 0, Math.PI * 2)
    ctx.fillStyle = '#fff'
    ctx.fill()
    ctx.fillStyle = color
  }
}

function distance(a: Point, b: Point) {
  const dx = a.x - b.x
  const dy = a.y - b.y
  return Math.hypot(dx, dy)
}

function round(n: number, places: number) {
  const f = 10 ** places
  return Math.round(n * f) / f
}
