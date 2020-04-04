import { getDifferSettings, getCode, getDiffer, getDiffCode, getInstance } from './selectors';
import { ignoreKeysFilter, locationInformationFilter, functionFilter, emptyKeysFilter, typeKeysFilter } from '../core/TreeAdapter.js';
import { SET_CURSOR, SET_DIFF_RESULT } from './actions';
import * as actions from './actions';
import RemoteDifferService from '../coevolutionService/differ';

function diff(differ, oldCode, newCode, differSettings) {
  if (!differ._promise) {
    differ._promise = new Promise(differ.loadDiffer);
  }
  return differ._promise.then(
    realDiffer => differ.diff(
      realDiffer,
      oldCode,
      newCode,
      differSettings || differ.getDefaultOptions(),
    ),
  );
}

function diff2(differ, { instance, oldcode, newCode }, differSettings) {
  debugger
  if (instance) {
    return RemoteDifferService(differ, {
      repo: instance.repo,
      commitIdBefore: instance.before,
      commitIdAfter: instance.after,
      settings: differSettings || differ.getDefaultOptions(),
    })
  } else {
    throw new Error("no instance differ not implemented yet")
  }
}

function compareInstances(i1, i2) {
  // const keys = new Set([...Object.keys(i1),...Object.keys(i2)])
  // for (const key of keys) {
  //   if (i1[key]!==i2[key]) {
  //     return false
  //   }
  // }
  // return true
  return (i1.repo !== i2.repo ||
    i1.before !== i2.before ||
    i1.after !== i2.after)
}

export default store => next => action => {
  const oldState = store.getState();
  next(action);
  if (action.type === actions.SET_CURSOR &&
    action.type === actions.SET_EVO_IMPACT_STATUS &&
    action.type === actions.SET_DIFF_STATUS) {
    return;
  }
  const newState = store.getState();

  if (newState.showDiffPanel) {
    const newDifferSettings = getDifferSettings(newState);
    const newCode = getCode(newState);
    const newDiffer = getDiffer(newState);
    const newInstance = getInstance(newState);
    const newCodeBefore = getDiffCode(newState);
    if (
      action.type === 'INIT' ||
      getDiffer(oldState).id !== newDiffer.id ||
      getDifferSettings(oldState) !== newDifferSettings ||
      compareInstances(getInstance(oldState), newInstance) ||
      (!newInstance &&
        (getCode(oldState) !== newCode ||
          getDiffCode(oldState) !== newCodeBefore))
    ) {
      if (!newDiffer || newCode == null) {
        return;
      }
      if (!newDiffer || newInstance == null) {
        return;
      }
      next(actions.setDiffStatus('started'));
      next(actions.setEvoImpactStatus('started'));
      const start = Date.now();
      return diff2(newDiffer, { instance: newInstance }, newDifferSettings).then(
        // return diff(newDiffer, newCodeBefore, newCode, newDifferSettings).then(
        json => {
          next(actions.setDiffStatus('received'));
          next(actions.setEvoImpactStatus('received'));
          // Did anything change in the meantime?
          const newnewstate = store.getState()
          if (newDiffer.id !== getDiffer(newnewstate).id ||
            newDifferSettings !== getDifferSettings(newnewstate) ||
            compareInstances(getInstance(newnewstate), newInstance)) {
            return;
          }
          if (!getInstance(newnewstate)) {
            if (newDiffer !== getDiffer(newnewstate) ||
              newDifferSettings !== getDifferSettings(newnewstate)) {
              return;
            }
          }
          // Temporary adapter for parsers that haven't been migrated yet.
          const treeAdapter = {
            type: 'default',
            options: {
              openByDefault: (newDiffer.opensByDefault || (() => false)).bind(newDiffer),
              nodeToRange: newDiffer.nodeToRange.bind(newDiffer),
              nodeToName: newDiffer.getNodeName.bind(newDiffer),
              walkNode: newDiffer.forEachProperty.bind(newDiffer),
              filters: [
                ignoreKeysFilter(newDiffer._ignoredProperties),
                functionFilter(),
                emptyKeysFilter(),
                locationInformationFilter(newDiffer.locationProps),
                typeKeysFilter(newDiffer.typeProps),
              ],
            },
          };
          next(
            actions.setDiffResult({ time: Date.now() - start, diff: json.diff, treeAdapter })
          );
          next(
            actions.setEvoImpactResult({ time: Date.now() - start, impact: json.impact, treeAdapter, uuid:json.uuid })
          );
        },
        (/** @type Error */ error) => {
          console.error(error); // eslint-disable-line no-console
          next(actions.setDiffStatus('error'));
          next(actions.setEvoImpactStatus('error'));
          next(
            actions.setDiffResult({ error })
          );
        },
      );
    }
  }

};
