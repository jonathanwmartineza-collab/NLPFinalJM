# 0003. One streamed call per request
Status: accepted · Date: 2026-11-21
**Context.** Netlify streaming functions stop at 60 s (a 30 s cut-off has been reported). A full HTML build can need more output than fits.
**Decision.** Each `/api/model` request makes exactly one model call, streams NDJSON (`{"t":"d"}` … `{"t":"done"}`) with a heartbeat every 10 s, and stops itself at 45 s. The browser runs team mode step by step (route → parallel experts → optional review → synthesis) and continues cut-off builds by sending the document so far (head + tail if huge) and joining without overlap, at most 4 times.
**Consequences.** Works on the Free plan. If builds regularly need many continuations, move builds to background functions writing to Netlify Blobs (available per docs/07).
