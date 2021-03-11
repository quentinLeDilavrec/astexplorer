import { connect, ConnectedProps } from "react-redux";
import { batchActions } from "redux-batched-actions";
import GraphOutput from "../components/GraphOutput";
import { Range } from "../components/MultiEditor2";
import actions from "../store/actions";
import * as selectors from "../store/selectors";
import { data_spoon as data } from "./data";

function mapStateToProps(state) {
  const tmp = selectors.getEvoImpactResult(state);
  const tmp2 = selectors.getDiffResult(state);
  const tmp3 = selectors.getInstance(state);

  function makeGraph() {
    if (
      tmp2 &&
      tmp2.ast &&
      tmp3 &&
      tmp3.commitIdAfter &&
      tmp3.commitIdBefore &&
      tmp &&
      tmp.graph
    ) {
      return {
        ...((tmp && tmp.graph) || data),
        evolutions: tmp2 && tmp2.ast,
        commitIdAfter: tmp3 && tmp3.commitIdAfter,
        commitIdBefore: tmp3 && tmp3.commitIdBefore,
      };
    }
  }
  const graph = makeGraph();
  return {
    ...(tmp2 && tmp2.ast ? { evolutions: tmp2 && tmp2.ast } : {}),
    ...(tmp3 && tmp3.commitIdAfter && tmp3.commitIdBefore
      ? {
          commitIdAfter: tmp3 && tmp3.commitIdAfter,
          commitIdBefore: tmp3 && tmp3.commitIdBefore,
        }
      : {}),
    position: null,
    result: {
      graph,
      time: graph && tmp && tmp.time,
      error: graph && tmp && tmp.error,
      status: graph && tmp && tmp.status,
    },
    uuid: graph && tmp.uuid,
    status: selectors.getEvoImpactStatus(state),
    getSelectedEvolutionsIds: () => selectors.getSelectedEvolutionsIds(state),
    getSelectedImpactedRanges: () => selectors.getSelectedImpactedRanges(state),
  };
}

function mapDispatchToProps(
  dispatch: import("react").Dispatch<import("redux").Action>
) {
  return {
    onSelection: (x: {
      impactedRanges: { [k: string]: Range };
      selectedEvolutionIds: Set<number>;
      cursor: Range;
    }) =>
      dispatch(
        batchActions([
          actions["Evolutions/Status/Selected/reset"](),
          actions["Impacts/Status/Selected/reset"](),
          actions["Cursor/set"](x.cursor),
          actions["Evolutions/Status/Selected/enable"](
            ...Array.from(x.selectedEvolutionIds)
          ),
          actions["Impacts/Status/Selected/add"](x.impactedRanges),
        ])
      ),
    // onSelection: cursor => dispatch(actions['Cursor/set'](cursor)),
  };
}

const connector = connect(mapStateToProps, mapDispatchToProps);
export type PT = ConnectedProps<typeof connector>;
/// @ts-ignore
export default connector(GraphOutput);
