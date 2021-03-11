import {connect} from 'react-redux';
import actions from '../store/actions';
import Editor from '../components/Editor';
import {getCode, getParser, getParseResult, getKeyMap} from '../store/selectors';

function mapStateToProps(state) {
  debugger
  return {
    keyMap: getKeyMap(state),
    value: getCode(state),
    mode: getParser(state).category.editorMode || getParser(state).category.id,
    error: (getParseResult(state) || {}).error,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    onContentChange: ({value, cursor}) => {
      dispatch(actions['setCode']({code: value, cursor}));
    },
    onActivity: cursor => dispatch(actions['Cursor/set'](cursor)),
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(Editor);