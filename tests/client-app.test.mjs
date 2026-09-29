// Static smoke test for client-side tool wiring.
// Validates that deployment/browser/server.mjs contains the expected symbols
// for the three PayVoice tools and the tool.result response pattern.

import { test } from 'node:test'
import assert from 'node:assert'
import { readFileSync } from 'node:fs'

const SOURCE = readFileSync('./deployment/browser/server.mjs', 'utf8')

test('server app contains tool handler wiring', () => {
  assert.ok(SOURCE.includes('lookup_invoice'))
  assert.ok(SOURCE.includes('log_promise'))
  assert.ok(SOURCE.includes('create_deposit'))
  assert.ok(SOURCE.includes("type: 'tool.result'"))
  assert.ok(SOURCE.includes('flushTools'))
  assert.ok(SOURCE.includes('logToolCall'))
  assert.ok(SOURCE.includes('logToolResult'))
})

test('log_promise is checked against what the caller said and against today', () => {
  assert.ok(SOURCE.includes('numberWasSpoken(phone_number, spoken)'))
  assert.ok(SOURCE.includes('promiseDateProblem(promise_date, today())'))
  assert.ok(SOURCE.includes("' Today is ' + today()"))
  assert.ok(SOURCE.includes('numberWasSpoken.toString()'))
  assert.ok(SOURCE.includes('promiseDateProblem.toString()'))
})
