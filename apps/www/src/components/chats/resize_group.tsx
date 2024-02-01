"use client";
import { ResizablePanelGroup } from "@/components/ui/resizable";
import { useParams } from "next/navigation";
import { useCookies } from "next-client-cookies";

export const ResizeGroup = ({
  children,
  defaultLayout,
}: {
  children: React.ReactNode;
  defaultLayout: number[] | undefined;
}) => {
  const params = useParams();
  const cookies = useCookies();

  const onLayout = (sizes: number[]) => {
    cookies.set("layout", JSON.stringify(sizes), {
      expires: 30,
    });
  };

  return (
    <ResizablePanelGroup
      direction="horizontal"
      className="w-full rounded-lg border"
      onLayout={onLayout}
    >
      {children}
    </ResizablePanelGroup>
  );
};
