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

test('deposit link is a real checkout the page watches until paid', () => {
  assert.ok(SOURCE.includes("req.url === '/deposit'"))
  assert.ok(SOURCE.includes("req.url.startsWith('/deposit/')"))
  assert.ok(SOURCE.includes('createCheckout'))
  assert.ok(SOURCE.includes('checkoutStatus'))
  assert.ok(SOURCE.includes('watchPayment'))
  assert.ok(SOURCE.includes('payment.received'))
  assert.ok(!SOURCE.includes('payvoice.example.com'))
})
