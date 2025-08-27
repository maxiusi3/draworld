"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { CreditDisplay } from "@/components/ui/CreditDisplay";
import { useAuth } from "@/contexts/AuthContext";

export function Header() {
  const { user, signOut } = useAuth();
  const isLoggedIn = !!user;

  return (
    <header
      className="bg-black/90 backdrop-blur-sm border-b border-zinc-800 sticky top-0 z-50"
      data-oid="ej9k2ie">

      <div
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        data-oid="fyi_p.a">

        <div
          className="flex justify-between items-center h-16"
          data-oid="na4xw74">

          {/* Logo */}
          <Link href="/" className="flex items-center" data-oid="r7in6kx">
            <span className="text-2xl font-bold text-white" data-oid=".3wwoqx">
              Draworld
            </span>
          </Link>

          {/* Navigation */}
          <nav
            className="hidden md:flex items-center space-x-8"
            data-oid="mcyg76q">

            <Link
              href="/create"
              className="text-gray-300 hover:text-white transition-colors"
              data-oid="s5vvl0x">

              Create
            </Link>
            <Link
              href="/gallery"
              className="text-gray-300 hover:text-white transition-colors"
              data-oid="egg03g:">

              Gallery
            </Link>
            <Link
              href="/pricing"
              className="text-gray-300 hover:text-white transition-colors"
              data-oid="14o7hu6">

              Pricing
            </Link>
          </nav>

          {/* Auth Buttons */}
          <div className="flex items-center space-x-4" data-oid="94ny4vw">
            {isLoggedIn ? (
              <div className="flex items-center space-x-4" data-oid="6pr_.ej">
                <CreditDisplay showCheckIn={true} />
                <div className="relative group">
                  <div
                    className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold cursor-pointer"
                    data-oid="rjraoqj"
                  >
                    {user.displayName?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  {/* Dropdown Menu */}
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="py-2">
                      <Link
                        href="/account/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Profile Settings
                      </Link>
                      <Link
                        href="/account/creations"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        My Creations
                      </Link>
                      <Link
                        href="/account/billing"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Billing & Credits
                      </Link>
                      <Link
                        href="/account/referrals"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Referrals
                      </Link>
                      <hr className="my-1" />
                      <button
                        onClick={signOut}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <Button
                  as="link"
                  href="/login"
                  variant="ghost"
                  size="sm"
                  data-oid="oqsnt-q"
                >
                  Log In
                </Button>
                <Button
                  as="link"
                  href="/signup"
                  variant="primary"
                  size="sm"
                  data-oid="y428bau"
                >
                  Sign Up for Free
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>);

}