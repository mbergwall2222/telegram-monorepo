"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useDebouncedCallback } from "use-debounce";

export const WorkspaceInput = () => {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const debounced = useDebouncedCallback(
    // function
    (value: string) => {
      handleSearch(value);
    },
    // delay in ms
    1000
  );

  function handleSearch(term: string) {
    const params = new URLSearchParams(
      searchParams as unknown as URLSearchParams
    );
    if (term) {
      params.set("query", term);
    } else {
      params.delete("query");
    }
    replace(`${pathname}?${params.toString()}`);
  }

  function toggleFilter(filter: string) {
    const params = new URLSearchParams(
      searchParams as unknown as URLSearchParams
    );
    if (params.has(filter)) {
      params.delete(filter);
    } else {
      params.set(filter, "true");
    }
    replace(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        Filters:
        <div className="flex items-center space-x-2">
          <Checkbox
            id="chats"
            checked={!searchParams.has("disableChatsFilter")}
            onClick={() => toggleFilter("disableChatsFilter")}
          />
          <label
            htmlFor="chats"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Chats
          </label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="users"
            checked={!searchParams.has("disableUsersFilter")}
            onClick={() => toggleFilter("disableUsersFilter")}
          />
          <label
            htmlFor="user"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Users
          </label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="messages"
            checked={!searchParams.has("disableMessagesFilter")}
            onClick={() => toggleFilter("disableMessagesFilter")}
          />
          <label
            htmlFor="messages"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Messages
          </label>
        </div>
      </div>
      <Input
        placeholder="Search..."
        onChange={(e) => {
          debounced(e.target.value);
        }}
        defaultValue={searchParams.get("query")?.toString()}
      />
    </div>
  );
};
