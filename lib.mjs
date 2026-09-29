// Shared plumbing for both front doors: loading credentials, reading an
// agent config, and talking to the AssemblyAI and Twilio APIs.

import { readFileSync, readdirSync, writeFileSync } from 'node:fs'

const ENV_FILE = new URL('./.env', import.meta.url)

// --- environment -----------------------------------------------------------

// Minimal .env loader so credentials live in one file. KEY=value per line,
// # starts a comment line, quotes around values are optional. Anything
// already set in the environment wins, so hosting platforms and one-off
// shell overrides take precedence over the file.
export function loadEnv(path = ENV_FILE) {
  let text
  try {
    text = readFileSync(path, 'utf8')
  } catch {
    return
  }
  for (const line of text.split('\n')) {
    if (/^\s*(#|$)/.test(line)) continue
    const match = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/)
    if (!match) continue
    const [, key, raw] = match
    if (key in process.env) continue
    process.env[key] = raw.replace(/^(['"])(.*)\1$/, '$2')
  }
}

// Writes a key back to .env, in place if it is already there. Used to
// remember the agent id after the first publish. Hosting platforms have no
// writable .env, so a failure here is reported, not fatal.
export function saveEnv(key, value, path = ENV_FILE) {
  process.env[key] = value
  let text = ''
  try {
    text = readFileSync(path, 'utf8')
  } catch {}
  const line = `${key}=${value}`
  const existing = new RegExp(`^[ \\t]*${key}[ \\t]*=.*$`, 'm')
  const next = existing.test(text)
    ? text.replace(existing, line)
    : (text && !text.endsWith('\n') ? `${text}\n` : text) + `${line}\n`
  try {
    writeFileSync(path, next)
    return true
  } catch {
    return false
  }
}

// A missing credential is the most common failure, so it gets a readable
// message instead of a stack trace.
export function required(name, hint) {
  const value = process.env[name]
  if (!value) {
    console.error(`Missing ${name}${hint ? `. ${hint}` : ''}`)
    process.exit(1)
  }
  return value
}

// For the CLI scripts only. The browser server keeps running after a bad
// request, so it handles its own errors.
export function reportErrors() {
  const report = (error) => {
    console.error(error instanceof ApiError ? error.message : error)
    process.exit(1)
  }
  process.on('uncaughtException', report)
  process.on('unhandledRejection', report)
}

// --- agent configs ---------------------------------------------------------

const AGENT_DIR = new URL('./agents/', import.meta.url)

export function listAgents() {
  return readdirSync(AGENT_DIR)
    .filter((file) => file.endsWith('.jsonc'))
    .map((file) => file.replace(/\.jsonc$/, ''))
    .sort()
}

// The configs are JSON with comments, so every field can carry a note and a
// link to the docs page that defines it. Comments and trailing commas are
// stripped here; what reaches the API is plain JSON.
export function parseJsonc(text) {
  let out = ''
  let inString = false
  let escaped = false
  let inLineComment = false
  let inBlockComment = false
  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    const next = text[i + 1]
    if (inLineComment) {
      if (char === '\n') {
        inLineComment = false
        out += char
      }
      continue
    }
    if (inBlockComment) {
      if (char === '*' && next === '/') {
        inBlockComment = false
        i++
      }
      continue
    }
    if (inString) {
      out += char
      if (escaped) escaped = false
      else if (char === '\\') escaped = true
      else if (char === '"') inString = false
      continue
    }
    if (char === '"') {
      inString = true
      out += char
      continue
    }
    if (char === '/' && next === '/') {
      inLineComment = true
      i++
      continue
    }
    if (char === '/' && next === '*') {
      inBlockComment = true
      i++
      continue
    }
    // A comma left dangling by a commented-out field would break JSON.parse.
    if (char === '}' || char === ']') out = out.replace(/,\s*$/, '')
    out += char
  }
  return JSON.parse(out)
}

// ${VAR} anywhere in an agent file is replaced with that variable from .env
// before the agent is sent. Tool credentials and model keys stay in .env; the
// agent file stays safe to commit.
function interpolate(value, file, missing) {
  if (typeof value === 'string') {
    return value.replace(/\$\{([A-Za-z0-9_]+)\}/g, (match, name) => {
      if (!process.env[name]) {
        missing.add(name)
        return match
      }
      return process.env[name]
    })
  }
  if (Array.isArray(value)) return value.map((item) => interpolate(item, file, missing))
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, interpolate(item, file, missing)])
    )
  }
  return value
}

