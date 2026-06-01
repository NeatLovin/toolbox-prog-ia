import tools from '../data/tools.json'
import concepts from '../data/concepts.json'
import matrix from '../data/matrix.json'
import combos from '../data/combos.json'
import meta from '../data/meta.json'

export function useData() {
  return { tools, concepts, matrix, combos, meta }
}
