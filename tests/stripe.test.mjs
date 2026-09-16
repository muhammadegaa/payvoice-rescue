import { describe, it, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert'
import { createCheckout, checkoutStatus } from '../lib.mjs'

// Stripe calls are checked against a stubbed fetch, so these run offline and
// without a key.

let calls
const realFetch = globalThis.fetch

function stubFetch(status, body) {
  globalThis.fetch = async (url, init = {}) => {
    calls.push({ url, init })
    return new Response(JSON.stringify(body), { status })
  }
}

beforeEach(() => {
  calls = []
  process.env.STRIPE_SECRET_KEY = 'sk_test_dummy'
})

afterEach(() => {
  globalThis.fetch = realFetch
})

describe('createCheckout', () => {
  it('creates a one-item payment session for the invoice amount', async () => {
    stubFetch(200, { id: 'cs_test_1', url: 'https://checkout.stripe.com/c/pay/cs_test_1' })
    const session = await createCheckout({
      invoice_id: '20492',
      amount_cents: 75000,
      return_url: 'http://localhost:3000/paid',
    })
    assert.deepStrictEqual(session, { id: 'cs_test_1', url: 'https://checkout.stripe.com/c/pay/cs_test_1' })

    const [{ url, init }] = calls
    assert.strictEqual(url, 'https://api.stripe.com/v1/checkout/sessions')
    assert.strictEqual(init.method, 'POST')
    assert.strictEqual(init.headers.Authorization, 'Bearer sk_test_dummy')
    const form = new URLSearchParams(init.body)
    assert.strictEqual(form.get('mode'), 'payment')
    assert.strictEqual(form.get('client_reference_id'), '20492')
    assert.strictEqual(form.get('line_items[0][quantity]'), '1')
    assert.strictEqual(form.get('line_items[0][price_data][currency]'), 'usd')
    assert.strictEqual(form.get('line_items[0][price_data][unit_amount]'), '75000')
    assert.strictEqual(form.get('line_items[0][price_data][product_data][name]'), 'Invoice 20492')
    assert.strictEqual(form.get('success_url'), 'http://localhost:3000/paid')
  })

  it('refuses amounts Stripe cannot charge before calling it', async () => {
    stubFetch(200, {})
    for (const amount_cents of [0, 49, 12.5, '75000', -100]) {
      await assert.rejects(
        createCheckout({ invoice_id: '20492', amount_cents, return_url: 'http://x/paid' }),
        /amount_cents/
      )
    }
    assert.strictEqual(calls.length, 0)
  })

  it('fails with a clear message when the key is missing', async () => {
    delete process.env.STRIPE_SECRET_KEY
    stubFetch(200, {})
    await assert.rejects(
      createCheckout({ invoice_id: '20492', amount_cents: 75000, return_url: 'http://x/paid' }),
      /STRIPE_SECRET_KEY/
    )
    assert.strictEqual(calls.length, 0)
  })

  it('surfaces Stripe errors with the status code', async () => {
    stubFetch(401, { error: { message: 'Invalid API Key provided' } })
    await assert.rejects(
      createCheckout({ invoice_id: '20492', amount_cents: 75000, return_url: 'http://x/paid' }),
      (err) => err.status === 401
    )
  })
})

describe('checkoutStatus', () => {
  it('returns the payment status of a session', async () => {
    stubFetch(200, { id: 'cs_test_1', payment_status: 'paid' })
    assert.strictEqual(await checkoutStatus('cs_test_1'), 'paid')
    const [{ url, init }] = calls
    assert.strictEqual(url, 'https://api.stripe.com/v1/checkout/sessions/cs_test_1')
    assert.strictEqual(init.method, 'GET')
  })

  it('rejects ids that are not checkout session ids', async () => {
    stubFetch(200, {})
    await assert.rejects(checkoutStatus('../customers'), /session id/)
    assert.strictEqual(calls.length, 0)
  })
})
