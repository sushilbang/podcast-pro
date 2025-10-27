"use client"

import type React from "react"
import { useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"

export default function Page() {
  const navbarRef = useRef<HTMLDivElement>(null)
  // navbar scroll effect
  useEffect(() => {
    const handleNavbarScroll = () => {
      const navbar = navbarRef.current
      if (!navbar) return

      const scrolled = window.scrollY > 50
      if (scrolled) {
        navbar.classList.add('scrolled')
      } else {
        navbar.classList.remove('scrolled')
      }
    }

    window.addEventListener('scroll', handleNavbarScroll)
    return () => window.removeEventListener('scroll', handleNavbarScroll)
  }, [])
  // animations
  useEffect(() => {
    // Initialize canvas animations
    new BentoCanvasAnimations()
  }, [])

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap');

        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        html {
          scroll-behavior: smooth;
        }

        body {
          font-family: 'Plus Jakarta Sans', sans-serif;
          overflow-x: hidden;
        }

        .hero {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: linear-gradient(135deg, rgba(0, 0, 0, 0.02), rgba(0, 0, 0, 0.05));
          padding: 16px;
          justify-content: center;
          align-items: center;
        }

        /* ===== NAVBAR (Mobile First) ===== */
        .navbar {
          position: fixed;
          top: 8px;
          left: 50%;
          background: white;
          transform: translateX(-50%);
          backdrop-filter: blur(20px);
          border-radius: 50px;
          z-index: 1000;
          border: 1px solid rgba(0, 0, 0, 0.12);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          width: calc(100vw - 16px);
          max-width: 340px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .navbar.scrolled {
          top: 8px;
          height: 36px;
        }

        .nav-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          height: 100%;
          padding: 0 12px;
          gap: 8px;
        }

        .logo {
          font-family: 'Inter', sans-serif;
          font-weight: 700;
          font-size: 12px;
          color: black;
          margin: 0;
          padding: 0;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .nav-links {
          display: flex;
          gap: 8px;
          align-items: center;
          justify-content: flex-end;
          height: 100%;
          margin: 0;
          padding: 0;
          flex-shrink: 0;
        }

        .nav-links a {
          text-decoration: none;
          color: black;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 600;
          font-size: 10px;
          transition: all 0.3s ease;
          cursor: pointer;
          white-space: nowrap;
          display: flex;
          align-items: center;
          height: 100%;
          padding: 0 6px;
        }

        .nav-links a:hover {
          color: rgba(0, 0, 0, 0.6);
        }

        .nav-links a:active {
          color: rgba(0, 0, 0, 0.9);
        }

        /* ===== HERO SECTION (Mobile First) ===== */
        .hero-heading {
          font-size: 24px;
          font-weight: 700;
          line-height: 1.35;
          letter-spacing: -0.02em;
          font-family: 'Plus Jakarta Sans', sans-serif;
          text-align: center;
          padding: 0 8px;
          margin-top: 20px;
        }

        #feat-pod {
          background-color: black;
          color: white;
          padding: 4px 8px;
          border-radius: 6px;
          font-family: 'Inter', sans-serif;
          font-size: 0.9em;
        }

        .hero-heading h2 {
          margin: 0;
        }

        .hero-img {
          display: none;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          flex: 1;
        }

        .hero-img img {
          max-width: 100%;
          height: auto;
          object-fit: contain;
          border-radius: 20px;
        }

        /* ===== FEATURES SECTION (Mobile First) ===== */
        .features {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
          padding: 0;
        }

        .features-title {
          text-align: center;
          font-size: 24px;
          font-weight: 700;
          font-family: 'Plus Jakarta Sans', sans-serif;
          margin: 30px 16px 16px;
          letter-spacing: -0.02em;
        }

        .features-subtitle {
          text-align: center;
          font-size: 16px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          margin: 0 16px 24px;
          color: rgba(0, 0, 0, 0.7);
        }

        /* ===== BENTO GRID (Mobile First) ===== */
        .bento-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
          max-width: 1400px;
          width: 100%;
          margin: 0 auto;
          position: relative;
          z-index: 2;
          padding: 0 12px 40px;
        }

        .bento-item {
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(20px);
          padding: 16px;
          border-radius: 16px;
          position: relative;
          overflow: hidden;
          min-height: 320px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          transition: all 0.3s ease;
          border: 1px solid rgba(0, 0, 0, 0.2);
        }

        .bento-item:nth-child(1) {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(248, 248, 255, 0.9));
        }

        .bento-item:nth-child(2) {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(255, 248, 248, 0.9));
        }

        .bento-item:nth-child(3) {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(248, 255, 248, 0.9));
        }

        .bento-item:nth-child(4) {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(255, 248, 255, 0.9));
        }

        .bento-item:nth-child(5) {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(248, 255, 255, 0.9));
        }

        .bento-item:nth-child(6) {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(255, 255, 248, 0.9));
        }

        .bento-item h3 {
          font-size: 15px;
          font-weight: 600;
          color: black;
          letter-spacing: -0.01em;
          font-family: 'Plus Jakarta Sans', sans-serif;
          z-index: 2;
          margin-bottom: 6px;
        }

        .feature-description {
          font-size: 12px;
          line-height: 1.5;
          color: rgba(0, 0, 0, 0.7);
          font-family: 'Plus Jakarta Sans', sans-serif;
          z-index: 2;
          margin-bottom: 8px;
        }

        .bento-canvas {
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 1;
        }

        /* ===== CTA SECTION (Mobile First) ===== */
        .cta-section {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 16px;
          background: linear-gradient(135deg, rgba(0, 0, 0, 0.02), rgba(0, 0, 0, 0.05));
          margin-top: 40px;
        }

        .cta-content {
          text-align: center;
          max-width: 600px;
          width: 100%;
        }

        .cta-content h2 {
          font-size: 24px;
          font-weight: 700;
          font-family: 'Plus Jakarta Sans', sans-serif;
          color: black;
          margin-bottom: 12px;
          letter-spacing: -0.02em;
        }

        .cta-content p {
          font-size: 14px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          color: rgba(0, 0, 0, 0.7);
          margin-bottom: 24px;
          line-height: 1.6;
        }

        .cta-button {
          background: black;
          color: white;
          border: none;
          padding: 11px 28px;
          font-size: 13px;
          font-weight: 600;
          font-family: 'Plus Jakarta Sans', sans-serif;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .cta-button:hover {
          background: rgba(0, 0, 0, 0.9);
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
        }

        .cta-button:active {
          transform: translateY(0);
        }

        /* ===== TABLET (600px - 1024px) ===== */
        @media (min-width: 600px) {
          .navbar {
            width: calc(100vw - 24px);
            max-width: 420px;
            height: 44px;
            top: 12px;
          }

          .navbar.scrolled {
            height: 40px;
          }

          .nav-container {
            padding: 0 16px;
            gap: 12px;
          }

          .logo {
            font-size: 13px;
          }

          .nav-links a {
            font-size: 11px;
            padding: 0 8px;
          }

          .hero {
            padding: 80px 24px;
          }

          .hero-heading {
            font-size: 28px;
            line-height: 1.4;
            margin-top: 16px;
          }

          .features-title {
            font-size: 28px;
            margin: 32px 24px 16px;
          }

          .features-subtitle {
            font-size: 18px;
            margin: 0 24px 32px;
          }

          .bento-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 14px;
            padding: 0 16px 40px;
          }

          .bento-item {
            min-height: 360px;
            padding: 18px;
          }

          .bento-item h3 {
            font-size: 16px;
          }

          .feature-description {
            font-size: 13px;
          }

          .cta-section {
            padding: 50px 24px;
            margin-top: 40px;
          }

          .cta-content h2 {
            font-size: 28px;
          }

          .cta-content p {
            font-size: 16px;
          }

          .cta-button {
            padding: 12px 32px;
            font-size: 14px;
          }
        }

        /* ===== TABLET LANDSCAPE (1025px - 1200px) ===== */
        @media (min-width: 1025px) {
          .navbar {
            width: 550px;
            height: 48px;
            top: 20px;
            max-width: none;
          }

          .navbar.scrolled {
            width: 450px;
            height: 44px;
          }

          .nav-container {
            padding: 0 24px;
            gap: 20px;
          }

          .logo {
            font-size: 14px;
          }

          .nav-links {
            gap: 20px;
          }

          .nav-links a {
            font-size: 12px;
            padding: 0 8px;
          }

          .hero {
            flex-direction: row;
            padding: 60px 48px;
            gap: 40px;
            justify-content: space-between;
            align-items: center;
          }

          .hero-heading {
            font-size: 36px;
            line-height: 1.4;
            flex: 1;
            text-align: left;
            padding: 0;
            margin-top: 0;
          }

          .hero-img {
            display: flex;
            flex: 1;
            min-height: 400px;
          }

          .hero-img img {
            max-width: 420px;
            max-height: 420px;
            width: 100%;
            height: auto;
          }

          .features-title {
            font-size: 32px;
            margin: 40px 0 16px;
          }

          .features-subtitle {
            font-size: 20px;
            margin: 0 0 40px;
          }

          .bento-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 18px;
            padding: 0 32px 50px;
            max-width: 1200px;
          }

          .bento-item {
            min-height: 400px;
            padding: 20px;
          }

          .bento-item h3 {
            font-size: 17px;
          }

          .feature-description {
            font-size: 14px;
          }

          .cta-section {
            padding: 60px 32px;
            margin-top: 50px;
          }

          .cta-content h2 {
            font-size: 32px;
          }

          .cta-content p {
            font-size: 17px;
          }

          .cta-button {
            padding: 13px 36px;
            font-size: 15px;
          }
        }

        /* ===== DESKTOP (1201px - 1440px) ===== */
        @media (min-width: 1201px) {
          .navbar {
            width: 600px;
            height: 52px;
            top: 20px;
          }

          .navbar.scrolled {
            width: 480px;
            height: 48px;
          }

          .nav-container {
            padding: 0 28px;
            gap: 24px;
          }

          .logo {
            font-size: 15px;
          }

          .nav-links {
            gap: 24px;
          }

          .nav-links a {
            font-size: 13px;
          }

          .hero {
            flex-direction: row;
            padding: 60px 80px;
            gap: 60px;
          }

          .hero-heading {
            font-size: 40px;
            line-height: 1.45;
            flex: 1;
          }

          .hero-img {
            display: flex;
            flex: 1;
            min-height: 450px;
          }

          .hero-img img {
            max-width: 480px;
            max-height: 480px;
            width: 100%;
            height: auto;
          }

          .features-title {
            font-size: 38px;
            margin: 50px 0 20px;
          }

          .features-subtitle {
            font-size: 22px;
            margin: 0 0 50px;
          }

          .bento-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            padding: 0 40px 60px;
            max-width: 1400px;
          }

          .bento-item {
            min-height: 420px;
            padding: 24px;
          }

          .bento-item h3 {
            font-size: 18px;
          }

          .feature-description {
            font-size: 14px;
          }

          .cta-section {
            padding: 80px 40px;
            margin-top: 60px;
          }

          .cta-content h2 {
            font-size: 36px;
          }

          .cta-content p {
            font-size: 18px;
          }

          .cta-button {
            padding: 14px 40px;
            font-size: 16px;
          }
        }

        /* ===== ULTRA-WIDE (1441px+) ===== */
        @media (min-width: 1441px) {
          .navbar {
            width: 700px;
            height: 56px;
          }

          .navbar.scrolled {
            width: 520px;
            height: 50px;
          }

          .nav-container {
            padding: 0 32px;
            gap: 28px;
          }

          .logo {
            font-size: 16px;
          }

          .nav-links a {
            font-size: 14px;
          }

          .hero {
            padding: 80px 100px;
            gap: 80px;
          }

          .hero-heading {
            font-size: 44px;
            line-height: 1.5;
          }

          .hero-img img {
            max-width: 500px;
            max-height: 500px;
          }

          .features-title {
            font-size: 42px;
          }

          .features-subtitle {
            font-size: 24px;
          }

          .bento-grid {
            gap: 24px;
            padding: 0 60px 80px;
          }

          .bento-item {
            min-height: 420px;
            padding: 28px;
          }

          .bento-item h3 {
            font-size: 19px;
          }

          .feature-description {
            font-size: 15px;
          }

          .cta-section {
            padding: 100px 60px;
            margin-top: 80px;
          }

          .cta-content h2 {
            font-size: 40px;
          }

          .cta-content p {
            font-size: 20px;
          }

          .cta-button {
            padding: 16px 48px;
            font-size: 17px;
          }
        }
      `}</style>

      <nav className="navbar" id="navbar" ref={navbarRef}>
        <div className="nav-container">
          <div
            className="logo rounded"
            style={{ background: 'black', color: 'white', padding: '6px 12px' }}
          >
            POD
          </div>
          <div className="nav-links">
            <Link href="/login">Get Started</Link>
            <Link href="/demo">Watch Demo</Link>
          </div>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-heading">
          <h2>
            If you&apos;re gonna spend time on short content, <span style={{ fontStyle: "italic", fontWeight: "500" }}>honey</span>, it better be worth the listen.
          </h2>
        </div>
        <div className="hero-img">
          <Image
            src="/image.jpg"
            alt="hero image"
            width={800}
            height={600}
            priority
          />
        </div>
      </section>

      <section className="features">
        <h2 className="features-title">What do <span id="feat-pod">POD</span> do?</h2>
        <p className="features-subtitle">Have a look on what pod can do for you</p>
        <div className="bento-grid">
          <div className="bento-item">
            <h3>PDF Upload</h3>
            <p className="feature-description">Easily upload your PDF documents with an intuitive interface and real-time upload feedback.</p>
            <canvas className="bento-canvas" id="canvas-upload" width="400" height="300"></canvas>
          </div>

          <div className="bento-item">
            <h3>Audio Conversion</h3>
            <p className="feature-description">Convert your PDF content to high-quality audio using advanced AI-powered text-to-speech technology.</p>
            <canvas className="bento-canvas" id="canvas-audio-conversion" width="400" height="300"></canvas>
          </div>

          <div className="bento-item">
            <h3>Progress Tracking</h3>
            <p className="feature-description">Monitor your episode generation in real-time with clear step-by-step progress indicators.</p>
            <canvas className="bento-canvas" id="canvas-progress-tracking" width="400" height="300"></canvas>
          </div>

          <div className="bento-item">
            <h3>Short-Form Creator</h3>
            <p className="feature-description">Automatically create bite-sized 5-10 minute episodes perfect for on-the-go listening.</p>
            <canvas className="bento-canvas" id="canvas-short-form" width="400" height="300"></canvas>
          </div>

          <div className="bento-item">
            <h3>Premium Quality</h3>
            <p className="feature-description">Enjoy studio-grade audio quality with advanced sound processing and optimization.</p>
            <canvas className="bento-canvas" id="canvas-quality" width="400" height="300"></canvas>
          </div>

          <div className="bento-item">
            <h3>Multi-Voice Support</h3>
            <p className="feature-description">Create dynamic content with multiple voice options for a more engaging listening experience.</p>
            <canvas className="bento-canvas" id="canvas-multi-voice" width="400" height="300"></canvas>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="cta-content">
          <h2>Think your PDFs can handle a fierce audio makeover?</h2>
          <p>Quit stalling and sass those pages into ear-popping episodes already!</p>
          <button className="cta-button">
            <Link href="/login" style={{ color: 'white', textDecoration: 'none' }}>
              Get Started
            </Link>
          </button>
        </div>
      </section>
    </>
  )
}

// Canvas animations class
interface CanvasInfo {
  element?: HTMLCanvasElement
  context?: CanvasRenderingContext2D | null
  width?: number
  height?: number
}

class BentoCanvasAnimations {
  private canvases: Record<string, CanvasInfo | HTMLCanvasElement> = {}
  private animations: Record<string, number> = {}

  constructor() {
    this.init()
  }

  init() {
    this.setupCanvases()
    this.setupIntersectionObserver()
  }

  setupCanvases() {
    const canvasIds = [
      'canvas-upload',
      'canvas-audio-conversion',
      'canvas-progress-tracking',
      'canvas-short-form',
      'canvas-quality',
      'canvas-multi-voice'
    ]

    canvasIds.forEach(id => {
      const canvas = document.getElementById(id) as HTMLCanvasElement
      if (canvas) {
        this.canvases[id] = canvas
        this.setupCanvas(canvas, id)
      }
    })
  }

  setupCanvas(canvas: HTMLCanvasElement, id: string) {
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * window.devicePixelRatio
      canvas.height = rect.height * window.devicePixelRatio
      canvas.style.width = rect.width + 'px'
      canvas.style.height = rect.height + 'px'

      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
      }
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    this.canvases[id] = {
      element: canvas,
      context: canvas.getContext('2d'),
      width: canvas.width,
      height: canvas.height
    }
  }

  setupIntersectionObserver() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const canvasId = (entry.target as HTMLCanvasElement).id
          this.startAnimation(canvasId)
        } else {
          const canvasId = (entry.target as HTMLCanvasElement).id
          this.stopAnimation(canvasId)
        }
      })
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    })

    Object.values(this.canvases).forEach(canvasItem => {
      const canvasElement = 'element' in canvasItem ? canvasItem.element : canvasItem
      if (canvasElement && canvasElement instanceof HTMLCanvasElement) {
        observer.observe(canvasElement)
      }
    })
  }

  startAnimation(canvasId: string) {
    this.stopAnimation(canvasId)

    switch (canvasId) {
      case 'canvas-upload':
        this.animateUpload(canvasId)
        break
      case 'canvas-audio-conversion':
        this.animateAudioConversion(canvasId)
        break
      case 'canvas-progress-tracking':
        this.animateProgressTracking(canvasId)
        break
      case 'canvas-short-form':
        this.animateShortForm(canvasId)
        break
      case 'canvas-quality':
        this.animateQuality(canvasId)
        break
      case 'canvas-multi-voice':
        this.animateMultiVoice(canvasId)
        break
    }
  }

  stopAnimation(canvasId: string) {
    if (this.animations[canvasId]) {
      cancelAnimationFrame(this.animations[canvasId])
      delete this.animations[canvasId]
    }
  }

  getCanvasInfo(canvasId: string): CanvasInfo | null {
    const canvas = this.canvases[canvasId]
    if (!canvas) return null
    if ('element' in canvas) {
      return canvas as CanvasInfo
    }
    return null
  }

  // Animation implementations
  animateUpload = (canvasId: string) => {
    const canvas = this.getCanvasInfo(canvasId)
    if (!canvas || !canvas.context || !canvas.element) return
    const ctx = canvas.context
    const width = canvas.element.width / window.devicePixelRatio
    const height = canvas.element.height / window.devicePixelRatio

    let time = 0
    let uploadProgress = 0

    const animate = () => {
      ctx.clearRect(0, 0, width, height)
      time += 0.02

      const docWidth = width * 0.3
      const docHeight = height * 0.45
      const docX = width * 0.35
      const docY = height * 0.15 + Math.sin(time) * 5

      ctx.fillStyle = '#ffffff'
      ctx.strokeStyle = '#000000'
      ctx.lineWidth = 2

      ctx.beginPath()
      ctx.rect(docX, docY, docWidth, docHeight)
      ctx.fill()
      ctx.stroke()

      const cornerSize = docWidth * 0.2
      ctx.beginPath()
      ctx.moveTo(docX + docWidth - cornerSize, docY)
      ctx.lineTo(docX + docWidth, docY + cornerSize)
      ctx.lineTo(docX + docWidth - cornerSize, docY + cornerSize)
      ctx.closePath()
      ctx.fillStyle = '#cccccc'
      ctx.fill()
      ctx.stroke()

      ctx.fillStyle = '#333333'
      for (let i = 0; i < 6; i++) {
        const lineY = docY + docHeight * 0.3 + i * (docHeight * 0.1)
        const lineWidth = docWidth * (0.6 + Math.random() * 0.2)
        ctx.fillRect(docX + docWidth * 0.15, lineY, lineWidth, 2)
      }

      ctx.fillStyle = '#000000'
      ctx.font = `bold ${width * 0.05}px Arial`
      ctx.textAlign = 'center'
      ctx.fillText('PDF', docX + docWidth / 2, docY + docHeight * 0.2)

      uploadProgress = (uploadProgress + 0.015) % 2
      const arrowProgress = uploadProgress > 1 ? 1 : uploadProgress
      const arrowStartY = docY + docHeight + 20
      const arrowEndY = height * 0.85
      const arrowY = arrowStartY + (arrowEndY - arrowStartY) * arrowProgress
      const arrowX = width * 0.5
      const opacity = uploadProgress > 1 ? 1 - (uploadProgress - 1) : 1

      ctx.globalAlpha = opacity
      ctx.strokeStyle = '#000000'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(arrowX, arrowStartY)
      ctx.lineTo(arrowX, arrowY)
      ctx.stroke()

      const arrowHeadSize = 10
      ctx.beginPath()
      ctx.moveTo(arrowX, arrowY)
      ctx.lineTo(arrowX - arrowHeadSize, arrowY - arrowHeadSize)
      ctx.moveTo(arrowX, arrowY)
      ctx.lineTo(arrowX + arrowHeadSize, arrowY - arrowHeadSize)
      ctx.stroke()

      ctx.globalAlpha = 1
      ctx.strokeStyle = '#000000'
      ctx.lineWidth = 2
      ctx.setLineDash([5, 5])
      ctx.strokeRect(width * 0.25, height * 0.8, width * 0.5, height * 0.15)
      ctx.setLineDash([])

      this.animations[canvasId] = requestAnimationFrame(animate)
    }

    animate()
  }

  animateAudioConversion = (canvasId: string) => {
    const canvas = this.getCanvasInfo(canvasId)
    if (!canvas || !canvas.context || !canvas.element) return
    const ctx = canvas.context
    const width = canvas.element.width / window.devicePixelRatio
    const height = canvas.element.height / window.devicePixelRatio

    let time = 0
    let particleProgress = 0

    const animate = () => {
      ctx.clearRect(0, 0, width, height)
      time += 0.02
      particleProgress = (particleProgress + 0.01) % 1

      const pdfSize = width * 0.15
      const pdfX = width * 0.5 - pdfSize / 2
      const pdfY = height * 0.1

      ctx.fillStyle = '#ffffff'
      ctx.strokeStyle = '#000000'
      ctx.lineWidth = 2
      ctx.fillRect(pdfX, pdfY, pdfSize, pdfSize * 1.3)
      ctx.strokeRect(pdfX, pdfY, pdfSize, pdfSize * 1.3)

      ctx.fillStyle = '#000000'
      ctx.font = `${width * 0.03}px Arial`
      ctx.textAlign = 'center'
      ctx.fillText('PDF', width * 0.5, pdfY + pdfSize * 0.7)

      const funnelTopY = pdfY + pdfSize * 1.3 + 20
      const funnelBottomY = height * 0.75
      const funnelTopWidth = width * 0.5
      const funnelBottomWidth = width * 0.15

      ctx.strokeStyle = '#000000'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(width * 0.5 - funnelTopWidth / 2, funnelTopY)
      ctx.lineTo(width * 0.5 - funnelBottomWidth / 2, funnelBottomY)
      ctx.lineTo(width * 0.5 + funnelBottomWidth / 2, funnelBottomY)
      ctx.lineTo(width * 0.5 + funnelTopWidth / 2, funnelTopY)
      ctx.closePath()
      ctx.stroke()

      for (let i = 0; i < 3; i++) {
        const offset = (particleProgress + i * 0.33) % 1
        const y = funnelTopY + (funnelBottomY - funnelTopY) * offset
        const funnelWidthAtY = funnelTopWidth - (funnelTopWidth - funnelBottomWidth) * offset

        for (let j = -1; j <= 1; j++) {
          const x = width * 0.5 + (funnelWidthAtY * 0.3 * j)
          const size = 4 - offset * 2

          ctx.fillStyle = '#000000'
          ctx.beginPath()
          ctx.arc(x, y, size, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      const podcastY = funnelBottomY + 20
      const podcastSize = width * 0.12

      ctx.strokeStyle = '#000000'
      ctx.lineWidth = 2
      ctx.fillStyle = '#000000'

      ctx.beginPath()
      ctx.arc(width * 0.5, podcastY, podcastSize * 0.3, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillRect(width * 0.5 - 2, podcastY + podcastSize * 0.3, 4, podcastSize * 0.4)
      ctx.fillRect(width * 0.5 - podcastSize * 0.2, podcastY + podcastSize * 0.7, podcastSize * 0.4, 3)

      for (let i = 1; i <= 2; i++) {
        const waveRadius = podcastSize * 0.3 + i * 15 + Math.sin(time * 2) * 3
        ctx.strokeStyle = '#000000'
        ctx.lineWidth = 2
        ctx.globalAlpha = 0.5 - i * 0.2
        ctx.beginPath()
        ctx.arc(width * 0.5, podcastY, waveRadius, -Math.PI * 0.3, -Math.PI * 0.7, true)
        ctx.stroke()
        ctx.beginPath()
        ctx.arc(width * 0.5, podcastY, waveRadius, Math.PI * 0.3, Math.PI * 0.7, false)
        ctx.stroke()
      }

      ctx.globalAlpha = 1

      this.animations[canvasId] = requestAnimationFrame(animate)
    }

    animate()
  }

  animateProgressTracking = (canvasId: string) => {
    const canvas = this.getCanvasInfo(canvasId)
    if (!canvas || !canvas.context || !canvas.element) return
    const ctx = canvas.context
    const width = canvas.element.width / window.devicePixelRatio
    const height = canvas.element.height / window.devicePixelRatio

    let time = 0
    let progress = 0

    const steps = [
      { label: 'Upload', icon: '↑' },
      { label: 'Process', icon: '⚙' },
      { label: 'Convert', icon: '🎙' },
      { label: 'Complete', icon: '✓' }
    ]

    const animate = () => {
      ctx.clearRect(0, 0, width, height)
      time += 0.02
      progress = (Math.sin(time * 0.5) + 1) / 2

      const stepWidth = width * 0.7 / steps.length
      const startX = width * 0.15
      const lineY = height * 0.5

      ctx.strokeStyle = '#cccccc'
      ctx.lineWidth = 4
      ctx.beginPath()
      ctx.moveTo(startX, lineY)
      ctx.lineTo(startX + width * 0.7, lineY)
      ctx.stroke()

      const progressLength = width * 0.7 * progress
      ctx.strokeStyle = '#000000'
      ctx.lineWidth = 4
      ctx.beginPath()
      ctx.moveTo(startX, lineY)
      ctx.lineTo(startX + progressLength, lineY)
      ctx.stroke()

      steps.forEach((step, index) => {
        const x = startX + index * stepWidth
        const isActive = progress >= index / (steps.length - 1)
        const isCurrentStep = progress >= index / (steps.length - 1) &&
                             progress < (index + 1) / (steps.length - 1)

        ctx.fillStyle = isActive ? '#000000' : '#ffffff'
        ctx.strokeStyle = '#000000'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(x, lineY, 15, 0, Math.PI * 2)
        ctx.fill()
        ctx.stroke()

        if (isCurrentStep) {
          const pulseRadius = 15 + Math.sin(time * 3) * 5
          ctx.strokeStyle = '#000000'
          ctx.globalAlpha = 0.3
          ctx.beginPath()
          ctx.arc(x, lineY, pulseRadius, 0, Math.PI * 2)
          ctx.stroke()
          ctx.globalAlpha = 1
        }

        ctx.fillStyle = '#000000'
        ctx.font = `${width * 0.035}px Arial`
        ctx.textAlign = 'center'
        ctx.fillText(step.label, x, lineY + 40)
      })

      ctx.fillStyle = '#000000'
      ctx.font = `bold ${width * 0.05}px Arial`
      ctx.textAlign = 'center'
      ctx.fillText(`${Math.floor(progress * 100)}%`, width * 0.5, height * 0.25)

      this.animations[canvasId] = requestAnimationFrame(animate)
    }

    animate()
  }

  animateShortForm = (canvasId: string) => {
    const canvas = this.getCanvasInfo(canvasId)
    if (!canvas || !canvas.context || !canvas.element) return
    const ctx = canvas.context
    const width = canvas.element.width / window.devicePixelRatio
    const height = canvas.element.height / window.devicePixelRatio

    let time = 0

    const animate = () => {
      ctx.clearRect(0, 0, width, height)
      time += 0.03

      const centerX = width * 0.5
      const centerY = height * 0.5
      const radius = Math.min(width, height) * 0.35

      ctx.strokeStyle = '#000000'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
      ctx.stroke()

      const segments = 8
      const segmentAngle = (Math.PI * 2) / segments

      for (let i = 0; i < segments; i++) {
        const angle = i * segmentAngle - Math.PI / 2
        const nextAngle = (i + 1) * segmentAngle - Math.PI / 2
        const isHighlighted = i < 3

        if (isHighlighted) {
          ctx.fillStyle = '#000000'
          ctx.beginPath()
          ctx.moveTo(centerX, centerY)
          ctx.arc(centerX, centerY, radius * 0.9, angle, nextAngle)
          ctx.closePath()
          ctx.fill()
        }

        const lineEndX = centerX + Math.cos(angle) * radius
        const lineEndY = centerY + Math.sin(angle) * radius

        ctx.strokeStyle = '#000000'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(centerX, centerY)
        ctx.lineTo(lineEndX, lineEndY)
        ctx.stroke()
      }

      const handAngle = time - Math.PI / 2
      const handLength = radius * 0.7
      const handEndX = centerX + Math.cos(handAngle) * handLength
      const handEndY = centerY + Math.sin(handAngle) * handLength

      ctx.strokeStyle = '#666666'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.lineTo(handEndX, handEndY)
      ctx.stroke()

      ctx.fillStyle = '#000000'
      ctx.beginPath()
      ctx.arc(centerX, centerY, 6, 0, Math.PI * 2)
      ctx.fill()

      this.animations[canvasId] = requestAnimationFrame(animate)
    }

    animate()
  }

  animateQuality = (canvasId: string) => {
    const canvas = this.getCanvasInfo(canvasId)
    if (!canvas || !canvas.context || !canvas.element) return
    const ctx = canvas.context
    const width = canvas.element.width / window.devicePixelRatio
    const height = canvas.element.height / window.devicePixelRatio

    let time = 0

    const animate = () => {
      ctx.clearRect(0, 0, width, height)
      time += 0.05

      const centerY = height * 0.5
      const points = 100
      const amplitude = height * 0.2

      for (let wave = 0; wave < 3; wave++) {
        ctx.strokeStyle = wave === 0 ? '#000000' : '#666666'
        ctx.lineWidth = wave === 0 ? 3 : 2
        ctx.globalAlpha = 1 - wave * 0.3

        ctx.beginPath()

        for (let i = 0; i < points; i++) {
          const x = (width / points) * i
          const t = (i / points) * Math.PI * 4 + time + wave * 0.5

          const y1 = Math.sin(t) * amplitude
          const y2 = Math.sin(t * 2.5) * amplitude * 0.3
          const y3 = Math.sin(t * 0.5) * amplitude * 0.5
          const y = centerY + y1 + y2 + y3

          if (i === 0) {
            ctx.moveTo(x, y)
          } else {
            ctx.lineTo(x, y)
          }
        }

        ctx.stroke()
      }

      ctx.globalAlpha = 1
      ctx.fillStyle = '#000000'
      ctx.font = `sans-serif`
      ctx.textAlign = 'center'
      ctx.font = `${Math.max(14, Math.round(width * 0.045))}px sans-serif`
      ctx.textBaseline = 'top'
      ctx.fillText('Premium Quality Audio', width * 0.5, height * 0.85)

      this.animations[canvasId] = requestAnimationFrame(animate)
    }

    animate()
  }

  animateMultiVoice = (canvasId: string) => {
    const canvas = this.getCanvasInfo(canvasId)
    if (!canvas || !canvas.context || !canvas.element) return
    const ctx = canvas.context
    const width = canvas.element.width / window.devicePixelRatio
    const height = canvas.element.height / window.devicePixelRatio

    let time = 0

    const microphones = [
      { x: width * 0.3, baseY: height * 0.6, phase: 0 },
      { x: width * 0.5, baseY: height * 0.5, phase: Math.PI / 3 },
      { x: width * 0.7, baseY: height * 0.6, phase: Math.PI * 2 / 3 }
    ]

    const animate = () => {
      ctx.clearRect(0, 0, width, height)
      time += 0.05

      microphones.forEach((mic, index) => {
        const bounce = Math.sin(time * 2 + mic.phase) * 10
        const y = mic.baseY + bounce
        const isActive = Math.sin(time * 2 + mic.phase) > 0.3

        ctx.fillStyle = isActive ? '#000000' : '#ffffff'
        ctx.strokeStyle = '#000000'
        ctx.lineWidth = 2

        ctx.beginPath()
        ctx.arc(mic.x, y, 15, 0, Math.PI * 2)
        ctx.fill()
        ctx.stroke()

        ctx.fillStyle = '#000000'
        ctx.fillRect(mic.x - 2, y + 15, 4, 30)
        ctx.fillRect(mic.x - 15, y + 45, 30, 3)

        if (isActive) {
          for (let i = 1; i <= 2; i++) {
            const waveRadius = 20 + i * 10
            ctx.strokeStyle = '#000000'
            ctx.globalAlpha = 0.5 - i * 0.15
            ctx.lineWidth = 2
            ctx.beginPath()
            ctx.arc(mic.x, y, waveRadius, -Math.PI * 0.4, -Math.PI * 0.6, true)
            ctx.stroke()
            ctx.beginPath()
            ctx.arc(mic.x, y, waveRadius, Math.PI * 0.4, Math.PI * 0.6, false)
            ctx.stroke()
          }
          ctx.globalAlpha = 1
        }

        ctx.fillStyle = '#000000'
        ctx.font = `${width * 0.03}px Arial`
        ctx.textAlign = 'center'
        ctx.fillText(`Voice ${index + 1}`, mic.x, y + 70)
      })

      this.animations[canvasId] = requestAnimationFrame(animate)
    }

    animate()
  }
}