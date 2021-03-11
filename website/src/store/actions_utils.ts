import { createActions as createActions0, ActionFunctionAny, ActionMap, Options, Action, combineActions as combineActions0 } from "redux-actions";

type KeysOf<T, I, E> = {
  [K in keyof T]:
  T[K] extends I ? K :
  T[K] extends E ? never :
  K
}[keyof T];

type NonObjectKeysOf<T> = KeysOf<T, Function | Array<any> | readonly [any, any], object>

type AAA = NonObjectKeysOf<Model>
type AAA1 = KeysOf<Model, Function | Array<any>, object>


type PropertiesOf<T, I, E> = Pick<T, KeysOf<T, I, E>>;
type NonObjectPropertiesOf<T> = PropertiesOf<T, Function | Array<any> | readonly [any, any], object>;

type BBB = NonObjectPropertiesOf<Model>
type BBB1 = PropertiesOf<Model, Function | Array<any>, object>


type ObjectPropertiesOf<T> = Omit<T, NonObjectKeysOf<T>>

type CCC = ObjectPropertiesOf<Model>

type ValuesOf<T> = T[keyof T];

type ObjectValuesConcatOf<T> = ValuesOf<{
  [K in keyof T & string]:
  {
    [J in keyof T[K] & string as `${K}/${J}`]:
    T[K][J]
  }
}>;

type zefzsefze = ObjectValuesConcatOf<ObjectPropertiesOf<Model>>

type UnionToIntersection<U> = (U extends any
  ? (k: U) => void
  : never) extends ((k: infer I) => void)
  ? I
  : never;


type ezf = ValuesOf<Model>
type fzfee = Extract<ezf, object>

type ObjectValuesOf<T> = Exclude<
  Extract<ValuesOf<T>, object>,
  Array<any> | Function
>;

type DDD = ObjectValuesOf<Model>

type DFBase<T, Recursor> = NonObjectPropertiesOf<T> &
  UnionToIntersection<Recursor>;

type DeepFlatten<T> = T extends any ? DFBase<T, DF2<ObjectValuesOf<T>>> : never;
type DF2<T> = T extends any ? DFBase<T, DF3<ObjectValuesOf<T>>> : never;
type DF3<T> = T extends any ? DFBase<T, DF4<ObjectValuesOf<T>>> : never;
type DF4<T> = T extends any ? DFBase<T, DF5<ObjectValuesOf<T>>> : never;
type DF5<T> = T extends any ? DFBase<T, DF6<ObjectValuesOf<T>>> : never;
type DF6<T> = T extends any ? DFBase<T, DF7<ObjectValuesOf<T>>> : never;
type DF7<T> = T extends any ? DFBase<T, DF8<ObjectValuesOf<T>>> : never;
type DF8<T> = T extends any ? DFBase<T, DF9<ObjectValuesOf<T>>> : never;
type DF9<T> = T extends any ? DFBase<T, ObjectValuesOf<T>> : never;

type Model = {
  'foo': number;
  bar: string;
  bav: () => string;
  zefze: Array<string>;
  baz: {
    qux: Array<string>;
    quux: {
      quuz: number | string;
      corge: boolean;
    };
    flob: number;
  };
  wobble: {
    doop: string;
  };
};
type FModel = DeepFlatten<Model>
type EEE = UnionToIntersection<DDD>
type X0 = DF9<Model>
// this should give no errors
const flattenedModel: DeepFlatten<Model> = {
  'foo': 1,
  bar: "abc",
  bav: () => 'a',
  zefze: ['3'],
  qux: ["abc"],
  quuz: 2,
  corge: true,
  flob: 3,
  doop: "abcd"
}; // ✅ yay, no errors!


type DFBaseC<T, Recursor> = Pick<T, NonObjectKeysOf<T>> &
  UnionToIntersection<Recursor>;

