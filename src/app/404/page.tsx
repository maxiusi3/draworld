import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-black text-white" data-oid="b.-.vq9">
      <Header data-oid="w5o1ak_" />

      <main className="py-20 px-4 sm:px-6 lg:px-8" data-oid="b8cv8xu">
        <div className="max-w-4xl mx-auto text-center" data-oid="08swim7">
          {/* Illustration */}
          <div className="mb-8" data-oid="8pvas2x">
            <div
              className="w-32 h-32 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-6"
              data-oid="i.4xf:5">

              <svg
                className="w-16 h-16 text-pink-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                data-oid="8vyia-q">

                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.291-1.1-5.291-2.709M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  data-oid="wrmonlq" />

              </svg>
            </div>

            {/* Lost Crayon Illustration */}
            <div className="relative" data-oid="g50jexo">
              <div
                className="w-24 h-6 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full mx-auto mb-2 transform rotate-12"
                data-oid="7c-k72c">
              </div>
              <div
                className="w-4 h-4 bg-pink-400 rounded-full mx-auto transform translate-x-10 -translate-y-2"
                data-oid="lasxlk5">
              </div>
              <div className="text-4xl mb-4" data-oid="j1xakzp">
                🖍️
              </div>
            </div>
          </div>

          <h1
            className="text-6xl font-bold mb-6 bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent"
            data-oid="bs6pq-7">

            404
          </h1>

          <h2 className="text-3xl font-bold mb-4" data-oid="45429fy">
            Page Not Found
          </h2>

          <p
            className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto"
            data-oid="7nhoz70">

            Oops! It looks like this page doesn't exist. Maybe it wandered off
            to create some art of its own!
          </p>

          <div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            data-oid="wtr0ttb">

            <Button
              as="link"
              href="/"
              variant="primary"
              size="lg"
              data-oid="8hrq_9g">

              🏠 Go to Homepage
            </Button>
            <Button
              as="link"
              href="/create"
              variant="secondary"
              size="lg"
              data-oid="5ia:bkt">

              🎨 Start Creating
            </Button>
          </div>

          {/* Fun Facts */}
          <div
            className="mt-16 bg-zinc-900/50 rounded-2xl p-8 max-w-2xl mx-auto"
            data-oid="aiooysa">

            <h3 className="text-lg font-semibold mb-4" data-oid="b4_pf9h">
              While you're here...
            </h3>
            <div
              className="grid md:grid-cols-2 gap-6 text-sm"
              data-oid="vddu:h8">

              <div className="text-center" data-oid="9w-6q:_">
                <div className="text-2xl mb-2" data-oid="oar8rt0">
                  🎨
                </div>
                <div className="font-medium mb-1" data-oid=":c0f__9">
                  Did you know?
                </div>
                <div className="text-gray-400" data-oid="loe16vf">
                  Children create an average of 1,600 drawings per year!
                </div>
              </div>
              <div className="text-center" data-oid="i8uxy6.">
                <div className="text-2xl mb-2" data-oid="uq:anzl">
                  ✨
                </div>
                <div className="font-medium mb-1" data-oid="xt5gj9b">
                  Fun Fact
                </div>
                <div className="text-gray-400" data-oid="g00_byf">
                  Art helps develop creativity, problem-solving, and fine motor
                  skills.
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer data-oid="br:6nl8" />
    </div>);

}