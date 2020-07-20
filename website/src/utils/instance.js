// TODO make it editable in the ui, storable in a gist
import RefactoringTypes from "../coevolutionService/utils/RefactoringTypes.json";


/**
 * 
 * @param {object} query an object were values are string
 * @return for example nest({"a.b.c"=3}) --> {a:{b:{c:3}}} 
 */
function nest(query) {
  query = { ...query }
  const r = {}
  for (const key in query) {
    if (query.hasOwnProperty(key)) {
      const element = query[key];
      const k = key.split(/\./)
      let o = r
      for (let i = 0; i < k.length; i++) {
        if (i + 1 < k.length) {
          if (o[k[i]] !== undefined && o[k[i]] !== null) {
            o[k[i]] = { 0: o[k[i]] }
          }
          o[k[i]] = o[k[i]] || {}
          o = o[k[i]]
        } else {
          if (o[k[i]] !== undefined && o[k[i]] !== null) {
            o[k[i]][0] = element
          } else {
            o[k[i]] = element
          }
        }
      }
    }
  }
  return r
}



console.log('RefactoringTypes', RefactoringTypes)
const RefactoringTypes2 = {}
function betterSide({ description, many }) {
  const keys = {}
  description.split(' ').forEach(x => keys[x.toLowerCase()] = true)
  return {
    description,
    many,
    keys,
  }
}

for (const key in RefactoringTypes) {
  if (RefactoringTypes.hasOwnProperty(key)) {
    const element = RefactoringTypes[key];
    const o = {
      before: element.left.map(betterSide),
      after: element.right.map(betterSide),
    }
    RefactoringTypes2[key] = o
  }
}
console.log('RefactoringTypes2', RefactoringTypes2, JSON.stringify(RefactoringTypes2))


const FilteredRefactorings = {}
for (const key in RefactoringTypes) {
  if (RefactoringTypes.hasOwnProperty(key)) {
    const element = RefactoringTypes2[key];
    if (!element.before.some(x => x.keys.method || x.keys.class)) continue
    if (element.before.some(x => x.many)) continue
    if (element.after.some(x => x.many)) continue
    FilteredRefactorings[key] = RefactoringTypes[key]
  }
}
console.log('FilteredRefactorings', FilteredRefactorings, JSON.stringify(FilteredRefactorings))

console.log('FilteredRefactorings', FilteredRefactorings, JSON.stringify(Object.keys(FilteredRefactorings)))

/**
 * 
 * @param {string} type 
 */
function normalyzeType(type) {
  // TODO
  switch (type) {
    case 'MM':
      return 'MOVE_METHOD';
    default:
      return type
  }
}

/**
 * 
 * @param {*} content 
 * @param {'left'|'right'} side 
 */
function side2ranges(content, type, side) {
  const r = {}
  if (typeof content !== 'object')
    return r;
  for (const key in content) {
    if (content.hasOwnProperty(key) && key !== '0') {
      let default_file
      const qtt_check = {}
      const ranges = [];
      const normalized_key = 'a'.charCodeAt() - key.charCodeAt();
      let desc = key;
      (Array.isArray(content[key]) ? content[key] : [content[key]]).forEach(
        content => {
          if (qtt_check[key]) throw new Error('to much ranges for this kind of range')
          const [file, range] = content.split(':')
          const [start, end] = (range || '-').split('-')
            .map(x => x === '0' ? 0 : parseInt(x) || undefined)
          default_file = default_file || file
          desc = RefactoringTypes[type][side][normalized_key].description
          const e = {
            file: file || default_file,
            start, end,
            descId: normalized_key, // optional
            desc, // optional
          }
          ranges.push(e)
          qtt_check[key] = !RefactoringTypes[type][side][normalized_key].many
        })
      r[desc] = ranges
    }
  }
  return r
}

export function query2instance(query) {

  const { repo, before, after, type } = nest(query)
  const r = {
    repo,
    commitIdAfter: typeof after === 'string'
      ? after : after[0],
    currentCase: null,
    cases: [],
  }
  
  if (before) {
    if (typeof before === 'string') {
      r.commitIdBefore = before
    } else if(before[0]) {
      r.commitIdBefore = before[0]
    }
  }

  const o = {
    type: normalyzeType(type),
    before: side2ranges(before, normalyzeType(type), 'left'),
    after: side2ranges(after, normalyzeType(type), 'right'),
  }
  r.cases.push(o)
  r.currentCase = o
  return r
}