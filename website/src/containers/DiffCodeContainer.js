import {connect} from 'react-redux';
import {setOldState, setCursor} from '../store/actions';
import DiffEditor from '../components/DiffEditor';
import {getDiffCode, getParser, getParseResult, getKeyMap, getCode} from '../store/selectors';

function mapStateToProps(state) {
  console.log(44,getDiffCode(state),getCode(state));
  return {
    keyMap: getKeyMap(state),
    value: 'class NewName {}',//getCode(state),
    oldvalue: 'class OldName {}',//+getDiffCode(state),
    mode: getParser(state).category.editorMode || getParser(state).category.id,
    error: (getParseResult(state) || {}).error,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    onContentChange: ({value, oldvalue, cursor}) => {
      console.log('oncontentchange', {value, oldvalue, cursor}) 
      dispatch(setOldState({code: value, oldcode: oldvalue, cursor}));
    },
    onActivity: cursor => dispatch(setCursor(cursor)),
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(DiffEditor);
