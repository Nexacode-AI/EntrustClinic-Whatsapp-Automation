import { env } from '../config/env.js'
import { logger } from '../config/logger.js'
import { db } from '../config/database.js'

const GRAPH_URL = 'https://graph.facebook.com/v20.0'

async function callMetaApi(endpoint, body) {
  const res = await fetch(`${GRAPH_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.meta.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`Meta API error ${res.status}: ${err?.error?.message || JSON.stringify(err)}`)
  }
  return res.json()
}

export async function sendMessage(to, body) {
  await db.from('messages').insert({ phone: to, direction: 'outbound', body })

  if (!env.meta.connected) {
    logger.info(`[TEST MODE] → ${to}: ${body}`)
    return
  }

  await callMetaApi(`/${env.meta.phoneNumberId}/messages`, {
    messaging_product: 'whatsapp',
    to,
    type: 'text',
    text: { body, preview_url: false },
  })
  logger.debug('Meta message sent', { to, body: body.slice(0, 60) })
}

export async function sendInteractiveMessage(to, fallbackText, interactiveData) {
  await db.from('messages').insert({ phone: to, direction: 'outbound', body: fallbackText })

  if (!env.meta.connected) {
    logger.info(`[TEST MODE] → ${to}: [Interactive] ${fallbackText.slice(0, 60)}`)
    return
  }

  try {
    await callMetaApi(`/${env.meta.phoneNumberId}/messages`, {
      messaging_product: 'whatsapp',
      to,
      type: 'interactive',
      interactive: interactiveData,
    })
    logger.debug('Meta interactive message sent', { to })
  } catch (err) {
    logger.warn('Interactive message failed — falling back to plain text', { error: err.message })
    await sendMessage(to, fallbackText)
  }
}

export function parseMetaWebhook(body) {
  try {
    const entry = body?.entry?.[0]
    const change = entry?.changes?.[0]
    if (change?.field !== 'messages') return null

    const value = change.value
    const msg = value?.messages?.[0]
    if (!msg) return null

    const phone = msg.from
    let text = ''
    let buttonPayload = null
    let listId = null

    if (msg.type === 'text') {
      text = msg.text?.body || ''
    } else if (msg.type === 'interactive') {
      const interactive = msg.interactive
      if (interactive.type === 'button_reply') {
        buttonPayload = interactive.button_reply.id
        text = interactive.button_reply.title
      } else if (interactive.type === 'list_reply') {
        listId = interactive.list_reply.id
        text = interactive.list_reply.title
      }
    } else {
      return null
    }

    if (!phone || !text) return null
    return { phone, text, buttonPayload, listId }
  } catch {
    return null
  }
}
