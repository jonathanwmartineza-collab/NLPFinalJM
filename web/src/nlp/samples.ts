// Built-in examples so every NLP panel has something to show before you type or chat.

/** A deliberately vague question: the Prompt coach should flag "better", "stuff" and "some". */
export const SAMPLE_QUESTION = 'Can you maybe make my landing page better and add some stuff about accessibility?';

/** Three expert answers that disagree, so the agreement map has real work to do. */
export const SAMPLE_ANSWERS: { name: string; text: string }[] = [
  {
    name: 'Maya (Frontend)',
    text: 'I recommend building the habit tracker as a progressive web app. A PWA ships to every phone from one codebase, installs from the browser, and works offline with a service worker. Push notifications now work on iOS too, so reminders are covered. It is the fastest and cheapest way to launch and learn.',
  },
  {
    name: 'Leo (Mobile)',
    text: 'I would build a native app instead. Habit trackers live or die on reliable reminders, home screen widgets and health data, and a PWA is weak at all three. Background notifications on iOS are still unreliable for web apps, which is a serious risk. Native costs more but users will trust it.',
  },
  {
    name: 'Ana (Product)',
    text: 'Start with a progressive web app to test whether people keep the habit for two weeks. Measure retention and reminder opens. If reminders turn out to be the problem, move to a native app later. Offline support and one codebase keep the first version small and cheap.',
  },
];
