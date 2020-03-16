import { connect } from 'react-redux';
import { setOldState, setCursor } from '../store/actions';
import DiffEditor from '../components/DiffEditor';
import { getDiffCode, getParser, getParseResult, getKeyMap, getCode } from '../store/selectors';

function mapStateToProps(state) {
  return {
    keyMap: getKeyMap(state),
    value: getCode(state),
    oldvalue: getDiffCode(state),
    mode: getParser(state).category.editorMode || getParser(state).category.id,
    error: (getParseResult(state) || {}).error,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    onContentChange: ({ value, oldvalue, cursor, side }) => {
      console.log('oncontentchange', { aa: (value === oldvalue), cursor })
      const o = { cursor, side };
      oldvalue && (o.oldcode = oldvalue);
      value && (o.code = value);
      dispatch(setOldState(o));
    },
    onActivity: (cursor) => dispatch(setCursor(cursor)),
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(DiffEditor);
