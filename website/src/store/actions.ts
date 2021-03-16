import { createActions } from "./actions_utils";
import { Range } from "./../components/MultiEditor2";

export const SET_ERROR = "SET_ERROR";
export const CLEAR_ERROR = "CLEAR_ERROR";
export const LOAD_SNIPPET = "LOAD_SNIPPET";
export const START_LOADING_SNIPPET = "START_LOADING_SNIPPET";
export const DONE_LOADING_SNIPPET = "DONE_LOADING_SNIPPET";
export const CLEAR_SNIPPET = "CLEAR_SNIPPET";
export const SET_SNIPPET = "SET_SNIPPET";
export const SELECT_CATEGORY = "CHANGE_CATEGORY";
export const SELECT_TRANSFORMER = "SELECT_TRANSFORMER";
export const HIDE_TRANSFORMER = "HIDE_TRANSFORMER";
export const SET_TRANSFORM = "SET_TRANSFORM";
export const SELECT_DIFFER = "SELECT_DIFFER";
export const HIDE_OLD = "HIDE_OLD";
export const SET_OLD = "SET_OLD";
export const SET_PARSER = "SET_PARSER";
export const SET_PARSER_SETTINGS = "SET_PARSER_SETTINGS";
export const SET_DIFFER_SETTINGS = "SET_DIFFER_SETTINGS";
export const SET_PARSE_RESULT = "SET_PARSE_RESULT";
export const SET_DIFF_RESULT = "SET_DIFF_RESULT";
export const SET_EVO_IMPACT_RESULT = "SET_EVO_IMPACT_RESULT";
export const OPEN_SETTINGS_DIALOG = "OPEN_SETTINGS_DIALOG";
export const CLOSE_SETTINGS_DIALOG = "CLOSE_SETTINGS_DIALOG";
export const OPEN_SHARE_DIALOG = "OPEN_SHARE_DIALOG";
export const CLOSE_SHARE_DIALOG = "CLOSE_SHARE_DIALOG";
export const SET_CODE = "SET_CODE";
export const SET_CURSOR = "SET_CURSOR";
// export const DROP_TEXT = "DROP_TEXT";
export const SAVE = "SAVE";
export const START_SAVE = "START_SAVE";
export const END_SAVE = "END_SAVE";
export const RESET = "RESET";
export const TOGGLE_FORMATTING = "TOGGLE_FORMATTING";
export const SET_KEY_MAP = "SET_KEY_MAP";
export const LOAD_INSTANCE = "LOAD_INSTANCE";
export const START_LOADING_INSTANCE = "START_LOADING_INSTANCE";
export const DONE_LOADING_INSTANCE = "DONE_LOADING_INSTANCE";
export const CLEAR_INSTANCE = "CLEAR_INSTANCE";
export const SET_INSTANCE = "SET_INSTANCE";
export const SET_EVO_IMPACT_STATUS = "SET_EVO_IMPACT_STATUS";
export const SET_DIFF_STATUS = "SET_DIFF_STATUS";

function setParser(parser) {
  return <const>{ type: SET_PARSER, parser };
}

// function setParserSettings(settings) {
//   return <const>{ type: SET_PARSER_SETTINGS, settings };
// }

function setDifferSettings(settings) {
  return <const>{ type: SET_DIFFER_SETTINGS, settings };
}

function save(fork = false) {
  return <const>{ type: SAVE, fork };
}

function startSave(fork) {
  return <const>{ type: START_SAVE, fork };
}

function endSave(fork) {
  return <const>{ type: END_SAVE, fork };
}

function setSnippet(revision) {
  return <const>{ type: SET_SNIPPET, revision };
}

function selectCategory(category) {
  return <const>{ type: SELECT_CATEGORY, category };
}

function clearSnippet() {
  return <const>{ type: CLEAR_SNIPPET };
}

function startLoadingSnippet() {
  return <const>{ type: START_LOADING_SNIPPET };
}

function doneLoadingSnippet() {
  return <const>{ type: DONE_LOADING_SNIPPET };
}

function loadSnippet() {
  return <const>{ type: LOAD_SNIPPET };
}

function openSettingsDialog(payload = "parser") {
  return <const>{ type: OPEN_SETTINGS_DIALOG, payload };
}

