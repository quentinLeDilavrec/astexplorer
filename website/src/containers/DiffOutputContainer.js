import { connect } from 'react-redux';
import DiffOutput from '../components/DiffOutput';
import * as selectors from '../store/selectors';

function mapStateToProps(state) {
  return {
    // parseResult: selectors.getParseResult(state),
    position: selectors.getCursor(state),
    status: selectors.getDiffStatus(state),
    differ: selectors.getDiffer(state),
    diffAST: selectors.getDiffResult(state),
  };
}

export default connect(mapStateToProps)(DiffOutput);
