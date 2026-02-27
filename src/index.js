import React, { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { useSprings, animated, to as interpolate } from '@react-spring/web'
import { useDrag } from '@use-gesture/react'

import * as utils from './utils'
import './styles.css'
import PHOTOS from './photos.json'

// Load Google Fonts
const link = document.createElement('link');
link.href = 'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&family=Caveat:wght@600&display=swap';
link.rel = 'stylesheet';
document.head.appendChild(link);

export default function Deck({ cards }) {
  const [gone] = useState(() => new Set()) // The set flags all the cards that are flicked out
  const [props, api] = useSprings(cards.length, (i) => ({
    ...utils.to(i),
    from: utils.from(i)
  })) // Create a bunch of springs using the helpers above

  const bind = useDrag(({ args: [index], active, movement: [mx], direction: [xDir], velocity: [vx] }) => {
    const trigger = vx > 0.2 // If you flick hard enough it should trigger the card to fly out
    if (!active && trigger) gone.add(index) // If button/finger's up and trigger velocity is reached, we flag the card ready to fly out
    api.start((i) => {
      if (index !== i) return // We're only interested in changing spring-data for the current spring
      const isGone = gone.has(index)
      const x = isGone ? (200 + window.innerWidth) * xDir : active ? mx : 0 // When a card is gone it flys out left or right, otherwise goes back to zero
      const rot = mx / 100 + (isGone ? xDir * 10 * vx : 0) // How much the card tilts, flicking it harder makes it rotate faster
      const scale = active ? 1.05 : 1 // Active cards lift up a bit less than before for elegance
      return {
        x,
        rot,
        scale,
        delay: undefined,
        config: { friction: 50, tension: active ? 800 : isGone ? 200 : 500 }
      }
    })
    if (!active && gone.size === cards.length)
      setTimeout(() => {
        gone.clear()
        api.start((i) => utils.to(i))
      }, 600)
  })

  return (
    <div className="app-container">
      <div className="text-overlay">
        <h1 className="main-title">Capture the Magic</h1>
        <p className="main-description">
          A timeless collection of unforgettable moments. Swipe through the polaroids to experience the journey all over again.
        </p>
      </div>

      <div className="deck-container">
        {props.map(({ x, y, rot, scale }, i) => (
          <animated.div key={i} className="card-wrapper" style={{ x, y }}>
            <animated.div
              {...bind(i)}
              className="polaroid-card"
              style={{
                transform: interpolate([rot, scale], utils.trans),
                width: cards[i].orientation === 'portrait' ? '280px' : '340px',
                height: cards[i].orientation === 'portrait' ? '380px' : '320px'
              }}
            >
              <div
                className="polaroid-image"
                style={{ backgroundImage: `url(${process.env.PUBLIC_URL}/img/${cards[i].url})` }}
              />
              <div className="polaroid-caption">
                <p>{cards[i].caption || "A beautiful memory captured forever."}</p>
              </div>
            </animated.div>
          </animated.div>
        ))}
      </div>
    </div>
  )
}

const rootElement = document.getElementById('photo-deck')
const root = createRoot(rootElement)
root.render(<Deck cards={PHOTOS} />)
