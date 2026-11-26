// Boots Pyodide + NLTK and runs nlp/nltk_core.py. Shared by the browser worker (nltk.worker.ts) and the Node test
// (tests/node/pyodide-nltk.mjs), so the code that runs live is the code that is tested.
export const PYODIDE_VERSION = '314.0.8';
export const PYODIDE_CDN = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;
export const FUNCTIONS = ['analyze', 'coach', 'agreement'] as const;
export type Fn = (typeof FUNCTIONS)[number];

export type Io = {
  loadPyodide: (o: { indexURL: string }) => Promise<any>;
  indexURL: string;
  text: (path: string) => Promise<string>;
  bytes: (path: string) => Promise<ArrayBuffer>;
  progress?: (step: string) => void;
};

const GLUE = `
import json, sys, nltk
sys.path.insert(0, "/home/pyodide/nlp")
nltk.data.path.insert(0, "/nltk_data")
import nltk_core
INDEX = json.loads(INDEX_JSON)
PHRASES = [p for p, _ in INDEX["phrases"] if " " in p]

def _call(fn, args_json):
    args = json.loads(args_json)
    if not isinstance(args, dict):
        args = {}
    if fn == "analyze":
        out = nltk_core.analyze(args.get("text", ""))
    elif fn == "coach":
        out = nltk_core.coach(args.get("text", ""), INDEX)
    elif fn == "agreement":
        out = nltk_core.agreement(args.get("answers") or [], PHRASES)
    else:
        raise ValueError("unknown function")
    return json.dumps(out)

nltk_core.sentiment("warm up")
`;

/** Returns a call(fn, args) function once Python, NLTK, its data and the topic index are loaded. */
export async function boot(io: Io): Promise<(fn: Fn, args: unknown) => unknown> {
  io.progress?.('Starting Python (Pyodide)');
  const py = await io.loadPyodide({ indexURL: io.indexURL });
  io.progress?.('Loading NLTK');
  const [, zip, src, index] = await Promise.all([
    py.loadPackage('nltk', { messageCallback: () => {} }),
    io.bytes('/nlp/nltk_data.zip'), io.text('/nlp/nltk_core.py'), io.text('/nlp/topic-index.json'),
  ]);
  io.progress?.('Unpacking NLTK data');
  py.unpackArchive(zip, 'zip', { extractDir: '/nltk_data' });
  py.FS.mkdirTree('/home/pyodide/nlp');
  py.FS.writeFile('/home/pyodide/nlp/nltk_core.py', src);
  py.globals.set('INDEX_JSON', index);
  py.runPython(GLUE);
  const call = py.globals.get('_call');
  return (fn: Fn, args: unknown) => {
    if (!FUNCTIONS.includes(fn)) throw new Error(`Unknown NLTK function ${fn}`);
    return JSON.parse(call(fn, JSON.stringify(args)));
  };
}

/** A short, readable message for the visitor: the last line of a Python traceback ("TypeError: ..."), or what to
 * check when Python itself could not be downloaded (offline, blocked CDN, content blocker). */
export function friendlyError(fn: Fn | 'boot', err: unknown): string {
  const raw = String((err as Error)?.message ?? err ?? 'Unknown error').trim();
  if (fn === 'boot') {
    const net = /fetch|network|import|load|HTTP|NetworkError|CSP|Content Security/i.test(raw);
    const first = raw.split('\n')[0].slice(0, 200);
    return net ? `${first}. Check your internet connection or content blocker: Python is downloaded from cdn.jsdelivr.net the first time` : first;
  }
  const lines = raw.split('\n').map((l) => l.trim()).filter(Boolean);
  const last = (lines[lines.length - 1] ?? raw).slice(0, 200);
  return `NLTK could not process this text (${last}).`;
}
