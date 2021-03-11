export const SET_ERROR = 'SET_ERROR';
export const CLEAR_ERROR = 'CLEAR_ERROR';
export const LOAD_SNIPPET = 'LOAD_SNIPPET';
export const START_LOADING_SNIPPET = 'START_LOADING_SNIPPET';
export const DONE_LOADING_SNIPPET = 'DONE_LOADING_SNIPPET';
export const CLEAR_SNIPPET = 'CLEAR_SNIPPET';
export const SET_SNIPPET = 'SET_SNIPPET';
export const SELECT_CATEGORY = 'CHANGE_CATEGORY';
export const SELECT_TRANSFORMER = 'SELECT_TRANSFORMER';
export const HIDE_TRANSFORMER = 'HIDE_TRANSFORMER';
export const SET_TRANSFORM = 'SET_TRANSFORM';
export const SELECT_DIFFER = 'SELECT_DIFFER';
export const HIDE_OLD = 'HIDE_OLD';
export const SET_OLD = 'SET_OLD';
export const SET_PARSER = 'SET_PARSER';
export const SET_PARSER_SETTINGS = 'SET_PARSER_SETTINGS';
export const SET_DIFFER_SETTINGS = 'SET_DIFFER_SETTINGS';
export const SET_PARSE_RESULT = 'SET_PARSE_RESULT';
export const SET_DIFF_RESULT = 'SET_DIFF_RESULT';
export const SET_EVO_IMPACT_RESULT = 'SET_EVO_IMPACT_RESULT';
export const OPEN_SETTINGS_DIALOG = 'OPEN_SETTINGS_DIALOG';
export const CLOSE_SETTINGS_DIALOG = 'CLOSE_SETTINGS_DIALOG';
export const OPEN_SHARE_DIALOG = 'OPEN_SHARE_DIALOG';
export const CLOSE_SHARE_DIALOG = 'CLOSE_SHARE_DIALOG';
export const SET_CODE = 'SET_CODE';
export const SET_CURSOR = 'SET_CURSOR';
export const DROP_TEXT = 'DROP_TEXT';
export const SAVE = 'SAVE';
export const START_SAVE = 'START_SAVE';
export const END_SAVE = 'END_SAVE';
export const RESET = 'RESET';
export const TOGGLE_FORMATTING = 'TOGGLE_FORMATTING';
export const SET_KEY_MAP = 'SET_KEY_MAP';
export const LOAD_INSTANCE = 'LOAD_INSTANCE';
export const START_LOADING_INSTANCE = 'START_LOADING_INSTANCE';
export const DONE_LOADING_INSTANCE = 'DONE_LOADING_INSTANCE';
export const CLEAR_INSTANCE = 'CLEAR_INSTANCE';
export const SET_INSTANCE = 'SET_INSTANCE';
export const SET_EVO_IMPACT_STATUS = 'SET_EVO_IMPACT_STATUS';
/** @constant */
export const SET_DIFF_STATUS = 'SET_DIFF_STATUS';


export function setParser(parser) {
  return { type: SET_PARSER, parser };
}

export function setParserSettings(settings) {
  return { type: SET_PARSER_SETTINGS, settings };
}

export function setDifferSettings(settings) {
  return { type: SET_DIFFER_SETTINGS, settings };
}

export function save(fork = false) {
  return { type: SAVE, fork };
}

export function startSave(fork) {
  return { type: START_SAVE, fork };
}

export function endSave(fork) {
  return { type: END_SAVE, fork };
}

export function setSnippet(revision) {
  return { type: SET_SNIPPET, revision };
}

export function selectCategory(category) {
  return { type: SELECT_CATEGORY, category };
}

export function clearSnippet() {
  return { type: CLEAR_SNIPPET };
}

export function startLoadingSnippet() {
  return { type: START_LOADING_SNIPPET };
}

export function doneLoadingSnippet() {
  return { type: DONE_LOADING_SNIPPET };
}

export function loadSnippet() {
  return { type: LOAD_SNIPPET };
}

export function openSettingsDialog(payload = 'parser') {
  return { type: OPEN_SETTINGS_DIALOG, payload };
}

export function closeSettingsDialog() {
  return { type: CLOSE_SETTINGS_DIALOG };
}

export function openShareDialog() {
  return { type: OPEN_SHARE_DIALOG };
}

export function closeShareDialog() {
  return { type: CLOSE_SHARE_DIALOG };
}

export function setError(error) {
  return { type: SET_ERROR, error };
}

export function clearError() {
  return { type: CLEAR_ERROR };
}

