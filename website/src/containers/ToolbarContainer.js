import {connect} from 'react-redux';
import actions from '../store/actions';
import Toolbar from '../components/Toolbar';
import * as selectors from '../store/selectors';
import {logEvent} from '../utils/logger';

function mapStateToProps(state) {
  const parser = selectors.getParser(state);

  return {
    forking: selectors.isForking(state),
    saving: selectors.isSaving(state),
    canSave: selectors.canSave(state),
    canFork: selectors.canFork(state),
    category: parser.category,
    parser,
    transformer: selectors.getTransformer(state),
    differ: selectors.getDiffer(state),
    keyMap: selectors.getKeyMap(state),
    showTransformer: selectors.showTransformer(state),
    showDiffer: selectors.showDiffer(state),
    snippet: selectors.getRevision(state),
  };
}

function mapDispatchToProps(dispatch) {
  return {
    onParserChange: parser => {
      dispatch(actions['Parse/select'](parser));
      logEvent('parser', 'select', parser.id);
    },
    onCategoryChange: category => {
      dispatch(actions.selectCategory(category));
      logEvent('category', 'select', category.id);
    },
    onParserSettingsButtonClick: () => {
      dispatch(actions.openSettingsDialog());
      logEvent('parser', 'open_settings');
    },
    onDifferSettingsButtonClick: () => {
      dispatch(actions.openSettingsDialog('evolve'));
      logEvent('differ', 'open_settings');
    },
    onShareButtonClick: () => {
      dispatch(actions.openShareDialog());
      logEvent('ui', 'open_share');
    },
    onTransformChange: transformer => {
      dispatch(transformer ? actions['Transformer/select'](transformer) : actions['Transformer/hide']());
      if (transformer) {
        logEvent('tool', 'select', transformer.id);
      }
    },
    onDiffChange: diff => {
      dispatch(diff ? actions['Evolutions/select'](diff) : actions.hideOld());
      if (diff) {
        logEvent('tool', 'select', diff.id);
      }
    },
    onKeyMapChange: keyMap => {
      dispatch(actions.setKeyMap(keyMap))
      if (keyMap) {
        logEvent('keyMap', keyMap);
      }
    },
    onSave: () => dispatch(actions['Save/start'](false)),
    onFork: () => dispatch(actions['Save/start'](true)),
    onNew: () => {
      if (document.location.hash) {
        document.location.hash = '';
      } else {
        dispatch(actions.reset());
      }
    },
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(Toolbar);

