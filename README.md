# ArchieRoast
Project Description (The Elevator Pitch)
ArchRoast (or Gordon RAM-say) is an AI-powered web tool that brings brutal honesty to software engineering. Users upload a screenshot or diagram of their system architecture, and our elite AI architect ruthlessly roasts their design choices—calling out single points of failure, over-engineered microservices, and outdated tech stacks. Beneath the humor, it delivers one piece of genuinely actionable advice to improve the system. It’s a tool built for developers to laugh, cry, and learn


To finish in 2 hours, you must be ruthless with your scope. Do not build a database. Your app is a stateless pipeline: Image goes in, Roast comes out.

1. The "Dropzone" UI (Frontend)

A clean, centered drag-and-drop box for image uploads (PNG/JPG).
Hackathon cheat: Use a pre-built component library like shadcn/ui or a Tailwind template to make it look premium in 5 minutes.
2. The Vision API Integration (Backend)

A single API route (e.g., Next.js API route or Express endpoint).
Takes the base64-encoded image and sends it to a multimodal LLM (like OpenAI's gpt-4o).
Returns a JSON payload with the roast text.
3. The Typewriter Reveal (Frontend Polish)

When the API returns the roast, don't just dump the text on the screen. Reveal it character-by-character (like a terminal or ChatGPT typing) to make it feel "smart" and dramatic.
Add a visual loading state (e.g., "Analyzing microservices...", "Finding circular dependencies...") while waiting for the API to respond.
