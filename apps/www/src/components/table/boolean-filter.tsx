"use client";

import { Column } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  PopoverTrigger,
  PopoverContent,
  Popover,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { PlusCircledIcon } from "@radix-ui/react-icons";
import { Filter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "../ui/separator";
import { Badge } from "../ui/badge";

type IBooleanFilterProps = {
  title: string;
  column?: Column<any, unknown>;
  canFilterLength?: boolean;
  canFilterLike?: boolean;
};
export const BooleanFilter = ({ title, column }: IBooleanFilterProps) => {
  const filterValue = column?.getFilterValue() as boolean | undefined;

  console.log("filtervalue", filterValue);
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 border-dashed data-[state=open]:bg-accent"
        >
          <Filter className="mr-2 h-4 w-4" />
          {title}
          {typeof filterValue == "boolean" && (
            <>
              <Separator orientation="vertical" className="mx-2 h-4" />
              <Badge
                variant="secondary"
                className="rounded-sm px-1 font-normal "
              >
                {filterValue ? "True" : "False"}
              </Badge>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96">
        <div className="grid gap-4">
          <div className="flex gap-4">
            <div className="flex flex-col gap-2">
              <h4 className="font-medium leading-none">Boolean Filter</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Filter the value based on whether it&apos;s true or false.
              </p>
            </div>
            <div className="flex text-nowrap flex-1 gap-2 items-center">
              <Select
                value={
                  typeof filterValue == "boolean" ? `${filterValue}` : "either"
                }
                onValueChange={(ev) => {
                  console.log(ev, ev === "either" ? undefined : ev === "true");
                  column?.setFilterValue(
                    ev === "either" ? undefined : ev === "true"
                  );
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={`Filter "${title}"`} />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Select Boolean Value</SelectLabel>
                    <SelectItem value="either">Either</SelectItem>
                    <SelectItem value="true">True</SelectItem>
                    <SelectItem value="false">False</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