function closeSettingsDialog() {
  return <const>{ type: CLOSE_SETTINGS_DIALOG };
}

function openShareDialog() {
  return <const>{ type: OPEN_SHARE_DIALOG };
}

function closeShareDialog() {
  return <const>{ type: CLOSE_SHARE_DIALOG };
}

function setError(error) {
  return <const>{ type: SET_ERROR, error };
}

function clearError() {
  return <const>{ type: CLEAR_ERROR };
}

function selectTransformer(transformer) {
  return <const>{ type: SELECT_TRANSFORMER, transformer };
}

function hideTransformer() {
  return <const>{ type: HIDE_TRANSFORMER };
}

function setTransformState(state) {
  return <const>{ type: SET_TRANSFORM, ...state };
}

function selectDiffer(differ) {
  // caution with differ name, it changes the key in returned record
  return <const>{ type: SELECT_DIFFER, differ };
}

function hideDiff() {
  return <const>{ type: HIDE_OLD };
}

function setOldState(state) {
  return <const>{ type: SET_OLD, ...state };
}

function setCode(state) {
  return <const>{ type: SET_CODE, ...state };
}

function setCursor(cursor) {
  return <const>{ type: SET_CURSOR, cursor };
}

// function dropText(text, categoryId) {
//   return <const>{ type: DROP_TEXT, text, categoryId };
// }

function reset() {
  return <const>{ type: RESET };
}

function toggleFormatting() {
  return <const>{ type: TOGGLE_FORMATTING };
}

