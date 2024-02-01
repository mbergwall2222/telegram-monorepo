"use client";
import * as React from "react";

import {
  Cell,
  ColumnDef,
  ColumnFiltersState,
  ColumnOrderState,
  ColumnSort,
  FilterFn,
  PaginationState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  DataTablePagination,
  DataTableViewOptions,
} from "@/components/ui/data-table";

import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Download, Lock, Save, Unlock } from "lucide-react";
import { IMessage } from "@/lib/types/messages";
import {
  keepPreviousData,
  useQuery,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { getMessages, getUsers } from "@/lib/client/api";
import { Skeleton } from "@/components/ui/skeleton";
import { ZodTypeAny, z } from "zod";
import {
  filterSchema,
  sortSchema,
  stringFiltersSchema,
} from "@/schemas/getUsers";
import {
  useQueryState,
  parseAsInteger,
  parseAsJson,
  parseAsString,
} from "next-usequerystate";
import {
  ColumnFilterStateSchema,
  SortingStateSchema,
  StringFilterType,
} from "@/schemas/table";
import { parseAsFilterState } from "@/schemas/parsers/filter";
import { parseAsSortState } from "@/schemas/parsers/sort";
import { parseAsPaginationState } from "@/schemas/parsers/pagination";
import { ColumnDefWithShow } from "@/lib/types/table";
import { DefaultCell, extractColumnVisibility } from "@/lib/tables";

import { FilterOptions, IFilterOptions } from "./filter-options";
import { toast } from "sonner";

type ZodSchemaWithKeys<Keys extends string> = ZodTypeAny & {
  _output: Record<Keys, any>;
};

interface DataTableProps<TData, TValue, T> {
  columns: ColumnDefWithShow<TData, TValue>[];
  sortSchema: ZodTypeAny;
  paramsSchema: T;
  defaultSortingState: ColumnSort;
  queryKey: string;
  convertFilterState: (state: ColumnFiltersState) => any;
  getData: (params: T) => Promise<{ data: TData[]; totalRecords: number }>;
  Filters: IFilterOptions<TData>["Filters"];
  searches: IFilterOptions<TData>["searches"];
}

const convertSortingState = (
  state: SortingState
): z.infer<typeof sortSchema> => {
  const sorting = state[0];
  if (!sorting) return {};

  const sortColumn = sorting.id.replaceAll("_", ".") as any;
  const sortDir = sorting.desc ? "desc" : "asc";
  return { sortColumn, sortDir };
};

export function DataTable<TData, TValue, TParams>({
  columns,
  defaultSortingState,
  convertFilterState,
  getData,
  queryKey,
  Filters,
  searches,
}: DataTableProps<TData, TValue, TParams>) {
  const [scrollLocked, setScrollLocked] = React.useState(true);

  const [sorting, setSorting] = useQueryState(
    "sort",
    parseAsSortState().withDefault([defaultSortingState])
  );

  const [columnFilters, setColumnFilters] = useQueryState(
    "filter",
    parseAsFilterState().withDefault([])
  );

  const [rowSelection, setRowSelection] = React.useState({});

  const [pagination, setPagination] = useQueryState(
    "page",
    parseAsPaginationState().withDefault({
      pageIndex: 0,
      pageSize: 10,
    })
  );

  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>(extractColumnVisibility(columns));

  const { data, isLoading } = useQuery({
    queryKey: [queryKey, pagination, sorting, columnFilters],
    gcTime: 0,
    queryFn: () =>
      getData({
        offset: pagination.pageIndex * pagination.pageSize,
        pageSize: pagination.pageSize,
        ...convertSortingState(sorting),
        ...convertFilterState(columnFilters),
      }),
    // placeholderData: keepPreviousData,
  });

  const [columnOrder, setColumnOrder] = React.useState<ColumnOrderState>([]);

  const tableData = React.useMemo(
    () =>
      isLoading ? Array(pagination.pageSize * 2).fill({}) : data?.data ?? [],
    [isLoading, data, pagination.pageSize]
  );

  const tableColumns = React.useMemo(
    () =>
      isLoading
        ? columns.map((column) => {
            if ("columns" in column && typeof column.columns != "undefined")
              return {
                ...column,
                columns: column.columns.map((nestedColumn) => ({
                  ...nestedColumn,
                  cell: <Skeleton className="w-full h-5" />,
                })),
              };
            return {
              ...column,
              cell: <Skeleton className="w-full h-5" />,
            } as any;
          })
        : columns,
    [isLoading, columns]
  );

  const realMaxPages = data?.totalRecords
    ? data?.totalRecords > 99999
      ? 9999
      : Math.ceil(data?.totalRecords / pagination.pageSize)
    : -1;

  // const maxPages =  ?

  const table = useReactTable<TData>({
    data: tableData,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    onColumnOrderChange: setColumnOrder,
    manualPagination: true,
    pageCount: realMaxPages,
    manualSorting: true,
    manualFiltering: true,
    defaultColumn: {
      cell: ({ cell }) => <DefaultCell cell={cell} />,
      filterFn: (row, columnId, filterValue) => {
        let value = row.getValue(columnId);
        if (typeof value == "number" || value instanceof Date)
          value = value.toString();
        return (value as string)
          .toLowerCase()
          .includes(filterValue.toString().toLowerCase());
      },
    },
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination,
      columnOrder,
    },
  });

  const clearAllFilters = React.useCallback(() => {
    setColumnFilters([]);
    table.setColumnFilters([]);
  }, [setColumnFilters]);

  console.log(columnFilters);

  return (
    <div className="flex flex-col h-full">
      <div
        className="flex flex-none items-center justify-between py-4"
        suppressHydrationWarning={true}
      >
        <div className="flex items-center gap-4">
          <FilterOptions
            table={table}
            clearAllFilters={clearAllFilters}
            Filters={Filters}
            searches={searches}
          />
        </div>

        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            onClick={() => toast.info("Export features are in development.")}
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          {scrollLocked ? (
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              onClick={() => setScrollLocked(false)}
            >
              <Lock className="mr-2 h-4 w-4" />
              Unlock Scroll
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              onClick={() => setScrollLocked(true)}
            >
              <Unlock className="mr-2 h-4 w-4" />
              Lock Scroll
            </Button>
          )}
          <DataTableViewOptions table={table} />
        </div>
      </div>
      <div
        className={cn("rounded-md border flex-grow", scrollLocked && "min-h-0")}
      >
        <ScrollArea className="h-full">
          <Table>
            <TableHeader className=" z-10 bg-primary-foreground">
              {table.getHeaderGroups().map((headerGroup, i) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const columnDef = header.column
                      .columnDef as ColumnDefWithShow<IMessage>;
                    const border =
                      typeof columnDef.border == "undefined"
                        ? "r"
                        : columnDef.border;
                    return (
                      <TableHead
                        key={header.id}
                        className={cn(
                          "text-center",
                          border ? "border-black " : "",
                          border && border == "x" && "border-x",
                          border && border == "l" && "border-l",
                          border && border == "r" && "border-r",
                          !border && "border-none"
                        )}
                        colSpan={header.colSpan}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>

      <div className="py-4 flex-none">
        <DataTablePagination table={table} />
      </div>
    </div>
  );
}
