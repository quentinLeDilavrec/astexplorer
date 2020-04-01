import { connect } from 'react-redux';
import GraphOutput from '../components/GraphOutput';
import { setCursor } from '../store/actions';
import * as selectors from '../store/selectors';
import { data_spoon as data } from './data'

function mapStateToProps(state) {
  const tmp = selectors.getEvoImpactResult(state)
  return {
    result: {
      graph: JSON.parse(JSON.stringify((tmp && tmp.graph) || data)),
      time: tmp && tmp.time,
      error: tmp && tmp.error,
      status: tmp && tmp.status,
    },
    status: selectors.getEvoImpactStatus(state),
  }
}

function mapDispatchToProps(dispatch) {
  return {
    onSelection: cursor => dispatch(setCursor(cursor)),
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(GraphOutput);