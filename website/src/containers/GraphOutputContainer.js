import { connect } from 'react-redux';
import GraphOutput from '../components/GraphOutput';
import { setCursor } from '../store/actions';
import * as selectors from '../store/selectors';
import { data_spoon as data } from './data'

function mapStateToProps(state) {
  const tmp = selectors.getEvoImpactResult(state)
  const tmp2 = selectors.getDiffResult(state)
  const tmp3 = selectors.getInstance(state)
  let graph = undefined
  if (tmp2 && tmp2.ast && tmp3 && tmp3.commitIdAfter && tmp3.commitIdBefore && tmp && tmp.graph) {
    graph = { ...(tmp && tmp.graph) || data, evolutions: tmp2 && tmp2.ast, commitIdAfter: tmp3 && tmp3.commitIdAfter, commitIdBefore: tmp3 && tmp3.commitIdBefore }
  }
  return {
    ...((tmp2 && tmp2.ast) ? { evolutions: tmp2 && tmp2.ast } : {}),
    ...((tmp3 && tmp3.commitIdAfter && tmp3.commitIdBefore) ? {
      commitIdAfter: tmp3 && tmp3.commitIdAfter,
      commitIdBefore: tmp3 && tmp3.commitIdBefore,
    } : {}),

    result: {
      graph,
      time: graph && tmp && tmp.time,
      error: graph && tmp && tmp.error,
      status: graph && tmp && tmp.status,
    },
    uuid: graph && tmp.uuid,
    status: selectors.getEvoImpactStatus(state),
  }
}

function mapDispatchToProps(dispatch) {
  return {
    onSelection: cursor => dispatch(setCursor(cursor)),
    returnScreenShot: svg => {
      const type = "image/svg+xml"
      let file = new Blob([svg], { type });
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