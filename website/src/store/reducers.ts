import * as actions from "./actions";
import {
  getCategoryByID,
  getDefaultParser,
  getParserByID,
  getTransformerByID,
  getDifferByID,
} from "../parsers";
import queryString from "query-string";
import { Instance, query2instance } from "../utils/instance";
import { window } from "d3";
import { QueryDocumentKeys } from "graphql/language/visitor";

const defaultParser = getDefaultParser(getCategoryByID("javascript"));

const initialState = {
  // UI related state
  showSettingsDialog: false as string | false,
  showShareDialog: false,
  loadingSnippet: false,
  forking: false,
  saving: false,
  cursor: null,
  error: null as null | boolean | undefined,
  showTransformPanel: false,
  showDiffPanel: false,

  // Snippet related state
  selectedRevision: null,

  // Workbench settings

  // Contains local settings of all parsers
  parserSettings: {},

  // Remember selected parser per category
  parserPerCategory: {},

  activeInstance: null as null | Instance,

  workbench: {
    parser: defaultParser.id,
    parserSettings: null,
    parseResult: null as any,
    parseError: null,
    code: defaultParser.category.codeExample,
    keyMap: "default",
    initialCode: defaultParser.category.codeExample,
    transform: {
      code: "",
      initialCode: "",
      transformer: null as null | string,
    },
    diff: {
      code: "",
      initialCode: "",
      differ: null as any,
      differSettings: null,
    },
    diffResult: {} as Omit<
      ReturnType<typeof actions.default["Evolutions/Result/set"]>["payload"],
      "status"
    > & {
      status: ReturnType<
        typeof actions.default["Evolutions/Status/set"]
      >["payload"];
    },
    evoImpactResult: {} as Omit<
      ReturnType<typeof actions.default["Impacts/Result/set"]>["payload"],
      "status"
    > & {
      status: ReturnType<
        typeof actions.default["Impacts/Status/set"]
      >["payload"];
    },
  },

  enableFormatting: false,

  // TODO

  loadingInstance: false,
  activeRevision: undefined as any,
  differSettings: {},
};

export type State = typeof initialState;

/**
 * Returns the subset of the data that makes sense to persist between visits.
 */
export function persist(state: State) {
  return {
    ...pick(
      state,
      "showTransformPanel",
      "showDiffPanel",
      "parserSettings",
      "parserPerCategory"
    ),
    workbench: {
      ...pick(state.workbench, "parser", "code", "keyMap"),
      transform: pick(state.workbench.transform, "code", "transformer"),
      diff: pick(state.workbench.diff, "code", "differ") || "persist",
    },
  };
}

/**
 * When read from persistent storage, set the last stored code as initial version.
 * This is necessary because we use CodeMirror as an uncontrolled component.
 */
export function revive(state = initialState) {
  return {
    ...state,
    workbench: {
      ...state.workbench,
      initialCode: state.workbench.code,
      parserSettings: state.parserSettings[state.workbench.parser] || null,
      transform: {
        ...state.workbench.transform,
        initialCode: state.workbench.transform.code,
      },
      diff: {
        ...state.workbench.diff,
        initialCode: state.workbench.code,
        code:
          (state.workbench.diff && state.workbench.diff.code) ||
          state.workbench.code,
      },
    },
  };
}

export function astexplorer(
  state = initialState,
  action: actions.allActions
): State {
  console.log(46, state, action);
  return {
    // UI related state
    showSettingsDialog: showSettingsDialog(state.showSettingsDialog, action),
    showShareDialog: showShareDialog(state.showShareDialog, action),
    loadingSnippet: loadSnippet(state.loadingSnippet, action),
    loadingInstance: loadInstance(state.loadingInstance, action),
    saving: saving(state.saving, action),
    forking: forking(state.forking, action),
    cursor: cursor(state.cursor, action),
    error: error(state.error, action),
    showTransformPanel: showTransformPanel(state.showTransformPanel, action),
    showDiffPanel: showDiffPanel(state.showDiffPanel, action),

    // Snippet related state
    activeRevision: activeRevision(state.activeRevision, action),

    // Instance related state
    activeInstance: activeInstance(state.activeInstance, action),

    // Workbench settings
    parserPerCategory: parserPerCategory(state.parserPerCategory, action),
    parserSettings: parserSettings(state.parserSettings, action, state),
    differSettings: differSettings(state.differSettings, action, state),
    workbench: workbench(state.workbench, action, state),
    enableFormatting: format(state.enableFormatting, action),
    selectedRevision: state.selectedRevision,
  };
}

