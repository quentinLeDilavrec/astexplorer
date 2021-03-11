// TODO make it editable in the ui, storable in a gist
import RefactoringTypes from "../coevolutionService/utils/RefactoringTypes.json";


/**
 * 
 * @param {{[k:string]:string}} query an object were values are string
 * @return {{[k:string]:string}} for example nest({"a.b.c"=3}) --> {a:{b:{c:3}}} 
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
      left: element.left.map(betterSide),
      right: element.right.map(betterSide),
    }
    RefactoringTypes2[key] = o
  }
}
console.log('RefactoringTypes2', RefactoringTypes2, JSON.stringify(RefactoringTypes2))


const FilteredRefactorings = {}
for (const key in RefactoringTypes) {
  if (RefactoringTypes.hasOwnProperty(key)) {
    const element = RefactoringTypes2[key];
    if (!element.left.some(x => x.keys.method || x.keys.class)) continue
    if (element.left.some(x => x.many)) continue
    if (element.right.some(x => x.many)) continue
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
 * @param {string} file 
 * @param {string} range 
 * @param {number} normalized_key 
 */
function makeRange(file, range, normalized_key) {
  const [start, end] = (range || '-').split('-')
    .map(x => x === '0' ? 0 : parseInt(x) || undefined)
  const desc = RefactoringTypes[type][side][normalized_key].description
  return {
    file,
    start, end,
    descId: normalized_key, // optional
    desc, // optional
  }
}

/**
 * 
 * @param {{[k:string]:string|string[]}} content 
 * @param {'left'|'right'} side 
 * @returns {{[k:string]:ReturnType<makeRange>[]}} 
 */
function side2ranges(content, type, side) {
  const r = {}
  if (typeof content !== 'object')
    return r;
  for (const key in content) {
    if (content.hasOwnProperty(key) && key !== '0') {
      let default_file
      const qtt_check = {}
      /** @type {(ReturnType<makeRange>)[]} */
      const ranges = [];
      const normalized_key = 'a'.charCodeAt() - key.charCodeAt();
      const desc = key;
      const cc = content[key]
      const aa = (Array.isArray(cc) ? cc : [cc])
      aa.forEach(
        content => {
          if (qtt_check[key]) throw new Error('to much ranges for this kind of range')
          const [file, range] = content.split(':')
          default_file = default_file || file
          ranges.push(makeRange(file || default_file, range, normalized_key))
          qtt_check[key] = !RefactoringTypes[type][side][normalized_key].many
        })
      r[desc] = ranges
    }
  }
  return r
}

export function query2instance(query) {

  const { repo, before, after, type } = nest(query)

  /** @type {undefined | string} */
  let commitIdBefore = undefined
  
  if (before) {
    if (typeof before === 'string') {
      commitIdBefore = before
    } else if(before[0]) {
      commitIdBefore = before[0]
    }
  }
  /** @type {string} */
  const commitIdAfter = typeof after === 'string'
  ? after : after && after[0]
  const r = {
    repo,
    commitIdAfter,
    commitIdBefore: commitIdBefore,
  }

  const o = {
    type: normalyzeType(type),
    before: side2ranges(before, normalyzeType(type), 'left'),
    after: side2ranges(after, normalyzeType(type), 'right'),
  }

  return {
    ...r,
    currentCase: o,
    cases: [o],
  }
}


/** @typedef {ReturnType<query2instance>} Instance */