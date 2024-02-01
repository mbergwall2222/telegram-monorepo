import { Suspense } from "react";
import { CardLoader } from "./CardLoader";

export const WrappedDataCard = ({
  title,
  height,
  children,
}: React.PropsWithChildren<{ title: string; height?: string }>) => {
  return (
    <Suspense fallback={<CardLoader title={title} height={height} />}>
      {children}
    </Suspense>
  );
};
