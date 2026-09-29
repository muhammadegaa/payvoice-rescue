import { describe, it } from 'node:test'
import assert from 'node:assert'
import { readAgent, sessionConfig } from '../lib.mjs'

// The browser configures its session inline rather than naming a stored
// agent, so the agent file has to be reshaped into the session.update form:
// the voice is a string there, not an object.
// https://www.assemblyai.com/docs/voice-agents/voice-agent-api/session-configuration

describe('sessionConfig', () => {
  it('moves the voice into output as a plain id', () => {
    const config = sessionConfig(readAgent('payvoice'))
    assert.strictEqual(config.output.voice, 'jane')
    assert.ok(!('voice' in config), 'voice should not stay at the top level')
  })

  it('carries the prompt, greeting, input settings and tools through', () => {
    const agent = readAgent('payvoice')
    const config = sessionConfig(agent)
    assert.strictEqual(config.system_prompt, agent.system_prompt)
    assert.strictEqual(config.greeting, agent.greeting)
    assert.deepStrictEqual(config.input.keyterms, agent.input.keyterms)
    assert.deepStrictEqual(config.input.turn_detection, agent.input.turn_detection)
    assert.deepStrictEqual(config.tools.map((t) => t.name), ['lookup_invoice', 'log_promise', 'create_deposit'])
  })

  it('drops the stored-agent name and any tool credentials', () => {
    const config = sessionConfig({
      name: 'Secret Agent',
      system_prompt: 'p',
      voice: { voice_id: 'jane' },
      tools: [{ type: 'function', name: 'a', http: { url: 'https://x', headers: [{ name: 'Authorization', value: 'Bearer sk-real' }] } }],
    })
    assert.ok(!('name' in config))
    assert.deepStrictEqual(config.tools[0].http.headers, [])
    assert.ok(!JSON.stringify(config).includes('sk-real'))
  })
})
