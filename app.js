/**
 * app.js — Web Slides SPA engine
 *
 * Supports two modes controlled by window.__MODE__:
 *   'presentation' (default) — full SPA: manifest, hash nav, keyboard shortcuts
 *   'preview'                — single-slide dev helper (set in layout.html)
 *
 * Depends on (must be loaded before this file):
 *   config.js  → window.WEB_SLIDES.CONFIG
 *   slides.js  → window.WEB_SLIDES.SLIDES  (presentation mode only)
 */

;(function () {
  'use strict'

  const { CONFIG } = window.WEB_SLIDES
  const MODE = window.__MODE__ || 'presentation'

  // ── Include cache ──────────────────────────────────────────
  // Shared across all slides. Paths are keys, HTML strings are values.
  const includeCache = new Map()

  async function fetchFragment(path) {
    if (includeCache.has(path)) return includeCache.get(path)
    const res = await fetch(path)
    if (!res.ok) throw new Error(`HTTP ${res.status} — ${path}`)
    const html = await res.text()
    includeCache.set(path, html)
    return html
  }

  /**
   * Resolve all data-include attributes inside `container`, recursively.
   * Supports nested includes (e.g. a header that includes a logo).
   * Uses a cache so each path is fetched at most once per session.
   */
  async function processIncludes(container) {
    const MAX_DEPTH = 10 // guard against circular includes
    for (let depth = 0; depth < MAX_DEPTH; depth++) {
      const targets = Array.from(container.querySelectorAll('[data-include]'))
      if (targets.length === 0) break

      await Promise.all(targets.map(async el => {
        const path = el.getAttribute('data-include')
        try {
          const html = await fetchFragment(path)
          // replaceWith handles multiple root nodes cleanly
          const temp = document.createElement('div')
          temp.innerHTML = html
          el.replaceWith(...temp.childNodes)
        } catch (err) {
          console.warn('[web-slides] include failed:', path, err.message)
          const placeholder = document.createElement('span')
          placeholder.className = 'include-error'
          placeholder.title = path
          placeholder.textContent = '⚠ include error'
          el.replaceWith(placeholder)
        }
      }))
    }
    if (container.querySelector('[data-include]')) {
      console.warn('[web-slides] include depth exceeded; possible circular include')
    }
  }

  // ── Scale engine ───────────────────────────────────────────
  function applyScale(heightReserved = 0) {
    const frame = document.getElementById('slide-frame')
    if (!frame) return
    const scale = Math.min(
      window.innerWidth  / CONFIG.slideWidth,
      (window.innerHeight - heightReserved) / CONFIG.slideHeight
    )
    frame.style.width     = `${CONFIG.slideWidth}px`
    frame.style.height    = `${CONFIG.slideHeight}px`
    frame.style.transform = `scale(${scale})`
  }

  // ── Fade helpers ───────────────────────────────────────────
  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  async function fadeOut(viewport) {
    if (CONFIG.transition !== 'fade') return
    viewport.classList.add('is-leaving')
    await delay(CONFIG.transitionDuration)
  }

  function fadeIn(viewport) {
    if (CONFIG.transition !== 'fade') return
    // Force reflow so the CSS transition runs from opacity:0 → opacity:1
    void viewport.offsetWidth
    viewport.classList.remove('is-leaving')
  }

  // ==========================================================
  //  PREVIEW MODE — single-slide dev helper
  // ==========================================================
  async function initPreview() {
    document.body.classList.add(`theme-${CONFIG.defaultTheme}`)
    const bar = document.getElementById('preview-bar')
    const scalePreview = () => applyScale(bar ? bar.offsetHeight : 0)
    scalePreview()
    window.addEventListener('resize', scalePreview)
    document.documentElement.style.setProperty('--transition-duration', CONFIG.transitionDuration)

    const params    = new URLSearchParams(window.location.search)
    const slidePath = params.get('slide') || ''
    const label     = document.getElementById('preview-path')
    const viewport  = document.getElementById('slide-viewport')

    if (label) label.textContent = slidePath || '(none)'

    if (!slidePath) {
      viewport.innerHTML =
        '<div class="slide-error">Use <code>?slide=main/slides/01/slide-01.html</code> to preview a slide.</div>'
      return
    }

    try {
      const html = await fetchFragment(slidePath)
      viewport.innerHTML = html
      await processIncludes(viewport)
    } catch (err) {
      viewport.innerHTML = `<div class="slide-error">Error loading slide:<br>${slidePath}<br><small>${err.message}</small></div>`
    }
  }

  // ==========================================================
  //  PRESENTATION MODE — full SPA
  // ==========================================================
  class SlideApp {
    constructor() {
      const { SLIDES } = window.WEB_SLIDES
      this.slides          = SLIDES
      this.currentIndex    = 0
      this.isTransitioning = false
      this.currentTheme    = CONFIG.defaultTheme

      this.frame    = document.getElementById('slide-frame')
      this.viewport = document.getElementById('slide-viewport')
    }

    init() {
      if (!this.slides || this.slides.length === 0) {
        this.viewport.innerHTML =
          '<div class="slide-error">Empty manifest: add slides in <code>main/slides/slides.js</code>.</div>'
        return
      }

      document.body.classList.add(`theme-${this.currentTheme}`)

      applyScale()
      window.addEventListener('resize', () => applyScale())
      document.documentElement.style.setProperty('--transition-duration', CONFIG.transitionDuration)

      // Determine starting slide from URL hash
      this.goTo(this.parseHash(), { updateHash: true })

      // Keyboard
      document.addEventListener('keydown', e => this.handleKey(e))

      // Touch swipe navigation
      let touchStartX = 0
      this.frame.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].clientX
      }, { passive: true })
      this.frame.addEventListener('touchend', e => {
        const dx = e.changedTouches[0].clientX - touchStartX
        if (Math.abs(dx) > 50) dx < 0 ? this.next() : this.prev()
      }, { passive: true })

      // Browser back / forward
      window.addEventListener('hashchange', () => {
        this.goTo(this.parseHash(), { updateHash: false })
      })

      // Keep fullscreen button in sync
      document.addEventListener('fullscreenchange', () => this.updateFullscreenButton())
    }

    // ── Hash helpers ─────────────────────────────────────────
    parseHash() {
      const raw = parseInt(window.location.hash.slice(1), 10)
      if (isNaN(raw) || raw < 1) return 0
      return Math.min(raw - 1, this.slides.length - 1)
    }

    // ── Slide loading ────────────────────────────────────────
    async goTo(index, { updateHash = true } = {}) {
      if (this.isTransitioning) return

      const nextIndex = Math.max(0, Math.min(index, this.slides.length - 1))
      if (nextIndex === this.currentIndex && this.viewport.innerHTML) return

      this.isTransitioning = true

      const path = this.slides[nextIndex]
      try {
        const html = await fetchFragment(path)

        await fadeOut(this.viewport)
        this.viewport.innerHTML = html
        await processIncludes(this.viewport)
        this.buildProgressBars()
        this.bindFooterControls()
        fadeIn(this.viewport)

        this.currentIndex = nextIndex
        this.updateNavState()

        if (updateHash) {
          window.location.hash = String(nextIndex + 1)
        }
      } catch (err) {
        console.error('[web-slides] Failed to load slide:', path, err)
        this.viewport.innerHTML =
          `<div class="slide-error">Could not load slide:<br>${path}</div>`
      }

      this.isTransitioning = false
    }

    // ── Navigation ────────────────────────────────────────────
    next() { return this.goTo(this.currentIndex + 1) }
    prev() { return this.goTo(this.currentIndex - 1) }

    // ── Keyboard ──────────────────────────────────────────────
    handleKey(e) {
      // Do not hijack keys when the user is typing
      const active = document.activeElement
      if (
        active?.tagName === 'INPUT'    ||
        active?.tagName === 'TEXTAREA' ||
        active?.isContentEditable
      ) return

      if (e.key === 'ArrowRight' || (e.key === ' ' && !e.shiftKey)) {
        e.preventDefault()
        this.next()
      } else if (e.key === 'ArrowLeft' || (e.key === ' ' && e.shiftKey)) {
        e.preventDefault()
        this.prev()
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault()
        this.toggleFullscreen()
      }
    }

    // ── Footer controls binding ──────────────────────────────
    bindFooterControls() {
      const vp = this.viewport
      const prev = vp.querySelector('[data-nav="prev"]')
      const next = vp.querySelector('[data-nav="next"]')
      const theme = vp.querySelector('[data-nav="theme"]')
      const fs = vp.querySelector('[data-nav="fullscreen"]')

      if (prev) prev.addEventListener('click', () => this.prev())
      if (next) next.addEventListener('click', () => this.next())
      if (theme) theme.addEventListener('click', () => this.toggleTheme())
      if (fs) fs.addEventListener('click', () => this.toggleFullscreen())
    }

    // ── Theme ─────────────────────────────────────────────────
    toggleTheme() {
      this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light'
      document.body.classList.remove('theme-light', 'theme-dark')
      document.body.classList.add(`theme-${this.currentTheme}`)
      this.updateThemeButton()
    }

    updateThemeButton() {
      const btn = this.viewport.querySelector('[data-nav="theme"]')
      if (!btn) return
      const isDark = this.currentTheme === 'dark'
      btn.textContent = isDark ? '☀' : '☾'
      btn.setAttribute('aria-label',
        isDark ? 'Switch to light mode' : 'Switch to dark mode')
    }

    // ── Fullscreen ───────────────────────────────────────────
    toggleFullscreen() {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {})
      } else {
        document.exitFullscreen().catch(() => {})
      }
    }

    updateFullscreenButton() {
      const btn = this.viewport.querySelector('[data-nav="fullscreen"]')
      if (!btn) return
      const isFs = !!document.fullscreenElement
      btn.textContent = isFs ? '✕' : '⛶'
      btn.setAttribute('aria-label', isFs ? 'Exit fullscreen' : 'Fullscreen')
    }

    // ── Progress bar ────────────────────────────────────────────
    buildProgressBars() {
      const bars = this.viewport.querySelectorAll('[data-progress]')
      bars.forEach(bar => {
        bar.innerHTML = ''
        this.slides.forEach((_, i) => {
          const seg = document.createElement('button')
          seg.type = 'button'
          seg.className = 'slide-progress__segment'
          seg.setAttribute('aria-label', `Slide ${i + 1}`)
          seg.addEventListener('click', () => this.goTo(i))
          bar.appendChild(seg)
        })
      })
    }

    updateProgressBars() {
      const segments = this.viewport.querySelectorAll('.slide-progress__segment')
      segments.forEach((seg, i) => {
        seg.classList.toggle('is-current', i === this.currentIndex)
        seg.classList.toggle('is-visited', i < this.currentIndex)
      })
    }

    // ── UI state ──────────────────────────────────────────────
    updateNavState() {
      const vp = this.viewport
      const prev = vp.querySelector('[data-nav="prev"]')
      const next = vp.querySelector('[data-nav="next"]')
      const counter = vp.querySelector('[data-nav="counter"]')

      if (prev) prev.disabled = this.currentIndex === 0
      if (next) next.disabled = this.currentIndex === this.slides.length - 1
      if (counter) counter.textContent = `${this.currentIndex + 1} / ${this.slides.length}`

      this.updateThemeButton()
      this.updateFullscreenButton()
      this.updateProgressBars()
    }
  }

  // ==========================================================
  //  Boot
  // ==========================================================
  document.addEventListener('DOMContentLoaded', () => {
    if (MODE === 'preview') {
      initPreview()
    } else {
      new SlideApp().init()
    }
  })

})()
