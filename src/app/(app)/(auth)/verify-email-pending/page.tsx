import Link from "next/link";

export const metadata = {
  title: "Verify Your Email | Toolbay",
  description: "Please check your inbox to verify your email address.",
};

export default function VerifyEmailPendingPage() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 min-h-screen">
      <div className="bg-[#F4F4F0] min-h-screen w-full lg:col-span-3 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-6">
          {/* Logo */}
          <Link href="/">
            <span className="text-2xl font-bold tracking-tight">Toolbay</span>
          </Link>

          {/* Icon */}
          <div className="flex justify-center">
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
          </div>

          {/* Heading */}
          <div>
            <h1 className="text-3xl font-semibold text-gray-900">
              Check your email
            </h1>
            <p className="mt-3 text-gray-600 leading-relaxed">
              We sent a verification link to your email address. Please click
              the link in the email to activate your account before logging in.
            </p>
          </div>

          {/* Info box */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 text-left space-y-2">
            <p className="text-sm font-medium text-gray-700">What to do next:</p>
            <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
              <li>Open your email inbox</li>
              <li>Find the email from Toolbay</li>
              <li>Click the <strong>Verify Email Address</strong> button</li>
              <li>You&apos;ll be redirected to log in</li>
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

          <p className="text-sm text-gray-500">
            Already verified?{" "}
            <Link
              href="/sign-in"
              className="text-black font-medium underline underline-offset-2 hover:text-orange-500"
            >
              Sign in here
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
