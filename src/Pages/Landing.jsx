import React from "react";
import Image from "../assets/images/Landing.png"
// import {HashLink} from "react-router-dom"
import { useNavigate } from "react-router-dom";



export default function Landing() {
  const navigate = useNavigate();
  return (
    <div className="w-full md:pb-24 bg-emerald-50">

      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 w-full z-50 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white font-bold">
              ✓
            </div>
            <span className="font-semibold text-lg">LoanTrack Pro</span>
          </div>

          {/* Button */}
          <button onClick={()=>navigate("/login")} className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2 rounded-lg transition">
            Sign In
          </button>

        </div>
      </nav>

      {/* HERO */}
      <section className="pt-32 px-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">

          {/* LEFT */}
          <div>
            <span className="inline-flex items-center gap-2 bg-white px-4 md:my-5 py-2 rounded-full shadow text-md">
              🟢 AI-Powered Loan Monitoring
            </span>

            <h1 className="mt-6 text-4xl md:text-8xl font-bold text-slate-900">
              Smart Loan
            </h1>

            <h2 className="text-4xl md:text-6xl font-bold text-emerald-500 mt-2">
              Utilization Tracking
            </h2>

            <p className="mt-6 text-slate-600 text-[20px] max-w-lg">
              Automate loan monitoring with AI-powered document recognition and
              fraud detection. Built for banks and borrowers who demand
              transparency and efficiency.
            </p>

            <div className="mt-8 flex gap-4">
         
             <button onClick={()=>navigate('/authcard')} className="bg-emerald-500 hover:bg-emerald-600 md:text-2xl text-white px-6 py-3 rounded-lg">
                Get Started Free →
              </button>

               
              <button className="border border-slate-300 md:text-2xl px-6 py-3 rounded-lg hover:bg-white">
                Schedule Demo
              </button>
              
            </div>
          </div>

          {/* RIGHT IMAGE */}
          {/* <div className="relative">
            <div className="absolute inset-0 bg-emerald-200 rounded-3xl blur-2xl"></div>
          </div>*/}

          <img
              src={Image}
              alt="hero"
              className="relative md:mt-11 rounded-3xl  w-full"
            />
        </div> 
      </section>

    </div>
  );
}
