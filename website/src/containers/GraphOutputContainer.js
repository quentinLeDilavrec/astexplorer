import { connect } from 'react-redux';
import GraphOutput from '../components/GraphOutput';
import { setCursor } from '../store/actions';
import * as selectors from '../store/selectors';
import { data_graphhopper as data } from './data'

function mapStateToProps(state) {
  const tmp = selectors.getEvoImpactResult(state)
  return {
    result: {
      graph: (tmp && tmp.graph) || data,
      time: tmp && tmp.time,
      error: tmp && tmp.error,
      status: tmp && tmp.status,
    },
    uuid: tmp.uuid,
    status: selectors.getEvoImpactStatus(state),
  }
}

function mapDispatchToProps(dispatch) {
  return {
    onSelection: cursor => dispatch(setCursor(cursor)),
    returnScreenShot: svg => {
      const type = "image/svg+xml"
      let file = new Blob([svg], {type});
      let a = document.createElement("a"),
        url = URL.createObjectURL(file);
      a.href = url;
      a.download = "graph.svg";
      document.body.appendChild(a);
      a.click();
      setTimeout(function () {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 0);
    },
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(GraphOutput);