import {connect} from 'react-redux';
import DiffOutput from '../components/DiffOutput';
import * as selectors from '../store/selectors';

function mapStateToProps(state) {
  return {
    // parseResult: selectors.getParseResult(state),
    position: selectors.getCursor(state),

    differ: selectors.getDiffer(state),
    // Either the transform example or the transform code from the current
    // revision. This is what we compare against to determine whether something
    // changed and we can save.
    oldCode: selectors.getDiffCode(state),
    diffAST: selectors.getDiffResult(state),
    code: selectors.getCode(state),
  };
}

export default connect(mapStateToProps)(DiffOutput);
