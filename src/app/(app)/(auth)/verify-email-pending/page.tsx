"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

export default function VerifyEmailPendingPage() {
  const router = useRouter();
  const trpc = useTRPC();

  // Poll every 3 seconds to check if the user has verified their email
  const { data } = useQuery({
    ...trpc.auth.checkVerification.queryOptions(),
    refetchInterval: 3000,       // re-check every 3 seconds
    refetchIntervalInBackground: true, // keep polling even if tab is not focused
  });

  // Auto-redirect to home as soon as verified
  useEffect(() => {
    if (data?.verified) {
      router.push("/");
      router.refresh();
    }
  }, [data?.verified, router]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 min-h-screen">
      <div className="bg-[#F4F4F0] min-h-screen w-full lg:col-span-3 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-8">

          {/* Logo */}
          <Link href="/">
            <span className="text-2xl font-bold tracking-tight">Toolbay</span>
          </Link>

          {/* Animated envelope + spinner */}
          <div className="flex flex-col items-center gap-4">
            {/* Envelope icon */}
            <div className="w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center">
              <svg
                className="w-10 h-10 text-orange-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>

            {/* Spinning loader */}
            <svg
              className="w-8 h-8 text-orange-400 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
          </div>

          {/* Text */}
          <div>
            <h1 className="text-3xl font-semibold text-gray-900">
              Waiting for verification…
            </h1>
            <p className="mt-3 text-gray-600 leading-relaxed">
              We sent a verification link to your email. Open it and click{" "}
              <strong>Verify Email Address</strong> — this page will
              automatically redirect you once verified.
            </p>
          </div>

          {/* Steps */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 text-left space-y-2">
            <p className="text-sm font-medium text-gray-700">Steps:</p>
            <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
              <li>Open your email inbox</li>
              <li>Find the email from Toolbay</li>
              <li>Click <strong>Verify Email Address</strong></li>
              <li>This page redirects you automatically ✓</li>
            </ol>
          </div>

          <p className="text-sm text-gray-500">
            Didn&apos;t receive the email?{" "}
            <Link
              href="/resend-verification"
              className="text-black font-medium underline underline-offset-2 hover:text-orange-500"
            >
              Resend verification email
            </Link>
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div
        className="h-screen w-full lg:col-span-2 hidden lg:block"
        style={{
          backgroundImage: "url('/auth-bg.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
    </div>
  );
}
