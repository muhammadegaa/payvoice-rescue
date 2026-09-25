# PayVoice Rescue

A voice agent that handles the call small firms avoid: chasing an overdue
invoice. The debtor talks to it in plain speech, and the agent confirms who it
is speaking to, reads back the balance, and either records a dated
promise-to-pay or issues a payment link. Every tool call it makes is shown on
screen as it happens, like a bank ledger.

Built for the [AssemblyAI Voice Agent Hackathon](https://lablab.ai/ai-hackathons/assemblyai-voice-agent-hackathon)
on the [Voice Agent API](https://www.assemblyai.com/docs/voice-agents/voice-agent-api).

**Live demo:** _(added at deploy)_

## Why this

56% of US small businesses are carrying unpaid invoices, averaging $17,500
each ([QuickBooks 2025 late payments report](https://quickbooks.intuit.com/r/small-business-data/small-business-late-payments-report-2025/),
survey of 2,487 businesses). The owner either makes the awkward call, or hands
the debt to an agency. PayVoice makes the call.

Scope: business-to-business invoice reminders. Consumer debt collection is
regulated and is explicitly out of scope.

## What it does

| Tool | What happens |
|---|---|
| `lookup_invoice` | Fetches the balance, due date and days overdue. The agent may not discuss an amount before calling it. |
| `log_promise` | Records a promise-to-pay once the caller gives a date and an amount, and returns a reference. |
| `create_deposit` | Issues a one-time payment link when the caller wants to pay now. |

Also in use: keyterms so invoice numbers and company names transcribe
correctly, turn detection tuned so the agent waits rather than talking over the
caller, JSON-Schema parameter hints so a phone number is read back digit by
digit, and a 60-second session token so the API key never reaches the browser.

**Demo data is mocked.** Invoice 20492 for Acme Consulting, $750, 30 days
overdue. No real customer data, no real money, no real phone calls.

## Run it

```sh
cp .env.example .env     # add ASSEMBLYAI_API_KEY
AGENT=payvoice npm run publish
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

The agent is a JSON document published to AssemblyAI; changing behaviour means
editing `agents/payvoice.jsonc` and publishing again, not editing the server.

## Credit

This repo began as [AssemblyAI's voice-agent-starter-js](https://github.com/AssemblyAI/voice-agent-starter-js),
which provides the agent-publishing scripts, the browser deployment and the
example agents in `agents/`. PayVoice Rescue adds the `payvoice` agent, its
tool handlers and ledger, the tests for both, and the Vercel deployment.
