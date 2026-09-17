import { useEffect, useRef } from 'react'

const AD_CLIENT = 'ca-pub-5845912732049177'
const AD_SLOT = '9236963789'
const AD_BAR_HEIGHT = '90px'

type AdsByGoogleWindow = Window & {
  adsbygoogle?: Array<Record<string, unknown>>
}

export function AdSenseFooter() {
  const slotRef = useRef<HTMLModElement>(null)
  const barRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const bar = barRef.current
    const slot = slotRef.current

    if (!bar) {
      return
    }

    const hasLiveAd = () => {
      if (!slot) {
        return false
      }

      if (slot.getAttribute('data-ad-status') === 'unfilled') {
        return false
      }

      if (slot.getAttribute('data-ad-status') === 'filled') {
        return true
      }

      const frame = slot.querySelector('iframe')
      return Boolean(frame && frame.offsetHeight > 0)
    }

    const applyBarState = () => {
      const filled = hasLiveAd()
      const height = filled ? AD_BAR_HEIGHT : '0px'
      const padding = filled
        ? '6px 12px max(6px, env(safe-area-inset-bottom))'
        : '0px'
      const alreadyApplied =
        bar.hasAttribute('data-filled') === filled &&
        bar.style.getPropertyValue('height') === height &&
        bar.style.getPropertyPriority('height') === 'important'

      if (alreadyApplied) {
        document.body.style.setProperty('--site-ad-footer-height', height)
        return
      }

      bar.toggleAttribute('data-filled', filled)
      bar.setAttribute('aria-hidden', filled ? 'false' : 'true')

      bar.style.setProperty('position', 'fixed', 'important')
      bar.style.setProperty('right', '0px', 'important')
      bar.style.setProperty('bottom', '0px', 'important')
      bar.style.setProperty('left', '0px', 'important')
      bar.style.setProperty('width', '100%', 'important')
      bar.style.setProperty('height', height, 'important')
      bar.style.setProperty('max-height', height, 'important')
      bar.style.setProperty('overflow', 'hidden', 'important')
      bar.style.setProperty('margin', '0px', 'important')
      bar.style.setProperty('padding', padding, 'important')
      bar.style.setProperty('transform', 'none', 'important')

      document.body.style.setProperty('--site-ad-footer-height', height)
    }

    applyBarState()
    const observer = new MutationObserver(applyBarState)
    observer.observe(bar, { attributes: true, attributeFilter: ['style'] })

    if (slot) {
      observer.observe(slot, {
        attributes: true,
        childList: true,
        subtree: true,
      })
    }

    if (slot && !slot.getAttribute('data-adsbygoogle-status')) {
      try {
        const adsWindow = window as AdsByGoogleWindow
        adsWindow.adsbygoogle = adsWindow.adsbygoogle ?? []
        adsWindow.adsbygoogle.push({})
      } catch {
        // AdSense throws if a slot is filled twice during remounts.
      }
    }

    const poll = window.setInterval(applyBarState, 500)
    const stopPoll = window.setTimeout(() => {
      window.clearInterval(poll)
    }, 10_000)

    return () => {
      observer.disconnect()
      window.clearInterval(poll)
      window.clearTimeout(stopPoll)
      document.body.style.removeProperty('--site-ad-footer-height')
    }
  }, [])

  return (
    <aside
      ref={barRef}
      className="site-ad-footer"
      aria-label="Advertisement"
      aria-hidden="true"
    >
      <div className="site-ad-footer-slot">
        <ins
          ref={slotRef}
          className="adsbygoogle"
          style={{ display: 'block', width: '100%', height: '90px' }}
          data-ad-client={AD_CLIENT}
          data-ad-slot={AD_SLOT}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>
    </aside>
  )
}