function setKeyMap(keyMap) {
  return <const>{ type: SET_KEY_MAP, keyMap };
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

// /**
//  *
//  * @param {import('../utils/instance').Instance} newInstance
//  */
// function loadInstance(newInstance) {
//   return <const>{ type: LOAD_INSTANCE, instance: newInstance };
// }

// function startLoadingInstance() {
//   return <const>{ type: START_LOADING_INSTANCE };
// }

// function doneLoadingInstance() {
//   return <const>{ type: DONE_LOADING_INSTANCE };
// }

// function clearInstance() {
//   return <const>{ type: CLEAR_INSTANCE };
// }

// function setInstance(evoRevision) {
//   return <const>{ type: SET_INSTANCE, revision: evoRevision };
// }

const setDiffResult = (
  result: { time: number; diff: any[]; treeAdapter: any } | { error: Error }
) => {
  if ("error" in result) {
    return <const>{
      error: result.error,
      selectedEvos: [] as boolean[],
      status: "error",
    };
  } else {
    const { time, diff, treeAdapter } = result;
    return <const>{
      status: "done",
      time: time,
      ast: diff,
      treeAdapter: treeAdapter,
      selectedEvos:
        diff && Array.isArray(diff)
          ? diff.map((x) => false)
          : ([] as boolean[]),
    };
  }
};

type Impact = {
  causes: number[];
  effects: number[];
  content:{
    type:string,
  };
};

type Impacts = {
  impacts: Impact[];
  ranges: (Range & { isTest?: boolean | "parent", sig?:string })[];
};

const setEvoImpactResult = (
  result:
    | { time: number; impact: Impacts; treeAdapter: any; uuid?: string }
    | { error: Error }
) => {
  if ("error" in result) {
    return <const>{
      status: "error",
      error: result.error,
    };
  } else {
    const { time, impact, treeAdapter, uuid } = result;
    return <const>{
      uuid,
      time: time,
      status: "done",
      graph: impact,
      treeAdapter: treeAdapter,
      selectedImpacted: {} as {[id:string]:Range}
    };
  }
};

const setCoEvoResult = (
  result: { time: number; diff: object; treeAdapter: any } | { error: Error }
) => {
  if ("error" in result) {
    return <const>{
      status: "error",
      error: result.error,
      selectedEvos: [],
    };
  } else {
    const { time, diff, treeAdapter } = result;
    return <const>{
      time: time || null,
      status: "done",
      ast: diff || null,
      error: null,
      treeAdapter: treeAdapter || null,
      selectedEvos: diff && Array.isArray(diff) ? diff.map((x) => false) : [],
    };
  }
};
type Status = "started" | "received" | "done" | "error";

const map = {
  INIT: () => undefined,
  reset: () => undefined,
  toggleFormatting: () => undefined,
  selectCategory: (revision: TODO) => revision,
  dropText: (text: TODO, categoryId: TODO) => ({ text, categoryId }),
  setCode: (state: { code: TODO; cursor: TODO }) => state,
  setOld: (state: { code?: TODO; oldcode?: TODO; side?: TODO }) => state,
  hideOld: () => undefined,
  setKeyMap: (keyMap: TODO) => keyMap,
  openSettingsDialog: (payload = "parser") => payload,
  closeSettingsDialog: () => undefined,
  openShareDialog: () => undefined,
  closeShareDialog: () => undefined,
  Instance: {
    load: (newInstance: import("../utils/instance").Instance) => newInstance,
    startLoading: () => undefined,
    doneLoading: () => undefined,
    clear: () => undefined,
    set: (revision: TODO) => revision,
  },
  Save: {
    start: (fork: TODO) => fork,
    end: () => undefined,
  },
  Cursor: {
    set: (cursor: TODO) => cursor,
  },
  Error: {
    set: (error: TODO) => error,
    clear: () => undefined,
  },
  Snippet: {
    set: (revision: TODO) => revision,
    clear: () => undefined,
    reset: () => undefined,
    Loading: {
      start: () => undefined,
      done: () => undefined,
    },
  },
  Parse: {
    Result: {
      set: (result: TODO) => result,
    },
    Settings: {
      set: (settings: TODO) => settings,
    },
    select: (x: { id: string; category: { id: string } }) => x,
  },
  Transformer: {
    Result: {
      set: (result: TODO) => result,
    },
    Settings: {
      set: (settings: TODO) => settings,
    },
    select: (x: {
      id: string;
      defaultParserID: string;
      defaultTransform: string;
    }) => x,
    hide: () => undefined,
  },
  Evolutions: {
    Result: {
      set: setDiffResult,
    },
    Status: {
      set: (status: Status) => status,
      Selected: {
        toggle: (id: number) => id,
        enable: (...ids: number[]) => ids[0]===undefined?[]:ids,
        reset: () => undefined,
      },
    },
    Settings: {
      set: (revision: TODO) => revision,
    },
    select: (x: { id: string; defaultDiff: string }) => x,
  },
  Impacts: {
    Result: {
      set: setEvoImpactResult,
    },
    Status: {
      set: (status: Status) => status,
      Selected: {
        remove: (...rs: Range[]) => rs,
        add: (rs: {[k:string]:Range}) => rs,
        reset: () => undefined,
      },
    },
    select: (x: { id: string }) => x,
  },
  CoEvolutions: {
    Result: {
      set: setCoEvoResult,
    },
    Status: {
      set: (status: Status) => status,
    },
  },
  Test: {
    INCREMENT: (amount) => ({ amount }),
    DECREMENT: (amount) => ({ amount: -amount }),
  },
  INCREMENT: (amount) => ({ amount }),
  DECREMENT: (amount) => ({ amount: -amount }),
} as const;

type TODO = any;

const actioners = createActions(map);

// FINAL TESTS
actioners["CoEvolution/Result/set"];
const aeezfgze: Required<{ a: () => number }> = { a: () => 3 } as const;
const zefgze = "b";
const fzef = aeezfgze[zefgze];
const gregthbn = aeezfgze["b" as const];
const ezfze = actioners["CoEvolutions/Status/set"]("done").payload;
const efzefze = actioners["CoEvolutions/Status/set"]("error").type;
const { DECREMENT, INCREMENT, "CoEvolutions/Result/set": zz } = actioners;

type zegzer = typeof actioners.DECREMENT;

// const red = handleActions(
//   {
//     [geresdrgher]: (
//       state,
//       { payload: { amount } }
//     ) => ({
//       ...state,
//       counter: state.counter + amount,
//     }),
//   },
//   { counter: 0 }
// );

export const nameof = <T>(name: keyof T & string) => name;

type types = allActions["type"];

export const types = (str: types) => str;

export default actioners;

type MappedRetTypes<
  T extends { [k: string]: (...args: any[]) => { type: string } }
> = ReturnType<T[keyof T]>;

export type allActions = MappedRetTypes<typeof actioners>;

// function mainReducer(state, action: allActions) {
//   switch (action.type) {
//     case "CoEvolutions/Result/set":
//       action.payload;
//       break;

//     default:
//       break;
//   }
// }
