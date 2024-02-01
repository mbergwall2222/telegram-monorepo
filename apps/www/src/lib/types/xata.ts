import { Identifiable, XataFile, XataRecord } from "@xata.io/client";

export type SingleOrArray<T> = T | T[];
export type StringKeys<O> = Extract<keyof O, string>;

export type JSONValue<Value> = Value & {
  __json: true;
};

export type Values<O> = O[StringKeys<O>];
export type XataRecordMetadata = {
  /**
   * Number that is increased every time the record is updated.
   */
  version: number;
  /**
   * Timestamp when the record was created.
   */
  createdAt: Date;
  /**
   * Timestamp when the record was last updated.
   */
  updatedAt: Date;
};
export type DataProps<O> = Exclude<StringKeys<O>, StringKeys<XataRecord>>;
export type IsObject<T> = T extends Record<string, any> ? true : false;
export type If<Condition, Then, Else> = Condition extends true ? Then : Else;
export type IsArray<T> = T extends Array<any> ? true : false;
export type XataArrayFile = Identifiable & XataFile;
export type XataFileFields = Partial<
  Pick<
    XataArrayFile,
    {
      [K in StringKeys<XataArrayFile>]: XataArrayFile[K] extends Function
        ? never
        : K;
    }[keyof XataArrayFile]
  >
>;
export type NestedColumns<
  O,
  RecursivePath extends any[]
> = RecursivePath["length"] extends MAX_RECURSION
  ? never
  : If<
      IsObject<O>,
      Values<{
        [K in DataProps<O>]: NonNullable<O[K]> extends infer Item
          ? If<
              IsArray<Item>,
              Item extends (infer Type)[]
                ? Type extends XataArrayFile
                  ? K | `${K}.${keyof XataFileFields | "*"}`
                  : K | `${K}.${StringKeys<Type> | "*"}`
                : never,
              If<
                IsObject<Item>,
                Item extends XataRecord
                  ? SelectableColumn<
                      Item,
                      [...RecursivePath, Item]
                    > extends infer Column
                    ? Column extends string
                      ? K | `${K}.${Column}`
                      : never
                    : never
                  : Item extends Date
                  ? K
                  : Item extends XataFile
                  ? K | `${K}.${keyof XataFileFields | "*"}`
                  : `${K}.${StringKeys<Item> | "*"}`, // This allows usage of objects that are not links
                K
              >
            >
          : never;
      }>,
      never
    >;
export type SelectableColumn<O, RecursivePath extends any[] = []> =
  | "*"
  | "id"
  | `xata.${"version" | "createdAt" | "updatedAt"}`
  | DataProps<O>
  | NestedColumns<O, RecursivePath>;
export type ExpandedColumnNotation = {
  name: string;
  columns?: SelectableColumn<any>[];
  as?: string;
  limit?: number;
  offset?: number;
  order?: {
    column: string;
    order: "asc" | "desc";
  }[];
};
export type SelectableColumnWithObjectNotation<
  O,
  RecursivePath extends any[] = []
> = SelectableColumn<O, RecursivePath> | ExpandedColumnNotation;
declare function isValidExpandedColumn(
  column: any
): column is ExpandedColumnNotation;
declare function isValidSelectableColumns(
  columns: any
): columns is SelectableColumn<any>[];
export type StringColumns<T> = T extends string ? T : never;
export type ProjectionColumns<T> = T extends string
  ? never
  : T extends {
      as: infer As;
    }
  ? NonNullable<As> extends string
    ? NonNullable<As>
    : never
  : never;
export type WildcardColumns<O> = Values<{
  [K in SelectableColumn<O>]: K extends `${string}*` ? K : never;
}>;
export type MAX_RECURSION = 3;

export type ValueAtColumn<
  Object,
  Key,
  RecursivePath extends any[] = []
> = RecursivePath["length"] extends MAX_RECURSION
  ? never
  : Key extends "*"
  ? Values<Object>
  : Key extends "id"
  ? string
  : Key extends "xata.version"
  ? number
  : Key extends "xata.createdAt"
  ? Date
  : Key extends "xata.updatedAt"
  ? Date
  : Key extends keyof Object
  ? Object[Key]
  : Key extends `${infer K}.${infer V}`
  ? K extends keyof Object
    ? Values<
        NonNullable<Object[K]> extends infer Item
          ? Item extends Record<string, any>
            ? V extends SelectableColumn<Item>
              ? {
                  V: ValueAtColumn<Item, V, [...RecursivePath, Item]>;
                }
              : never
            : Object[K]
          : never
      >
    : never
  : never;