function format(
  state = initialState.enableFormatting,
  action: actions.allActions
) {
  if (action.type === "toggleFormatting") return !state;
  return state;
}

function workbench(
  state = initialState.workbench,
  action: actions.allActions,
  fullState: State
) {
  function parserFromCategory(category) {
    const parser =
      fullState.parserPerCategory[category.id] || getDefaultParser(category).id;
    return {
      parser,
      parserSettings: fullState.parserSettings[parser] || null,
      code: category.codeExample,
      initialCode: category.codeExample,
    };
  }

  state = {
    ...state,
    diffResult: evolutionResult(state.diffResult, action, fullState),
    evoImpactResult: impactResult(state.evoImpactResult, action, fullState),
  };

  switch (action.type) {
    case "selectCategory":
      return {
        ...state,
        ...parserFromCategory(action.payload),
      };
    case "dropText":
      return {
        ...state,
        ...parserFromCategory(getCategoryByID(action.payload.categoryId)),
        code: action.payload.text,
        initialCode: action.payload.text,
      };
    case "Parse/Result/set":
      return { ...state, parseResult: action.payload };
    case "Parse/Settings/set":
      return { ...state, parserSettings: action.payload };
    case "Evolutions/Settings/set":
      return { ...state, differSettings: action.payload };
    case "Parse/select": {
      const newState = { ...state, parser: action.payload.id };
      if (action.payload !== state.parser) {
        // Update parser settings
        newState.parserSettings =
          fullState.parserSettings[action.payload.id] || null;
      }
      return newState;
    }
    case "setCode":
      return { ...state, code: action.payload };
    case "Transformer/select": {
      const differentParser = action.payload.defaultParserID !== state.parser;
      const differentTransformer =
        action.payload.id !== state.transform.transformer;

      if (!(differentParser || differentTransformer)) {
        return state;
      }

      const newState = { ...state };

      if (differentParser) {
        newState.parser = action.payload.defaultParserID;
        newState.parserSettings =
          fullState.parserSettings[action.payload.defaultParserID] || null;
      }

      if (differentTransformer) {
        const snippetHasDifferentTransform =
          fullState.activeRevision &&
          fullState.activeRevision.getTransformerID() === action.payload.id;
        newState.transform = {
          ...state.transform,
          transformer: action.payload.id,
          code: snippetHasDifferentTransform
            ? state.transform.code
            : action.payload.defaultTransform,
          initialCode: snippetHasDifferentTransform
            ? fullState.activeRevision.getTransformCode()
            : action.payload.defaultTransform,
        };
      }

      return newState;
    }
    case "Evolutions/select": {
      // const differentParser =
      // action.differ.defaultParserID !== state.parser;
      const differentDiffer = action.payload.id !== state.diff.differ;

      if (!differentDiffer) {
        return state;
      }

      const newState2 = { ...state };

      // if (differentParser) {
      //   newState.parser = action.differ.defaultParserID;
      //   newState.parserSettings =
      //     fullState.parserSettings[action.differ.defaultParserID] || null;
      // }
      // newState2.code = fullState.workbench.diff.code;
      if (differentDiffer) {
        const snippetHasDifferentDiff = fullState.activeRevision && false;
        //   fullState.activeRevision.getDifferID() === action.differ.id;

        // console.log(44, snippetHasDifferentDiff, state.diff.code, action.differ.defaultDiff)
        newState2.diff = {
          ...state.diff,
          differ: action.payload.id,
          code: fullState.workbench.diff.code,
          // (snippetHasDifferentDiff ?
          //   (state.diff.code === undefined ? newState2.code : state.diff.code) :
          //   (action.differ.defaultDiff === undefined ? newState2.code : action.differ.defaultDiff)) || "select differ",
          initialCode: snippetHasDifferentDiff
            ? fullState.activeRevision.getDiffCode()
            : action.payload.defaultDiff,
        };
      }
      return newState2;
    }
    case "Transformer/Result/set":
      return {
        ...state,
        transform: {
          ...state.transform,
          code: action.payload,
        },
      };
    case "setOld":
      return {
        ...state,
        code: action.payload.code || state.code,
        diff: {
          ...state.diff,
          code: action.payload.oldcode || state.diff.code,
        },
      };
    case "Snippet/set": {
      const revision = action.payload;

      const transformerID = revision.getTransformerID();
      // const differID = revision.getDifferID();
      const parserID = revision.getParserID();

      return {
        ...state,
        parser: parserID,
        parserSettings:
          revision.getParserSettings() ||
          fullState.parserSettings[parserID] ||
          null,
        code: revision.getCode(),
        initialCode: revision.getCode(), // || 'let x = 3',
        transform: {
          ...state.transform,
          transformer: transformerID,
          code: revision.getTransformCode(),
          initialCode: revision.getTransformCode(),
        },
        diff: {
          ...state.diff,
          // differ: differID,
          code:
            (revision.getDiffCode && revision.getDiffCode()) ||
            state.diff.code ||
            state.code,
          initialCode: revision.getDiffCode && revision.getDiffCode(),
        },
      };
    }
    case "Snippet/clear":
    case "Snippet/reset": {
      const reset = Boolean(actions.RESET);
      const newState = {
        ...state,
        parserSettings: fullState.parserSettings[state.parser] || null,
        code: getParserByID(state.parser).category.codeExample,
        initialCode: getParserByID(state.parser).category.codeExample,
      };
      if (
        (fullState.activeRevision &&
          fullState.activeRevision.getTransformerID()) ||
        (reset && state.transform.transformer)
      ) {
        // Clear transform as well
        const transformer = getTransformerByID(state.transform.transformer);
        newState.transform = {
          ...state.transform,
          code: transformer.defaultTransform,
          initialCode: transformer.defaultTransform,
        };
      }
      if (
        (fullState.activeRevision &&
          true) /*fullState.activeRevision.getDifferID()*/ ||
        (reset && state.diff.differ)
      ) {
        // Clear transform as well
        const differ = getDifferByID(state.diff.differ);
        newState.diff = {
          ...state.diff,
          code: differ.defaultTransform || "default",
          initialCode: differ.defaultTransform,
        };
      }
      return newState;
    }
    case "setKeyMap":
      return { ...state, keyMap: action.payload };
    default:
      return state;
  }
}

