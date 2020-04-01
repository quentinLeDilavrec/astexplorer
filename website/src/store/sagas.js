/*eslint no-constant-condition:0*/

import * as actions from './actions';
import {
  takeEvery,
  take,
  fork,
  join,
  cancel,
  cancelled,
  put,
  select,
  call,
} from 'redux-saga/effects';
import { batchActions } from 'redux-batched-actions';
import { logEvent, logError } from '../utils/logger';
import {
  getParser,
  getParserSettings,
  getCode,
  isSaving,
  isForking,
  getRevision,
  getTransformer,
  getTransformCode,
  showTransformer,
  getDiffResult,
  getDiffer,
  getDiffCode,
  showDiffer,
  getInstance,
  getEvoImpactResult,
  getDifferSettings,
} from './selectors';
import queryString from 'query-string';

function stripImpacts({ perRoot, roots, tests }) {
  return {
    roots, tests
  }
}

function stripEvolutions(evo) {
  return evo
    .map(x =>
      x.refactorings.map(x =>x.type))
}

function* save(fork, storageAdapter) {
  let action = 'new_revision';
  // TODO check this yield []; it might be the caus of warning where we should replace it with yield all([])
  let [
    revision,
    parser,
    parserSettings,
    code,
    transformCode,
    transformer,
    showTransformPanel,
    diffCode,
    minedEvolutions,
    differ,
    differSettings,
    showDiffPanel,
    instance,
    minedEvoImpacts,
  ] = yield [
    select(getRevision),
    select(getParser),
    select(getParserSettings),
    select(getCode),
    select(getTransformCode),
    select(getTransformer),
    select(showTransformer),
    select(getDiffCode),
    select(getDiffResult),
    select(getDiffer),
    select(getDifferSettings),
    select(showDiffer),
    select(getInstance),
    select(getEvoImpactResult),
  ];
  if (fork || !revision) {
    action = fork ? 'fork' : 'create';
  }
  const data = {
    instance: instance,
    settings: {
      [parser.id]: parserSettings,
    },
    versions: {
    },
  };
  // parser
  data.parserID = parser.id;
  data.versions[parser.id] = parser.version;

  if (!instance) {
    data.filename = `source.${parser.category.fileExtension}`
    data.code = code;
  }
  if (showDiffPanel && differ) {
    // differ
    data.mode = 'evolve';
    data.evoMinerID = differ.id;
    data.versions[differ.id] = differ.version;
    data.settings[differ.id] = differSettings;
    if (!instance) {
      data.codeBefore = diffCode;
    }
    data.minedEvolutions = stripEvolutions(minedEvolutions && minedEvolutions.ast);
    data.minedEvoImpacts = stripImpacts(minedEvoImpacts && minedEvoImpacts.graph);
  } else {
    // transformer
    if (showTransformPanel && transformer) {
      data.mode = 'transform';
      data.toolID = transformer.id;
      data.versions[transformer.id] = transformer.version;
      data.transform = transformCode;
    }
  }

  logEvent('snippet', action, data.toolID);

  try {
    let newRevision;
    if (fork) {
      newRevision = yield storageAdapter.fork(revision, data);
    } else if (revision) {
      newRevision = yield storageAdapter.update(revision, data);
    } else {
      newRevision = yield storageAdapter.create(data);
    }
    if (newRevision) {
      storageAdapter.updateHash(newRevision);
    }
  } catch (error) {
    logError(error.message);
    console.error(error);
    yield put(actions.setError(error));
  }
}

function* watchSave(storageAdapter, { fork }) {
  yield put(actions.startSave(fork));
  yield* save(fork, storageAdapter);
  yield put(actions.endSave(fork));
}

let goBackTask = null;

function* goBack() {
  try {
    yield take(actions.CLEAR_ERROR);
    global.location.hash = '';
  } finally {
    if (yield cancelled()) {
      // URL must have been changed while error dialog is open, nothing to do
    }
  }
}

