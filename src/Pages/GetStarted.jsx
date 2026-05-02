import React from "react";

export default function GetStarted() {
  return (
    <section  id="getstarted" className="py-24 bg-gradient-to-b from-emerald-600 to-emerald-500">

      <div className="max-w-5xl mx-auto px-6">

        <div className="bg-white rounded-3xl shadow-xl p-10 md:p-14">

          {/* Heading */}
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
              Get Started Today
            </h2>
            <p className="mt-2 text-slate-500">
              Schedule a demo or contact our team
            </p>
          </div>

          {/* Form */}
          <form className="grid grid-cols-1 md:grid-cols-2 gap-6">

            <div>
              <label className="text-sm font-medium">Full Name *</label>
              <input
                type="text"
                placeholder="John Doe"
                className="mt-2 w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Email *</label>
              <input
                type="email"
                placeholder="john@example.com"
                className="mt-2 w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Phone *</label>
              <input
                type="text"
                placeholder="+91 98765 43210"
                className="mt-2 w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Organization</label>
              <input
                type="text"
                placeholder="Your Bank Name"
                className="mt-2 w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Role */}
            <div className="md:col-span-2">
              <label className="text-sm font-medium">Your Role</label>
              <select className="mt-2 w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option>Select your role</option>
                <option>Bank Manager</option>
                <option>Loan Officer</option>
                <option>Founder</option>
                <option>Developer</option>
              </select>
            </div>

            {/* Button */}
            <div className="md:col-span-2 mt-4">
              <button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-4 rounded-xl font-medium transition shadow-lg">
                Schedule Demo →
              </button>
            </div>

          </form>

        </div>
      </div>
    </section>
  );
}