// An agent file is the request body for POST /v1/agents, nothing more. No
// wrapper fields, no starter-only keys: what you read is what the API gets.
export function readAgent(name) {
  let text
  try {
    text = readFileSync(new URL(`${name}.jsonc`, AGENT_DIR), 'utf8')
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
    console.error(`No agents/${name}.jsonc. Set AGENT to one of: ${listAgents().join(', ')}`)
    process.exit(1)
  }
  // An agent is its JSON plus the credentials that JSON names. Keys shared by
  // everything live in the root .env; keys only this agent needs can live
  // beside it in agents/<name>.env, which is gitignored too.
  loadEnv(new URL(`${name}.env`, AGENT_DIR))
  const missing = new Set()
  const agent = interpolate(parseJsonc(text), name, missing)
  if (missing.size) {
    console.error(
      `agents/${name}.jsonc needs ${[...missing].join(', ')}. Add ${
        missing.size > 1 ? 'them' : 'it'
      } to .env`
    )
    process.exit(1)
  }
  return agent
}

// --- AssemblyAI ------------------------------------------------------------

// The API also answers on regional hosts; set AGENTS_API_BASE if your account
// is pinned to one. Read per call, since .env loads after this import.
// agents.assemblyai.com routes by where the caller is, and agents and
// sessions live in the region that routing picked: an agent published from
// one place is not found from another, and a session opened by a browser is
// invisible to a server in the other region. Pinning one region keeps a
// deployed page, its sessions and this process on the same side.
// Regional hosts: agents.eu.assemblyai.com and agents.us.assemblyai.com.
const agentsApi = () =>
  process.env.AGENTS_API_BASE || 'https://agents.eu.assemblyai.com/v1'

// The websocket the browser opens has to be the same region as the API this
// process talks to, so it is derived from the same base.
export const agentsWebsocket = () =>
  agentsApi().replace(/^http/, 'ws') + '/ws'

export class ApiError extends Error {
  constructor(label, status, body) {
    super(`${label} failed (${status}): ${body}`)
    this.status = status
  }
}

