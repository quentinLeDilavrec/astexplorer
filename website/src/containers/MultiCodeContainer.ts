import { connect, ConnectedProps } from "react-redux";
import actions from "../store/actions";
import MultiEditor, { EvoImp, Range } from "../components/MultiEditor2";
import {
  getDiffCode,
  getParser,
  getParseResult,
  getKeyMap,
  getCode,
  getInstance,
  getSelectedEvolutionsIds,
  getDiffResult,
  getSelectedImpactedRanges,
} from "../store/selectors";
import { State } from "../store/reducers";
import { Dispatch } from "redux";
import { Action } from "redux-actions";

const def = (inst) => ({
  evolutions: [
    {
      type: "Move Method",
      before: [
        {
          repository: inst.repo || "",
          commitId: inst.commitIdBefore || "",
          file: "src/main/java/spoon/refactoring/Refactoring.java",
          start: 1,
          end: 2,
          description: "method declaration before move",
          type: "Method",
        },
      ],
      after: [
        {
          repository: inst.repo || "",
          commitId: inst.commitIdAfter || "",
          file: "src/main/java/spoon/refactoring/Refactoring.java",
          start: 1,
          end: 2,
          description: "method declaration after move",
          type: "Method",
        },
      ],
    },
  ],
  impactsBefore: [
    {
      repository: inst.repo || "",
      commitId: inst.commitIdBefore || "",
      file: "/src/test/java/spoon/test/refactoring/RefactoringTest.java",
      start: 1,
      end: 2,
      type: "invocation",
    },
    {
      repository: inst.repo || "",
      commitId: inst.commitIdBefore || "",
      file: "/src/test/java/spoon/test/refactoring/RefactoringTest.java",
      start: 10,
      end: 12,
      type: "invocation",
    },
  ],
  impactsAfter: [],
} as const)

function mapStateToProps(state: State) {
  const mode =
    getParser(state).category.editorMode || getParser(state).category.id;
  const inst = getInstance(state);
  if (!inst) {
    throw new Error("operation no implemented");
  }
  return {
    keyMap: getKeyMap(state),
    instance: inst,
    mode: mode,
    error: (getParseResult(state) || {}).error,
    selectedEvolutions: getSelectedEvolutionsIds(state),
    impactsBefore: getSelectedImpactedRanges(state),
    impactsAfter: [] as Range[],
    getEvolution: (id: number) => {
      const ast = getDiffResult(state).ast;
      return ast && ast[id];
    },
  };
}

function mapDispatchToProps(dispatch: Dispatch<Action<any>>) {
  return {
    onContentChange: ({ value, oldvalue, cursor, side }) => {
      console.log("oncontentchange", { aa: value === oldvalue, cursor });
      const o = { cursor, side, oldcode: oldvalue, code: value };
      // oldvalue && ((o as any).oldcode = oldvalue);
      // value && ((o as any).code = value);
      dispatch(actions["setOld"](o));
    },
    onActivity: (cursor) => dispatch(actions["Cursor/set"](cursor)),
  };
}

const connector = connect(mapStateToProps, mapDispatchToProps);
export type PT = ConnectedProps<typeof connector>;
/// @ts-ignore
export default connector(MultiEditor);
