export function logLine(event, fields = {}) {
  try {
    console.log(JSON.stringify({ ts: new Date().toISOString(), event, ...fields }));
  } catch {
    // logging must never break the request path
  }
}
