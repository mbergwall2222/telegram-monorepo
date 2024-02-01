import { valueFormatter } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Skeleton } from "../ui/skeleton";

export const CardLoader = ({
  title,
  height,
}: {
  title: string;
  height?: string;
}) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          <Skeleton style={{ height: height ?? "32px" }} className=" w-full" />
        </div>
      </CardContent>
    </Card>
  );
};
