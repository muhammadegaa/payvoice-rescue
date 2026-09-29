# Submission copy — PayVoice Rescue

Paste-ready text for the lablab submission form.

## Project title

PayVoice Rescue

## Short description (233 characters)

A voice agent that makes the call small firms avoid: chasing an overdue
invoice. It takes a dated promise-to-pay, then hands back the record: the
promise, the caller's own words that produced it, and the confidence it was
heard with.

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

When the call ends, PayVoice does the part that matters in collections: it
fetches that session back from AssemblyAI and shows the record. The promise
with its date and reference, the caller's own words that produced it, the
confidence those words were heard with, every tool call with how long it took,
and how fast the agent replied. That record comes from the stored session, not
from what the page happened to observe, which is the difference between a
transcript and evidence.

A language model fills in tool arguments and will sometimes invent them, so
the promise tool is checked in code before anything is recorded. It refuses a
callback number the caller never said and a date that is already in the past,
and the agent has to go back and ask. In testing, the agent tried to log a
promise with "unknown" as the number, was refused, asked the caller, and then
logged the real one. The record ignores the refused attempt.

Under the hood it also uses keyterms so invoice numbers and company names
transcribe correctly, turn detection tuned so the agent waits instead of
talking over an annoyed caller, prompt rules that stop it discussing the
invoice with the wrong person or offering discounts, and a 60-second session
token so the API key never reaches the browser.

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
