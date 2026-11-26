// Canned replies for the mock engine (VITE_MOCK_ENGINE=1): tests and development without a GPU.
export function mockReply(messages: { role: string; content: string }[], json: boolean): string {
  const sys = messages.find((m) => m.role === 'system')?.content ?? '';
  const name = sys.match(/^You are (\w+)/)?.[1] ?? 'Expert';
  if (json) {
    const userText = [...messages].reverse().find((m) => m.role === 'user')?.content ?? '';
    // [[noop]] in a change request makes the mock return the page unchanged (tests the no-op edit message).
    const refine = /edit website content JSON/.test(sys) && !userText.includes('[[noop]]');
    return JSON.stringify({
      title: refine ? 'Mock Page v2' : 'Mock Page', tagline: 'A page built by the mock engine to test the Studio.', palette: refine ? 'ocean' : 'forest', cta: 'Say hello',
      sections: [
        { kind: 'features', heading: 'Why it works', intro: '', items: [{ title: 'Fast', text: 'Built in seconds.', meta: '' }, { title: 'Private', text: 'Runs on your device.', meta: '' }] },
        { kind: 'pricing', heading: 'Prices', intro: '', items: [{ title: 'Free', text: 'All features; No account', meta: '€0' }] },
        { kind: 'faq', heading: 'Questions', intro: '', items: [{ title: 'Is it free?', text: 'Yes.', meta: '' }] },
        { kind: 'contact', heading: 'Contact', intro: 'Write to us.', items: [] },
      ],
    });
  }
  // Test hooks (mock builds only): [[echo]] repeats the visitor's text, [[slow]] streams a long answer.
  const last = [...messages].reverse().find((m) => m.role === 'user')?.content ?? '';
  if (last.includes('[[echo]]')) return last.replace('[[echo]]', '');
  if (last.includes('[[loop]]')) return `Start with the user's job.\n\n${'Ask explicitly and drive the answer with confidence rules. '.repeat(40)}`;
  if (last.includes('[[slow]]')) return Array.from({ length: 30 }, (_, i) => `Slow paragraph ${i + 1} from ${name}.`).join('\n\n');
  return `**${name} here (mock engine).** This is a short streamed answer so the interface can be tested without a GPU.\n\n- First point\n- Second point\n\n\`\`\`js\nconsole.log('code block');\n\`\`\``;
}
