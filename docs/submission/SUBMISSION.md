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

Handing that call to a voice agent introduces a worse failure than an awkward
conversation. The model does not only speak: it fills in the date, the amount
and the callback number on the tools it calls. When it guesses one, the result
is a dated commitment with a reference number that nobody made. The call
sounded fine and the transcript reads fine, so nothing surfaces until the money
does not arrive. An invented promise is worse than no promise.

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

Open on the refusal, not the happy path. Everyone else's first two minutes are
an agent being helpful; this one is an agent being stopped.

| Time | On screen | Said |
|---|---|---|
| 0:00–0:25 | Title card, then the Tools tab mid-call showing `log_promise` refused in red | "This is a voice agent trying to record a payment promise with a phone number the caller never said. It was stopped. That is the whole point of this project." |
| 0:25–0:55 | Slide 3 | "A voice agent fills in the date, the amount and the callback number. When it guesses you don't get an awkward sentence, you get a dated commitment nobody made. The call sounded fine, so nobody catches it for weeks." |
| 0:55–2:40 | The live URL. Run the call: confirm, ask about 20492, give a date, **then deliberately don't give a number** so the refusal fires, then give a real one | Let the agent talk. Point at the ledger as each tool fires, and at the red row when the promise is refused. "It asked again. Now it has a number I actually said." |
| 2:40–3:30 | End the call, open the Record tab, wait for it to fill | "Fetched back from the session AssemblyAI stored: the promise, the turn it was recorded on, every other caller turn beside it, and the confidence that turn was transcribed at. It says 'needs review', because confidence measures transcription, not agreement." |
| 3:30–4:20 | Slides: business case | Who it is for, what they do today, how it would be priced, why voice. |
| 4:20–5:00 | Slides: scope and roadmap | "B2B reminders only, mocked invoice data, and the debtor comes to a link rather than the agent dialling out. Next: HTTP tools so the same agent answers a phone number, and a webhook that sends the record to the collections team." |

Rules for the recording: one take if possible, screen capture with clean audio,
no background music. Say out loud that the data is mocked and that the payment
link is simulated. Do not claim the agent places outbound calls.

If the refusal does not fire on camera, say so and show it another way rather
than editing around it: try `log_promise` with no number given, which is the
case the agent produced in testing.
