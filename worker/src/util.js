export function jsonResponse(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json' }
  })
}

export function safeStr(v, max) {
  return typeof v === 'string' ? v.slice(0, max) : null
}

export function safeJsonStr(v, maxChars) {
  if (v === undefined || v === null) return null
  try {
    const s = JSON.stringify(v)
    return s.length > maxChars ? s.slice(0, maxChars) : s
  } catch {
    return null
  }
}

export function todayUTC() {
  return new Date().toISOString().slice(0, 10)
}
