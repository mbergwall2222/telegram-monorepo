"use client";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuViewport,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import { OrganizationSwitcher, SignedIn, UserButton } from "@clerk/nextjs";
import Image from "next/image";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import { ModeToggle } from "./mode-toggle";
import { toast } from "sonner";

const logoLight = require("../../public/logo_light.svg");
const logoDark = require("../../public/logo_dark.svg");

const Link = ({
  href,
  ...props
}: React.ComponentProps<typeof NavigationMenuLink> & { href: string }) => {
  const pathName = usePathname();
  const isActive = pathName === href || pathName.startsWith(`${href}/`);

  return (
    <NextLink href={href} passHref legacyBehavior>
      <NavigationMenuLink
        // className="NavigationMenuLink"
        active={isActive}
        className={navigationMenuTriggerStyle()}
        {...props}
      />
    </NextLink>
  );
};
export const Navigation = () => {
  return (
    <div className="px-8 h-16 w-full border-b border-black flex justify-center items-center relative">
      <NavigationMenu className="gap-4 h-fit">
        <Image src={logoLight} alt="Logo" className="w-20 rounded-sm" />
        <SignedIn>
          <NavigationMenuList>
            <NavigationMenuItem>
              <Link href="/">Home</Link>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Link href="/workspaces">Workspaces</Link>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Data</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid gap-3 p-6 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                  <li className="row-span-3">
                    <NavigationMenuLink asChild>
                      <a
                        className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md"
                        href="/"
                      >
                        <h2 className="text-3xl">𝕏𝟚𝟙</h2>
                        <div className="mb-2 mt-4 text-lg font-medium">
                          Data.
                        </div>
                        <p className="text-sm leading-tight text-muted-foreground">
                          X21 uses the power of data to generate intelligence.
                          Query through the raw, realtime datasets here.
                        </p>
                      </a>
                    </NavigationMenuLink>
                  </li>

                  <ListItem href="/data/messages" title="Messages">
                    View & filter all messages currently stored within X21.
                  </ListItem>

                  <ListItem href="/data/users" title="Users">
                    View & filter all users currently stored within X21.
                  </ListItem>
                  <ListItem
                    href="#"
                    onClick={() => toast.info("Currently in development.")}
                    title="Chat Rooms"
                  >
                    View & filter all chat rooms currently stored within X21.
                  </ListItem>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Link href="/chats">Client</Link>
            </NavigationMenuItem>
          </NavigationMenuList>
        </SignedIn>
      </NavigationMenu>
      <div className="absolute right-4 flex gap-4 items-center">
        <ModeToggle />
        <OrganizationSwitcher />

        <UserButton />
      </div>
    </div>
  );
};

const ListItem = React.forwardRef<
  React.ElementRef<typeof Link>,
  React.ComponentPropsWithoutRef<typeof Link>
>(({ className, title, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <Link
          // ref={ref}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            className
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </Link>
      </NavigationMenuLink>
    </li>
  );
});
ListItem.displayName = "ListItem";
