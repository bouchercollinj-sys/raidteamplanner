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

    const lockBar = () => {
      const locked =
        bar.style.getPropertyValue('height') === AD_BAR_HEIGHT &&
        bar.style.getPropertyPriority('height') === 'important'

      if (!locked) {
        bar.style.setProperty('position', 'fixed', 'important')
        bar.style.setProperty('right', '0px', 'important')
        bar.style.setProperty('bottom', '0px', 'important')
        bar.style.setProperty('left', '0px', 'important')
        bar.style.setProperty('width', '100%', 'important')
        bar.style.setProperty('height', AD_BAR_HEIGHT, 'important')
        bar.style.setProperty('max-height', AD_BAR_HEIGHT, 'important')
        bar.style.setProperty('overflow', 'hidden', 'important')
        bar.style.setProperty('margin', '0px', 'important')
        bar.style.setProperty('transform', 'none', 'important')
      }

      document.body.style.setProperty('--site-ad-footer-height', AD_BAR_HEIGHT)
    }

    lockBar()
    const observer = new MutationObserver(lockBar)
    observer.observe(bar, { attributes: true, attributeFilter: ['style'] })

    if (slot && !slot.getAttribute('data-adsbygoogle-status')) {
      try {
        const adsWindow = window as AdsByGoogleWindow
        adsWindow.adsbygoogle = adsWindow.adsbygoogle ?? []
        adsWindow.adsbygoogle.push({})
      } catch {
        // AdSense throws if a slot is filled twice during remounts.
      }
    }

    return () => {
      observer.disconnect()
      document.body.style.removeProperty('--site-ad-footer-height')
    }
  }, [])

  return (
    <aside
      ref={barRef}
      className="site-ad-footer"
      aria-label="Advertisement"
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