function* watchSnippetURI(storageAdapter) {
  if (goBackTask) {
    yield cancel(goBackTask);
  }

  const [saving, forking] = yield [
    select(isSaving),
    select(isForking),
  ];
  if (saving || forking) {
    return;
  }

  yield put(batchActions([
    actions.setError(null),
    actions.startLoadingSnippet(),
  ]));
  let revision;
  try {
    revision = yield call(storageAdapter.fetchFromURL.bind(storageAdapter));
  } catch (error) {
    console.error(error);
    const errorMessage = 'Failed to fetch revision: ' + error.message;
    logError(errorMessage);

    yield put(batchActions([
      actions.setError(new Error(errorMessage)),
      actions.doneLoadingSnippet(),
    ]));

    if (global.history) {
      /* eslint-disable-next-line require-atomic-updates */
      goBackTask = yield fork(goBack);
    }
    return;
  }

  if (revision) {
    logEvent('snippet', 'load');
  }

  if (location.search.length > 1 && revision.getInstance) {
    const inst = revision.getInstance()
    if (inst) {
      const parsed = queryString.parse(location.search);
      if ((parsed.repo || parsed.before || parsed.after) &&
        (inst.repo !== parsed.repo ||
          inst.commitId !== parsed.commitId ||
          inst.before !== parsed.before ||
          inst.after !== parsed.after)) {
        const errorMessage = 'Failed to instanciate revision,\ninstances parameters in URL don not correspond to values registered in the snippet.';
        console.error(errorMessage);
        logError(errorMessage);

        yield put(batchActions([
          actions.setError(new Error(errorMessage)),
          actions.doneLoadingSnippet(),
        ]));

        if (global.history) {
          /* eslint-disable-next-line require-atomic-updates */
          goBackTask = yield fork(goBack);
        }
        return;
      }
    }
  }

  yield put(batchActions([
    revision ?
      actions.setSnippet(revision) :
      actions.clearSnippet(),
    actions.doneLoadingSnippet(),
  ]));

  if (revision && revision.getInstance && revision.getInstance()) {
    yield put(actions.loadInstance(revision.getInstance()));
  }
}

function* watchClone(coevolutionServiceAdapter, action) {
  // ask server to clone repo
  // return some data about repo structure and metadata (file tree, pom structure)
  console.log("start Cloning", action) // yield put(actions.startCloning());
  console.log("end Cloning", action) // yield put(actions.doneCloning());
}

function* watchImpact(coevolutionServiceAdapter, action) {
  if (action.evolutions) {
    // ask the server to compute impacts caused by evolutions    
  } else {
    // ask server to compute the complete impact graph (correspond to preparing ast then getting all impacts)
    // return the complete impact graph 
  }
}

function* watchEvo(coevolutionServiceAdapter, action) {
  // ask server to compute the evolutions
  // return evolutions
}

// TODO need a clever server (splitting queries)
const FRAGMENTED = false;

function* watchInstance(coevolutionServiceAdapter, action) { // it does not use gist things
  yield put(actions.startLoadingInstance());

  // START can be parallele
  const defaultImpactSettings = {
    // impacts: true, // all impacts available
    // impacts: undefined, // all default impacts
    impacts: {
      call: true,
      type: false,
      values: false,
    }
  }

  const defaultEvoSettings = {
    // evolutions: true, // all evolutions available
    // evolutions: undefined, // all default evolutions
    evolutions: {
      "Move Method": true,
    }
  }

  if (FRAGMENTED) {
    yield* watchClone(coevolutionServiceAdapter);

    // yield* watchImpact(coevolutionServiceAdapter, { defaultImpactSettings, ...action, });
    // yield* watchEvo(coevolutionServiceAdapter, { defaultEvoSettings, ...action, });

    const impactTask = yield fork(watchImpact, coevolutionServiceAdapter, { defaultImpactSettings, ...action, });
    const evoTask = yield fork(watchImpact, coevolutionServiceAdapter, { defaultEvoSettings, ...action, });
    const res1 = yield join(impactTask, evoTask);

    // END can be parallele

    const res2 = yield* watchImpact(coevolutionServiceAdapter, {
      ...defaultImpactSettings,
      ...defaultEvoSettings,
      ...action,
    });

  } else {
    // NEXT for now should return current RefMiner differ results, later il will hand over to framented or return same results merged into one request (should be better for cases were it does not clone repo)
    const inst = yield select(getInstance)
  }
  yield put(actions.doneLoadingInstance());
}

export default function* (storageAdapter, coevolutionServiceAdapter) {
  // TODO check for cause of warning: [...effects] has been deprecated in favor of all([...effects]), please update your code 
  yield takeEvery(actions.LOAD_SNIPPET, watchSnippetURI, storageAdapter);
  yield takeEvery(actions.LOAD_INSTANCE, watchInstance, coevolutionServiceAdapter);
  // yield takeEvery(actions.LOAD_REPO, whatchClone, coevolutionServiceAdapter);
  // yield takeEvery(actions.LOAD_FILE, whatchFile, coevolutionServiceAdapter);
  // yield takeEvery(actions.LOAD_EVO, watchEvo, coevolutionServiceAdapter);
  // yield takeEvery(actions.LOAD_CALLGRAPH, watchCallGraph, coevolutionServiceAdapter);
  // yield takeEvery(actions.LOAD_IMPACT, watchImpact, coevolutionServiceAdapter);
  yield takeEvery(actions.SAVE, watchSave, storageAdapter);
}
