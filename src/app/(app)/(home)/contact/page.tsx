import { Mail, MapPin, Phone } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us | Toolbay",
  description: "Get in touch with Toolbay for any questions, support, or partnership inquiries.",
};

export const dynamic = "force-dynamic";

const Page = () => {
  return (
    <div className="container mx-auto px-4 py-12 md:py-24 max-w-4xl">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 mb-4">
          Contact Us
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Have questions about our platform or need help finding the right equipment? 
          Our team is here to help. Reach out to us through any of the channels below.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Phone */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center hover:shadow-md transition-shadow">
          <div className="mx-auto w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mb-4">
            <Phone className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Call Us</h3>
          <p className="text-gray-500 mb-4 text-sm">
            Mon-Sat from 8am to 5pm
          </p>
          <a 
            href="tel:+250788474297" 
            className="text-orange-600 font-medium hover:text-orange-700 transition-colors"
          >
            +250 788 474 297
          </a>
        </div>

        {/* Email */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center hover:shadow-md transition-shadow">
          <div className="mx-auto w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mb-4">
            <Mail className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Email Us</h3>
          <p className="text-gray-500 mb-4 text-sm">
            We usually respond within 24 hours
          </p>
          <a 
            href="mailto:support@toolbay.net" 
            className="text-orange-600 font-medium hover:text-orange-700 transition-colors"
          >
            support@toolbay.net
          </a>
        </div>

        {/* Office */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center hover:shadow-md transition-shadow md:col-span-2 lg:col-span-1">
          <div className="mx-auto w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mb-4">
            <MapPin className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Office</h3>
          <p className="text-gray-500 mb-4 text-sm">
            Come visit our headquarters
          </p>
          <p className="text-gray-900 font-medium">
            Kigali, Rwanda
          </p>
        </div>
      </div>
      
      <div className="mt-16 bg-orange-50 rounded-2xl p-8 text-center border border-orange-100">
        <h2 className="text-2xl font-semibold text-gray-900 mb-3">Looking to become a seller?</h2>
        <p className="text-gray-600 mb-6 max-w-xl mx-auto">
          Join hundreds of other businesses selling their construction materials and equipment on Toolbay.
        </p>
        <a 
          href="/sign-up" 
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-orange-600 text-white hover:bg-orange-700 h-10 px-8 py-2"
        >
          Create Seller Account
        </a>
      </div>
    </div>
  );
};

export default Page;
