import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="w-full flex justify-center h-full items-center">
      <SignIn
        appearance={{
          elements: {
            footer: "hidden",
          },
        }}
      />
    </div>
  );
}
