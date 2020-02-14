import {connect} from 'react-redux';
import {setCode, setCursor} from '../store/actions';
// import Editor from '../components/Editor';
// import MonacoEditor from 'react-monaco-editor';
import MyEditor from '../components/MirrorMonacoEditor';

import {getCode, getParser, getParseResult, getKeyMap} from '../store/selectors';

function mapStateToProps(state) {
  debugger
  return {
    keyMap: getKeyMap(state),
    value: getCode(state),// || 'let x = 5',
    mode: getParser(state).category.editorMode || getParser(state).category.id,
    error: (getParseResult(state) || {}).error,

    // language:"javascript", // mode: getParser(state).category.editorMode || getParser(state).category.id
    // theme:"vs-dark",
    // code:getCode(state),
    // // options={options},
    // // onChange={this._onContentChange},
    // // editorDidMount={this.editorDidMount},
    // // keyMap: getKeyMap(state),
    // // error: (getParseResult(state) || {}).error,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    onContentChange: ({code, cursor}) => {
      dispatch(setCode({code: code, cursor}));
    },
    onActivity: cursor => dispatch(setCursor(cursor)),
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(MyEditor);