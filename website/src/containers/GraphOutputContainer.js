import {connect} from 'react-redux';
import GraphOutput from '../components/GraphOutput';
import {setCursor} from '../store/actions';

function mapStateToProps(state) {
  return {
  };
}

function mapDispatchToProps(dispatch) {
  return {
    onSelection: cursor => dispatch(setCursor(cursor)),
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(GraphOutput);