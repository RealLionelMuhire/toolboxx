import { cookies as getCookies } from "next/headers";
import { getNextAuthCookieOptions } from "@/lib/auth-cookie-options";

interface Props {
  prefix: string;
  value: string;
  rememberMe?: boolean; // If true, session persists; if false, session expires when browser closes
};

export const generateAuthCookie = async ({
  prefix,
  value,
  rememberMe = true, // Default to persistent session
}: Props) => {
  const cookies = await getCookies();

  // Set maxAge based on rememberMe
  // If rememberMe is true: 30 days (2592000 seconds)
  // If rememberMe is false: undefined (session cookie - expires when browser closes)
  const maxAge = rememberMe ? 30 * 24 * 60 * 60 : undefined;

  cookies.set({
    name: `${prefix}-token`,
    value,
    httpOnly: true,
    path: "/",
    maxAge, // Session persists for 30 days if rememberMe, otherwise expires on browser close
    ...getNextAuthCookieOptions(),
  });
};

export const clearAuthCookie = async (prefix: string) => {
  const cookies = await getCookies();

  cookies.set({
    name: `${prefix}-token`,
    value: "",
    httpOnly: true,
    path: "/",
    maxAge: 0, // Expire immediately
    ...getNextAuthCookieOptions(),
  });
};
