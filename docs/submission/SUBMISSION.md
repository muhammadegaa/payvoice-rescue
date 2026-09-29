# Submission copy — PayVoice Rescue

Paste-ready text for the lablab submission form.

## Project title

PayVoice Rescue

## Short description (252 characters)

A voice agent for the call small firms avoid: chasing an overdue invoice. It
takes a dated promise-to-pay, refuses arguments the caller never said, and
hands back a reviewable record of the call from the session AssemblyAI
stored.

## Long description

Late payment is the quiet killer of small businesses. Most owners know exactly
who owes them money and still put off the call, because collections is
uncomfortable, repetitive work that nobody wants to do twice a week.

PayVoice Rescue is a browser prototype of that call, built on the AssemblyAI
Voice Agent API for business-to-business invoice reminders. The debtor opens a
link and speaks normally; the agent asks who it is speaking to, looks up the
invoice, states the balance in one sentence, and then aims at one of two
endings: a promise-to-pay with a specific date, or a payment link for the
caller who wants to settle now. The link is simulated in this demo.

The part judges can see is the ledger. Every tool call the agent makes appears
on screen the moment it happens, with the arguments it chose and the result it
got back, so nothing about the conversation is hidden behind a transcript.

The harder problem is that a language model fills in those arguments, and will
sometimes invent them. So the promise tool checks them in code before anything
is recorded. A callback number whose digits do not appear in what the caller
just said is refused, as is a date in the past or one that is not a real
calendar date, and the agent has to go back and ask. The check is deliberately
narrow: it matches the last ten digits against the caller's most recent turn,
which catches the invented number this agent actually produced, and does not
attempt to prove that the caller agreed to the debt.

When the call ends, the page fetches that session back from AssemblyAI and
shows a record: the promise with its date, amount and reference, the caller's
turn it was recorded on, the confidence that turn was transcribed at, every
caller turn so the quote can be read in context, each tool call with how long
it took, and the reply latency. Refused and timed-out attempts do not count as
commitments. Every promise is flagged for a human to read, because turn
confidence is a transcription measure, not proof that someone agreed.

Also in use: keyterms configured for invoice numbers and company names, turn
detection tuned for silence and barge-in, JSON-Schema parameter hints on the
spoken phone number, and a session token minted server-side so the API key
never reaches the browser.

Scope is deliberate. This is B2B invoice reminders, not consumer debt
collection, which is heavily regulated. The demo runs on mocked invoice data:
one fixture invoice, no real customer, no real money, and no outbound phone
call — the debtor comes to the link.

## Technology tags

AssemblyAI, Voice Agent API, JavaScript, Node.js, Vercel, voice agents,
speech-to-text, tool calling

## Category tags

Business, Fintech, Productivity, Automation

## Links

- GitHub: https://github.com/muhammadegaa/payvoice-rescue
- Live demo: https://payvoice-rescue.vercel.app

## Video shot list (5:00 maximum)

| Time | On screen | Said |
|---|---|---|
| 0:00–0:30 | Title card, then the problem in plain words | "56% of US small businesses are carrying unpaid invoices, averaging $17,500. The owner knows who owes them. They still don't make the call." |
| 0:30–2:30 | The live deployed URL. Start the call, play the debtor, agree to a date | Let the agent talk. Say as little as possible over it. Point out the ledger filling in as each tool fires. |
| 2:30–3:00 | The Tools tab | "The agent cannot discuss a balance before it has looked the invoice up. Every call it made is here." |
| 3:00–3:40 | End the call, open the Record tab and wait for it to fill | "This is fetched back from the session AssemblyAI stored: the promise, the words that produced it, and the confidence they were heard with. That is what a collections team keeps." |
| 3:40–4:30 | Slides: business case | Who it is for, what they pay today, how this is priced, why it needs voice. |
| 4:30–5:00 | Slides: scope and roadmap | "B2B only. Mocked data in this demo. Next: HTTP tools so it answers a real phone number, and a webhook that sends the record to the collections team when a call ends." |

Rules for the recording: one take if possible, screen capture with clean audio,
no background music, and say out loud that the data is mocked.
