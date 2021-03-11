import {connect} from 'react-redux';
import ErrorMessage from '../components/ErrorMessage';
import actions from '../store/actions';
import {getError} from '../store/selectors';

function mapStateToProps(state) {
  return {
    error: getError(state),
  };
}


function mapDispatchToProps(dispatch) {
  return {
    onWantToClose: () => dispatch(actions['Error/clear']()),
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(ErrorMessage);
