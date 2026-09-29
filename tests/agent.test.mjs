import { describe, it } from 'node:test'
import assert from 'node:assert'
import { readAgent, parseJsonc } from '../lib.mjs'

// Smoke tests for the PayVoice Rescue agent configuration.
// These run without an API key and verify the agent file is valid JSONC and
// declares the three client-side tools the browser will handle.

describe('PayVoice agent config', () => {
  it('parses agents/payvoice.jsonc without interpolation errors', () => {
    const agent = readAgent('payvoice')
    assert.strictEqual(agent.name, 'PayVoice Rescue')
    assert.strictEqual(agent.voice.voice_id, 'jane')
    assert.ok(agent.system_prompt.includes('lookup_invoice'))
  })

  it('declares three client-side tools', () => {
    const agent = readAgent('payvoice')
    const names = agent.tools.map((t) => t.name)
    assert.deepStrictEqual(names, ['lookup_invoice', 'log_promise', 'create_deposit'])
    for (const tool of agent.tools) {
      assert.strictEqual(tool.type, 'function')
      assert.strictEqual(tool.execution_mode, 'hold')
    }
  })

  it('includes keyterms for invoice vocabulary', () => {
    const agent = readAgent('payvoice')
    const terms = new Set(agent.input.keyterms)
    assert.ok(terms.has('PayVoice Rescue'))
    assert.ok(terms.has('Acme Consulting'))
    assert.ok(terms.has('two zero four nine two'))
  })
})

describe('parseJsonc', () => {
  it('strips comments and trailing commas', () => {
    const parsed = parseJsonc(`{
      // greeting
      "greeting": "hi",
      /* block */
      "voice": { "voice_id": "jane" },
    }`)
    assert.deepStrictEqual(parsed, {
      greeting: 'hi',
      voice: { voice_id: 'jane' }
    })
  })
})

describe('PayVoice guardrails', () => {
  const agent = readAgent('payvoice')
  const prompt = agent.system_prompt

  it('says nothing about the invoice to someone who is not Acme', () => {
    assert.match(prompt, /wrong number/i)
    assert.doesNotMatch(agent.greeting, /invoice/i)
  })

  it('does not argue with a caller who says they already paid', () => {
    assert.match(prompt, /already paid/i)
  })

  it('cannot offer discounts, part payments or plans', () => {
    assert.match(prompt, /discounts/i)
    assert.match(prompt, /payment plans/i)
  })

  it('needs a specific date and a phone number the caller actually said', () => {
    assert.match(prompt, /day and a month/i)
    assert.match(prompt, /do not ask for the year/i)
    assert.match(prompt, /never make up a phone number/i)
  })
})
