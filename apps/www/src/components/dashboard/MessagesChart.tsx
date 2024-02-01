"use client";
import { Suspense, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { MessagesPerDay } from "./MessagesPerDay";
import { MessagesPerMonth } from "./MessagesPerMonth";
import { Skeleton } from "../ui/skeleton";

export const MessagesChart = () => {
  const [tabValue, setTabValue] = useState("perDay");
  return (
    <Card>
      <Tabs
        value={tabValue}
        onValueChange={(ev) => setTabValue(ev)}
        className=""
      >
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2 w-full">
          <CardTitle className="text-sm font-medium whitespace-nowrap">
            Messages {tabValue == "perDay" ? "per Day" : "per Month"}
          </CardTitle>
          <TabsList className="grid w-52 grid-cols-2">
            <TabsTrigger value="perDay">Per Day</TabsTrigger>
            <TabsTrigger value="perMonth">Per Month</TabsTrigger>
          </TabsList>
        </CardHeader>
        <CardContent>
          <div className="w-full">
            <TabsContent value="perDay">
              <Suspense fallback={<Skeleton className="w-full h-96" />}>
                <MessagesPerDay />
              </Suspense>
            </TabsContent>
            <TabsContent value="perMonth">
              <Suspense fallback={<Skeleton className="w-full h-96" />}>
                <MessagesPerMonth />
              </Suspense>
            </TabsContent>
          </div>
        </CardContent>
      </Tabs>
    </Card>
  );
};
