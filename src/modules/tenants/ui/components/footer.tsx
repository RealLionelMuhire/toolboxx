import Link from "next/link";
import { Poppins } from "next/font/google";

import { cn } from "@/lib/utils";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["700"],
});

export const Footer = () => {
  // Always redirect to root domain
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN;
  const homeUrl = rootDomain 
    ? `https://${rootDomain}` 
    : process.env.NEXT_PUBLIC_APP_URL || '/';

  return (
    <footer className="border-t font-medium bg-white">
      <div className="max-w-(--breakpoint-xl) mx-auto flex items-center h-full gap-2 px-4 py-6 lg:px-12">
        <p>Powered by</p>
        <Link href={homeUrl}>
          <span className={cn("text-2xl font-semibold", poppins.className)}>
            Toolbay
          </span>
        </Link>
      </div>
    </footer>
  );
};
