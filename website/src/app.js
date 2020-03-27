import * as LocalStorage from './components/LocalStorage';
import ASTOutputContainer from './containers/ASTOutputContainer';
import CodeEditorContainer from './containers/CodeEditorContainer';

import MultiCodeContainer from './containers/MultiCodeContainer';
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
import GraphChart from './containers/GraphOutputContainer';

function resize() {
  PubSub.publish('PANEL_RESIZE');
}

function App(props) {
  // console.log(98, props);
  // debugger
  /** @type {JSX.Element} */
  let content;
  if (props.showTransformer) {
    content = (
      <SplitPane
        className="splitpane-content"
        vertical={true}
        onResize={resize}>
        <SplitPane
          className="splitpane"
          onResize={resize}>
          <CodeEditorContainer />
          <ASTOutputContainer />
        </SplitPane><TransformerContainer />
      </SplitPane>
    );
  } else if (props.showDiffer) {
    content = (<SplitPane
      className="splitpane-content"
      vertical={true}
      onResize={resize}>
      <MultiCodeContainer />
      {true ? <SplitPane
        className="splitpane"
        onResize={resize}>
        <DiffOutputContainer />
        <GraphChart />
      </SplitPane> :
        <DiffOutputContainer />
      }
    </SplitPane>);
  } else {
    content = (<SplitPane
      className="splitpane-content"
      vertical={true}
      onResize={resize}>
      <SplitPane
        className="splitpane"
        onResize={resize}>
        <CodeEditorContainer />
        <ASTOutputContainer />
      </SplitPane>
    </SplitPane>);
  }
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
            {content}
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
    applyMiddleware(sagaMiddleware, parserMiddleware),
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


window.currentTarget = window.currentTarget || {
  // repo: "https://github.com/Graylog2/graylog2-server.git",
  // commitIdBefore: "904f8e2a49f8ded1b16ab52e37588592e02da71c",
  // commitIdAfter: "767171c90110c4c5781e8f6d19ece1fba0d492e9"
  repo: "https://github.com/INRIA/spoon.git",
  commitIdBefore: "4b42324566bdd0da145a647d136a2f555c533978",
  commitIdAfter: "904fb1e7001a8b686c6956e32c4cc0cdb6e2f80b"
};
{
  const r = window.prompt("target", window.currentTarget.repo + ';' + window.currentTarget.commitIdBefore + ';' + window.currentTarget.commitIdAfter)
  if (r){
    const [repo, before, after] = r.split(/;/);

    window.currentTarget = {
      repo: repo,
      commitIdBefore: before,
      commitIdAfter: after
    };
  }
  /*
  on open JDK 8
https://github.com/INRIA/spoon.git;4b42324566bdd0da145a647d136a2f555c533978;904fb1e7001a8b686c6956e32c4cc0cdb6e2f80b
https://github.com/INRIA/spoon.git;8fd216c220de592eb5b9cb306404c54673b71d37;904fb1e7001a8b686c6956e32c4cc0cdb6e2f80b
https://github.com/google/truth.git;fb7f2fe21d8ca690daabedbd31a0ade99244f99c;1768840bf1e69892fd2a23776817f620edfed536
spoon.compiler.ModelBuildingException: The type Platform is already defined
        at spoon.support.compiler.jdt.JDTBasedSpoonCompiler.reportProblem(JDTBasedSpoonCompiler.java:573)
https://github.com/antlr/antlr4.git;53678867ca61ffb4aa79298b40efcc74bebf952c;b395127e733b33c27f344695ebf155ecf5edeeab
evolution des not seem to be in the spoon AST
https://github.com/apache/hive.git;42326958148c2558be9c3d4dfe44c9e735704617;240097b78b70172e1cf9bc37876a566ddfb9e115
https://github.com/quentinLeDilavrec/interacto-java-api.git;5377ad5864cd54e776aa30f690fd84253153677a;3bf9a6d0876fc5c99221934a5ecd161ea51204f0
java.lang.IllegalStateException: Module should be known
        at org.eclipse.jdt.internal.compiler.batch.CompilationUnit.module(CompilationUnit.java:126)
https://github.com/quentinLeDilavrec/interacto-java-api.git;7a7caea2ef82d4e6c676da085116427069b86e80;3bf9a6d0876fc5c99221934a5ecd161ea51204f0
idem
https://github.com/quentinLeDilavrec/interacto-java-api.git;d022a91c49378cd182d6b1398dad3939164443b4;3bf9a6d0876fc5c99221934a5ecd161ea51204f0
idem
solved by removing module.info
https://github.com/neo4j/neo4j.git;5d73d6f87a7e5df53447a26c515ca5632466d374;021d17c8234904dcb1d54596662352395927fe7b
5d73d6f87a7e5df53447a26c515ca5632466d374 unknown, on 4.0 branch
should have one parent
https://github.com/wildfly/wildfly.git;727e0e0f7e2b75bc13f738d0543a1077cdd4edd8;4aa2e8746b5492bbc1cf2b36af956cf3b01e40f5
https://github.com/google/closure-compiler.git;81968c426bc06dbe26ecdde1aee90604f26b6c9e;5a853a60f93e09c446d458673bc7a2f6bb26742c
my tool don't get any impacts
https://github.com/Athou/commafeed.git;dfbd556bb809d9af61abd577628d0fb12e10035c;18a7bd1fd1a83b3b8d1b245e32f78c0b4443b7a7
https://github.com/crashub/crash.git;3224abedd01aaa85aae9ae3399efe92557f42e55;2801269c7e47bd6e243612654a74cee809d20959

https://github.com/graphhopper/graphhopper.git;0c77e1d8a4337b8c3e649957dd4f1f6ef377a377;7f80425b6a0af9bdfef12c8a873676e39e0a04a6
almost working
https://github.com/addthis/hydra.git;e9de568e9c5cbe1cc89cfcf9a4f60b157e20aa1f;7fea4c9d5ee97d4a61ad985cadc9c5c0ab2db780

https://github.com/opentripplanner/OpenTripPlanner.git;fc89d5e3e5dd5a09f0579fc3f5509d88e38aea42;e32f161fc023d1ee153c49df312ae10b06941465

https://github.com/apache/drill.git;711992f22ae6d6dfc43bdb4c01bf8f921d175b38;8815eb7d947be6d2a0281c15a3a60d8ba040db95

https://github.com/plutext/docx4j.git;4b4b0babb11891427a8123771350d46417bb5dd4;e29924b33ec0c0298ba4fc3f7a8c218c8e6cfa0c

https://github.com/undertow-io/undertow.git;a55874e2d4c370e02ad3eb189a5210839f6dab20;d5b2bb8cd1393f1c5a5bb623e3d8906cd57e53c4
same as graphhopper
*/
}

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
