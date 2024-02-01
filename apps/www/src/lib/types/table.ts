import {
  CoreInstance,
  HeadersInstance,
  VisibilityInstance,
  ColumnOrderInstance,
  ColumnPinningInstance,
  RowPinningInstance,
  FiltersInstance,
  SortingInstance,
  GroupingInstance,
  ColumnSizingInstance,
  ExpandedInstance,
  PaginationInstance,
  RowSelectionInstance,
  VisibilityOptions,
  ColumnOrderOptions,
  ColumnPinningOptions,
  RowPinningOptions,
  FiltersOptions,
  SortingOptions,
  GroupingOptions,
  ExpandedOptions,
  ColumnSizingOptions,
  PaginationOptions,
  RowSelectionOptions,
  CoreOptions,
  PartialKeys,
  CoreTableState,
  VisibilityTableState,
  ColumnOrderTableState,
  ColumnPinningTableState,
  RowPinningTableState,
  FiltersTableState,
  SortingTableState,
  ExpandedTableState,
  GroupingTableState,
  ColumnSizingTableState,
  PaginationTableState,
  RowSelectionTableState,
  PaginationInitialTableState,
  CoreRow,
  VisibilityRow,
  ColumnPinningRow,
  RowPinningRow,
  FiltersRow,
  GroupingRow,
  RowSelectionRow,
  ExpandedRow,
  HeaderContext,
  CellContext,
  UnionToIntersection,
  CoreColumn,
  ColumnPinningColumn,
  FiltersColumn,
  SortingColumn,
  GroupingColumn,
  ColumnSizingColumn,
  CoreCell,
  GroupingCell,
  CoreHeader,
  ColumnSizingHeader,
  CoreHeaderGroup,
  ColumnPinningColumnDef,
  ColumnSizingColumnDef,
  FiltersColumnDef,
  GroupingColumnDef,
  SortingColumnDef,
  VisibilityColumn,
} from "@tanstack/react-table";

export interface VisibilityColumnDef {
  enableHiding?: boolean;
  show?: boolean;
}

export interface TableMeta<TData extends RowData> {}
export interface ColumnMeta<TData extends RowData, TValue> {}
export interface FilterMeta {}
export interface FilterFns {}
export interface SortingFns {}
export interface AggregationFns {}
export type Updater<T> = T | ((old: T) => T);
export type OnChangeFn<T> = (updaterOrValue: Updater<T>) => void;
export type RowData = unknown | object | any[];
export type AnyRender = (Comp: any, props: any) => any;
export interface Table<TData extends RowData>
  extends CoreInstance<TData>,
    HeadersInstance<TData>,
    VisibilityInstance<TData>,
    ColumnOrderInstance<TData>,
    ColumnPinningInstance<TData>,
    RowPinningInstance<TData>,
    FiltersInstance<TData>,
    SortingInstance<TData>,
    GroupingInstance<TData>,
    ColumnSizingInstance,
    ExpandedInstance<TData>,
    PaginationInstance<TData>,
    RowSelectionInstance<TData> {}
interface FeatureOptions<TData extends RowData>
  extends VisibilityOptions,
    ColumnOrderOptions,
    ColumnPinningOptions,
    RowPinningOptions<TData>,
    FiltersOptions<TData>,
    SortingOptions<TData>,
    GroupingOptions,
    ExpandedOptions<TData>,
    ColumnSizingOptions,
    PaginationOptions,
    RowSelectionOptions<TData> {}
export type TableOptionsResolved<TData extends RowData> = CoreOptions<TData> &
  FeatureOptions<TData>;
export interface TableOptions<TData extends RowData>
  extends PartialKeys<
    TableOptionsResolved<TData>,
    "state" | "onStateChange" | "renderFallbackValue"
  > {}
export interface TableState
  extends CoreTableState,
    VisibilityTableState,
    ColumnOrderTableState,
    ColumnPinningTableState,
    RowPinningTableState,
    FiltersTableState,
    SortingTableState,
    ExpandedTableState,
    GroupingTableState,
    ColumnSizingTableState,
    PaginationTableState,
    RowSelectionTableState {}
interface CompleteInitialTableState
  extends CoreTableState,
    VisibilityTableState,
    ColumnOrderTableState,
    ColumnPinningTableState,
    RowPinningTableState,
    FiltersTableState,
    SortingTableState,
    ExpandedTableState,
    GroupingTableState,
    ColumnSizingTableState,
    PaginationInitialTableState,
    RowSelectionTableState {}
export interface InitialTableState extends Partial<CompleteInitialTableState> {}
export interface Row<TData extends RowData>
  extends CoreRow<TData>,
    VisibilityRow<TData>,
    ColumnPinningRow<TData>,
    RowPinningRow,
    FiltersRow<TData>,
    GroupingRow,
    RowSelectionRow,
    ExpandedRow {}
