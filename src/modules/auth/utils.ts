import { cookies as getCookies } from "next/headers";

interface Props {
  prefix: string;
  value: string;
};

export const generateAuthCookie = async ({
  prefix,
  value,
}: Props) => {
  const cookies = await getCookies();

  const isProduction = process.env.NODE_ENV === "production";
  const isLocalhost = process.env.NEXT_PUBLIC_ROOT_DOMAIN?.includes("localhost");

  cookies.set({
    name: `${prefix}-token`,
    value,
    httpOnly: true,
    path: "/",
    // For production with actual domain (not localhost)
    ...(isProduction && !isLocalhost && {
      sameSite: "none",
      domain: process.env.NEXT_PUBLIC_ROOT_DOMAIN,
      secure: true,
    }),
    // For localhost in production mode or development
    ...((isLocalhost || !isProduction) && {
      sameSite: "lax",
      // Don't set domain for localhost - let browser handle it
    }),
  });
};

export const clearAuthCookie = async (prefix: string) => {
  const cookies = await getCookies();

  const isProduction = process.env.NODE_ENV === "production";
  const isLocalhost = process.env.NEXT_PUBLIC_ROOT_DOMAIN?.includes("localhost");

  cookies.set({
    name: `${prefix}-token`,
    value: "",
    httpOnly: true,
    path: "/",
    maxAge: 0, // Expire immediately
    // For production with actual domain (not localhost)
    ...(isProduction && !isLocalhost && {
      sameSite: "none",
      domain: process.env.NEXT_PUBLIC_ROOT_DOMAIN,
      secure: true,
    }),
    // For localhost in production mode or development
    ...((isLocalhost || !isProduction) && {
      sameSite: "lax",
      // Don't set domain for localhost - let browser handle it
    }),
  });
};
