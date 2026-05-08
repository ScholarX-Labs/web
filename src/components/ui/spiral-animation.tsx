'use client'

/** @usage Full-screen hero background, intro/loading screens, splash pages */
import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'

class AnimationController {
  private timeline: gsap.core.Timeline
  private time = 0
  private ctx: CanvasRenderingContext2D
  private size: number
  private stars: Star[] = []

  private readonly changeEventTime = 0.32
  private readonly cameraZ = -400
  private readonly cameraTravelDistance = 3400
  private readonly startDotYOffset = 28
  private readonly viewZoom = 100
  private readonly numberOfStars = 5000
  private readonly trailLength = 80

  constructor(ctx: CanvasRenderingContext2D, size: number) {
    this.ctx = ctx
    this.size = size
    this.timeline = gsap.timeline({ repeat: -1 })

    for (let i = 0; i < this.numberOfStars; i++) {
      this.stars.push(new Star(this.cameraZ, this.cameraTravelDistance))
    }

    this.timeline.to(this, {
      time: 1,
      duration: 15,
      repeat: -1,
      ease: "none",
      onUpdate: () => this.render()
    })
  }

  public ease(p: number, g: number): number {
    return p < 0.5
      ? 0.5 * Math.pow(2 * p, g)
      : 1 - 0.5 * Math.pow(2 * (1 - p), g)
  }

  public easeOutElastic(x: number): number {
    const c4 = (2 * Math.PI) / 4.5
    if (x <= 0) return 0
    if (x >= 1) return 1
    return Math.pow(2, -8 * x) * Math.sin((x * 8 - 0.75) * c4) + 1
  }

  public map(value: number, start1: number, stop1: number, start2: number, stop2: number): number {
    return start2 + (stop2 - start2) * ((value - start1) / (stop1 - start1))
  }

  public constrain(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max)
  }

  public lerp(start: number, end: number, t: number): number {
    return start * (1 - t) + end * t
  }

  public getCameraZ() { return this.cameraZ; }
  public getViewZoom() { return this.viewZoom; }

  public spiralPath(p: number): { x: number; y: number } {
    p = this.constrain(1.2 * p, 0, 1)
    p = this.ease(p, 1.8)
    const theta = 2 * Math.PI * 6 * Math.sqrt(p)
    const r = 170 * Math.sqrt(p)
    return { x: r * Math.cos(theta), y: r * Math.sin(theta) + this.startDotYOffset }
  }

  public rotate(x: number, y: number, p: number, orientation: boolean): { x: number; y: number } {
    const mx = x
    const my = y
    const dx = x - mx
    const dy = y - my
    const angle = Math.atan2(dy, dx)
    const o = orientation ? -1 : 1
    const r = Math.sqrt(dx * dx + dy * dy)
    const bounce = Math.sin(p * Math.PI) * 0.05 * (1 - p)
    const elastic = this.easeOutElastic(p)
    return {
      x: mx + r * (1 + bounce) * Math.cos(angle + o * Math.PI * elastic),
      y: my + r * (1 + bounce) * Math.sin(angle + o * Math.PI * elastic),
    }
  }

  public showProjectedDot(x: number, y: number, z: number, sizeFactor: number) {
    const t2 = this.constrain(this.map(this.time, this.changeEventTime, 1, 0, 1), 0, 1)
    const newCameraZ = this.cameraZ + this.ease(Math.pow(t2, 1.2), 1.8) * this.cameraTravelDistance

    if (z > newCameraZ) {
      const dotDepth = z - newCameraZ
      const sx = this.viewZoom * x / dotDepth
      const sy = this.viewZoom * y / dotDepth
      const sw = 400 * sizeFactor / dotDepth
      this.ctx.lineWidth = sw
      this.ctx.beginPath()
      this.ctx.arc(sx, sy, 0.5, 0, Math.PI * 2)
      this.ctx.fill()
    }
  }

  public render() {
    const ctx = this.ctx
    ctx.fillStyle = 'black'
    ctx.fillRect(0, 0, this.size, this.size)

    ctx.save()
    ctx.translate(this.size / 2, this.size / 2)

    const t1 = this.constrain(this.map(this.time, 0, this.changeEventTime + 0.25, 0, 1), 0, 1)
    const t2 = this.constrain(this.map(this.time, this.changeEventTime, 1, 0, 1), 0, 1)
    ctx.rotate(-Math.PI * this.ease(t2, 2.7))

    for (let i = 0; i < this.trailLength; i++) {
      const f = this.map(i, 0, this.trailLength, 1.1, 0.1)
      const sw = (1.3 * (1 - t1) + 3.0 * Math.sin(Math.PI * t1)) * f
      ctx.fillStyle = 'white'
      ctx.lineWidth = sw

      const pathT = t1 - 0.00015 * i
      const pos = this.spiralPath(pathT)
      const rotated = this.rotate(pos.x + 5, pos.y + 5, Math.sin(this.time * Math.PI * 2) * 0.5 + 0.5, i % 2 === 0)

      ctx.beginPath()
      ctx.arc(rotated.x, rotated.y, sw / 2, 0, Math.PI * 2)
      ctx.fill()
    }

    ctx.fillStyle = 'white'
    for (const star of this.stars) {
      star.render(t1, this)
    }

    if (this.time > this.changeEventTime) {
      const dy = this.cameraZ * this.startDotYOffset / this.viewZoom
      this.showProjectedDot(0, dy, this.cameraTravelDistance, 2.5)
    }

    ctx.restore()
  }

  public destroy() {
    this.timeline.kill()
  }
}

