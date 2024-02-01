import { Table } from "@tanstack/react-table";
import { Separator } from "@/components/ui/separator";
import { ISavedSearchesProps, SavedSearches } from "./saved-searches";
import { ISaveSearchProps, SaveSearch } from "./save-search";
import { Button } from "@/components/ui/button";
import { Edit, EyeOff, Plus, XCircle } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { parseAsBoolean, useQueryState } from "next-usequerystate";

export type IFilterOptions<TData> = {
  table: Table<TData>;
  clearAllFilters: () => void;
  Filters: React.ComponentType<{ table: Table<TData> }>;
  searches: {
    queryKey: string;
    getSearches: ISavedSearchesProps["getSearches"];
    entityType: ISavedSearchesProps["entityType"];
    saveSearch: ISaveSearchProps["saveSearch"];
  };
};
export const FilterOptions = <TData,>({
  table,
  clearAllFilters,
  Filters,
  searches,
}: IFilterOptions<TData>) => {
  const columnFilters = table.getState().columnFilters;
  const isFiltering = useMemo(() => {
    if (!columnFilters.length) return false;
    return columnFilters.some((f) => {
      const value = f.value as object;

      if (Array.isArray(value)) {
        return value.filter((o) => typeof o != "undefined").length > 0;
      } else {
        return (
          Object.values(value).filter((o) => typeof o != "undefined").length > 0
        );
      }
    });
  }, [columnFilters]);

  const [showFilters, setShowFilters] = useQueryState(
    "showFilters",
    parseAsBoolean.withDefault(false)
  );

  console.log("showFilters", showFilters);
  console.log("isFiltering", isFiltering);
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const clearSavedSearch = useCallback(() => {
    if (!searchParams.get("searchId")) return;

    router.push(pathname);
  }, [searchParams, pathname]);

  const savedSearch = searchParams.get("searchId");

  console.log("SavedSerach", savedSearch);

  const showSavedSearches = !showFilters || !!savedSearch;
  return (
    <div className="flex flex-wrap flex-1 gap-2 items-center">
      {showFilters && !savedSearch && <Filters table={table} />}
      {showSavedSearches && (
        <SavedSearches
          currentId={savedSearch}
          queryKey={searches.queryKey}
          getSearches={searches.getSearches}
          entityType={searches.entityType}
        />
      )}
      {savedSearch && false && (
        <Button
          variant="outline"
          size="sm"
          className="h-8"
          onClick={() => {
            setShowFilters(true);
          }}
        >
          <Edit className="mr-2 h-4 w-4" />
          Edit Filter
        </Button>
      )}
      {!showFilters && !savedSearch && (
        <Button
          variant="outline"
          size="sm"
          className="h-8"
          onClick={() => {
            clearSavedSearch();
            clearAllFilters();
            setShowFilters(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Filter
        </Button>
      )}
      {showFilters && !isFiltering && (
        <Button
          variant="outline"
          size="sm"
          className="h-8"
          onClick={() => {
            setShowFilters(false);
          }}
        >
          <EyeOff className="mr-2 h-4 w-4" />
          Hide Filters
        </Button>
      )}
      {isFiltering && (
        <Button
          variant="outline"
          size="sm"
          className="h-8"
          onClick={() => {
            clearAllFilters();
            clearSavedSearch();
          }}
        >
          <XCircle className="mr-2 h-4 w-4" />
          Clear Filters
        </Button>
      )}
      {isFiltering && !savedSearch && (
        <SaveSearch
          isAsNew={!!savedSearch}
          queryKey={searches.queryKey}
          saveSearch={searches.saveSearch}
        />
      )}
    </div>
  );
};
