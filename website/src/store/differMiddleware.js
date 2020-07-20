// @ts-check
import { getDifferSettings, getCode, getDiffer, getDiffCode, getInstance } from './selectors';
import { ignoreKeysFilter, locationInformationFilter, functionFilter, emptyKeysFilter, typeKeysFilter } from '../core/TreeAdapter.js';
import { SET_CURSOR, SET_DIFF_RESULT } from './actions';
import * as actions from './actions';
import RemoteDifferService from '../coevolutionService/differ';
import RemoteEvolutionService from '../coevolutionService/evolution';
import RemoteImpactService from '../coevolutionService/impact';

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

async function diff2(differ, { instance, oldcode = null, newCode = null }, differSettings) {
  if (instance) {
    const param = {
      repo: instance.repo,
      commitIdAfter: instance.commitIdAfter,
      cases: instance.cases,
      settings: differSettings || differ.getDefaultOptions(),
    }
    debugger
    if (instance.commitIdBefore)
      param.commitIdBefore = instance.commitIdBefore
    return {
      evolutionP: RemoteEvolutionService(differ, param),
      impactP: RemoteImpactService(differ, param),
    }
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
      const errorHandler =
        (/** @type Error */ error) => {
          console.error(error); // eslint-disable-line no-console
          next(actions.setDiffStatus('error'));
          next(actions.setEvoImpactStatus('error'));
          next(
            actions.setDiffResult({ error })
          );
        }
      return diff2(newDiffer, { instance: newInstance }, newDifferSettings).then(
        // return diff(newDiffer, newCodeBefore, newCode, newDifferSettings).then(
        ({ evolutionP, impactP }) => {
          const treeAdaptAnduptDetect = () => {
            // Did anything change in the meantime?
            const newnewstate = store.getState()
            if (newDiffer.id !== getDiffer(newnewstate).id ||
              newDifferSettings !== getDifferSettings(newnewstate) ||
              compareInstances(getInstance(newnewstate), newInstance)) {
              return null;
            }
            if (!getInstance(newnewstate)) {
              if (newDiffer !== getDiffer(newnewstate) ||
                newDifferSettings !== getDifferSettings(newnewstate)) {
                return null;
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
            return treeAdapter
          };
          evolutionP.then(x => {
            next(actions.setDiffStatus('received'));
            const treeAdapter = treeAdaptAnduptDetect()
            if (treeAdapter !== null) {
              next(
                actions.setDiffResult({ time: Date.now() - start, diff: x.value, treeAdapter })
              );

            }
          }, errorHandler)
          impactP.then(x => {
            next(actions.setEvoImpactStatus('received'));
            const treeAdapter = treeAdaptAnduptDetect()
            if (treeAdapter !== null) {
              next(
                actions.setEvoImpactResult({ time: Date.now() - start, impact: x.value, treeAdapter, uuid: x.uuid })
              );
            }
          }, errorHandler)
        }, errorHandler,
      );
    }
  }

};
