import { detectEmergency, EMERGENCY_NOTICE } from '../ai/safety';

/** A fixed, app-written safety notice shown before any AI text when a message looks like an emergency. */
export default function EmergencyNotice({ text }: { text: string }) {
  const kind = detectEmergency(text);
  if (!kind) return null;
  return <p className="notice err emergency" role="alert"><b>{kind === 'medical' ? 'Possible emergency.' : 'Please reach out now.'}</b> {EMERGENCY_NOTICE[kind]}</p>;
}
