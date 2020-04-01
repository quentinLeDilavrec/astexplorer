import { connect } from 'react-redux';
import { closeSettingsDialog, setParserSettings, setDifferSettings } from '../store/actions';
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
        ? setDifferSettings(newSettings)
        : setParserSettings(newSettings)),
    onWantToClose: () => dispatch(closeSettingsDialog()),
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(SettingsDialog);
