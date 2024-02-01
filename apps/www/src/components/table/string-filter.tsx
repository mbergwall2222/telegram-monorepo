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
import { useEffect, useState } from "react";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { StringFilterType } from "@/schemas/table";
import { Badge } from "@/components/ui/badge";
import { useDebounce } from "use-debounce";

type IStringFilterProps = {
  title: string;
  column?: Column<any, unknown>;
  canFilterLength?: boolean;
  canFilterLike?: boolean;
};
export const StringFilter = ({
  title,
  column,
  canFilterLength = false,
  canFilterLike = false,
}: IStringFilterProps) => {
  const filterValue = column?.getFilterValue() as StringFilterType;
  const isFilteringNull = typeof filterValue?.isNull != "undefined";

  const [filterLength, setFilterLength] = useState(false);
  const [filterKeyword, setFilterKeyword] = useState(
    filterValue && "keyword" in filterValue
  );

  const showNonNullFilters = isFilteringNull && !filterValue.isNull;

  const [keywordValue, setKeywordValue] = useState<string | undefined>(
    filterValue
      ? "keyword" in filterValue
        ? filterValue.keyword ?? undefined
        : undefined
      : undefined
  );
  const isKeywordError =
    typeof keywordValue == "undefined" || keywordValue.length < 4;

  const [debouncedKeywordValue] = useDebounce(keywordValue, 1000);

  useEffect(() => {
    if (typeof keywordValue == "undefined") return;
    if (filterKeyword && !isKeywordError) {
      column?.setFilterValue({
        ...filterValue,
        keyword: debouncedKeywordValue,
      });
    } else if (isKeywordError) {
      column?.setFilterValue({
        ...filterValue,
        keyword: undefined,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedKeywordValue]);

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
          {!!Object.keys(filterValue ?? {}).length && (
            <>
              <Separator orientation="vertical" className="mx-2 h-4" />
              <Badge
                variant="secondary"
                className="rounded-sm px-1 font-normal lg:hidden"
              >
                Filtered
              </Badge>
              <div className="hidden space-x-1 lg:flex">
                {Object.keys(filterValue ?? {}).length > 2 ? (
                  <Badge
                    variant="secondary"
                    className="rounded-sm px-1 font-normal"
                  >
                    {Object.keys(filterValue ?? {}).length} filters
                  </Badge>
                ) : (
                  <>
                    {`keyword` in filterValue &&
                      filterValue.keyword?.length && (
                        <Badge
                          variant="secondary"
                          className="rounded-sm px-1 font-normal"
                        >
                          Keyword
                        </Badge>
                      )}
                    {typeof filterValue.isNull ==
                    "undefined" ? null : filterValue.isNull ? (
                      <Badge
                        variant="secondary"
                        className="rounded-sm px-1 font-normal"
                      >
                        Null Only
                      </Badge>
                    ) : (
                      <Badge
                        variant="secondary"
                        className="rounded-sm px-1 font-normal"
                      >
                        Not Null
                      </Badge>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96">
        <div className="grid gap-4">
          <div className="flex gap-4">
            <div className="flex flex-col gap-2">
              <h4 className="font-medium leading-none">Nullity Filter</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Filter the value based on whether it&apos;s null (undefined) or
                not.
              </p>
            </div>
            <div className="flex text-nowrap flex-1 gap-2 items-center">
              <Switch
                className=""
                checked={isFilteringNull}
                onCheckedChange={(state) =>
                  column?.setFilterValue({ isNull: state ? false : undefined })
                }
              >
                <div className="mr-4">Nullity</div>
              </Switch>
            </div>
          </div>
          {isFilteringNull && (
            <RadioGroup
              className="flex justify-center gap-2"
              value={filterValue.isNull ? "null" : "notNull"}
              onValueChange={(value) =>
                column?.setFilterValue({ isNull: value == "null" })
              }
              orientation="horizontal"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="notNull" id="r1" />
                <Label className="cursor-pointer" htmlFor="r1">
                  Not Null / Defined
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="null" id="r2" />
                <Label className="cursor-pointer" htmlFor="r2">
                  Null / Undefined
                </Label>
              </div>
            </RadioGroup>
          )}
          {showNonNullFilters && canFilterLength && (
            <>
              <Separator />
              <div className="flex gap-4">
                <div className="flex flex-col gap-2">
                  <h4 className="font-medium leading-none">Filter by Length</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Filter the value based on the min and max length.
                  </p>
                </div>
                <div className="flex text-nowrap flex-1 gap-2 items-center">
                  <Switch
                    className=""
                    checked={filterLength}
                    onCheckedChange={(state) => setFilterLength(state)}
                  >
                    <div className="mr-4">Filter by Length</div>
                    <div />
                  </Switch>
                </div>
              </div>
              <div className="grid gap-2">
                <div className="grid grid-cols-3 items-center gap-4">
                  <Label htmlFor="minLength">Min. Length</Label>
                  <Input
                    className="col-span-2 h-8"
                    defaultValue="1"
                    id="minLength"
                    type="number"
                  />
                </div>
                <div className="grid grid-cols-3 items-center gap-4">
                  <Label htmlFor="maxLength">Max. Length</Label>
                  <Input
                    className="col-span-2 h-8"
                    defaultValue="100"
                    id="maxLength"
                    type="number"
                  />
                </div>
              </div>
            </>
          )}
          {showNonNullFilters && canFilterLike && (
            <>
              <Separator />
              <div className="flex gap-4">
                <div className="flex flex-col gap-2">
                  <h4 className="font-medium leading-none">
                    Filter by Keyword
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Filter the value based on a specific keyword.
                  </p>
                </div>
                <div className="flex text-nowrap flex-1 gap-2 items-center">
                  <Switch
                    className=""
                    checked={filterKeyword}
                    onCheckedChange={(state) => setFilterKeyword(state)}
                  >
                    <div className="mr-4">Filter by Keyword</div>
                    <div />
                  </Switch>
                </div>
              </div>
              {filterKeyword && (
                <div className="grid gap-2">
                  <div className="text-center text-sm">
                    <span className="font-bold">WARNING: </span>
                    <span>
                      This will perform a full wildcard (*keyword*) query on the
                      full database. This is not a full search feature. Use this
                      only if you know what you&apos;re doing.
                    </span>
                  </div>

                  <div className="grid grid-cols-3 items-center gap-4">
                    <Label htmlFor="keyword">Keyword</Label>
                    <Input
                      className="col-span-2 h-8"
                      placeholder="Keyword"
                      id="keyword"
                      value={keywordValue ?? ""}
                      onChange={(ev) => setKeywordValue(ev.target.value)}
                    />
                  </div>
                  {isKeywordError && (
                    <div className="text-center text-sm text-red-600">
                      Your keyword must be at least 4 characters long.
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
