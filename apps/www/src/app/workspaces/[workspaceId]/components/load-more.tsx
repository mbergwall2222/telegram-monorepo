"use client";
import * as React from "react";

type loadMoreAction<Data extends { offset: number | string | null }> =
  Data["offset"] extends number
    ? (data: Data) => Promise<readonly [React.JSX.Element, Data]>
    : Data["offset"] extends string
      ? (data: Data) => Promise<readonly [React.JSX.Element, Data]>
      : any;

const LoadMore = <T extends { offset: number | string | null }>({
  children,
  initialOffset,
  loadMoreAction,
}: React.PropsWithChildren<{
  initialOffset: T;
  loadMoreAction: loadMoreAction<T>;
}>) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const [loadMoreNodes, setLoadMoreNodes] = React.useState<React.JSX.Element[]>(
    []
  );

  const [disabled, setDisabled] = React.useState(false);
  const currentOffsetRef = React.useRef<T>(initialOffset);
  const [scrollLoad, setScrollLoad] = React.useState(true);
  const [loading, setLoading] = React.useState(false);

  const loadMore = React.useCallback(
    async (abortController?: AbortController) => {
      setLoading(true);
      if (currentOffsetRef.current.offset == null) return;

      loadMoreAction(currentOffsetRef.current)
        .then(([node, next]) => {
          console.log(next);
          if (abortController?.signal.aborted) return;

          setLoadMoreNodes((prev) => [...prev, node]);
          if (next.offset === null) {
            console.log("Disabled");
            currentOffsetRef.current.offset = null;
            setDisabled(true);
            return;
          }

          currentOffsetRef.current = next;
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    },
    [loadMoreAction]
  );

  React.useEffect(() => {
    const signal = new AbortController();

    const element = ref.current;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !disabled) {
        loadMore(signal);
      }
    });

    if (element && scrollLoad) {
      observer.observe(element);
    }

    return () => {
      signal.abort();
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [loadMore, scrollLoad, disabled]);

  return (
    <>
      {children}
      {loadMoreNodes}
      <div className="flex justify-center items-center" ref={ref}>
        {loading && "Loading..."}
      </div>
    </>
  );
};

export default LoadMore;
