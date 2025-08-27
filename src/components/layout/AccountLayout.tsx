"use client";

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface AccountLayoutProps {
  children: React.ReactNode;
  title: string;
}

const navigationItems = [
{ href: "/account/creations", label: "My Creations", icon: "🎨" },
{ href: "/account/billing", label: "Billing & History", icon: "💳" },
{ href: "/account/referrals", label: "Invite Friends", icon: "👥" },
{ href: "/account/profile", label: "Profile Settings", icon: "⚙️" }];


export function AccountLayout({ children, title }: AccountLayoutProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-black text-white" data-oid="-l4nkjq">
      <Header data-oid="s6jqpmz" />

      <main className="py-20" data-oid="k62oh2l">
        <div
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
          data-oid="vd57hgl">

          <div className="grid lg:grid-cols-4 gap-8" data-oid="bu:74jg">
            {/* Sidebar Navigation */}
            <div className="lg:col-span-1" data-oid="-1__8l-">
              <div
                className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 sticky top-24"
                data-oid="o709yje">

                <h2 className="text-lg font-semibold mb-4" data-oid="hoyno8f">
                  Account
                </h2>
                <nav className="space-y-2" data-oid="g.o.:yv">
                  {navigationItems.map((item) =>
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                    pathname === item.href ?
                    "bg-pink-500 text-white" :
                    "text-gray-300 hover:text-white hover:bg-zinc-800"}`
                    }
                    data-oid="eakl7.c">

                      <span data-oid="jdtgcx5">{item.icon}</span>
                      {item.label}
                    </Link>
                  )}
                </nav>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3" data-oid="q1wpfnp">
              <div
                className="bg-zinc-900 rounded-2xl border border-zinc-800"
                data-oid="c6gv_hk">

                <div
                  className="p-6 border-b border-zinc-800"
                  data-oid="0nvvck0">

                  <h1 className="text-2xl font-bold" data-oid="61wbz9w">
                    {title}
                  </h1>
                </div>
                <div className="p-6" data-oid="aym78gw">
                  {children}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer data-oid="eakts.k" />
    </div>);

}