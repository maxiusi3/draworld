import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-zinc-900 border-t border-zinc-800" data-oid="7vdnjph">
      <div
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
        data-oid="w1e0mg:">

        <div
          className="grid grid-cols-1 md:grid-cols-4 gap-8"
          data-oid="tvy5-nx">

          {/* Logo & Tagline */}
          <div className="col-span-1 md:col-span-1" data-oid="dgduumu">
            <Link
              href="/"
              className="flex items-center mb-4"
              data-oid="l49w9sk">

              <span
                className="text-2xl font-bold text-white"
                data-oid="q-3v27o">

                Draworld
              </span>
            </Link>
            <p className="text-gray-400 text-sm" data-oid="uwy:87r">
              Where imagination comes to life.
            </p>
          </div>

          {/* Product */}
          <div data-oid="d1f_nrx">
            <h3 className="text-white font-semibold mb-4" data-oid=".qytb0:">
              Product
            </h3>
            <ul className="space-y-2" data-oid="qicru6m">
              <li data-oid="5uoc3n8">
                <Link
                  href="/create"
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                  data-oid="8hs6eiv">

                  Create
                </Link>
              </li>
              <li data-oid="1y32p4a">
                <Link
                  href="/gallery"
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                  data-oid="llxum19">

                  Gallery
                </Link>
              </li>
              <li data-oid="58p_ojr">
                <Link
                  href="/pricing"
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                  data-oid="ctdl7z4">

                  Pricing
                </Link>
              </li>
              <li data-oid="s-s9jq3">
                <Link
                  href="/account/referrals"
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                  data-oid="zah02in">

                  Refer a Friend
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div data-oid="zkwq3_0">
            <h3 className="text-white font-semibold mb-4" data-oid="12_1jqg">
              Company
            </h3>
            <ul className="space-y-2" data-oid="jfsv:8t">
              <li data-oid="-qh7-io">
                <Link
                  href="/about"
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                  data-oid="n4kn89r">

                  About Us
                </Link>
              </li>
              <li data-oid="9.4l2j3">
                <Link
                  href="/careers"
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                  data-oid="9znte9x">

                  Careers
                </Link>
              </li>
              <li data-oid="vy2srz8">
                <Link
                  href="/press"
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                  data-oid="tulz-ue">

                  Press
                </Link>
              </li>
            </ul>
          </div>

          {/* Support & Legal */}
          <div data-oid="9chfy7a">
            <h3 className="text-white font-semibold mb-4" data-oid="v49ec8r">
              Support
            </h3>
            <ul className="space-y-2" data-oid="9wh_gak">
              <li data-oid="ql8:h6k">
                <Link
                  href="/faq"
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                  data-oid="gd_g9s8">

                  FAQ
                </Link>
              </li>
              <li data-oid=".peq1tn">
                <Link
                  href="/contact"
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                  data-oid=".msynht">

                  Contact Us
                </Link>
              </li>
              <li data-oid="nmk9akm">
                <Link
                  href="/terms-of-service"
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                  data-oid="_i_ah9j">

                  Terms of Service
                </Link>
              </li>
              <li data-oid="l.n7rlw">
                <Link
                  href="/privacy-policy"
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                  data-oid=":5aqgoj">

                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div
          className="mt-8 pt-8 border-t border-zinc-800 flex flex-col md:flex-row justify-between items-center"
          data-oid="3f:n4my">

          <p className="text-gray-400 text-sm" data-oid="-q3qa17">
            © 2023 Draworld, Inc. All rights reserved.
          </p>

          {/* Social Media Icons */}
          <div className="flex space-x-4 mt-4 md:mt-0" data-oid="qfpzqnf">
            <a
              href="#"
              className="text-gray-400 hover:text-white transition-colors"
              data-oid="g8c78ox">

              <span className="sr-only" data-oid="6b1tcbb">
                Instagram
              </span>
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 24 24"
                data-oid="a:eqcbd">

                <path
                  d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987s11.987-5.367 11.987-11.987C24.004 5.367 18.637.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.323-1.297C4.198 14.895 3.708 13.744 3.708 12.447s.49-2.448 1.418-3.323c.875-.807 2.026-1.297 3.323-1.297s2.448.49 3.323 1.297c.928.875 1.418 2.026 1.418 3.323s-.49 2.448-1.418 3.244c-.875.807-2.026 1.297-3.323 1.297zm7.83-9.781c-.49 0-.928-.438-.928-.928 0-.49.438-.928.928-.928.49 0 .928.438.928.928 0 .49-.438.928-.928.928zm-7.83 1.513c1.051 0 1.904.853 1.904 1.904s-.853 1.904-1.904 1.904-1.904-.853-1.904-1.904.853-1.904 1.904-1.904z"
                  data-oid=".fpmtpa" />

              </svg>
            </a>
            <a
              href="#"
              className="text-gray-400 hover:text-white transition-colors"
              data-oid="-x0-z3i">

              <span className="sr-only" data-oid="l-rspbz">
                TikTok
              </span>
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 24 24"
                data-oid="lw:tt8s">

                <path
                  d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"
                  data-oid="c8uubjf" />

              </svg>
            </a>
            <a
              href="#"
              className="text-gray-400 hover:text-white transition-colors"
              data-oid="tp066cg">

              <span className="sr-only" data-oid="pi-0xx.">
                Facebook
              </span>
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 24 24"
                data-oid="4ko24uc">

                <path
                  d="M24 12.073c0-6.627-5.373-12-12-5.373-12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
                  data-oid="rlw6zxi" />

              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>);

}