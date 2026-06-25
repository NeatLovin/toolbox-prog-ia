export function fullerHint(fuller) {
  if (fuller?.includes('Produce') && fuller?.includes('Interpret'))
    return 'Produce (écrire du code) et Interpret (lire/tracer du code) sont tous les deux mobilisés.'
  if (fuller?.includes('Produce'))   return 'Principalement Produce : l\'étudiant doit produire du code ou un algorithme.'
  if (fuller?.includes('Interpret')) return 'Principalement Interpret : l\'étudiant doit lire, tracer et expliquer du code existant.'
  return fuller || ''
}
