# PayVoice Rescue

A browser prototype of the call small firms avoid: chasing an overdue invoice.
The debtor opens a link and talks in plain speech, and the agent asks who it is
speaking to, states the balance, and aims at a dated promise-to-pay or a
payment link. Every tool call it makes is shown on screen as it happens, like a
bank ledger, and the call ends with a record a human can review.

Built for the [AssemblyAI Voice Agent Hackathon](https://lablab.ai/ai-hackathons/assemblyai-voice-agent-hackathon)
on the [Voice Agent API](https://www.assemblyai.com/docs/voice-agents/voice-agent-api).

**Live demo:** https://payvoice-rescue.vercel.app

## Why this

56% of US small businesses are carrying unpaid invoices, averaging $17,500
each ([QuickBooks 2025 late payments report](https://quickbooks.intuit.com/r/small-business-data/small-business-late-payments-report-2025/),
survey of 2,487 businesses). The owner either makes the awkward call, or hands
the debt to an agency. PayVoice takes the conversation.

Scope: business-to-business invoice reminders. Consumer debt collection is
regulated and is explicitly out of scope.

## What it does

| Tool | What happens |
|---|---|
| `lookup_invoice` | Returns the balance, due date and days overdue for the one fixture invoice. The prompt tells the agent to call it before discussing an amount. |
| `log_promise` | Records a promise-to-pay with a date, amount and callback number, and returns a reference. Checked in code first. |
| `create_deposit` | Returns a payment link. Simulated: it points at an example domain and takes no money. |

When the call ends, the page fetches that session back from AssemblyAI and
shows a record: the promise with its date, amount, callback number and
reference, the caller's turn it was recorded on, the confidence that turn was
transcribed at, every caller turn so the quote can be read in context, each
tool call with its duration, and the reply latency. Every promise is flagged
for review, because turn confidence measures transcription, not agreement.

The model fills in tool arguments and sometimes makes them up, so `log_promise`
is checked in code before anything is recorded. It refuses a callback number
whose last ten digits do not appear in what the caller just said, a date in the
past, and a date that is not a real calendar date; the agent then has to ask
again. That is a narrow check against invented arguments, not a proof that the
caller agreed to the debt. Refused and timed-out attempts never become the
recorded promise.

Also in use: keyterms configured for invoice numbers and company names, turn
detection tuned for silence windows and barge-in, JSON-Schema hints on the
spoken phone number, prompt rules against discussing the invoice with the wrong
person or offering discounts, and a session token minted server-side so the API
key never reaches the browser. The prompt rules are instructions to a model,
not guarantees.

**Demo data is mocked.** Invoice 20492 for Acme Consulting, $750, 30 days
overdue. No real customer data, no real money, no real phone calls.

## Run it

```sh
cp .env.example .env     # add ASSEMBLYAI_API_KEY
AGENT=payvoice npm start # http://localhost:3000
npm test
```

Node 18 or later. No dependencies.

## How it is built

```
agents/payvoice.jsonc      the agent: prompt, voice, keyterms, tools
deployment/browser/        the page, the session token, the tool handlers
api/index.mjs              the same handler, for Vercel
lib.mjs                    env loading, JSONC parsing, AssemblyAI calls
tests/                     node --test
```

The browser reads `agents/payvoice.jsonc` and sends it with the session, so
changing behaviour means editing that file and restarting or redeploying, not
editing the server and not republishing a stored agent. Sessions are configured
inline because a stored agent is resolved per region: an id published from one
machine is not found from another, which broke the deployed page until the
configuration travelled with the session. `npm run publish` still manages
stored agents for the phone deployment.

## Credit

This repo began as [AssemblyAI's voice-agent-starter-js](https://github.com/AssemblyAI/voice-agent-starter-js),
which provides the agent-publishing scripts, the browser deployment and the
example agents in `agents/`. PayVoice Rescue adds the `payvoice` agent, its
tool handlers and ledger, the tests for both, and the Vercel deployment.