function impactResult(
  state = initialState.workbench.evoImpactResult,
  action: actions.allActions,
  fullState: State
): State["workbench"]["evoImpactResult"] {
  switch (action.type) {
    case "Impacts/Result/set":
      return action.payload;
    case "Impacts/Status/set":
      return { ...state, status: action.payload };
    case "Impacts/Status/Selected/add":
      return {
        ...state,
        selectedImpacted: {
          ...state.selectedImpacted,
          ...action.payload,
        },
      };
    case "Impacts/Status/Selected/remove":
      const tmp = state.selectedImpacted;
      if (!tmp) {
        return state;
      }
      return {
        ...state,
        selectedImpacted: Object.keys(tmp).reduce(
          (acc, x) => (x in action.payload ? acc : ((acc[x] = tmp[x]), acc)),
          {}
        ),
      };
    case "Impacts/Status/Selected/reset":
      return {
        ...state,
        selectedImpacted: {},
      };
    default:
      return state;
  }
}

import { shallowEqual } from "react-redux";

function isSingleton<T>(x: T[]): x is [T] {
  return x.length === 1;
}

function evolutionResult(
  state = initialState.workbench.diffResult,
  action: actions.allActions,
  fullState: State
): State["workbench"]["diffResult"] {
  switch (action.type) {
    case "Evolutions/Result/set":
      return action.payload;
    case "Evolutions/Status/set":
      return { ...state, status: action.payload };
    case "Evolutions/Status/Selected/toggle":
      debugger
      return {
        ...state,
        selectedEvos: [
          ...state.selectedEvos.slice(0, action.payload),
          !state.selectedEvos[action.payload],
          ...state.selectedEvos.slice(action.payload + 1),
        ],
      };
    case "Evolutions/Status/Selected/enable":
      debugger
      return {
        ...state,
        selectedEvos: isSingleton(action.payload)
          ? [
              ...state.selectedEvos.slice(0, action.payload[0]),
              !state.selectedEvos[action.payload[0]],
              ...state.selectedEvos.slice(action.payload[0] + 1),
            ]
          : state.selectedEvos.map((x, i) => x || action.payload.indexOf(i) >= 0 ),
      };
    case "Evolutions/Status/Selected/reset":
      return {
        ...state,
        selectedEvos: state.selectedEvos.map(() => false),
      };
    default:
      return state;
  }
}

function parserSettings(
  state = initialState.parserSettings,
  action: actions.allActions,
  fullState: State
) {
  switch (action.type) {
    case "Parse/Settings/set":
      if (fullState.activeRevision) {
        // If a revision is loaded, we are **not** storing changes to the
        // settings in our local copy
        return state;
      }
      return {
        ...state,
        [fullState.workbench.parser]: action.payload,
      };
    default:
      return state;
  }
}

