import { format, parseISO } from "date-fns";
import { ISO_TIMESTAMP } from "./regex";
import { Cell, ColumnDefWithShow } from "./types/table";

export function extractColumnVisibility<TData, TValue>(
  columns: ColumnDefWithShow<TData, TValue>[],
  result: { [id: string]: boolean } = {}
): { [id: string]: boolean } {
  columns.forEach((column) => {
    let id: string | number | symbol | (string & {}) | undefined = column.id;
    if (!id && "accessorKey" in column) {
      id = column.accessorKey;
    }

    if (!id && "header" in column) {
      id = column.header as string;
    }

    if (!id) return;
    if ("columns" in column && typeof column.columns != "undefined") {
      extractColumnVisibility(column.columns, result);
    }
    // Fallback to generating an ID if neither id nor accessorKey are available

    result[id.toString().replaceAll(".", "_")] =
      column.show !== undefined ? column.show : true;
  });

  return result;
}

export const DefaultCell = <TData,>({
  cell,
}: {
  cell: Cell<TData, unknown>;
}) => {
  const value = cell.getValue();
  let parsedValue: React.ReactNode;

  if (typeof value == "string") {
    if (ISO_TIMESTAMP.test(value)) {
      const date = parseISO(value);
      const humanReadableTimestamp = format(date, "yyyy-MM-dd HH:mm");
      parsedValue = humanReadableTimestamp;
    } else parsedValue = value;
  } else if (typeof value == "number")
    parsedValue = Intl.NumberFormat("en-US").format(value);
  else if (
    typeof value == "boolean" ||
    typeof value == "object" ||
    typeof value == "bigint"
  )
    parsedValue = value?.toString();
  else return null;

  return <div className="text-nowrap">{parsedValue}</div>;
};
