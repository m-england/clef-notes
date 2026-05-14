---
name: Avoid unnecessary runtime verification
description: Don't run node/shell commands to inspect package exports or APIs when the answer is already known from other sources
type: feedback
---

Don't run speculative `node -e` or shell inspection commands to verify library APIs when the information is already available from GitHub pages, docs, or prior tool results in the conversation.

**Why:** The user called this out directly — it's wasted effort and adds noise.

**How to apply:** If a library's API has already been confirmed (via web fetch, docs, or prior research), proceed with that knowledge. Only do runtime inspection if there's a genuine ambiguity that can't be resolved another way.