function differSettings(
  state = initialState.differSettings,
  action: actions.allActions,
  fullState: State
) {
  switch (action.type) {
    case "Evolutions/Settings/set":
      if (fullState.activeRevision) {
        // If a revision is loaded, we are **not** storing changes to the
        // settings in our local copy
        return state;
      }
      return {
        ...state,
        [fullState.workbench.diff.differ]: action.payload,
      };
    default:
      return state;
  }
}

function parserPerCategory(
  state = initialState.parserPerCategory,
  action: actions.allActions
) {
  switch (action.type) {
    case "Parse/select":
      return { ...state, [action.payload.category.id]: action.payload.id };
    default:
      return state;
  }
}

function showSettingsDialog(
  state = initialState.showSettingsDialog,
  action: actions.allActions
) {
  switch (action.type) {
    case "openSettingsDialog":
      return action.payload;
    case "closeSettingsDialog":
      return false;
    default:
      return state;
  }
}

function showShareDialog(
  state = initialState.showShareDialog,
  action: actions.allActions
) {
  switch (action.type) {
    case "openShareDialog":
      return true;
    case "closeShareDialog":
      return false;
    default:
      return state;
  }
}

function loadSnippet(
  state = initialState.loadingSnippet,
  action: actions.allActions
) {
  switch (action.type) {
    case "Snippet/Loading/start":
      return true;
    case "Snippet/Loading/done":
      return false;
    default:
      return state;
  }
}

function loadInstance(
  state = initialState.loadingInstance,
  action: actions.allActions
) {
  switch (action.type) {
    case "Instance/startLoading":
      return true;
    case "Instance/doneLoading":
      return false;
    default:
      return state;
  }
}

function saving(state = initialState.saving, action: actions.allActions) {
  switch (action.type) {
    case "Save/start":
      return !action.payload;
    case "Save/end":
      return false;
    default:
      return state;
  }
}

function forking(state = initialState.forking, action: actions.allActions) {
  switch (action.type) {
    case "Save/start":
      return action.payload;
    case "Save/end":
      return false;
    default:
      return state;
  }
}

function cursor(state = initialState.cursor, action: actions.allActions) {
  switch (action.type) {
    case "Cursor/set":
      return action.payload;
    case "setCode":
      // If this action is triggered and the cursor = 0, then the code must be
      // loaded
      if (action.payload.cursor != null && action.payload.cursor !== 0) {
        return action.payload.cursor;
      }
      return state;
    case "reset":
    case "Snippet/set":
    case "Snippet/clear":
      return null;
    default:
      return state;
  }
}

function error(state = initialState.error, action: actions.allActions) {
  switch (action.type) {
    case "Error/set":
      return action.error;
    case "Error/clear":
      return null;
    default:
      return state;
  }
}

function showTransformPanel(
  state = initialState.showTransformPanel,
  action: actions.allActions
) {
  switch (action.type) {
    case "Transformer/select":
      return true;
    case "Transformer/hide":
    case "selectCategory":
    case "Snippet/clear":
      return false;
    case "Snippet/set":
      return Boolean(action.payload.getTransformerID());
    default:
      return state;
  }
}

function showDiffPanel(
  state = initialState.showDiffPanel,
  action: actions.allActions
) {
  switch (action.type) {
    case "Evolutions/select":
      return true;
    case "hideOld":
    case "selectCategory":
    case "Snippet/clear":
      return false;
    // case actions.SET_SNIPPET:
    //   return Boolean(action.revision.getDifferID());
    default:
      return state;
  }
}

function activeRevision(
  state = initialState.selectedRevision,
  action: actions.allActions
) {
  switch (action.type) {
    case "Snippet/set":
      return action.payload;
    case "selectCategory":
    case "Snippet/clear":
    case "reset":
      return null;
    default:
      return state;
  }
}

/**
 * @typedef {ReturnType<query2instance>} Instance
 */

// /**
//  * @param {{activeInstance:Instance}} state
//  * @param {import('redux').Action} action
//  * @returns {Instance}
//  */
function activeInstance(
  state = initialState.activeInstance,
  action: actions.allActions
) {
  switch (action.type) {
    case "INIT":
    case "Snippet/set":
      if ((global as any).location.search.length > 1) {
        const parsed = query2instance(
          queryString.parse((global as any).location.search)
        );
        return parsed;
      }
    case "Instance/load":
      return action.payload.instance || state;
    // case 'selectCategory':
    // case actions.CLEAR_SNIPPET:
    // case actions.RESET:
    //   return null;
    default:
      return state;
  }
}

function pick(obj: { [k: string]: any }, ...properties: string[]) {
  return properties.reduce(
    (result, prop) => ((result[prop] = obj[prop]), result),
    {}
  );
}
