// Canned replies for the mock engine (VITE_MOCK_ENGINE=1): tests and development without a GPU.
export function mockReply(messages: { role: string; content: string }[], json: boolean): string {
  const sys = messages.find((m) => m.role === 'system')?.content ?? '';
  const name = sys.match(/^You are (\w+)/)?.[1] ?? 'Expert';
  if (json) {
    const refine = /edit website content JSON/.test(sys);
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
  return `**${name} here (mock engine).** This is a short streamed answer so the interface can be tested without a GPU.\n\n- First point\n- Second point\n\n\`\`\`js\nconsole.log('code block');\n\`\`\``;
}
