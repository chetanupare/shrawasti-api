<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Fast2SMS Integration Issues (BLOCKED)
- **Status**: API not working due to account restrictions
- **Issue 1**: "Quick API Access is disabled" - SMS endpoint blocked
- **Issue 2**: WhatsApp API requires different format (template-based)
- **Required Action**: User must enable Quick API Access in Fast2SMS dashboard at https://www.fast2sms.com → Settings → API
- **Alternative**: Consider switching to MSG91, Twilio, or AWS SNS for OTP delivery
