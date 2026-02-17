import React from "react";
import Work1 from "../assets/images/Work1.png"
import Work2 from "../assets/images/Work2.png"
import Work3 from "../assets/images/Work3.png"
import Work4 from "../assets/images/Work4.png"

const steps = [
  {
    img: Work1,
    num: "1",
    title: "Upload Documents",
    desc: "Borrowers upload loan utilization documents directly from their mobile devices",
    icon: "⬆️",
  },
  {
    img:Work2,
    num: "2",
    title: "AI Analysis",
    desc: "Our AI engine automatically recognizes, categorizes, and validates documents",
    icon: "👁️",
  },
  {
    img: Work3,
    num: "3",
    title: "Fraud Check",
    desc: "Advanced algorithms scan for suspicious patterns and flag potential fraud",
    icon: "⚠️",
  },
  {
    img: Work4,
    num: "4",
    title: "Real-Time Reports",
    desc: "Banks and borrowers access comprehensive reports and analytics instantly",
    icon: "📊",
  },
];

export default function HowItWorks() {
  return (
    <section className="py-24 bg-white">

      <div className="max-w-7xl mx-auto px-6">

        {/* Heading */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-slate-900">
            How It Works
          </h2>
          <p className="mt-3 md:text-[20px] text-slate-500">
            Simple, automated, and intelligent
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">

          {steps.map((step, i) => (
            <div
              key={i}
              className="bg-emerald-50 rounded-3xl p-6 shadow hover:shadow-lg transition"
            >

              {/* IMAGE */}
              <div className="overflow-hidden rounded-2xl h-40 mb-6">
                <img
                  src={step.img}
                  alt=""
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                />
              </div>

              {/* NUMBER */}
              <div className="flex items-center justify-between mb-4">
                <div className="h-10 w-10 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold">
                  {step.num}
                </div>

                <span className="text-emerald-500 text-xl">
                  →
                </span>
              </div>

              {/* ICON */}
              <div className="h-10 w-10 bg-white rounded-xl shadow flex items-center justify-center mb-4">
                {step.icon}
              </div>

              {/* TEXT */}
              <h3 className="text-lg font-bold text-slate-900">
                {step.title}
              </h3>

              <p className="mt-2 text-slate-600 text-sm leading-relaxed">
                {step.desc}
              </p>

            </div>
          ))}

        </div>
      </div>
    </section>
  );
}
