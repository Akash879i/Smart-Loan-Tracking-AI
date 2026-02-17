import React from "react";
import Feature1 from "../assets/images/Feature1.png"
import Feature2 from "../assets/images/Feature2.png"
import Feature3 from "../assets/images/Feature3.png"
import Feature4 from "../assets/images/Feature4.png"

const features = [
  {
    img: Feature1,
    title: "AI-Powered Recognition",
    desc: "Automatically identify and categorize uploaded documents with 99% accuracy",
    icon: "⚡",
  },
  {
    img: Feature2,
    title: "Fraud Detection",
    desc: "Advanced AI algorithms detect suspicious patterns and prevent fraudulent activities",
    icon: "🛡️",
  },
  {
    img: Feature3,
    title: "Real-Time Tracking",
    desc: "Monitor loan utilization in real-time with comprehensive dashboards",
    icon: "🛡️",
  },
  {
    img: Feature4,
    title: "Smart Analytics",
    desc: "Generate insightful reports and predictive analytics for better decision-making",
    icon: "🛡️",
  },
];

export default function Features() {
  return (
    <section className="py-24 bg-slate-50">

      <div className="max-w-7xl mx-auto px-6">

        {/* Heading */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-slate-900">
            Powerful Features
          </h2>
          <p className="mt-3 md:text-[20px] text-slate-500">
            Everything you need for seamless loan monitoring
          </p>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-2 gap-10">

          {features.map((item, i) => (
            <div
              key={i}
              className="bg-white rounded-3xl shadow hover:shadow-lg transition overflow-hidden"
            >

              {/* IMAGE */}
              <div className="h-56 overflow-hidden">
                <img
                  src={item.img}
                  alt=""
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                />
              </div>

              {/* CONTENT */}
              <div className="p-8">

                <div className="h-12 w-12 rounded-xl bg-emerald-500 flex items-center justify-center text-white text-xl mb-5">
                  {item.icon}
                </div>

                <h3 className="text-xl font-bold text-slate-900">
                  {item.title}
                </h3>

                <p className="mt-3 text-slate-600">
                  {item.desc}
                </p>

              </div>
            </div>
          ))}

        </div>
      </div>
    </section>
  );
}
