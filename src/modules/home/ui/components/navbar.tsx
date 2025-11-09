"use client";

import Link from "next/link";
import { useState } from "react";
import { MenuIcon, LogOut } from "lucide-react";
import { Poppins } from "next/font/google";
import { usePathname, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { OptimizedLink } from "@/components/optimized-link";

import { NavbarSidebar } from "./navbar-sidebar";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["700"],
});

interface NavbarItemProps {
  href: string;
  children: React.ReactNode;
  isActive?: boolean;
};

const NavbarItem = ({
  href,
  children,
  isActive,
}: NavbarItemProps) => {
  return (
    <Button
      asChild
      variant="outline"
      className={cn(
        "bg-transparent hover:bg-transparent rounded-full hover:border-primary border-transparent px-3.5 text-lg",
        isActive && "bg-black text-white hover:bg-black hover:text-white",
      )}
    >
      <OptimizedLink href={href}>
        {children}
      </OptimizedLink>
    </Button>
  );
};

const publicNavbarItems = [
  { href: "/", children: "Home" },
  { href: "/about", children: "About" },
  { href: "/features", children: "Features" },
  { href: "/pricing", children: "Pricing" },
  { href: "/contact", children: "Contact" },
];

const customerNavbarItems = [
  { href: "/", children: "Home" },
  { href: "/my-account", children: "My Account" },
  { href: "/orders", children: "My Orders" },
  { href: "/about", children: "About" },
  { href: "/contact", children: "Contact" },
];

const tenantNavbarItems = [
  { href: "/", children: "Home" },
  { href: "/my-products", children: "My Products" },
  { href: "/my-sales", children: "My Sales" },
  { href: "/my-account", children: "My Account" },
  { href: "/orders", children: "My Orders" },
  { href: "/about", children: "About" },
  { href: "/contact", children: "Contact" },
];

export const Navbar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const trpc = useTRPC();
  const queryClient = useQueryClient();
  
  // Configure session query for immediate UI updates
  const session = useQuery({
    ...trpc.auth.session.queryOptions(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    retry: false, // Don't retry session checks
    refetchOnMount: true, // Always check session on mount
    refetchOnWindowFocus: true, // Check session when window regains focus
  });
  
  const logout = useMutation(trpc.auth.logout.mutationOptions({
    onMutate: async () => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries(trpc.auth.session.queryFilter());
      
      // Snapshot the previous value
      const previousSession = queryClient.getQueryData(trpc.auth.session.queryKey());
      
      // Optimistically update to logged-out state immediately
      queryClient.setQueryData(
        trpc.auth.session.queryKey(),
        { user: null, permissions: {} }
      );
      
      return { previousSession };
    },
    onSuccess: () => {
      toast.success("Logged out successfully");
      
      // Navigate to home and refresh any server-side data
      router.push("/");
      router.refresh();
    },
    onError: (error, variables, context) => {
      // Revert to previous state on error
      if (context?.previousSession) {
        queryClient.setQueryData(
          trpc.auth.session.queryKey(),
          context.previousSession
        );
      }
      toast.error(error.message || "Failed to logout");
    },
  }));

  const handleLogout = () => {
    logout.mutate();
  };
  
  // Show tenant items if user is a tenant, customer items if logged in, otherwise show public items
  // While loading, use the cached data to prevent flash
  const navbarItems = session.data?.user 
    ? session.data.user.roles?.includes('tenant') 
      ? tenantNavbarItems 
      : customerNavbarItems 
    : publicNavbarItems;

  return (
    <nav className="h-20 flex border-b justify-between font-medium bg-white">
      <Link href="/" className="pl-6 flex items-center">
        <span className={cn("text-5xl font-semibold", poppins.className)}>
          Toolboxx
        </span>
      </Link>

      <NavbarSidebar
        items={navbarItems}
        open={isSidebarOpen}
        onOpenChange={setIsSidebarOpen}
        isLoggedIn={!!session.data?.user}
        onLogout={handleLogout}
        isLoggingOut={logout.isPending}
      />

      <div className="items-center gap-4 hidden lg:flex">
        {navbarItems.map((item) => (
          <NavbarItem
            key={item.href}
            href={item.href}
            isActive={pathname === item.href}
          >
            {item.children}
          </NavbarItem>
        ))}
      </div>

      {session.data?.user ? (
        <div className="hidden lg:flex items-center">
          <Button
            asChild
            className="border-l border-t-0 border-b-0 border-r-0 px-12 h-full rounded-none bg-black text-white hover:bg-pink-400 hover:text-black transition-colors text-lg"
          >
            <Link 
              href={session.data.user.roles?.includes('super-admin') ? "/admin" : session.data.user.roles?.includes('tenant') ? "/dashboard" : "/my-account"}
              prefetch={true}
            >
              {session.data.user.roles?.includes('super-admin') ? "Admin Panel" : session.data.user.roles?.includes('tenant') ? "Dashboard" : "My Account"}
            </Link>
          </Button>
          <Button
            onClick={handleLogout}
            disabled={logout.isPending}
            className="border-l border-t-0 border-b-0 border-r-0 px-12 h-full rounded-none bg-red-600 text-white hover:bg-red-700 transition-colors text-lg flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            {logout.isPending ? "Logging out..." : "Logout"}
          </Button>
        </div>
      ) : (
        <div className="hidden lg:flex">
          <Button
            asChild
            variant="secondary"
            className="border-l border-t-0 border-b-0 border-r-0 px-12 h-full rounded-none bg-white hover:bg-pink-400 transition-colors text-lg"
          >
            <OptimizedLink prefetch={true} href="/sign-in">
              Log in
            </OptimizedLink>
          </Button>
          <Button
            asChild
            className="border-l border-t-0 border-b-0 border-r-0 px-12 h-full rounded-none bg-black text-white hover:bg-pink-400 hover:text-black transition-colors text-lg"
          >
            <OptimizedLink prefetch={true} href="/sign-up">
              Sign Up
            </OptimizedLink>
          </Button>
        </div>
      )}

      <div className="flex lg:hidden items-center justify-center">
        <Button
          variant="ghost"
          className="size-12 border-transparent bg-white"
          onClick={() => setIsSidebarOpen(true)}
        >
          <MenuIcon />
        </Button>
      </div>
    </nav>
  );
};
