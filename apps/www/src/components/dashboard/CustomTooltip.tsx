import { valueFormatter } from "@/lib/utils";
import { UTCDate } from "@date-fns/utc";
import { format } from "date-fns";
import { useMemo } from "react";
import { TooltipProps } from "recharts";
import {
  NameType,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";

type CustomTooltipProps<
  TValue extends ValueType,
  TName extends NameType
> = TooltipProps<TValue, TName> & {
  isDate: boolean;
  payloadLabel?: string;
};
export const CustomTooltip = <
  TValue extends ValueType,
  TName extends NameType
>({
  active,
  payload,
  label,
  isDate,
  payloadLabel,
}: CustomTooltipProps<TValue, TName>) => {
  const formattedLabel = useMemo(() => {
    if (!label) return;
    if (isDate) return format(new UTCDate(label), "MMM do yyyy");
    else return label;
  }, [label, isDate]);

  const formattedValue = useMemo(() => {
    if (!payload) return;
    const value = payload?.[0]?.value;
    if (typeof value == "number") return valueFormatter(value);
    return value;
  }, [payload]);

  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 p-3 shadow-lg rounded-lg">
        <p className="text-sm text-gray-800">{formattedLabel}</p>
        <p className="text-sm text-gray-600">{`${
          payloadLabel ?? "Value"
        }: ${formattedValue}`}</p>
      </div>
    );
  }

  return null;
};
