import confetti from 'canvas-confetti'

/**
 * 1. Completing a task (Chore Finished by Kid)
 * Dual side-cannons shooting stars & colorful streamers from lower corners
 */
export function celebrateTaskComplete() {
  try {
    const defaults = {
      shapes: ['circle', 'star'],
      colors: ['#7c3aed', '#ec4899', '#f59e0b', '#10b981', '#00f2fe', '#ffd600'],
      disableForReducedMotion: true,
      zIndex: 9999,
    }

    // Left cannon
    confetti({
      ...defaults,
      particleCount: 45,
      angle: 60,
      spread: 55,
      origin: { x: 0.05, y: 0.8 },
      scalar: 1.1,
    })

    // Right cannon
    confetti({
      ...defaults,
      particleCount: 45,
      angle: 120,
      spread: 55,
      origin: { x: 0.95, y: 0.8 },
      scalar: 1.1,
    })
  } catch (err) {
    console.warn('Confetti error:', err)
  }
}

/**
 * 2. Approving a task (Parent approves finished chore)
 * Golden coins & stars shower falling gently from above
 */
export function celebrateTaskApproved() {
  try {
    confetti({
      particleCount: 65,
      spread: 80,
      origin: { y: 0.1, x: 0.5 },
      gravity: 0.85,
      scalar: 1.25,
      shapes: ['star', 'circle'],
      colors: ['#fbbf24', '#f59e0b', '#fef08a', '#eab308', '#ffffff'],
      disableForReducedMotion: true,
      zIndex: 9999,
    })
  } catch (err) {
    console.warn('Confetti error:', err)
  }
}

/**
 * 3. Buying a Reward Ticket (Store Purchase)
 * Golden ticket & sparkle burst from center
 */
export function celebrateRewardPurchase() {
  try {
    // Primary burst
    confetti({
      particleCount: 60,
      spread: 75,
      startVelocity: 35,
      origin: { x: 0.5, y: 0.65 },
      shapes: ['star', 'circle'],
      colors: ['#f59e0b', '#fbbf24', '#ec4899', '#7c3aed', '#38bdf8', '#10b981'],
      scalar: 1.2,
      disableForReducedMotion: true,
      zIndex: 9999,
    })

    // Secondary golden star burst
    setTimeout(() => {
      confetti({
        particleCount: 35,
        spread: 90,
        startVelocity: 25,
        origin: { x: 0.5, y: 0.6 },
        shapes: ['star'],
        colors: ['#fbbf24', '#fef08a', '#ffffff'],
        scalar: 1.3,
        disableForReducedMotion: true,
        zIndex: 9999,
      })
    }, 180)
  } catch (err) {
    console.warn('Confetti error:', err)
  }
}

/**
 * 4. Redeeming / Using a Ticket (Celebration for kid & family)
 * Cheerful pop of party colors
 */
export function celebrateTicketUsed() {
  try {
    confetti({
      particleCount: 50,
      spread: 70,
      origin: { x: 0.5, y: 0.7 },
      colors: ['#ec4899', '#f43f5e', '#fbbf24', '#a855f7', '#06b6d4'],
      shapes: ['circle', 'star'],
      disableForReducedMotion: true,
      zIndex: 9999,
    })
  } catch (err) {
    console.warn('Confetti error:', err)
  }
}

/**
 * 5. Finishing Onboarding (Account & Family Created)
 * Grand finale fireworks show across the screen
 */
export function celebrateOnboardingFinish() {
  try {
    const duration = 2200
    const animationEnd = Date.now() + duration
    const defaults = {
      startVelocity: 30,
      spread: 360,
      ticks: 60,
      zIndex: 99999,
      disableForReducedMotion: true,
    }

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now()
      if (timeLeft <= 0) {
        clearInterval(interval)
        return
      }

      const particleCount = 40 * (timeLeft / duration)

      // Random bursts across the screen
      confetti({
        ...defaults,
        particleCount,
        origin: { x: Math.random() * 0.4 + 0.1, y: Math.random() * 0.35 + 0.2 },
        colors: ['#7c3aed', '#ec4899', '#f59e0b', '#10b981', '#00f2fe'],
      })
      confetti({
        ...defaults,
        particleCount,
        origin: { x: Math.random() * 0.4 + 0.5, y: Math.random() * 0.35 + 0.2 },
        colors: ['#fbbf24', '#a855f7', '#06b6d4', '#ec4899', '#10b981'],
      })
    }, 280)

    // Grand finale double cannon
    setTimeout(() => {
      confetti({
        particleCount: 70,
        angle: 60,
        spread: 65,
        origin: { x: 0.05, y: 0.75 },
        colors: ['#7c3aed', '#f59e0b', '#ec4899'],
        zIndex: 99999,
      })
      confetti({
        particleCount: 70,
        angle: 120,
        spread: 65,
        origin: { x: 0.95, y: 0.75 },
        colors: ['#10b981', '#00f2fe', '#fbbf24'],
        zIndex: 99999,
      })
    }, 1100)
  } catch (err) {
    console.warn('Confetti error:', err)
  }
}

