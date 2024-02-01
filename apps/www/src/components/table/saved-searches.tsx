import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Avatar, AvatarImage } from "@radix-ui/react-avatar";
import { DropdownMenuIcon, PlusCircledIcon } from "@radix-ui/react-icons";
import { useQuery } from "@tanstack/react-query";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import { ArrowRightCircle, Check, CheckIcon, Filter } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { AvatarFallback } from "@/components/ui/avatar";
import { SavedSearch } from "@/lib/types/searches";
import { useAuth } from "@clerk/nextjs";

export type ISavedSearchesProps = {
  currentId: string | null;
  queryKey: string;
  getSearches: () => Promise<SavedSearch[]>;
  entityType: "users" | "messages" | "chats";
};

export const SavedSearches = ({
  currentId,
  queryKey,
  getSearches,
  entityType,
}: ISavedSearchesProps) => {
  const auth = useAuth();
  const [open, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [value, setValue] = useState("");
  const { data } = useQuery({
    queryKey: [queryKey, auth.orgId, auth.userId],
    queryFn: getSearches,
  });

  const currentSearch = data?.find((s) => s.id === currentId);

  useEffect(() => {
    setIsOpen(false);
  }, [currentSearch]);

  const filteredData = data?.filter((search) =>
    search.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Popover open={open} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 border-dashed data-[state=open]:bg-accent"
        >
          {currentSearch ? (
            <>
              <ArrowRightCircle className="mr-2 h-4 w-4" />
              {currentSearch.name}{" "}
            </>
          ) : (
            <>
              <DropdownMenuIcon className="mr-2 h-4 w-4" />
              Select Saved Search...
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-fit p-0" align="start">
        {!data ? (
          "Loading..."
        ) : (
          <Command shouldFilter={false}>
            <CommandInput
              value={searchQuery}
              onValueChange={(ev) => setSearchQuery(ev)}
              placeholder="Search for filter..."
            />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup>
                {filteredData?.map((search) => (
                  <CommandItem key={search.id} value={search.id}>
                    <Link
                      href={`/data/${entityType}/?${search.params}&searchId=${search.id}`}
                      className="flex items-center w-full justify-start text-nowrap gap-2"
                    >
                      <Avatar className="flex items-center justify-between">
                        <AvatarImage
                          className="w-6 h-6 rounded-full"
                          src={search.user.imageUrl}
                        />
                        <AvatarFallback>
                          {search.user.firstName?.slice(0, 1).toUpperCase()}
                          {search.user.lastName?.slice(0, 1).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {search.name}
                    </Link>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        )}
      </PopoverContent>
    </Popover>
  );
};
