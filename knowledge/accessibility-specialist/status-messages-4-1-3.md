# Status messages (WCAG 4.1.3): announcing loading, results and errors

- Source: Understanding SC 4.1.3 Status Messages — https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html (accessed 2026-11-28)
- Publisher: W3C Web Accessibility Initiative (WAI)
- Licence: W3C Document License 2023 (no SPDX id; publisher's terms) · Copy in repo: link only

Why this matters for accessibility-specialist: the live NLTK box, the WebLLM engine gate and the
toaster all change text without moving focus ("Loading Python...", "Analysed 3 sentences", "Model
failed to load"). The code already uses `role="status"`, `role="alert"` and `aria-live`; this
criterion is how those are judged.

## Key facts
- Level AA. In markup content, status messages can be programmatically determined through role or
  properties so assistive technology can present them without the message receiving focus.
- A status message is a change in content that is not a change of context and that tells the user
  about the success or results of an action, a waiting state, the progress of a process, or errors.
- Examples that are status messages: "5 results returned" near results; an updated cart count;
  an "Invalid entry" note above a field; a busy indicator; a progress update; "Saved" confirmations.
- Not status messages: an error shown in a dialog that takes focus (that is a change of context);
  expanding or collapsing menus, accordions, trees or tabs (state is exposed under 4.1.2);
  new content that reports no success, waiting, progress or error.
- Assistive technology may delay, suppress or highlight messages by user preference, so the role
  matters as well as the text.

## Sufficient techniques
- Situation A, success or results: ARIA22 (`role="status"`) with G199 (success feedback on submit).
- Situation B, suggestions or errors: ARIA19 (`role="alert"` or a live region) with G83, G84, G85,
  G177 or G194. `role="alert"` is only needed when no change of context occurs.
- Situation C, progress: ARIA23 (`role="log"` for sequential updates), ARIA25 (live region for
  progress bar status), ARIA22 with G193, or ARIA27 (`ariaNotify` for progress).
- Advisory: ARIA18 (`alertdialog`), SCR14 (make nonessential alerts optional).
- `aria-atomic` helps when only part of a string changes, so "3 items" is read whole.

## Failures
- F103: a status message that cannot be programmatically determined through role or properties.
- Also listed (no ID): `role="alert"` or `aria-live="assertive"` on content that is not important
  and time-sensitive.

## How to test here
1. Find every dynamic message: `grep -rn 'role="status"\|role="alert"\|aria-live' web/src`.
2. For each, note which situation it is (A result, B error, C progress) and check the role
   matches the techniques above; then confirm the announcement with a real screen reader.
3. Screen-reader pass (NVDA + Firefox, VoiceOver + Safari): run Analyze in the live NLTK box and
   confirm "loading" and "done" are each announced once, without focus moving.
4. Trigger a failure (block the CDN in devtools) and confirm the error is announced, and that it
   uses `alert` only because it is time-sensitive.
5. Check the chat streaming output: listen for whether every streamed token is announced; the
   design target is to announce start and completion, with `role="log"` for whole appended messages.
6. Confirm decorative spinners are `aria-hidden` and the text beside them carries the status.

## Report format
- Criterion 4.1.3 · location (component and file) · steps · expected vs actual announcement ·
  fix (role or property) · how verified (reader, browser, version).

## Limits
- The page does not define polite versus assertive behaviour in detail or give per-reader support
  data; verify with real screen readers.
- `role="timer"` is mentioned as a technique without a published write-up.
- Focus management after a change of context (dialogs) is covered by other criteria (2.4.3, 4.1.2).