export function selectTransformer(transformer) {
  return { type: SELECT_TRANSFORMER, transformer };
}

export function hideTransformer() {
  return { type: HIDE_TRANSFORMER };
}

export function setTransformState(state) {
  return { type: SET_TRANSFORM, ...state };
}

export function selectDiffer(differ) {
  // caution with differ name, it changes the key in returned record
  return { type: SELECT_DIFFER, differ };
}

export function hideDiff() {
  return { type: HIDE_OLD };
}

export function setOldState(state) {
  return { type: SET_OLD, ...state };
}

export function setCode(state) {
  return { type: SET_CODE, ...state };
}

export function setCursor(cursor) {
  return { type: SET_CURSOR, cursor };
}

export function dropText(text, categoryId) {
  return { type: DROP_TEXT, text, categoryId };
}

export function reset() {
  return { type: RESET };
}

export function toggleFormatting() {
  return { type: TOGGLE_FORMATTING };
}

export function setKeyMap(keyMap) {
  return { type: SET_KEY_MAP, keyMap }
}

/**
 * @typedef {Object} EvoInstanciationData
 * @property {string} repo
 * @property {string} before
 * @property {string} after
 * 
 * @typedef {Object} InstantInstanciationData
 * @property {string} repo
 * @property {string} commitId
 * 
 * @typedef {InstantInstanciationData|EvoInstanciationData} InstanciationData
 * 
 */

/**
 * 
 * @param {import('../utils/instance').Instance} newInstance 
 */
export function loadInstance(newInstance) {
  return { type: LOAD_INSTANCE, instance: newInstance }
}

export function startLoadingInstance() {
  return { type: START_LOADING_INSTANCE }
}

export function doneLoadingInstance() {
  return { type: DONE_LOADING_INSTANCE }
}

export function clearInstance() {
  return { type: CLEAR_INSTANCE }
}

export function setInstance(evoRevision) {
  return { type: SET_INSTANCE, revision: evoRevision }
}

export function setDiffStatus(status = 'started') {
  return { type: SET_DIFF_STATUS, status }
}

export function setEvoImpactStatus(status = 'started') {
  return { type: SET_EVO_IMPACT_STATUS, status }
}

/**
 * 
 * @param {{time:number, diff:Object, treeAdapter:any}|{error:Error}} result 
 */
export function setDiffResult(result) {
  const { time, diff, treeAdapter, error } = result
  return {
    type: SET_DIFF_RESULT, result: {
      time: time || null,
      status: 'done',
      ast: diff || null,
      error: error || null,
      treeAdapter: treeAdapter || null,
      selectedEvos: diff && Array.isArray(diff) ? diff.map(x=>false) : []
    }
  }
}

/**
 * 
 * @param {{time:number, impact:Object, treeAdapter:any, uuid?:string}|{error:Error}} result 
 */
export function setEvoImpactResult(result) {
  const { time, impact, treeAdapter, error, uuid } = result
  return {
    type: SET_EVO_IMPACT_RESULT, result: {
      uuid,
      time: time || null,
      status: 'done',
      graph: impact || null,
      error: error || null,
      treeAdapter: treeAdapter || null,
    }
  }
}
let a = null;

export function setCoEvoStatus(status = 'started') {
  /** @constant */
  const aa = { type: SET_DIFF_STATUS, status }
  return aa
}

/**
 * 
 * @param {{time:number, diff:Object, treeAdapter:any}|{error:Error}} result 
 */
const setCoEvoResult = (result) => {
  const { time, diff, treeAdapter, error } = result
  return {
    type: SET_DIFF_RESULT, 
    result: {
      time: time || null,
      status: 'done',
      ast: diff || null,
      error: error || null,
      treeAdapter: treeAdapter || null,
      selectedEvos: diff && Array.isArray(diff) ? diff.map(x=>false) : []
    }
  }
}

/**
 * @typedef {ReturnType<setCoEvoResult> | ReturnType<setCoEvoStatus>} A
 */

const actioners = {
  CoEvolution: {
    Result: setCoEvoResult,
    setStatus: setCoEvoStatus,
  },
  Evolution: {
    setResult: setDiffResult,
    setStatus: setDiffStatus,
    setSettings: setDifferSettings,
  },
  Impact: {
    setResult: setEvoImpactResult,
    setStatus: setEvoImpactStatus,
  },
  Instance: {
    load : loadInstance,
    startLoading : startLoadingInstance,
    doneLoading : doneLoadingInstance,
    clear : clearInstance,
    set : setInstance,
  },
  Save: {
  },
  Snippet: {
  },
}

export default actioners