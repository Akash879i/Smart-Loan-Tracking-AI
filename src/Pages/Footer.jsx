import React from "react";

export default function Footer() {
  return (
    <footer className="bg-gradient-to-b from-slate-900 to-slate-950 text-slate-300">

      <div className="max-w-7xl mx-auto px-6 py-5 md:pt-16">

        {/* Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">

          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white font-bold">
                ✓
              </div>
              <span className="text-xl font-semibold text-white">
                LoanTrack Pro
              </span>
            </div>

            <p className="text-slate-400 leading-relaxed">
              Smart loan utilization tracking for the modern financial ecosystem.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-white font-semibold mb-4">Product</h4>
            <ul className="space-y-3">
              {["Features", "Pricing", "Security", "Integrations"].map((item) => (
                <li
                  key={item}
                  className="hover:text-white transition cursor-pointer"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-white font-semibold mb-4">Company</h4>
            <ul className="space-y-3">
              {["About Us", "Careers", "Blog", "Contact"].map((item) => (
                <li
                  key={item}
                  className="hover:text-white transition cursor-pointer"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-white font-semibold mb-4">Legal</h4>
            <ul className="space-y-3">
              {["Privacy Policy", "Terms of Service", "Compliance"].map(
                (item) => (
                  <li
                    key={item}
                    className="hover:text-white transition cursor-pointer"
                  >
                    {item}
                  </li>
                )
              )}
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-800 mt-10 pt-8 text-center text-slate-500">
          © 2026 LoanTrack Pro. All rights reserved.
        </div>

      </div>
    </footer>
  );
}
