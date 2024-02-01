import { CardLoader } from "@/components/dashboard/CardLoader";
import { WrappedDataCard } from "@/components/dashboard/WrappedDataCard";
import { cn } from "@/lib/utils";
import CircleLoader from "react-spinners/CircleLoader";

export default function Loading() {
  return (
    <div className="h-full w-full flex items-center justify-center">
      <div className="lds-ring">
        <div></div>
        <div></div>
        <div></div>
        <div></div>
      </div>
    </div>
  );
}