type DeepFlattenConcat<T> = T extends any ? DFBaseC<T, DF2C<ObjectValuesConcatOf<ObjectPropertiesOf<T>>>> : never;
type DF2C<T> = T extends any ? DFBase<T, DF3C<ObjectValuesConcatOf<ObjectPropertiesOf<T>>>> : never;
type DF3C<T> = T extends any ? DFBase<T, DF4C<ObjectValuesConcatOf<ObjectPropertiesOf<T>>>> : never;
type DF4C<T> = T extends any ? DFBase<T, DF5C<ObjectValuesConcatOf<ObjectPropertiesOf<T>>>> : never;
type DF5C<T> = T extends any ? DFBase<T, DF6C<ObjectValuesConcatOf<ObjectPropertiesOf<T>>>> : never;
type DF6C<T> = T extends any ? DFBase<T, DF7C<ObjectValuesConcatOf<ObjectPropertiesOf<T>>>> : never;
type DF7C<T> = T extends any ? DFBase<T, DF8C<ObjectValuesConcatOf<ObjectPropertiesOf<T>>>> : never;
type DF8C<T> = T extends any ? DFBase<T, DF9C<ObjectValuesConcatOf<ObjectPropertiesOf<T>>>> : never;
type DF9C<T> = T extends any ? DFBase<T, ObjectValuesConcatOf<ObjectPropertiesOf<T>>> : never;

type efzefze = DeepFlattenConcat<Model>
type azdazd = DF4C<Model>
type zegesdrgzre = Pick<Model, NonObjectKeysOf<Model>>

const flattenedModel2: DeepFlattenConcat<Model> = {
  'foo': 1,
  bar: "abc",
  bav: () => 'a',
  zefze: ['3'],
  'baz/qux': ["abc"],
  'baz/quux/quuz': 2,
  'baz/quux/corge': true,
  'baz/flob': 3,
  'wobble/doop': "abcd"
};

const aaa: UnionToIntersection<{ a: 1 } | { b?: 2 }> = { a: 1 };

type Actioning<T extends ActionFunctionAny<any>> = (...args:Parameters<T>) => Action<ReturnType<T>>
type Actioning2<U extends string, T extends ActionFunctionAny<any>> = (...args:Parameters<T>) => {type: U, payload: ReturnType<T>, error?: boolean}

type ToActionFunc<T extends { [k: string]: readonly [ActionFunctionAny<any>, ActionFunctionAny<any>] | ActionFunctionAny<any>}> = {
  [K in keyof T & string]: 
    T[K] extends readonly [any, any] ? Actioning2<K,T[K][0]> : 
    T[K] extends ActionFunctionAny<any> ? Actioning2<K,T[K]> : never
}

type dazdaz = ToActionFunc<{a:()=>number[],b:[()=>number,()=>string]}>

interface ActionMap2<Payload, Meta> {
  [actionType: string]:
  ActionMap2<Payload, Meta> |
  ActionFunctionAny<Payload> |
  readonly [ActionFunctionAny<Payload>, ActionFunctionAny<Meta>] |
  undefined;
}
//ActionMap<Payload, any>
export function createActions<U extends ActionMap2<any, any>>(
  actionMapOrIdentityAction: U,
  ...identityActions: Array<string | Options>
): Readonly<ToActionFunc<DeepFlattenConcat<U>>> {
  // return createActions0(actionMapOrIdentityAction as ActionMap<any, any>, ...identityActions) as Readonly<ToActionFunc<DeepFlattenConcat<U>>>
  const tmp = createActions0(actionMapOrIdentityAction as ActionMap<any, any>, ...identityActions) as any
  const res = {}
  flatten(actionMapOrIdentityAction, tmp, res)
  return res as unknown as Readonly<ToActionFunc<DeepFlattenConcat<U>>>
};


function flatten(map:{[k:string]: any}, mapR:{[k:string]: any}, acc: {}, path: string[] = []) {
  for (const key in map) {
    if (Object.prototype.hasOwnProperty.call(map, key)) {
      const element = map[key];
      const elementR = mapR[key.slice(0,1).toLowerCase()+key.slice(1)];
      const p = [...path, key]
      if (typeof element === 'function') {
        acc[p.join('/')] = elementR
      } else {
        flatten(element, elementR, acc, p)
      }
    }
  }
}

// export function getTypes<U extends ActionMap2<any, any>>(map:Readonly<ToActionFunc<DeepFlattenConcat<U>>>) {
  
// }


type A = 'a' | 'aa' | 'aaa'
type B = 'b' | 'bb' | 'bbb'

type AB = `${A}-${B}`

type O = {
  ab: AB,
  content: O
}