import { createSelector } from 'reselect';
import isEqual from 'lodash.isequal';
import { getParserByID, getTransformerByID, getDifferByID } from '../parsers';
import { State } from "./reducers";

// UI related

export function getFormattingState(state:State) {
  return state.enableFormatting;
}

export function getCursor(state:State) {
  return state.cursor;
}

export function getError(state:State) {
  return state.error;
}

export function isLoadingSnippet(state:State) {
  return state.loadingSnippet;
}

export function isLoadingInstance(state:State) {
  return state.loadingInstance;
}

export function showSettingsDialog(state:State) {
  return state.showSettingsDialog;
}

export function showShareDialog(state:State) {
  return state.showShareDialog;
}

export function isForking(state:State) {
  return state.forking;
}

export function isSaving(state:State) {
  return state.saving;
}

// Parser related

export function getParser(state:State) {
  return getParserByID(state.workbench.parser);
}

export function getParserSettings(state:State) {
  return state.workbench.parserSettings;
}


export function getParseResult(state:State) {
  return state.workbench.parseResult;
}

// Code related
export function getRevision(state:State) {
  return state.activeRevision;
}

export function getCode(state:State) {
  return state.workbench.code;
}

export function getInitialCode(state:State) {
  return state.workbench.initialCode;
}

export function getKeyMap(state:State) {
  return state.workbench.keyMap;
}


const isCodeDirty = createSelector(
  [getCode, getInitialCode],
  (code, initialCode) => code !== initialCode,
);

// Transform related

export function getTransformCode(state:State) {
  return state.workbench.transform.code;
}

export function getInitialTransformCode(state:State) {
  return state.workbench.transform.initialCode;
}

export function getTransformer(state:State) {
  return getTransformerByID(state.workbench.transform.transformer);
}

export function showTransformer(state:State) {
  return state.showTransformPanel;
}

const isTransformDirty = createSelector(
  [getTransformCode, getInitialTransformCode],
  (code, initialCode) => code !== initialCode,
);

export const canFork = createSelector(
  [getRevision],
  (revision) => !!revision,
);

const canSaveCode = createSelector(
  [getRevision, isCodeDirty],
  (revision, dirty) => (
    !revision || // can always save if there is no revision
    dirty
  ),
);

export const canSaveTransform = createSelector(
  [showTransformer, isTransformDirty],
  (showTransformer, dirty) => showTransformer && dirty,
);

const didParserSettingsChange = createSelector(
  [getParserSettings, getRevision, getParser],
  (parserSettings, revision, parser) => {
    const savedParserSettings = revision && revision.getParserSettings();
    return (
      !!revision &&
      (
        parser.id !== revision.getParserID() ||
        !!savedParserSettings && !isEqual(parserSettings, savedParserSettings)
      )
    )

  },
);

// Diff related

export function getDiffResult(state:State) {
  return state.workbench.diffResult;
}

export function getSelectedEvolutionsIds(state:State) {
  const diff = getDiffResult(state)
  switch (diff.status) {
    case 'done': {
      return diff.selectedEvos
    }
    default:
      return []
  }
}

export function getEvoImpactResult(state:State) {
  return state.workbench.evoImpactResult;
}

export function getDiffCode(state:State) {
  return state.workbench.diff.code;
}

export function getInitialDiffCode(state:State) {
  return state.workbench.diff.initialCode;
}

export function getDiffStatus(state:State) {
  return (state.workbench.diffResult &&
    state.workbench.diffResult.status);
}

export function getEvoImpactStatus(state:State) {
  return (state.workbench.evoImpactResult &&
    state.workbench.evoImpactResult.status);
}

export function getDiffer(state:State) {
  return getDifferByID(state.workbench.diff.differ);
}

export function showDiffer(state:State) {
  return state.showDiffPanel;
}

export function getDifferSettings(state:State) {
  return state.workbench.diff.differSettings;
}

const didDifferSettingsChange = createSelector(
  [getDifferSettings, getRevision, getDiffer],
  (differSettings, revision, differ) => {
    const savedDifferSettings = revision && revision.getDifferSettings && revision.getDifferSettings();
    return (
      !!revision &&
      (
        (revision.getDifferID &&
          differ.id !== revision.getDifferID()) ||
        !!savedDifferSettings && !isEqual(differSettings, savedDifferSettings)
      )
    )

  },
);

const isDiffDirty = createSelector(
  [getDiffCode, getInitialDiffCode, isCodeDirty],
  (code, initialCode, codeDirty) => code !== initialCode || codeDirty,
);

export const canSaveDiff = createSelector(
  [showDiffer, isDiffDirty],
  (showDiffer, dirty) => showDiffer && dirty,
);

export function getInstance(state:State) {
  return state.activeInstance;
}

// save related
export const canSave = createSelector(
  [getRevision, canSaveCode, canSaveTransform, canSaveDiff, didParserSettingsChange, didDifferSettingsChange],
  (revision, canSaveCode, canSaveTransform, canSaveDiff, didParserSettingsChange, didDifferSettingsChange) => (
    (canSaveCode || canSaveTransform || canSaveDiff || didParserSettingsChange || didDifferSettingsChange) &&
    (!revision || revision.canSave())
  ),
);

export function getSelectedImpactedRanges(state:State) {
  const imps = getEvoImpactResult(state)
  switch (imps.status) {
    case 'done': {
      return imps.selectedImpacted || {}
    }
    default:
      return {}
  }
}
