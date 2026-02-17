import React from "react";

const stats = [
  {
    img: "/trust1.jpg",
    value: "10M+",
    label: "Documents Processed",
  },
  {
    img: "/trust2.jpg",
    value: "500+",
    label: "Banks & Lenders",
  },
  {
    img: "/trust3.jpg",
    value: "99.9%",
    label: "Accuracy Rate",
  },
  {
    img: "/trust4.jpg",
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