export interface RowModel<TData extends RowData> {
  rows: Row<TData>[];
  flatRows: Row<TData>[];
  rowsById: Record<string, Row<TData>>;
}
export type AccessorFn<TData extends RowData, TValue = unknown> = (
  originalRow: TData,
  index: number
) => TValue;
export type ColumnDefWithShowTemplate<TProps extends object> =
  | string
  | ((props: TProps) => any);
export type StringOrTemplateHeader<TData, TValue> =
  | string
  | ColumnDefWithShowTemplate<HeaderContext<TData, TValue>>;

interface ColumnStyling {
  border?: "l" | "r" | "x" | false;
}

export interface StringHeaderIdentifier extends ColumnStyling {
  header: string;
  id?: string;
}

export interface IdIdentifier<TData extends RowData, TValue>
  extends ColumnStyling {
  id: string;
  title: string;
  header?: StringOrTemplateHeader<TData, TValue>;
}
type ColumnIdentifiers<TData extends RowData, TValue> =
  | IdIdentifier<TData, TValue>
  | StringHeaderIdentifier;
interface ColumnDefWithShowExtensions<TData extends RowData, TValue = unknown>
  extends VisibilityColumnDef,
    ColumnPinningColumnDef,
    FiltersColumnDef<TData>,
    SortingColumnDef<TData>,
    GroupingColumnDef<TData, TValue>,
    ColumnSizingColumnDef {}
export interface ColumnDefWithShowBase<TData extends RowData, TValue = unknown>
  extends ColumnDefWithShowExtensions<TData, TValue> {
  getUniqueValues?: AccessorFn<TData, unknown[]>;
  footer?: ColumnDefWithShowTemplate<HeaderContext<TData, TValue>>;
  cell?: ColumnDefWithShowTemplate<CellContext<TData, TValue>>;
  meta?: ColumnMeta<TData, TValue>;
}
export interface IdentifiedColumnDefWithShow<
  TData extends RowData,
  TValue = unknown
> extends ColumnDefWithShowBase<TData, TValue> {
  id?: string;
  header?: StringOrTemplateHeader<TData, TValue>;
}
export type DisplayColumnDefWithShow<
  TData extends RowData,
  TValue = unknown
> = ColumnDefWithShowBase<TData, TValue> & ColumnIdentifiers<TData, TValue>;
interface GroupColumnDefWithShowBase<TData extends RowData, TValue = unknown>
  extends ColumnDefWithShowBase<TData, TValue> {
  columns?: ColumnDefWithShow<TData, any>[];
}
export type GroupColumnDefWithShow<
  TData extends RowData,
  TValue = unknown
> = GroupColumnDefWithShowBase<TData, TValue> &
  ColumnIdentifiers<TData, TValue>;
interface AccessorFnColumnDefWithShowBase<
  TData extends RowData,
  TValue = unknown
> extends ColumnDefWithShowBase<TData, TValue> {
  accessorFn: AccessorFn<TData, TValue>;
}
export type AccessorFnColumnDefWithShow<
  TData extends RowData,
  TValue = unknown
> = AccessorFnColumnDefWithShowBase<TData, TValue> &
  ColumnIdentifiers<TData, TValue>;
export interface AccessorKeyColumnDefWithShowBase<
  TData extends RowData,
  TValue = unknown
> extends ColumnDefWithShowBase<TData, TValue> {
  id?: string;
  accessorKey: (string & {}) | keyof TData;
}
export type AccessorKeyColumnDefWithShow<
  TData extends RowData,
  TValue = unknown
> = AccessorKeyColumnDefWithShowBase<TData, TValue> &
  Partial<ColumnIdentifiers<TData, TValue>>;
export type AccessorColumnDefWithShow<
  TData extends RowData,
  TValue = unknown
> =
  | AccessorKeyColumnDefWithShow<TData, TValue>
  | AccessorFnColumnDefWithShow<TData, TValue>;
export type ColumnDefWithShow<TData extends RowData, TValue = unknown> =
  | DisplayColumnDefWithShow<TData, TValue>
  | GroupColumnDefWithShow<TData, TValue>
  | AccessorColumnDefWithShow<TData, TValue>;
export type ColumnDefWithShowResolved<
  TData extends RowData,
  TValue = unknown
> = Partial<UnionToIntersection<ColumnDefWithShow<TData, TValue>>> & {
  accessorKey?: string;
};
export interface Column<TData extends RowData, TValue = unknown>
  extends CoreColumn<TData, TValue>,
    VisibilityColumn,
    ColumnPinningColumn,
    FiltersColumn<TData>,
    SortingColumn<TData>,
    GroupingColumn<TData>,
    ColumnSizingColumn {}
export interface Cell<TData extends RowData, TValue>
  extends CoreCell<TData, TValue>,
    GroupingCell {}
export interface Header<TData extends RowData, TValue>
  extends CoreHeader<TData, TValue>,
    ColumnSizingHeader {}
export interface HeaderGroup<TData extends RowData>
  extends CoreHeaderGroup<TData> {}
export {};