export async function aai(path, { method = 'GET', body, headers = {} } = {}) {
  const res = await fetch(agentsApi() + path, {
    method,
    headers: {
      Authorization: `Bearer ${process.env.ASSEMBLYAI_API_KEY}`,
      'Content-Type': 'application/json',
      ...headers,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  const text = await res.text()
  if (!res.ok) throw new ApiError(`${method} ${path}`, res.status, text)
  try {
    return text ? JSON.parse(text) : {}
  } catch {
    return {}
  }
}

// Each agent file gets its own id, saved as AGENT_ID_<NAME>, so switching
// files does not overwrite the agent the last one published. AGENT_ID with no
// suffix overrides all of them, for an agent shaped in the dashboard or a
// hosted deploy that serves one specific agent.
export const agentIdKey = (name) => 'AGENT_ID_' + name.toUpperCase().replace(/[^A-Z0-9]/g, '_')

export const storedAgentId = (name) =>
  process.env.AGENT_ID || process.env[agentIdKey(name)] || ''

// An id in the environment decides create vs update: absent means POST a new
// agent and remember the id it comes back with, present means PUT the file
// over that agent.
export async function publishAgent(agent, { name, reuseByName = false } = {}) {
  const key = agentIdKey(name)
  const explicit = Boolean(process.env.AGENT_ID)
  const id = storedAgentId(name)
  if (id) {
    try {
      // Publishing a different file over the same id replaces what that agent
      // is, which is worth printing rather than swapping it silently.
      const current = await aai(`/agents/${id}`)
      if (current.name && current.name !== agent.name) {
        console.log(`Note: agent ${id} was "${current.name}"`)
      }
      await aai(`/agents/${id}`, { method: 'PUT', body: agent })
      return { id, created: false, key }
    } catch (error) {
      // The id in .env points at an agent that is gone; fall through and
      // make a new one rather than dead-ending.
      if (!(error instanceof ApiError) || error.status !== 404) throw error
      console.warn(`Agent ${id} no longer exists, creating a new one`)
    }
  }
  // A hosted server has no AGENT_ID and no writable .env, so without this it
  // would POST another agent on every restart. Matching the name reuses the
  // one it made last time. The CLI does not do this: there, creating a second
  // agent is a deliberate act.
  if (reuseByName) {
    const list = await aai('/agents')
    const existing = (list.agents ?? []).find((a) => a.name === agent.name)
    if (existing) {
      await aai(`/agents/${existing.id}`, { method: 'PUT', body: agent })
      return { id: existing.id, created: false, saved: saveEnv(key, existing.id) }
    }
  }
  const created = await aai('/agents', { method: 'POST', body: agent })
  // An explicit AGENT_ID is the caller's choice, so it is not overwritten.
  const saved = explicit ? false : saveEnv(key, created.id)
  return { id: created.id, created: true, saved, key }
}

// --- Twilio ----------------------------------------------------------------

// Twilio's REST API is form-encoded with basic auth, which keeps this repo
// dependency-free: no Twilio CLI or SDK to install.
export async function twilio(url, form) {
  const auth = Buffer.from(
    `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`
  ).toString('base64')
  const res = await fetch(url, {
    method: form ? 'POST' : 'GET',
    headers: {
      Authorization: `Basic ${auth}`,
      ...(form ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}),
    },
    ...(form ? { body: new URLSearchParams(form).toString() } : {}),
  })
  const text = await res.text()
  if (!res.ok) {
    const label = url.replace(/https:\/\/[^/]+/, '').replace(/\?.*/, '')
    throw new ApiError(`Twilio ${form ? 'POST' : 'GET'} ${label}`, res.status, text)
  }
  return text ? JSON.parse(text) : {}
}

// --- call record -----------------------------------------------------------

// Every call is stored as a session. The timeline is the evidence a
// collections team actually needs: what was promised, in the caller's own
// words, and what the agent did to get there.
// https://www.assemblyai.com/docs/voice-agents/voice-agent-api/session-history
export async function sessionTimeline(id) {
  const session = await aai(`/sessions/${id}`)
  const artifact = (session.artifacts ?? []).find((a) => a.type === 'timeline')
  // No timeline yet means the session is still open or still being written.
  if (!artifact) return null
  // Pre-signed, so it must not carry the Authorization header.
  const res = await fetch(artifact.url)
  if (!res.ok) throw new ApiError(`GET timeline ${id}`, res.status, await res.text())
  return res.json()
}

const parseResult = (raw) => {
  try {
    return typeof raw === 'string' ? JSON.parse(raw) : raw ?? {}
  } catch {
    return {}
  }
}

const median = (numbers) => {
  if (!numbers.length) return null
  const sorted = [...numbers].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[middle] : Math.round((sorted[middle - 1] + sorted[middle]) / 2)
}

export function callRecord(timeline) {
  const turns = timeline?.turns ?? []
  const tools = []
  let promise = null
  let paying = false

  for (const turn of turns) {
    for (const call of turn.tool_calls ?? []) {
      tools.push({
        name: call.name,
        arguments: call.arguments,
        result: parseResult(call.result),
        duration_ms: call.duration_ms ?? null,
        is_error: Boolean(call.is_error || call.timed_out),
      })
      if (call.is_error) continue
      if (call.name === 'create_deposit') paying = true
      if (call.name === 'log_promise') {
        const result = parseResult(call.result)
        promise = {
          invoice_id: call.arguments?.invoice_id ?? null,
          promise_date: call.arguments?.promise_date ?? null,
          amount_cents: call.arguments?.amount_cents ?? null,
          reference: result.reference ?? null,
          // The words that produced the promise, not a paraphrase of them.
          said: turn.user_transcript ?? null,
          confidence: turn.user_confidence ?? null,
        }
      }
    }
  }

  const confidences = turns.map((t) => t.user_confidence).filter((c) => typeof c === 'number')
  return {
    session_id: timeline?.session_id ?? null,
    started_at_unix_ms: timeline?.started_at_unix_ms ?? null,
    promise,
    tools,
    summary: {
      turns: turns.length,
      outcome: promise ? 'promise_to_pay' : paying ? 'paying_now' : 'no_commitment',
      median_reply_ms: median(turns.map((t) => t.time_to_first_audio_ms).filter(Boolean)),
      lowest_confidence: confidences.length ? Math.min(...confidences) : null,
    },
  }
}

// An agent file is the body of POST /v1/agents. The same fields configure a
// session inline over the websocket, with two differences: the voice is a
// plain id under output, and the stored-agent name has no meaning there.
// Inline configuration needs no stored agent, so a page can open a session
// without one having been published first.
// https://www.assemblyai.com/docs/voice-agents/voice-agent-api/session-configuration
export function sessionConfig(agent) {
  const { name, voice, tools, ...rest } = structuredClone(agent)
  const config = { ...rest }
  if (voice?.voice_id) config.output = { ...(config.output ?? {}), voice: voice.voice_id }
  if (tools) {
    // This config reaches the browser, so tool credentials must not ride along.
    config.tools = tools.map((tool) =>
      tool.http ? { ...tool, http: { ...tool.http, headers: [] } } : tool
    )
  }
  return config
}
