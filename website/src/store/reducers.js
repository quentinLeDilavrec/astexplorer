import * as actions from './actions';
import { getCategoryByID, getDefaultParser, getParserByID, getTransformerByID, getDifferByID } from '../parsers';
import queryString from 'query-string';
import { query2instance } from '../utils/instance';

const defaultParser = getDefaultParser(getCategoryByID('javascript'));

const initialState = {

  // UI related state
  showSettingsDialog: false,
  showShareDialog: false,
  loadingSnippet: false,
  forking: false,
  saving: false,
  cursor: null,
  error: null,
  showTransformPanel: false,
  showDiffPanel: false,

  // Snippet related state
  selectedRevision: null,

  // Workbench settings

  // Contains local settings of all parsers
  parserSettings: {},

  // Remember selected parser per category
  parserPerCategory: {},

  activeInstance: null,

  workbench: {
    parser: defaultParser.id,
    parserSettings: null,
    parseError: null,
    code: defaultParser.category.codeExample,
    keyMap: 'default',
    initialCode: defaultParser.category.codeExample,
    transform: {
      code: '',
      initialCode: '',
      transformer: null,
    },
    diff: {
      code: '',
      initialCode: '',
      differ: null,
    },
  },

  enableFormatting: false,

};

/**
 * Returns the subset of the data that makes sense to persist between visits.
 */
export function persist(state) {
  return {
    ...pick(state, 'showTransformPanel', 'showDiffPanel', 'parserSettings', 'parserPerCategory'),
    workbench: {
      ...pick(state.workbench, 'parser', 'code', 'keyMap'),
      transform: pick(state.workbench.transform, 'code', 'transformer'),
      diff: pick(state.workbench.diff, 'code', 'differ') || "persist",
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
        code: (state.workbench.diff && state.workbench.diff.code) || state.workbench.code,
      },
    },
  };
}

export function astexplorer(state = initialState, action) {
  console.log(46, state, action)
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
    enableFormatting: format(state.enableFormatting, action, state),
  };
}

function format(state = initialState.enableFormatting, action) {
  if (action.type === actions.TOGGLE_FORMATTING) return !state;
  return state;
}

