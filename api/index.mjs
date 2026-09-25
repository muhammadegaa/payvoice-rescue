// Vercel entry point. The page, the agent lookup and the session token all
// come from the browser deployment; this file only hands Vercel its handler.
// Set ASSEMBLYAI_API_KEY, AGENT and AGENT_ID in the project's environment.
export { handler as default } from '../deployment/browser/server.mjs'
