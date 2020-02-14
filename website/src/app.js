import * as LocalStorage from './components/LocalStorage';
import ASTOutputContainer from './containers/ASTOutputContainer';
import CodeEditorContainer from './containers/CodeEditorContainer';
import CodeMMEditorContainer from './containers/CodeMMEditorContainer';

import DiffCodeContainer from './containers/DiffCodeContainer';
import DiffOutputContainer from './containers/DiffOutputContainer';
import ErrorMessageContainer from './containers/ErrorMessageContainer';
import GistBanner from './components/GistBanner';
import LoadingIndicatorContainer from './containers/LoadingIndicatorContainer';
import PasteDropTargetContainer from './containers/PasteDropTargetContainer';
import PropTypes from 'prop-types';
import PubSub from 'pubsub-js';
import React from 'react';
import SettingsDialogContainer from './containers/SettingsDialogContainer';
import ShareDialogContainer from './containers/ShareDialogContainer';
import SplitPane from './components/SplitPane';
import ToolbarContainer from './containers/ToolbarContainer';
import TransformerContainer from './containers/TransformerContainer';
import createSagaMiddleware from 'redux-saga'
import debounce from './utils/debounce';
import saga from './store/sagas';
import { Provider, connect } from 'react-redux';
import { astexplorer, persist, revive } from './store/reducers';
import { createStore, applyMiddleware, compose } from 'redux';
import { canSaveTransform, getRevision } from './store/selectors';
import { enableBatching } from 'redux-batched-actions';
import { loadSnippet } from './store/actions';
import { render } from 'react-dom';
import * as gist from './storage/gist';
import * as parse from './storage/parse';
import StorageHandler from './storage';
import '../css/style.css';
import parserMiddleware from './store/parserMiddleware';
import differMiddleware from './store/differMiddleware';

import 'diff-match-patch'

function resize() {
  PubSub.publish('PANEL_RESIZE');
}

function App(props) {
  // console.log(98, props);
  // debugger
  return (
    <div>
      <ErrorMessageContainer />
      <div className={'dropTarget' + (props.hasError ? ' hasError' : '')}>
        <PasteDropTargetContainer>
          <LoadingIndicatorContainer />
          <SettingsDialogContainer />
          <ShareDialogContainer />
          <div id="root">
            <ToolbarContainer />
            <GistBanner />
            <SplitPane
              className="splitpane-content"
              vertical={true}
              onResize={resize}>
              {props.showDiffer ?
                <DiffCodeContainer /> :
                <SplitPane
                  className="splitpane"
                  onResize={resize}>
                  <CodeEditorContainer />
                  <ASTOutputContainer />
                </SplitPane>
              }
              {props.showTransformer ? <TransformerContainer /> :
                props.showDiffer ? <DiffOutputContainer /> :
                  null}
            </SplitPane>
          </div>
        </PasteDropTargetContainer>
      </div>
    </div>
  );
}

App.propTypes = {
  hasError: PropTypes.bool,
  showTransformer: PropTypes.bool,
  showDiffer: PropTypes.bool,
};

const AppContainer = connect(
  state => {
    window.qwerty = state
    // debugger
    return ({
      showTransformer: state.showTransformPanel,
      showDiffer: state.showDiffPanel,
      hasError: !!state.error,
    });
  },
)(App);

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
const sagaMiddleware = createSagaMiddleware();
const store = createStore(
  enableBatching(astexplorer),
  revive(LocalStorage.readState()),
  composeEnhancers(
    applyMiddleware(sagaMiddleware, parserMiddleware, differMiddleware),
  ),
);
store.subscribe(debounce(() => {
  // debugger
  const state = store.getState();
  // We are not persisting the state while looking at an existing revision
  if (!getRevision(state)) {
    LocalStorage.writeState(persist(state));
  }
}));
sagaMiddleware.run(saga, new StorageHandler([gist, parse]));
store.dispatch({ type: 'INIT' });

render(
  <Provider store={store}>
    <AppContainer />
  </Provider>,
  document.getElementById('container'),
);

global.onhashchange = () => {
  // debugger
  store.dispatch(loadSnippet());
};

if (location.hash.length > 1) {
  store.dispatch(loadSnippet());
}

global.onbeforeunload = () => {
  const state = store.getState();
  if (canSaveTransform(state)) {
    return 'You have unsaved transform code. Do you really want to leave?';
  }
};
