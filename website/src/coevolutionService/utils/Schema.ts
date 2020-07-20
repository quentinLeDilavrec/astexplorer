export interface MiningResult {
  repository: string;
  commitIdBefore: string;
  commitIdAfter: string;
  evolutions: Evolution[]
}

export interface Evolution {
  type: string;
  repository?: string;
  commitIdBefore?: string;
  commitIdAfter?: string;
  before: Range[];
  after: Range[];
}

export interface Range {
  repository?: string;
  commitId?: string;
  file: string;
  start: number;
  end: number;
  description?: string;
}

/**
 * Can be joined by ; , : @
 */
export interface RangeQuery {
  commitId?: string; //if undefined, if in before get commitIdBefore, else if in after get commitIdAfter
  file: string;
  start: number; // lower or equal to aimed value
  end: number; // higher or equal to aimed value
  description?: number;
}

type aaa = {
  left: (string | string[])[],
  right: (string | string[])[],
  partOf?: string
}

/**
 * Come from RefactoringMiner
 */
export const Refactoring: { [type: string]: aaa } = {
  CHANGE_ATTRIBUTE_TYPE: {
    left: ["original attribute declaration"],
    right: ["changed-type attribute declaration"]
  },
  CHANGE_RETURN_TYPE: {
    left: ["original return type"],
    right: ["changed return type"]
  },
  CHANGE_VARIABLE_TYPE: {
    left: ["original variable declaration"],
    right: ["changed-type variable declaration"]
  },
  CHANGE_PARAMETER_TYPE: {
    left: ["original variable declaration"],
    right: ["changed-type variable declaration"],
    partOf: "CHANGE_VARIABLE_TYPE"
  },
  CONVERT_ANONYMOUS_CLASS_TO_TYPE: {
    left: ["anonymous class declaration"],
    right: ["added type declaration"]
  },
  EXTRACT_ATTRIBUTE: {
    left: [
      ["statement with the initializer of the extracted attribute"],
    ],
    right: [
      "extracted attribute declaration",
      ["statement with the name of the extracted attribute"],
    ]
  },
  EXTRACT_SUBCLASS: {
    left: ["original type declaration"],
    right: ["extracted type declaration"],
    partOf: "EXTRACT_CLASS"
  },
  EXTRACT_CLASS: {
    left: ["original type declaration"],
    right: ["extracted type declaration"]
  },
  ExtractOperation: {
    left: [
      "source method declaration before extraction",
      ["extracted code from source method declaration"],
    ],
    right: [
      "extracted method declaration",
      ["extracted code to extracted method declaration"],
      "source method declaration after extraction",
      ["added statement in extracted method declaration"],
      ["added statement in extracted method declaration"]
    ]
  },
  ExtractAndMoveOperation: {
    left: [
      "source method declaration before extraction",
      ["extracted code from source method declaration"],
    ],
    right: [
      "extracted method declaration",
      ["extracted code to extracted method declaration"],
      "source method declaration after extraction",
      ["added statement in extracted method declaration"],
      ["added statement in extracted method declaration"]
    ],
    partOf: "ExtractAndMoveOperation"
  },
  EXTRACT_SUPERCLASS: {
    left: [["sub-type declaration"]],
    right: ["extracted super-type declaration"]
  },
  EXTRACT_INTERFACE: {
    left: [["sub-type declaration"]],
    right: ["extracted super-type declaration"],
    partOf: "EXTRACT_SUPERCLASS"
  },
  EXTRACT_VARIABLE: {
    left: [["statement with the initializer of the extracted variable"]],
    right: [
      "extracted variable declaration",
      ["statement with the name of the extracted variable"]],
  },
  INLINE_OPERATION: {
    left: [
      "inlined method declaration",
      ["inlined code from inlined method declaration"],
      "target method declaration before inline",
      ["inlined method invocation"],
      ["deleted statement in inlined method declaration"]
    ],
    right: [
      "target method declaration after inline",
      "inlined code in target method declaration"
    ],
  },
  MOVE_AND_INLINE_OPERATION: {
    left: [
      "inlined method declaration",
      ["inlined code from inlined method declaration"],
      "target method declaration before inline",
      ["inlined method invocation"],
      ["deleted statement in inlined method declaration"]
    ],
    right: [
      "target method declaration after inline",
      "inlined code in target method declaration"
    ],
    partOf: "INLINE_OPERATION"
  },
  INLINE_VARIABLE: {
    left: [
      "inlined variable declaration",
      ["statement with the name of the inlined variable"]
    ],
    right: [["statement with the initializer of the inlined variable"]],
  },
  MERGE_ATTRIBUTE: {
    left: [["merged attribute declaration"]],
    right: ["new attribute declaration"],
  },
  MERGE_VARIABLE: {
    left: [["merged variable declaration"]],
    right: ["new variable declaration"],
  },
  MERGE_PARAMETER: {
    left: [["merged variable declaration"]],
    right: ["new variable declaration"],
    partOf: "MERGE_VARIABLE"
  },
  MOVE_RENAME_ATTRIBUTE: {
    left: ["original attribute declaration"],
    right: ["moved and renamed attribute declaration"],
  },
  MOVE_RENAME_CLASS: {
    left: ["original type declaration"],
    right: ["moved and renamed type declaration"],
  },
  MOVE_ATTRIBUTE: {
    left: ["original attribute declaration"],
    right: ["moved attribute declaration"],
  },
  MOVE_CLASS: {
    left: ["original type declaration"],
    right: ["moved type declaration"],
  },
  MoveMethod: { 
    left: ["original method declaration"], 
    right: ["moved method declaration"] },
  MOVE_AND_RENAME_OPERATION: {
    left: ["original method declaration"], 
    right: ["moved method declaration"],
    partOf: "MOVE_OPERATION"
  },
  MOVE_SOURCE_FOLDER: {
  left: [["original type declaration"]],
    right: [["moved type declaration"]],
  },
  PULL_UP_ATTRIBUTE: {
  left: ["original attribute declaration"],
    right: ["pulled up attribute declaration"],
  },
  PULL_UP_OPERATION: {
  left: ["original method declaration"],
    right: ["pulled up method declaration"],
  },
  PUSH_DOWN_ATTRIBUTE: {
  left: ["original attribute declaration"],
    right: ["pushed down attribute declaration"],
  },
  PUSH_DOWN_OPERATION: {
  left: ["original method declaration"],
    right: ["pushed down method declaration"],
  },
  RENAME_ATTRIBUTE: {
  left: ["original attribute declaration"],
    right: ["renamed attribute declaration"],
  },
  RENAME_CLASS: {
  left: ["original type declaration"],
    right: ["renamed type declaration"],
  },
  RENAME_METHOD: {
  left: ["original method declaration"],
    right: ["renamed method declaration"],
  },
  RENAME_PACKAGE: {
  left: ["original type declaration"],
    right: ["moved type declaration"],
  },
  RENAME_VARIABLE: {
  left: ["original variable declaration"],
    right: ["renamed variable declaration"],
  },
  RENAME_PARAMETER: {
  left: ["original variable declaration"],
    right: ["renamed variable declaration"],
    partOf: "RENAME_VARIABLE"
  },
  PARAMETERIZE_VARIABLE: {
  left: ["original variable declaration"],
    right: ["renamed variable declaration"],
    partOf: "RENAME_VARIABLE"
  },
  REPLACE_VARIABLE_WITH_ATTRIBUTE: {
  left: ["original variable declaration"],
    right: ["renamed variable declaration"],
    partOf: "RENAME_VARIABLE"
  },
  REPLACE_ATTRIBUTE: {
  left: ["original attribute declaration"],
    right: ["replaced attribute declaration"],
  },
  SPLIT_ATTRIBUTE: {
  left: ["original attribute declaration"],
    right: [["split attribute declaration"]],
  },
  SPLIT_VARIABLE: {
  left: ["original variable declaration"],
    right: [["split variable declaration"]],
  },
}

export interface EvoQuery {
  repository: string;
  commitIdBefore: string;
  commitIdAfter: string;
  before: RangeQuery[];
  after: RangeQuery[];
}