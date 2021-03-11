import {connect} from 'react-redux';
import PasteDropTarget from '../components/PasteDropTarget';
import actions from '../store/actions';

function mapDispatchToProps(dispatch) {
  return {
    onText: (type, event, code, categoryId) => {
      dispatch(actions.dropText(code, categoryId));
    },
    onError: error => dispatch(actions['Error/set'](error)),
  };
}

export default connect(null, mapDispatchToProps)(PasteDropTarget);
