import { subscribeToQueryUpdates } from "next-usequerystate";
import { ReadonlyURLSearchParams, useSearchParams } from "next/navigation";
import { useLayoutEffect, useState } from "react";

export const useSubscribedSearchParams = () => {
  const _searchParams = useSearchParams();
  const [searchParams, setSearchParams] = useState<any>(_searchParams);

  useLayoutEffect(
    () =>
      subscribeToQueryUpdates(({ search }) => {
        setSearchParams(search);
      }),
    // * This returns an unsubscribe function
    []
  );

  return searchParams;
};
