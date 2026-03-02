/**
 * config.js — Central configuration for web-slides
 *
 * Edit this file to customize your presentation globally.
 * Changes here affect all slides automatically.
 *
 * All settings are attached to window.WEB_SLIDES to avoid global collisions.
 */

window.WEB_SLIDES = window.WEB_SLIDES || {}

window.WEB_SLIDES.CONFIG = {
  // Slide canvas dimensions (fixed, scaled to fit viewport)
  slideWidth: 1920,
  slideHeight: 1080,

  // Default theme applied on load: 'light' | 'dark'
  defaultTheme: 'light',

  // Slide transition style: 'fade' | 'none'
  transition: 'fade',

  // Transition duration in milliseconds (only used when transition = 'fade')
  transitionDuration: 200,
}