export type ColumnsByValue<O, Value> = Values<{
  [K in SelectableColumn<O>]: ValueAtColumn<O, K> extends infer C
    ? C extends Value
      ? K extends WildcardColumns<O>
        ? never
        : K
      : never
    : never;
}>;

export type JSONFilterColumns<Record> = Values<{
  [K in keyof Record]: NonNullable<Record[K]> extends JSONValue<any>
    ? K extends string
      ? `${K}->${string}`
      : never
    : never;
}>;
export type FilterColumns<T> =
  | ColumnsByValue<T, any>
  | `xata.${keyof XataRecordMetadata}`;
export type FilterValueAtColumn<Record, F> = NonNullable<
  ValueAtColumn<Record, F>
> extends JSONValue<any>
  ? PropertyFilter<any>
  : Filter<NonNullable<ValueAtColumn<Record, F>>>;
/**
* PropertyMatchFilter
* Example:
{
"filter": {
  "name": "value",
  "name": {
     "$is":  "value",
     "$any": [ "value1", "value2" ],
  },
  "settings.plan": {"$any": ["free", "paid"]},
  "settings.plan": "free",
  "settings": {
    "plan": "free"
  },
}
}
*/
export type PropertyAccessFilter<Record> = {
  [key in FilterColumns<Record>]?:
    | NestedApiFilter<ValueAtColumn<Record, key>>
    | PropertyFilter<ValueAtColumn<Record, key>>;
} & {
  [key in JSONFilterColumns<Record>]?: PropertyFilter<Record[keyof Record]>;
};
export type PropertyFilter<T> =
  | T
  | {
      $is: T;
    }
  | {
      $isNot: T;
    }
  | {
      $any: T[];
    }
  | {
      $none: T[];
    }
  | ValueTypeFilters<T>;
export type IncludesFilter<T> =
  | PropertyFilter<T>
  | {
      [key in "$all" | "$none" | "$any"]?:
        | IncludesFilter<T>
        | Array<
            | IncludesFilter<T>
            | {
                $not: IncludesFilter<T>;
              }
          >;
    };
export type StringTypeFilter = {
  [key in
    | "$contains"
    | "$iContains"
    | "$pattern"
    | "$iPattern"
    | "$startsWith"
    | "$endsWith"]?: string;
};
export type ComparableType = number | Date;
export type ComparableTypeFilter<T extends ComparableType> = {
  [key in "$gt" | "$lt" | "$ge" | "$le"]?: T;
};
export type ArrayFilter<T> =
  | {
      [key in "$includes"]?:
        | SingleOrArray<PropertyFilter<T> | ValueTypeFilters<T>>
        | IncludesFilter<T>;
    }
  | {
      [key in "$includesAll" | "$includesNone" | "$includesAny"]?:
        | T
        | Array<
            | PropertyFilter<T>
            | {
                $not: PropertyFilter<T>;
              }
          >;
    };
export type ValueTypeFilters<T> = T | T extends string
  ? StringTypeFilter
  : T extends number
  ? ComparableTypeFilter<number>
  : T extends Date
  ? ComparableTypeFilter<Date>
  : T extends Array<infer T>
  ? ArrayFilter<T>
  : never;
/**
* AggregatorFilter
* Example:
{
"filter": {
    "$any": {
      "settings.dark": true,
      "settings.plan": "free"
    }
},
}
{
"filter": {
  "$any": [
    {
      "name": "r1",
    },
    {
      "name": "r2",
    },
  ],
}
*/
export type AggregatorFilter<T> = {
  [key in "$all" | "$any" | "$not" | "$none"]?: SingleOrArray<Filter<T>>;
};
/**
 * Existance filter
 * Example: { filter: { $exists: "settings" } }
 */
export type ExistanceFilter<Record> = {
  [key in "$exists" | "$notExists"]?: FilterColumns<Record>;
};
export type BaseApiFilter<Record> =
  | PropertyAccessFilter<Record>
  | AggregatorFilter<Record>
  | ExistanceFilter<Record>;
/**
 * Nested filter
 * Injects the Api filters on nested properties
 * Example: { filter: { settings: { plan: { $any: ['free', 'trial'] } } } }
 */
export type NestedApiFilter<T> = {
  [key in keyof T]?: T[key] extends Record<string, any>
    ? SingleOrArray<Filter<T[key]>>
    : PropertyFilter<T[key]>;
};
export type Filter<T> = T extends Record<string, any>
  ? T extends (infer ArrayType)[]
    ?
        | ArrayType
        | ArrayType[]
        | ArrayFilter<ArrayType>
        | ArrayFilter<ArrayType[]>
    : T extends Date
    ? PropertyFilter<T>
    : BaseApiFilter<T> | NestedApiFilter<T>
  : PropertyFilter<T>;
