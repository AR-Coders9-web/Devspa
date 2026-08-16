import { motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { NavLink } from "react-router-dom";
import logo from "../../assets/logo.png"

const navLinks = [
  {
    name: "Home",
    path: "/",
  },
  {
    name: "Analyze",
    path: "/analyze",
  },

  {
    name: "How It Works",
    path: "/how-it-works",
  },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7 }}
      className="fixed top-0 left-0 z-50 w-full"
    >
      <div className="mx-auto mt-5 flex w-[92%] max-w-7xl items-center justify-between rounded-2xl border border-[#1F2937]/80 bg-[#111827]/60 px-6 py-4 backdrop-blur-xl">

        {/* Logo */}

        <NavLink
          to="/"
          className="flex items-center gap-2"
        >
          <div className="rounded-xl bg-[#F8FAFC] via-50% to-[#2563EB] px-0 py-0.5 text-sm font-semibold text-white transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-purple-700/30"
          >
          <img src={logo} alt="Logo" className="h-15  rounded-2xl" />
          </div>
        </NavLink>

        {/* Desktop Nav */}

        <nav className="hidden items-center gap-10 lg:flex">
          {navLinks.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `relative text-sm font-medium transition-all duration-300 ${
                  isActive
                    ? "text-white"
                    : "text-[#94A3B8] hover:text-white"
                }`
              }
            >
              {item.name}
            </NavLink>
          ))}
        </nav>

        {/* Desktop Button */}

        <div className="hidden lg:block">
          <NavLink
            to="/analyze"
            className="rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#3B82F6] px-6 py-3 text-sm font-semibold text-white transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-purple-700/30"
          >
            Analyze Idea
          </NavLink>
        </div>

        {/* Mobile */}

        <button
          onClick={() => setOpen(!open)}
          className="rounded-xl border border-[#1F2937] bg-[#111827] p-2 text-white lg:hidden"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Menu */}

      {open && (
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto mt-3 flex w-[92%] max-w-7xl flex-col gap-5 rounded-2xl border border-[#1F2937] bg-[#111827]/95 p-6 backdrop-blur-xl lg:hidden"
        >
          {navLinks.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={() => setOpen(false)}
              className="text-[#F8FAFC]"
            >
              {item.name}
            </NavLink>
          ))}

          <NavLink
            to="/analyze"
            onClick={() => setOpen(false)}
            className="rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#3B82F6] py-3 text-center font-semibold text-white"
          >
            Analyze Idea
          </NavLink>
        </motion.div>
      )}
    </motion.header>
  );
}