function workbench(state = initialState.workbench, action, fullState) {
  function parserFromCategory(category) {
    const parser = fullState.parserPerCategory[category.id] ||
      getDefaultParser(category).id;
    return {
      parser,
      parserSettings: fullState.parserSettings[parser] || null,
      code: category.codeExample,
      initialCode: category.codeExample,
    };
  }

  // console.log(47, action)

  switch (action.type) {
    case actions.SELECT_CATEGORY:
      return {
        ...state,
        ...parserFromCategory(action.category),
      };
    case actions.DROP_TEXT:
      return {
        ...state,
        ...parserFromCategory(getCategoryByID(action.categoryId)),
        code: action.text,
        initialCode: action.text,
      };
    case actions.SET_PARSE_RESULT:
      return { ...state, parseResult: action.result };
    // TODO set ParserStatus
    case actions.SET_DIFF_RESULT:
      return { ...state, diffResult: action.result };
    case actions.SET_EVO_IMPACT_RESULT:
      return { ...state, evoImpactResult: action.result };
    case actions.SET_DIFF_STATUS:
      return { ...state, diffResult: { ...state.diffResult, status: action.status } };
    case actions.SET_EVO_IMPACT_STATUS:
      return { ...state, evoImpactResult: { ...state.evoImpactResult, status: action.status } };
    case actions.SET_PARSER_SETTINGS:
      return { ...state, parserSettings: action.settings };
    case actions.SET_DIFFER_SETTINGS:
      return { ...state, differSettings: action.settings };
    case actions.SET_PARSER:
      {
        const newState = { ...state, parser: action.parser.id };
        if (action.parser !== state.parser) {
          // Update parser settings
          newState.parserSettings =
            fullState.parserSettings[action.parser.id] || null;
        }
        return newState;
      }
    case actions.SET_CODE:
      return { ...state, code: action.code };
    case actions.SELECT_TRANSFORMER:
      {
        const differentParser =
          action.transformer.defaultParserID !== state.parser;
        const differentTransformer =
          action.transformer.id !== state.transform.transformer;

        if (!(differentParser || differentTransformer)) {
          return state;
        }

        const newState = { ...state };

        if (differentParser) {
          newState.parser = action.transformer.defaultParserID;
          newState.parserSettings =
            fullState.parserSettings[action.transformer.defaultParserID] || null;
        }

        if (differentTransformer) {
          const snippetHasDifferentTransform = fullState.activeRevision &&
            fullState.activeRevision.getTransformerID() === action.transformer.id;
          newState.transform = {
            ...state.transform,
            transformer: action.transformer.id,
            code: snippetHasDifferentTransform ?
              state.transform.code :
              action.transformer.defaultTransform,
            initialCode: snippetHasDifferentTransform ?
              fullState.activeRevision.getTransformCode() :
              action.transformer.defaultTransform,
          };
        }

        return newState;
      }
    case actions.SELECT_DIFFER:
      {
        // const differentParser =
        // action.differ.defaultParserID !== state.parser;
        const differentDiffer =
          action.differ.id !== state.diff.differ;

        if (!(differentDiffer)) {
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
          const snippetHasDifferentDiff = fullState.activeRevision && false
          //   fullState.activeRevision.getDifferID() === action.differ.id;

          // console.log(44, snippetHasDifferentDiff, state.diff.code, action.differ.defaultDiff)
          newState2.diff = {
            ...state.diff,
            differ: action.differ.id,
            code: fullState.workbench.diff.code,
            // (snippetHasDifferentDiff ?
            //   (state.diff.code === undefined ? newState2.code : state.diff.code) :
            //   (action.differ.defaultDiff === undefined ? newState2.code : action.differ.defaultDiff)) || "select differ",
            initialCode: snippetHasDifferentDiff ?
              fullState.activeRevision.getDiffCode() :
              action.differ.defaultDiff,
          };
        }

        return newState2;
      }
    case actions.SET_TRANSFORM:
      return {
        ...state,
        transform: {
          ...state.transform,
          code: action.code,
        },
      };
    case actions.SET_OLD:
      return {
        ...state,
        code: action.code || state.code,
        diff: {
          ...state.diff,
          code: action.oldcode || state.diff.code,
        },
      };
    case actions.SET_SNIPPET:
      {
        const { revision } = action;

        const transformerID = revision.getTransformerID();
        // const differID = revision.getDifferID();
        const parserID = revision.getParserID();

        return {
          ...state,
          parser: parserID,
          parserSettings: revision.getParserSettings() || fullState.parserSettings[parserID] || null,
          code: revision.getCode(),
          initialCode: revision.getCode(),// || 'let x = 3',
          transform: {
            ...state.transform,
            transformer: transformerID,
            code: revision.getTransformCode(),
            initialCode: revision.getTransformCode(),
          },
          diff: {
            ...state.diff,
            // differ: differID,
            code: (revision.getDiffCode && revision.getDiffCode()) || state.diff.code || state.code,
            initialCode: (revision.getDiffCode && revision.getDiffCode()),
          },
        };
      }
    case actions.CLEAR_SNIPPET:
    case actions.RESET:
      {
        const reset = Boolean(actions.RESET);
        const newState = {
          ...state,
          parserSettings: fullState.parserSettings[state.parser] || null,
          code: getParserByID(state.parser).category.codeExample,
          initialCode: getParserByID(state.parser).category.codeExample,
        };
        if (fullState.activeRevision && fullState.activeRevision.getTransformerID() || reset && state.transform.transformer) {
          // Clear transform as well
          const transformer = getTransformerByID(state.transform.transformer);
          newState.transform = {
            ...state.transform,
            code: transformer.defaultTransform,
            initialCode: transformer.defaultTransform,
          };
        }
        if (fullState.activeRevision && true /*fullState.activeRevision.getDifferID()*/ || reset && state.diff.differ) {
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
    case actions.SET_KEY_MAP:
      return { ...state, keyMap: action.keyMap };
    default:
      return state;
  }
}

function parserSettings(state = initialState.parserSettings, action, fullState) {
  switch (action.type) {
    case actions.SET_PARSER_SETTINGS:
      if (fullState.activeRevision) {
        // If a revision is loaded, we are **not** storing changes to the
        // settings in our local copy
        return state;
      }
      return {
        ...state,
        [fullState.workbench.parser]: action.settings,
      };
    default:
      return state;
  }
}

function differSettings(state = initialState.differSettings, action, fullState) {
  switch (action.type) {
    case actions.SET_DIFFER_SETTINGS:
      if (fullState.activeRevision) {
        // If a revision is loaded, we are **not** storing changes to the
        // settings in our local copy
        return state;
      }
      return {
        ...state,
        [fullState.workbench.diff.differ]: action.settings,
      };
    default:
      return state;
  }
}

function parserPerCategory(state = initialState.parserPerCategory, action) {
  switch (action.type) {
    case actions.SET_PARSER:
      return { ...state, [action.parser.category.id]: action.parser.id };
    default:
      return state;
  }
}

function showSettingsDialog(state = initialState.showSettingsDialog, action) {
  switch (action.type) {
    case actions.OPEN_SETTINGS_DIALOG:
      return action.payload;
    case actions.CLOSE_SETTINGS_DIALOG:
      return false;
    default:
      return state;
  }
}

function showShareDialog(state = initialState.showShareDialog, action) {
  switch (action.type) {
    case actions.OPEN_SHARE_DIALOG:
      return true;
    case actions.CLOSE_SHARE_DIALOG:
      return false;
    default:
      return state;
  }
}

function loadSnippet(state = initialState.loadingSnippet, action) {
  switch (action.type) {
    case actions.START_LOADING_SNIPPET:
      return true;
    case actions.DONE_LOADING_SNIPPET:
      return false;
    default:
      return state;
  }
}

function loadInstance(state = initialState.loadingInstance, action) {
  switch (action.type) {
    case actions.START_LOADING_INSTANCE:
      return true;
    case actions.DONE_LOADING_INSTANCE:
      return false;
    default:
      return state;
  }
}

function saving(state = initialState.saving, action) {
  switch (action.type) {
    case actions.START_SAVE:
      return !action.fork;
    case actions.END_SAVE:
      return false;
    default:
      return state;
  }
}

function forking(state = initialState.forking, action) {
  switch (action.type) {
    case actions.START_SAVE:
      return action.fork;
    case actions.END_SAVE:
      return false;
    default:
      return state;
  }
}

function cursor(state = initialState.cursor, action) {
  switch (action.type) {
    case actions.SET_CURSOR:
      return action.cursor;
    case actions.SET_CODE:
      // If this action is triggered and the cursor = 0, then the code must be
      // loaded
      if (action.cursor != null && action.cursor !== 0) {
        return action.cursor;
      }
      return state;
    case actions.RESET:
    case actions.SET_SNIPPET:
    case actions.CLEAR_SNIPPET:
      return null;
    default:
      return state;
  }
}

function error(state = initialState.error, action) {
  switch (action.type) {
    case actions.SET_ERROR:
      return action.error;
    case actions.CLEAR_ERROR:
      return null;
    default:
      return state;
  }
}

function showTransformPanel(state = initialState.showTransformPanel, action) {
  switch (action.type) {
    case actions.SELECT_TRANSFORMER:
      return true;
    case actions.HIDE_TRANSFORMER:
    case actions.SELECT_CATEGORY:
    case actions.CLEAR_SNIPPET:
      return false;
    case actions.SET_SNIPPET:
      return Boolean(action.revision.getTransformerID());
    default:
      return state;
  }
}

function showDiffPanel(state = initialState.showDiffPanel, action) {
  switch (action.type) {
    case actions.SELECT_DIFFER:
      return true;
    case actions.HIDE_OLD:
    case actions.SELECT_CATEGORY:
    case actions.CLEAR_SNIPPET:
      return false;
    // case actions.SET_SNIPPET:
    //   return Boolean(action.revision.getDifferID());
    default:
      return state;
  }
}

function activeRevision(state = initialState.selectedRevision, action) {
  switch (action.type) {
    case actions.SET_SNIPPET:
      return action.revision;
    case actions.SELECT_CATEGORY:
    case actions.CLEAR_SNIPPET:
    case actions.RESET:
      return null;
    default:
      return state;
  }
}

function activeInstance(state = initialState.activeInstance, action) {
  switch (action.type) {
    case 'INIT':
    case actions.SET_SNIPPET:
      if (location.search.length > 1) {
        const parsed = query2instance(queryString.parse(location.search));
        return parsed;
      }
    case actions.LOAD_INSTANCE:
      return action.instance || state;
    // case actions.SELECT_CATEGORY:
    // case actions.CLEAR_SNIPPET:
    // case actions.RESET:
    //   return null;
    default:
      return state;
  }
}

function pick(obj, ...properties) {
  return properties.reduce(
    (result, prop) => (result[prop] = obj[prop], result),
    {},
  );
}
