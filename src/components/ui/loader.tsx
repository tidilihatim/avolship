'use client'

import { useEffect, useState } from 'react'
import NextTopLoader from 'nextjs-toploader'

const ThemeAwareTopLoader = () => {
  const [loaderColor, setLoaderColor] = useState('#f97316') // Default color

  useEffect(() => {
    const updateLoaderColor = () => {
      // Get the primary color from CSS custom properties
      const computedStyle = getComputedStyle(document.documentElement)
      const primaryColor = computedStyle.getPropertyValue('--primary').trim()
      
      if (primaryColor) {
        // Convert OKLCH to hex
        const hexColor = oklchToHex(primaryColor)
        setLoaderColor(hexColor)
      }
    }

    // Run after DOM is ready
    const timer = setTimeout(updateLoaderColor, 100)

    // Update color when theme changes
    const observer = new MutationObserver(updateLoaderColor)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

    return () => {
      clearTimeout(timer)
      observer.disconnect()
    }
  }, [])

  return <NextTopLoader showSpinner={false} color={loaderColor} />
}

// Convert OKLCH to Hex
function oklchToHex(oklchString: string): string {
  try {
    // Parse OKLCH string like "oklch(0.675 0.25 35)"
    const match = oklchString.match(/oklch\(([^)]+)\)/)
    if (!match) return '#f97316'
    
    const [l, c, h] = match[1].split(' ').map(v => parseFloat(v.trim()))
    
    // Convert OKLCH to RGB
    const rgb = oklchToRgb(l, c || 0, h || 0)
    
    // Convert RGB to hex
    return `#${rgb.map(v => Math.round(v).toString(16).padStart(2, '0')).join('')}`
  } catch {
    return '#f97316'
  }
}

// Convert OKLCH to RGB
function oklchToRgb(l: number, c: number, h: number): number[] {
  // More accurate OKLCH to RGB conversion
  const hRad = (h * Math.PI) / 180
  const a = c * Math.cos(hRad)
  const b = c * Math.sin(hRad)
  
  // Convert OKLab to linear RGB
  const l_ = l + 0.3963377774 * a + 0.2158037573 * b
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b
  const s_ = l - 0.0894841775 * a - 1.2914855480 * b
  
  const l3 = l_ * l_ * l_
  const m3 = m_ * m_ * m_
  const s3 = s_ * s_ * s_
  
  const r = +4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3
  const g = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3
  const b_val = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.7076147010 * s3
  
  // Apply gamma correction and clamp
  const gammaCorrect = (val: number) => {
    const abs = Math.abs(val)
    const sign = Math.sign(val)
    return sign * (abs > 0.0031308 ? 1.055 * Math.pow(abs, 1/2.4) - 0.055 : 12.92 * abs)
  }
  
  const clamp = (val: number) => Math.max(0, Math.min(255, val * 255))
  
  return [
    clamp(gammaCorrect(r)),
    clamp(gammaCorrect(g)), 
    clamp(gammaCorrect(b_val))
  ]
}

export default ThemeAwareTopLoader