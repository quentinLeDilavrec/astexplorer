import { getParser, getParserSettings, getCode, getDiffer, getDiffCode } from './selectors';
import { ignoreKeysFilter, locationInformationFilter, functionFilter, emptyKeysFilter, typeKeysFilter } from '../core/TreeAdapter.js';

const cancels = []

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

export default store => next => action => {
  const oldState = store.getState();
  next(action);
  const newState = store.getState();

  if (!newState.showDiffPanel) {
    const newParserSettings = getParserSettings(newState);
    const newCode = getCode(newState);
    const newParser = getParser(newState);
    if (
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
  }
};
