import {useState}from "react";
import { motion } from "framer-motion";
import { FcGoogle } from "react-icons/fc";
import { useNavigate } from "react-router-dom";
import { useFirebase } from "../Auth/firebase";


export default function Signup() {
    const navigate = useNavigate();
    const firebase = useFirebase();

    const[username,setUserName]=useState("");
    const[email,setEmail]=useState("");
    const[password,setPassword]=useState("");

    const handlesignup = async () => {
    try {
    await firebase.Signup(username,email,password)
    // navigate("/dashboard");
    } catch (err) {
    console.log(err.message);
    }
    };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 relative overflow-hidden">

      {/* Animated Background Circles */}
      <div className="absolute w-96 h-96 bg-white opacity-10 rounded-full top-10 left-10 animate-pulse"></div>
      <div className="absolute w-72 h-72 bg-white opacity-10 rounded-full bottom-10 right-10 animate-bounce"></div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white/90 backdrop-blur-lg shadow-2xl rounded-2xl p-8 w-[380px] relative z-10"
      >
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">
          Create Account
        </h2>

        {/* User Name */}
        <div className="mb-4">
          <input
            type="username"
            placeholder="username"
            onChange={(e)=>setUserName(e.target.value)}
            value={username}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
            required
          />
        </div>

        {/* Email */}
        <div className="mb-4">
          <input
            type="email"
            placeholder="Email Address"
            onChange={(e)=>setEmail(e.target.value)}
            value={email}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
            required
          />
        </div>

        {/* Password */}
        <div className="mb-4">
          <input
            type="password"
            placeholder="Password"
             onChange={(e)=>setPassword(e.target.value)}
            value={password}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
            required
          />
        </div>

        {/* Signup Button */}
        <button onClick={handlesignup} className="w-full bg-purple-600 text-white py-2 rounded-lg font-semibold hover:bg-purple-700 transition duration-300 shadow-md hover:scale-105">
          Sign Up
        </button>

        {/* Divider */}
        <div className="flex items-center my-5">
          <hr className="flex-grow border-gray-300" />
          <span className="px-3 text-gray-500 text-sm">OR</span>
          <hr className="flex-grow border-gray-300" />
        </div>

        {/* Google Button */}
        <button onClick={()=>firebase.Google()} className="w-full flex items-center justify-center gap-3 border py-2 rounded-lg hover:bg-gray-100 transition duration-300 shadow-sm">
          <FcGoogle size={20} />
          Sign up with Google
        </button>

        {/* Login Link */}
        <p className="text-center text-sm text-gray-600 mt-6">
          Already have an account?{" "}
          <span onClick={()=>navigate("/login")}
            className="text-purple-600 cursor-pointer font-semibold hover:underline"
          >
            Login
          </span>
        </p>
      </motion.div>
    </div>
  );
}