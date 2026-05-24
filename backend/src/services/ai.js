/**
 * AI service — Claude is used ONLY for rating interpretation.
 * Language detection and intent detection are handled by structured menus in bot.js.
 */
import Anthropic from '@anthropic-ai/sdk'
import { env } from '../config/env.js'
import { logger } from '../config/logger.js'

const client = new Anthropic({ apiKey: env.anthropic.apiKey })

/**
 * Interpret a patient's rating reply when keyword matching is inconclusive.
 * @returns {'positive' | 'neutral' | 'negative'}
 */
export async function interpretRating(text) {
  try {
    const res = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 50,
      messages: [{
        role: 'user',
        content: `A patient left feedback after a clinic visit. Classify the overall sentiment strictly.\n\nRules:\n- Any complaint, disappointment, or negative mention → "negative"\n- Fully satisfied, happy, praise → "positive"\n- Mixed or unclear → "neutral"\n\nReply with ONLY one word: positive, neutral, or negative.\n\nFeedback: "${text}"`,
      }],
    })
    const result = res.content[0].text.trim().toLowerCase()
    return ['positive', 'neutral', 'negative'].includes(result) ? result : 'neutral'
  } catch (err) {
    logger.error('Rating interpretation error', { error: err.message })
    return 'neutral'
  }
}