class Star {
  private dx: number
  private dy: number
  private spiralLocation: number
  private strokeWeightFactor: number
  private z: number
  private angle: number
  private distance: number
  private rotationDirection: number
  private expansionRate: number
  private finalScale: number

  constructor(cameraZ: number, cameraTravelDistance: number) {
    this.angle = Math.random() * Math.PI * 2
    this.distance = 30 * Math.random() + 15
    this.rotationDirection = Math.random() > 0.5 ? 1 : -1
    this.expansionRate = 1.2 + Math.random() * 0.8
    this.finalScale = 0.7 + Math.random() * 0.6
    this.dx = this.distance * Math.cos(this.angle)
    this.dy = this.distance * Math.sin(this.angle)
    this.spiralLocation = (1 - Math.pow(1 - Math.random(), 3.0)) / 1.3
    this.z = cameraZ + Math.random() * (cameraTravelDistance + cameraZ)
    this.z = this.z * (1 - 0.3) + (cameraTravelDistance / 2) * 0.3 * this.spiralLocation
    this.strokeWeightFactor = Math.pow(Math.random(), 2.0)
  }

  render(p: number, ctrl: AnimationController) {
    const spiralPos = ctrl.spiralPath(this.spiralLocation)
    const q = p - this.spiralLocation
    if (q <= 0) return

    const dp = ctrl.constrain(4 * q, 0, 1)
    const linearEasing = dp
    const elasticEasing = ctrl.easeOutElastic(dp)
    const powerEasing = Math.pow(dp, 2)

    let easing: number
    if (dp < 0.3) {
      easing = ctrl.lerp(linearEasing, powerEasing, dp / 0.3)
    } else if (dp < 0.7) {
      easing = ctrl.lerp(powerEasing, elasticEasing, (dp - 0.3) / 0.4)
    } else {
      easing = elasticEasing
    }

    let screenX: number, screenY: number

    if (dp < 0.3) {
      screenX = ctrl.lerp(spiralPos.x, spiralPos.x + this.dx * 0.3, easing / 0.3)
      screenY = ctrl.lerp(spiralPos.y, spiralPos.y + this.dy * 0.3, easing / 0.3)
    } else if (dp < 0.7) {
      const midProgress = (dp - 0.3) / 0.4
      const curve = Math.sin(midProgress * Math.PI) * this.rotationDirection * 1.5
      const baseX = spiralPos.x + this.dx * 0.3
      const baseY = spiralPos.y + this.dy * 0.3
      const targetX = spiralPos.x + this.dx * 0.7
      const targetY = spiralPos.y + this.dy * 0.7
      screenX = ctrl.lerp(baseX, targetX, midProgress) - this.dy * 0.4 * curve * midProgress
      screenY = ctrl.lerp(baseY, targetY, midProgress) + this.dx * 0.4 * curve * midProgress
    } else {
      const finalProgress = (dp - 0.7) / 0.3
      const baseX = spiralPos.x + this.dx * 0.7
      const baseY = spiralPos.y + this.dy * 0.7
      const targetDist = this.distance * this.expansionRate * 1.5
      const spiralAngle = this.angle + 1.2 * this.rotationDirection * finalProgress * Math.PI
      screenX = ctrl.lerp(baseX, baseX + targetDist * Math.cos(spiralAngle), finalProgress)
      screenY = ctrl.lerp(baseY, baseY + targetDist * Math.sin(spiralAngle), finalProgress)
    }

    const vx = (this.z - ctrl.getCameraZ()) * screenX / ctrl.getViewZoom()
    const vy = (this.z - ctrl.getCameraZ()) * screenY / ctrl.getViewZoom()

    let sizeMultiplier = 1.0
    if (dp < 0.6) {
      sizeMultiplier = 1.0 + dp * 0.2
    } else {
      const t = (dp - 0.6) / 0.4
      sizeMultiplier = 1.2 * (1 - t) + this.finalScale * t
    }

    ctrl.showProjectedDot(vx, vy, this.z, 8.5 * this.strokeWeightFactor * sizeMultiplier)
  }
}

export function SpiralAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<AnimationController | null>(null)
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })

  useEffect(() => {
    const handleResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight })
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const size = Math.max(dimensions.width, dimensions.height)
    const dpr = window.devicePixelRatio || 1

    canvas.width = size * dpr
    canvas.height = size * dpr
    canvas.style.width = `${dimensions.width}px`
    canvas.style.height = `${dimensions.height}px`
    ctx.scale(dpr, dpr)

    animationRef.current = new AnimationController(ctx, size)

    return () => {
      animationRef.current?.destroy()
      animationRef.current = null
    }
  }, [dimensions])

  return (
    <div className="relative w-full h-full">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  )
}
