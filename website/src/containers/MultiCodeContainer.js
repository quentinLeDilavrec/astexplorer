import { connect } from 'react-redux';
import { setOldState, setCursor } from '../store/actions';
import MultiEditor from '../components/MultiEditor';
import { getDiffCode, getParser, getParseResult, getKeyMap, getCode } from '../store/selectors';

function mapStateToProps(state) {
  const mode = getParser(state).category.editorMode || getParser(state).category.id;

  return {
    keyMap: getKeyMap(state),
    value: {
      type: "move",
      what: "method",
      from: { repo: window.currentTarget.repo, commitId: window.currentTarget.commitIdBefore, path: "src/main/java/spoon/refactoring/Refactoring.java", start: 1, end: 2 },
      to: { repo: window.currentTarget.repo, commitId: window.currentTarget.commitIdAfter, path: "src/main/java/spoon/refactoring/Refactoring.java", start: 1, end: 2 },
      impacts: [
        { repo: window.currentTarget.repo, commitId: window.currentTarget.commitIdBefore, path: "/src/test/java/spoon/test/refactoring/RefactoringTest.java", start: 10, end: 12 }
      ]
    },//getCode(state),
    mode: mode,
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

export default connect(mapStateToProps, mapDispatchToProps)(MultiEditor);
