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
