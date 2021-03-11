import { connect, ConnectedProps, MapStateToProps } from 'react-redux';
import {default as DiffOutput} from '../components/DiffOutput';
import * as selectors from '../store/selectors';
import actions from '../store/actions';
import React, { Dispatch } from 'react';
import { Action } from 'redux-actions';

/**
 * 
 * @param {import('../store/reducers').State} state 
 */
function mapStateToProps(state) {
  return {
    // parseResult: selectors.getParseResult(state),
    position: selectors.getCursor(state),
    status: selectors.getDiffStatus(state),
    differ: selectors.getDiffer(state),
    diffAST: selectors.getDiffResult(state),
    selectedEvos: selectors.getSelectedEvolutionsIds(state),
  };
}

function mapDispatchToProps(dispatch: Dispatch<Action<any>>) {
  return {
    onToggleEvo: (/** @type {number} */id) => {
      dispatch(actions['Evolutions/Status/Selected/toggle'](id));
    },
  };
}

const connector = connect(mapStateToProps, mapDispatchToProps)

export type PT = ConnectedProps<typeof connector> // ReturnType<typeof mapStateToProps> & ReturnType<typeof mapDispatchToProps>//

export default connector<(p:PT)=>JSX.Element>(DiffOutput);