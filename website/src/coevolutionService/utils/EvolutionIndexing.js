


/**
 * @typedef {Object} Range
 * @property {string} repository if missing refer to the repository of your side of the evolution
 * @property {string} commitId if missing refer to the commitId of your side of the evolution
 * @property {string} filePath
 * @property {number} start
 * @property {number} end
 * @property {string} description
 */
/**
 * Evolutions properties
 * @typedef {Object} Evolution
 * @property {string} repository if missing refer to the repository of your set of evolutions
 * @property {string} type
 * @property {Range[]} before /left
 * @property {Range[]} after  /right
 * @property {string} commitIdBefore
 * @property {string} commitIdAfter
 */