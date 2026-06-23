const DOI_MAP = {
  'lister 2004':       'https://doi.org/10.1145/1041624.1041673',
  'biggs 1996':        'https://doi.org/10.1007/BF00138871',
  'fuller 2007':       'https://doi.org/10.1145/1345375.1345438',
  'bassner 2024':      'https://doi.org/10.1145/3649217.3653543',
  'kazemitabaar 2024': 'https://doi.org/10.1145/3613904.3642773',
  'liffiton 2024':     'https://doi.org/10.1145/3631802.3631830',
  'liffiton 2023':     'https://doi.org/10.1145/3631802.3631830',
  'sheese 2024':       'https://doi.org/10.1145/3636243.3636249',
  'kazemitabaar 2023': 'https://arxiv.org/abs/2309.14049',
  'zhang 2026':        'https://arxiv.org/abs/2601.20085',
}

const DENYLIST = ['anthropic', 'openai', 'google', 'hes-so', 'unifr', 'karpathy']

export function referenceUrl(segment) {
  if (/E\d{2}/.test(segment)) return null

  const lower = segment.toLowerCase()
  if (DENYLIST.some(d => lower.includes(d))) return null

  const yearMatch = segment.match(/\b(19|20)\d{2}\b/)
  if (!yearMatch) return null
  const year = yearMatch[0]

  const nameMatch = segment.match(/\b([A-Z]\w+)/)
  if (!nameMatch) return null
  const name = nameMatch[1].toLowerCase()

  const key = `${name} ${year}`
  if (DOI_MAP[key]) return DOI_MAP[key]

  return `https://scholar.google.com/scholar?q=${encodeURIComponent(segment.trim())}`
}

export function parseReferences(str) {
  if (!str) return []
  return str.split('·').map(s => s.trim()).filter(Boolean).map(text => ({
    text,
    url: referenceUrl(text)
  }))
}
