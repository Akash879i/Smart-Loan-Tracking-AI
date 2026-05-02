import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Lock } from "lucide-react";
import { useFirebase } from "../Auth/firebase";
import { useNavigate } from "react-router-dom";

export default function AnimatedLoginPage() {
  const navigate = useNavigate();
  const firebase = useFirebase();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // 🔥 GOOGLE LOGIN (FIXED)
  const handleGoogleLogin = async () => {
    try {
      await firebase.Google(); // ✅ correct function
      navigate("/dashboard");
    } catch (err) {
      console.error("Google Login Error:", err);
      alert(err.message);
    }
  };

  // 🔥 EMAIL LOGIN
  const handleSignIn = async () => {
    if (!email || !email.includes("@")) {
      alert("Enter valid email");
      return;
    }

    if (!password || password.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }

    try {
      await firebase.Login(email, password);
      navigate("/dashboard");
    } catch (err) {
      console.error("Login Error:", err);
      alert(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-slate-900 via-indigo-900 to-purple-900 p-4 overflow-hidden relative">
      
      {/* Background */}
      <div className="absolute w-96 h-96 bg-white opacity-10 rounded-full top-10 left-10 animate-pulse"></div>
      <div className="absolute w-72 h-72 bg-white opacity-10 rounded-full bottom-10 right-10 animate-bounce"></div>

      <motion.div
        className="absolute w-72 h-72 bg-purple-500 rounded-full opacity-20 blur-3xl"
        animate={{ x: [0, 100, -100, 0], y: [0, -50, 50, 0] }}
        transition={{ duration: 12, repeat: Infinity }}
      />
      <motion.div
        className="absolute w-72 h-72 bg-indigo-500 rounded-full opacity-20 blur-3xl right-0"
        animate={{ x: [0, -100, 100, 0], y: [0, 50, -50, 0] }}
        transition={{ duration: 14, repeat: Infinity }}
      />

      {/* CARD */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md z-10"
      >
        <div className="rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl p-6 sm:p-8 text-white">
          
          <motion.h2
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-2xl sm:text-3xl font-bold text-center mb-2"
          >
            Welcome Back
          </motion.h2>

          <p className="text-center text-gray-300 mb-6 text-sm sm:text-base">
            Login to continue your journey
          </p>

          <div className="space-y-5">

            {/* Email */}
            <motion.div
              initial={{ x: -40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="relative"
            >
              <Mail className="absolute left-3 top-3 text-gray-300" size={18} />
              <input
                type="email"
                placeholder="Email"
                onChange={(e) => setEmail(e.target.value)}
                value={email}
                className="w-full pl-10 rounded-xl bg-white/20 border border-white/30 p-3 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </motion.div>

            {/* Password */}
            <motion.div
              initial={{ x: 40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="relative"
            >
              <Lock className="absolute left-3 top-3 text-gray-300" size={18} />
              <input
                type="password"
                placeholder="Password"
                onChange={(e) => setPassword(e.target.value)}
                value={password}
                className="w-full pl-10 rounded-xl bg-white/20 border border-white/30 p-3 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </motion.div>

            {/* Login Button */}
            <motion.button
              onClick={handleSignIn}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full rounded-xl text-lg font-semibold py-3 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-indigo-500 hover:to-purple-500"
            >
              Login
            </motion.button>

            {/* Divider */}
            <div className="flex items-center gap-2 my-4">
              <div className="flex-1 h-px bg-white/30" />
              <span className="text-sm text-gray-300">OR</span>
              <div className="flex-1 h-px bg-white/30" />
            </div>

            {/* Google Login */}
            <motion.button
              onClick={handleGoogleLogin}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full rounded-xl py-3 text-base font-medium flex items-center justify-center gap-2 bg-white text-black hover:bg-gray-200"
            >
              <img
                src="https://www.svgrepo.com/show/475656/google-color.svg"
                alt="Google"
                className="w-5 h-5"
              />
              Continue with Google
            </motion.button>
          </div>

          {/* Signup */}
          <p className="text-center text-sm text-gray-300 mt-6">
            Don’t have an account?{" "}
            <span
              onClick={() => navigate("/authcard")}
              className="text-purple-400 cursor-pointer hover:underline"
            >
              Sign Up
            </span>
          </p>
        </div>
      </motion.div>
    </div>
  );
}