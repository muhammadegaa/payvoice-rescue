# Submission copy — PayVoice Rescue

Paste-ready text for the lablab submission form.

## Project title

PayVoice Rescue

## Short description (233 characters)

A voice agent that makes the call small firms avoid: chasing an overdue
invoice. It confirms who is speaking, reads back the balance, records a dated
promise-to-pay, and shows every tool call on screen as it happens.

## Long description

Late payment is the quiet killer of small businesses. Most owners know exactly
who owes them money and still put off the call, because collections is
uncomfortable, repetitive work that nobody wants to do twice a week.

PayVoice Rescue makes that call. It is a voice agent built on the AssemblyAI
Voice Agent API for business-to-business invoice reminders. The debtor speaks
normally; the agent confirms who it is talking to, looks up the invoice before
it will discuss any number, states the balance in one sentence, and then does
one of two things: records a promise-to-pay with a specific date, or issues a
one-time payment link for the caller who wants to settle now.

The part judges can see is the ledger. Every tool call the agent makes appears
on screen the moment it happens, with the arguments it chose and the result it
got back, so nothing about the conversation is hidden behind a transcript.
That matters in collections, where the difference between "they said they'd
pay" and a dated, recorded commitment is the whole job.

Under the hood it uses keyterms so invoice numbers and company names transcribe
correctly, JSON-Schema parameter hints so a spoken phone number is captured
digit by digit rather than guessed, turn detection tuned so the agent waits
instead of talking over an annoyed caller, and a 60-second session token so the
API key never reaches the browser.

Scope is deliberate. This is B2B invoice reminders, not consumer debt
collection, which is heavily regulated. The demo runs on mocked invoice data:
no real customer, no real money.

## Technology tags

AssemblyAI, Voice Agent API, JavaScript, Node.js, Vercel, voice agents,
speech-to-text, tool calling

## Category tags

Business, Fintech, Productivity, Automation

## Links

- GitHub: https://github.com/muhammadegaa/payvoice-rescue
- Live demo: _(Vercel URL, added at deploy)_

## Video shot list (5:00 maximum)

| Time | On screen | Said |
|---|---|---|
| 0:00–0:30 | Title card, then the problem in plain words | "56% of US small businesses are carrying unpaid invoices, averaging $17,500. The owner knows who owes them. They still don't make the call." |
| 0:30–2:30 | The live deployed URL. Start the call, play the debtor, agree to a date | Let the agent talk. Say as little as possible over it. Point out the ledger filling in as each tool fires. |
| 2:30–3:30 | The Tools tab and the agent tab | "The agent cannot discuss a balance before it has looked the invoice up. Here is the promise it recorded, with the date it confirmed back to me." |
| 3:30–4:30 | Slides: business case | Who it is for, what they pay today, how this is priced, why it needs voice. |
| 4:30–5:00 | Slides: scope and roadmap | "B2B only. Mocked data in this demo. Next: HTTP tools so it answers a real phone number, and a post-call record from the Sessions API." |

Rules for the recording: one take if possible, screen capture with clean audio,
no background music, and say out loud that the data is mocked.
