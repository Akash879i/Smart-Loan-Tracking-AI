import React from "react";
import Work1 from "../assets/images/Work1.png"
import Work2 from "../assets/images/Work2.png"
import Work3 from "../assets/images/Work3.png"
import Work4 from "../assets/images/Work4.png"

const stats = [
  {
    img: Work1,
    value: "10M+",
    label: "Documents Processed",
  },
  {
    img: Work2,
    value: "500+",
    label: "Banks & Lenders",
  },
  {
    img: Work3,
    value: "99.9%",
    label: "Accuracy Rate",
  },
  {
    img: Work4,
    value: "24/7",
    label: "Support Available",
  },
];

export default function TrustSection() {
  return (
    <section className="py-20 bg-white">

      <div className="max-w-7xl mx-auto px-6 text-center">

        <h2 className="text-3xl md:text-5xl font-bold text-slate-900">
          Trusted by Leading Financial Institutions
        </h2>

        <p className="mt-3 md:text-[20px] text-slate-500">
          Join 500+ banks and lenders using LoanTrack Pro
        </p>

        <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10">

          {stats.map((item, i) => (
            <div key={i} className="flex flex-col items-center">

              {/* IMAGE */}
              <div className="overflow-hidden rounded-2xl w-full h-44 shadow">

                <img
                  src={item.img}
                  alt=""
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                />

              </div>

              {/* NUMBER */}
              <h3 className="mt-6 text-3xl font-bold text-emerald-500">
                {item.value}
              </h3>

              {/* LABEL */}
              <p className="mt-2 text-slate-600 font-medium">
                {item.label}
              </p>

            </div>
          ))}

        </div>
      </div>
    </section>
  );
}
