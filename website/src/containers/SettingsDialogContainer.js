import { connect } from 'react-redux';
import actions from '../store/actions';
import { showSettingsDialog, getParser, getParserSettings, getDiffer, getDifferSettings } from '../store/selectors';
import SettingsDialog from '../components/dialogs/SettingsDialog';

function mapStateToProps(state) {
  const cat = showSettingsDialog(state)
  return {
    category: cat,
    visible: !!cat,
    tool: cat === 'evolve' ? getDiffer(state) : getParser(state),
    toolSettings: cat === 'evolve'
      ? getDifferSettings(state)
      : getParserSettings(state),
  };
}

function mapDispatchToProps(dispatch) {
  return {
    onSave: (category, newSettings) =>
      dispatch(category === 'evolve'
        ? actions['Evolutions/Settings/set'](newSettings)
        : actions['Parse/Settings/set'](newSettings)),
    onWantToClose: () => dispatch(actions.closeSettingsDialog()),
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(SettingsDialog);
