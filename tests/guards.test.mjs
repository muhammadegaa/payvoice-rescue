import { describe, it } from 'node:test'
import assert from 'node:assert'
import { numberWasSpoken, promiseDateProblem } from '../lib.mjs'

describe('numberWasSpoken', () => {
  it('accepts a number the caller said as digits', () => {
    assert.ok(numberWasSpoken('+14155550134', ['My number is 415-555-0134.']))
  })

  it('accepts a number the caller said as words', () => {
    assert.ok(numberWasSpoken('+14155550134', ['four one five, five five five, zero one three four']))
    assert.ok(numberWasSpoken('+14155550134', ['four one five five five five oh one three four']))
  })

  it('accepts a number with or without the country code', () => {
    assert.ok(numberWasSpoken('4155550134', ['415 555 0134']))
    assert.ok(numberWasSpoken('+14155550134', ['1 415 555 0134']))
  })

  it('refuses a number the caller never said', () => {
    assert.ok(!numberWasSpoken('+15555555555', ['Yes, this is Acme.', 'I can pay it on the 14th of October.']))
    assert.ok(!numberWasSpoken('+15551234567', ['My number is 415-555-0134.']))
  })

  it('refuses placeholders and empty values', () => {
    for (const bad of ['unknown', '', undefined, null, '123']) {
      assert.ok(!numberWasSpoken(bad, ['415-555-0134']), String(bad))
    }
  })

  it('refuses a caller line that only shares the date digits', () => {
    assert.ok(!numberWasSpoken('+14155550134', ['I can pay on 2026 10 14']))
  })
})

describe('promiseDateProblem', () => {
  const today = '2026-09-29'

  it('accepts today and later dates', () => {
    assert.strictEqual(promiseDateProblem('2026-09-29', today), null)
    assert.strictEqual(promiseDateProblem('2026-10-14', today), null)
    assert.strictEqual(promiseDateProblem('2027-01-05', today), null)
  })

  it('refuses a date in the past and says what today is', () => {
    const message = promiseDateProblem('2024-10-14', today)
    assert.match(message, /past/)
    assert.match(message, /2026-09-29/)
  })

  it('refuses anything that is not an ISO date', () => {
    for (const bad of ['14th October', '10/14/2026', '', undefined, '2026-13-45x']) {
      assert.match(promiseDateProblem(bad, today), /ISO date/, String(bad))
    }
  })
})
