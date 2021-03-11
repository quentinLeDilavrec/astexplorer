import {connect} from 'react-redux';
import actions from '../store/actions';
import {showShareDialog, getRevision} from '../store/selectors';
import ShareDialog from '../components/dialogs/ShareDialog';

function mapStateToProps(state) {
  return {
    visible: showShareDialog(state),
    snippet: getRevision(state),
  };
}

function mapDispatchToProps(dispatch) {
  return {
    onWantToClose: () => dispatch(actions.closeShareDialog()),
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(ShareDialog);
