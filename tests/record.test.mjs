import { describe, it } from 'node:test'
import assert from 'node:assert'
import { callRecord } from '../lib.mjs'

// The call record is what a collections team keeps: what was promised, in the
// caller's own words, and how the agent got there. It is derived from the
// session timeline the Voice Agent API stores for every call.

const timeline = {
  session_id: 'sess_abc',
  started_at_unix_ms: 1_768_413_867_285,
  turns: [
    {
      trigger: 'greeting',
      status: 'completed',
      user_transcript: null,
      agent_text: 'Hello, this is PayVoice Rescue calling about invoice two zero four nine two.',
      time_to_first_audio_ms: 900,
    },
    {
      trigger: 'user_speech',
      status: 'completed',
      user_transcript: 'Yes, this is Acme.',
      user_confidence: 0.97,
      agent_text: 'Thank you. One moment while I pull up the invoice.',
      time_to_first_audio_ms: 1100,
      tool_calls: [
        {
          call_id: 'call_1',
          name: 'lookup_invoice',
          arguments: { invoice_id: '20492' },
          result: '{"amount_cents":75000,"days_overdue":30}',
          duration_ms: 120,
          is_error: false,
        },
      ],
    },
    {
      trigger: 'user_speech',
      status: 'completed',
      user_transcript: 'I can pay it on the fourteenth of October.',
      user_confidence: 0.91,
      agent_text: 'Recorded for the fourteenth of October twenty twenty six.',
      time_to_first_audio_ms: 1300,
      tool_calls: [
        {
          call_id: 'call_2',
          name: 'log_promise',
          arguments: { invoice_id: '20492', promise_date: '2026-10-14', amount_cents: 75000 },
          result: '{"reference":"PROM-20492-4K8QZR","confirmed":true}',
          duration_ms: 95,
          is_error: false,
        },
      ],
    },
  ],
}

describe('callRecord', () => {
  it('reports the promise with the words that produced it', () => {
    const record = callRecord(timeline)
    assert.deepStrictEqual(record.promise, {
      invoice_id: '20492',
      promise_date: '2026-10-14',
      amount_cents: 75000,
      reference: 'PROM-20492-4K8QZR',
      said: 'I can pay it on the fourteenth of October.',
      confidence: 0.91,
    })
  })

  it('lists every tool call in order with its duration', () => {
    const { tools } = callRecord(timeline)
    assert.deepStrictEqual(
      tools.map((t) => [t.name, t.duration_ms, t.is_error]),
      [['lookup_invoice', 120, false], ['log_promise', 95, false]]
    )
  })

  it('summarises the call for a collections log', () => {
    const { summary } = callRecord(timeline)
    assert.strictEqual(summary.turns, 3)
    assert.strictEqual(summary.outcome, 'promise_to_pay')
    assert.strictEqual(summary.median_reply_ms, 1100)
    assert.strictEqual(summary.lowest_confidence, 0.91)
  })

  it('calls it no commitment when no promise was logged', () => {
    const noPromise = { ...timeline, turns: timeline.turns.slice(0, 2) }
    const record = callRecord(noPromise)
    assert.strictEqual(record.promise, null)
    assert.strictEqual(record.summary.outcome, 'no_commitment')
  })

  it('reports a payment link as its own outcome', () => {
    const paid = {
      ...timeline,
      turns: [
        timeline.turns[0],
        {
          trigger: 'user_speech',
          status: 'completed',
          user_transcript: "I'll pay now.",
          user_confidence: 0.88,
          agent_text: 'The secure payment link is on your screen.',
          time_to_first_audio_ms: 1000,
          tool_calls: [
            {
              name: 'create_deposit',
              arguments: { invoice_id: '20492', amount_cents: 75000 },
              result: '{"deposit_url":"https://example.test/d/1"}',
              duration_ms: 80,
              is_error: false,
            },
          ],
        },
      ],
    }
    assert.strictEqual(callRecord(paid).summary.outcome, 'paying_now')
  })

  it('survives an empty timeline', () => {
    const record = callRecord({ session_id: 'sess_x', started_at_unix_ms: 1 })
    assert.strictEqual(record.promise, null)
    assert.deepStrictEqual(record.tools, [])
    assert.strictEqual(record.summary.turns, 0)
    assert.strictEqual(record.summary.outcome, 'no_commitment')
  })
})

// A promise is often made over several turns: the date in one, the callback
// number in the next. The quote must be the words that gave the date.
const turn = (user_transcript, user_confidence, tool_calls = []) => ({
  user_transcript, user_confidence, agent_text: '', time_to_first_audio_ms: 900, tool_calls,
})
const call = (name, args, result, is_error = false) => ({
  call_id: name + Math.random(), name, arguments: args, result: JSON.stringify(result), duration_ms: 200, is_error,
})
const promiseArgs = { invoice_id: '20492', promise_date: '2026-10-14', amount_cents: 75000 }

describe('callRecord quotes the words that made the promise', () => {
  it('uses the turn where the caller gave the date, not the later turn that gave the phone number', () => {
    const record = callRecord({
      session_id: 'sess_1',
      turns: [
        turn(null, null),
        turn('Yes, this is Acme.', 0.99, [call('lookup_invoice', { invoice_id: '20492' }, { status: 'overdue' })]),
        turn('I can pay it on the 14th of October.', 0.93, [
          call('log_promise', { ...promiseArgs, phone_number: 'unknown' }, { error: 'The caller has not said that phone number.' }, true),
        ]),
        turn('My number is 415-555-0134.', 0.99, [
          call('log_promise', { ...promiseArgs, phone_number: '+14155550134' }, { reference: 'PROM-20492-ABC' }),
        ]),
      ],
    })
    assert.strictEqual(record.promise.reference, 'PROM-20492-ABC')
    assert.strictEqual(record.promise.said, 'I can pay it on the 14th of October.')
    assert.strictEqual(record.promise.confidence, 0.93)
    assert.strictEqual(record.summary.outcome, 'promise_to_pay')
  })

  it('shows a refused attempt in the tool list without counting it as the promise', () => {
    const record = callRecord({
      turns: [
        turn('I can pay it on the 14th of October.', 0.93, [
          call('log_promise', { ...promiseArgs, phone_number: 'unknown' }, { error: 'no' }, true),
        ]),
      ],
    })
    assert.strictEqual(record.tools.length, 1)
    assert.strictEqual(record.tools[0].is_error, true)
    assert.strictEqual(record.promise, null)
    assert.strictEqual(record.summary.outcome, 'no_commitment')
  })

  it('uses the same turn when the date and the tool call are in it', () => {
    const record = callRecord({
      turns: [
        turn('I will pay on October 14th, my number is 415-555-0134.', 0.9, [
          call('log_promise', { ...promiseArgs, phone_number: '+14155550134' }, { reference: 'PROM-1' }),
        ]),
      ],
    })
    assert.strictEqual(record.promise.said, 'I will pay on October 14th, my number is 415-555-0134.')
  })

  it('falls back to the turn of the tool call when no earlier turn mentions a date', () => {
    const record = callRecord({
      turns: [
        turn('Yes.', 0.99),
        turn('Sure, go ahead.', 0.95, [call('log_promise', promiseArgs, { reference: 'PROM-2' })]),
      ],
    })
    assert.strictEqual(record.promise.said, 'Sure, go ahead.')
  })
})
