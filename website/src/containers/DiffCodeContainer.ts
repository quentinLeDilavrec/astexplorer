import { connect, ConnectedProps } from 'react-redux';
import actions from '../store/actions';
import DiffEditor from '../components/DiffEditor';
import { getDiffCode, getParser, getParseResult, getKeyMap, getCode, getSelectedEvolutionsIds, getDiffResult } from '../store/selectors';
import { State } from '../store/reducers';
import { Action, Dispatch } from 'redux';

function mapStateToProps(state: State) {
  return {
    keyMap: getKeyMap(state),
    value: getCode(state),
    oldvalue: getDiffCode(state),
    mode: getParser(state).category.editorMode || getParser(state).category.id,
    error: (getParseResult(state) || {}).error,
    selectedEvolutions: getSelectedEvolutionsIds(state),
    getEvolution: (id: number) => {
      const ast = getDiffResult(state).ast
      return ast && ast[id]
    },
  };
}

function mapDispatchToProps(dispatch: Dispatch<Action>) {
  return {
    onContentChange: ({ value, oldvalue, cursor, side }) => {
      console.log('oncontentchange', { aa: (value === oldvalue), cursor })
      const o = { cursor, side, oldcode:oldvalue, code: value };
      // oldvalue && ((o as any).oldcode = oldvalue);
      // value && ((o as any).code = value);
      dispatch(actions['setOld'](o));
    },
    onActivity: (cursor) => dispatch(actions['Cursor/set'](cursor)),
  };
}

const connector = connect(mapStateToProps, mapDispatchToProps)

export type PT = ConnectedProps<typeof connector>

export default connector(DiffEditor);
