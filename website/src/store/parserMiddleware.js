import {getParser, getParserSettings, getCode, getDiffer, getDiffCode} from './selectors';
import {ignoreKeysFilter, locationInformationFilter, functionFilter, emptyKeysFilter, typeKeysFilter} from '../core/TreeAdapter.js';

function parse(parser, code, parserSettings) {
  if (!parser._promise) {
    parser._promise = new Promise(parser.loadParser);
  }
  return parser._promise.then(
    realParser => parser.parse(
      realParser,
      code,
      parserSettings || parser.getDefaultOptions(),
    ),
  );
}

function diff(differ, oldCode, newCode, parserSettings) {
  if (!differ._promise) {
    differ._promise = new Promise(differ.loadDiffer);
  }
  return differ._promise.then(
    realDiffer => differ.diff(
      realDiffer,
      oldCode,
      newCode,
      // parserSettings || differ.getDefaultOptions(), // TODO add settings
    ),
  );
}

export default store => next => action => {
  const oldState = store.getState();
  next(action);
  const newState = store.getState();

  const newParser = getParser(newState);
  const newParserSettings = getParserSettings(newState);
  const newCode = getCode(newState);
  const newDiffer = getDiffer(newState);
  const oldCode = getDiffCode(newState);

  
  if (
    oldState.showDiffPanel &&
    (action.type === 'INIT' ||
    getParser(oldState) !== newDiffer ||
    getParserSettings(oldState) !== newParserSettings ||
    getCode(oldState) !== newCode)
  ) {
    if (!newDiffer || newCode == null) {
      return;
    }
    const start = Date.now();
    return diff(newDiffer, oldCode, newCode, newParserSettings).then(
      ast => {
        // Did anything change in the meantime?
        const cond = newDiffer !== getParser(store.getState()) ||
          newParserSettings !== getParserSettings(store.getState()) ||
          newCode !== getCode(store.getState())
        if (false && cond) { // TODO modify it

          return;
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
        next({
          type: 'SET_DIFF_RESULT', // TODO duplicate into diffMidleware?
          result: {
            time: Date.now() - start,
            ast: ast,
            error: null,
            treeAdapter,
          },
        });
      },
      error => {
        console.error(error); // eslint-disable-line no-console
        next({
          type: 'SET_DIFF_RESULT',
          result: {
            time: null,
            ast: null,
            treeAdapter: null,
            error,
          },
        });
      },
    );
  } else if (
    action.type === 'INIT' ||
    getParser(oldState) !== newParser ||
    getParserSettings(oldState) !== newParserSettings ||
    getCode(oldState) !== newCode
  ) {
    if (!newParser || newCode == null) {
      return;
    }
    const start = Date.now();
    return parse(newParser, newCode, newParserSettings).then(
      ast => {
        // Did anything change in the meantime?
        if (
          newParser !== getParser(store.getState()) ||
          newParserSettings !== getParserSettings(store.getState()) ||
          newCode !== getCode(store.getState())
        ) {
          return;
        }
        // Temporary adapter for parsers that haven't been migrated yet.
        const treeAdapter = {
          type: 'default',
          options: {
            openByDefault: (newParser.opensByDefault || (() => false)).bind(newParser),
            nodeToRange: newParser.nodeToRange.bind(newParser),
            nodeToName: newParser.getNodeName.bind(newParser),
            walkNode: newParser.forEachProperty.bind(newParser),
            filters: [
              ignoreKeysFilter(newParser._ignoredProperties),
              functionFilter(),
              emptyKeysFilter(),
              locationInformationFilter(newParser.locationProps),
              typeKeysFilter(newParser.typeProps),
            ],
          },
        };
        next({
          type: 'SET_PARSE_RESULT', // TODO duplicate into diffMidleware?
          result: {
            time: Date.now() - start,
            ast: ast,
            error: null,
            treeAdapter,
          },
        });
      },
      error => {
        console.error(error); // eslint-disable-line no-console
        next({
          type: 'SET_PARSE_RESULT',
          result: {
            time: null,
            ast: null,
            treeAdapter: null,
            error,
          },
        });
      },
    );
  }

};
