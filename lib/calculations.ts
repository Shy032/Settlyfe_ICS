// Enhanced calculation functions with dynamic weights and user ratings

export function calcEC(hours: number): number {
  if (hours >= 20) return 1.0
  if (hours >= 15) return 0.8
  if (hours >= 10) return 0.5
  return 0.0
}

export interface KR {
  score: number
  weight: number
}

export function calcOC(krs: KR[]): number {
  if (krs.length === 0) return 0

  const sumW = krs.reduce((s, k) => s + k.weight, 0)
  const sumSW = krs.reduce((s, k) => s + k.score * k.weight, 0)
  return sumSW / sumW
}

export function calcCC(prReviews: number, dailyPosts: number, retroInsights: boolean): number {
  let cc = 0
  cc += Math.min(prReviews, 3) * 0.33 // Max 3 reviews, 0.33 each
  cc += (5 - dailyPosts) * -0.2 // -0.2 for each missing day
  if (!retroInsights) cc -= 0.2 // -0.2 if no retro insights

  return Math.max(0, Math.min(1, Number.parseFloat(cc.toFixed(2))))
}

// Original WCS calculation with fixed weights (for backward compatibility)
export function calcWCS(EC: number, OC: number, CC: number): number {
  return Number.parseFloat((EC * 0.4 + OC * 0.5 + CC * 0.1).toFixed(2))
}

// New dynamic WCS calculation with custom weights
export function calcDynamicWCS(
  EC: number,
  OC: number,
  CC: number,
  weights: { EC: number; OC: number; CC: number } = { EC: 40, OC: 50, CC: 10 },
): number {
  const ecWeight = weights.EC / 100
  const ocWeight = weights.OC / 100
  const ccWeight = weights.CC / 100

  return Number.parseFloat((EC * ecWeight + OC * ocWeight + CC * ccWeight).toFixed(2))
}

// Apply user performance multiplier to final score
export function applyUserMultiplier(score: number, multiplier = 1.0): number {
  return Number.parseFloat((score * multiplier).toFixed(2))
}

// Get team weights from localStorage
export function getTeamWeights(teamId: string): { EC: number; OC: number; CC: number } {
  if (typeof window === "undefined") return { EC: 40, OC: 50, CC: 10 }

  try {
    const configs = localStorage.getItem("teamCreditConfigs")
    if (configs) {
      const teamConfigs = JSON.parse(configs)
      const config = teamConfigs.find((c: any) => c.teamId === teamId)
      if (config) {
        return config.weights
      }
    }
  } catch (error) {
    console.error("Error loading team weights:", error)
  }

  return { EC: 40, OC: 50, CC: 10 } // Default weights
}

// Get user performance multiplier from localStorage
export function getUserMultiplier(userId: string): number {
  if (typeof window === "undefined") return 1.0

  try {
    const ratings = localStorage.getItem("userRatings")
    if (ratings) {
      const userRatings = JSON.parse(ratings)
      const rating = userRatings.find((r: any) => r.userId === userId)
      if (rating) {
        return rating.performanceMultiplier
      }
    }
  } catch (error) {
    console.error("Error loading user multiplier:", error)
  }

  return 1.0 // Default multiplier
}

// Calculate final score with dynamic weights and user multiplier
export function calculateFinalScore(
  EC: number,
  OC: number,
  CC: number,
  userId: string,
  teamId?: string,
): { baseScore: number; finalScore: number; multiplier: number; weights: { EC: number; OC: number; CC: number } } {
  const weights = teamId ? getTeamWeights(teamId) : { EC: 40, OC: 50, CC: 10 }
  const multiplier = getUserMultiplier(userId)

  const baseScore = calcDynamicWCS(EC, OC, CC, weights)
  const finalScore = applyUserMultiplier(baseScore, multiplier)

  return {
    baseScore,
    finalScore,
    multiplier,
    weights,
  }
}
