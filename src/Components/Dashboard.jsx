import React, { useEffect, useState } from "react";
import { useFirebase } from "../Auth/firebase";

import LoanApplications from "./LoanApplications";
import Documents from "./Documents";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();
  const { Logout, loading } = useFirebase();

  const [activeTab, setActiveTab] = useState("dashboard");

  if (loading) {
    return <p className="p-6 sm:p-10">Loading...</p>;
  }

  const handleLogout = async () => {
    await Logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* NAVBAR */}
      <nav className="bg-white shadow-sm px-4 sm:px-6 md:px-8 py-4 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        
        {/* LEFT */}
        <div className="flex items-center gap-3">
          <div className="bg-green-500 text-white w-10 h-10 rounded-xl flex items-center justify-center">
            ✓
          </div>
          <div>
            <h1 className="font-bold text-lg">LoanTrack Pro</h1>
            <p className="text-xs text-gray-500">Smart Loan Monitoring</p>
          </div>
        </div>

        {/* NAV ITEMS */}
        <div className="flex gap-4 sm:gap-6 font-medium overflow-x-auto scrollbar-hide">
          <NavItem label="Dashboard" tab="dashboard" activeTab={activeTab} setActiveTab={setActiveTab} />
          <NavItem label="Applications" tab="applications" activeTab={activeTab} setActiveTab={setActiveTab} />
          <NavItem label="Documents" tab="documents" activeTab={activeTab} setActiveTab={setActiveTab} />
          <NavItem label="Reports" tab="reports" activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>

        {/* LOGOUT */}
        <button
          onClick={handleLogout}
          className="bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300 transition w-full md:w-auto"
        >
          Logout
        </button>
      </nav>

      {/* CONTENT */}
      <div className="p-4 sm:p-6 md:p-10">
        {activeTab === "dashboard" && (
          <DashboardHome setActiveTab={setActiveTab} />
        )}
        {activeTab === "applications" && <LoanApplications />}
        {activeTab === "documents" && <Documents />}
        {activeTab === "reports" && <Reports />}
      </div>
    </div>
  );
}

/* 🔹 NAV ITEM */
function NavItem({ label, tab, activeTab, setActiveTab }) {
  const isActive = activeTab === tab;

  return (
    <button
      onClick={() => setActiveTab(tab)}
      className={`whitespace-nowrap transition ${
        isActive
          ? "text-green-600 border-b-2 border-green-600"
          : "text-gray-600 hover:text-green-600"
      }`}
    >
      {label}
    </button>
  );
}

/* 🔹 DASHBOARD HOME */
function DashboardHome({ setActiveTab }) {
  const firebase = useFirebase();

  const [loans, setLoans] = useState([]);
  const [documents, setDocuments] = useState([]); // 🔥 NEW
  const [loadingLoans, setLoadingLoans] = useState(true);

  useEffect(() => {
    if (!firebase || !firebase.getUserLoans) return;

    const fetchLoans = async () => {
      try {
        const data = await firebase.getUserLoans();
        const docData = await firebase.getUserDocuments(); // 🔥 FETCH DOCS
        setDocuments(docData || []); // 🔥 SET DOCS
        setLoans(data || []);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoadingLoans(false);
      }
    };

    fetchLoans();
  }, [firebase]);

  return (
    <>
      <h2 className="text-2xl sm:text-3xl font-bold mb-2">Welcome Back!</h2>
      <p className="text-gray-500 mb-8 text-sm sm:text-base">
        Here's your loan utilization overview
      </p>

      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-10">
        <StatCard title="Active Loans" value={loans.length} />
        <StatCard
          title="Total Borrowed"
          value={`₹${loans.reduce((sum, l) => sum + Number(l.amount || 0), 0)}`}
        />
        <StatCard title="Documents Uploaded" value={documents.length} />
      </div>

      {/* ACTIVE LOANS */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow mb-10">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Active Loans</h3>

          <button
            onClick={() => setActiveTab("applications")}
            className="text-green-600 text-sm hover:underline"
          >
            View All
          </button>
        </div>

        {loadingLoans ? (
          <p>Loading...</p>
        ) : loans.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-500 mb-4">
              No loan applications found
            </p>

            <button
              onClick={() => setActiveTab("applications")}
              className="bg-green-600 text-white px-5 py-2 rounded-lg"
            >
              Create Loan Application
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {loans.slice(0, 2).map((loan) => (
              <div key={loan.id} className="border p-4 rounded-xl">
                <div className="flex justify-between">
                  <h4 className="font-semibold">{loan.loanType}</h4>
                  <span className="bg-yellow-100 text-yellow-700 px-3 py-1 text-xs rounded-full">
                    {loan.status || "pending"}
                  </span>
                </div>

                <p className="text-sm text-gray-500 mt-2">
                  Amount: ₹{loan.amount}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ACTION CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <ActionCard
          title="Upload Documents"
          desc="Keep your loan records updated"
          button="Upload Now"
          onClick={() => setActiveTab("documents")}
          color="bg-green-500"
        />

        <ActionCard
          title="View Reports"
          desc="See analytics & insights"
          button="View Reports"
          onClick={() => setActiveTab("reports")}
          color="bg-blue-500"
        />
      </div>
    </>
  );
}

/* 🔹 STAT CARD */
function StatCard({ title, value }) {
  return (
    <div className="bg-white p-4 sm:p-6 rounded-2xl shadow">
      <h3 className="text-gray-500 text-sm">{title}</h3>
      <p className="text-2xl sm:text-3xl font-bold mt-2">{value}</p>
    </div>
  );
}

/* 🔹 ACTION CARD */
function ActionCard({ title, desc, button, onClick, color }) {
  return (
    <div className={`${color} text-white p-6 sm:p-8 rounded-2xl shadow`}>
      <h3 className="text-lg sm:text-xl font-bold mb-2">{title}</h3>
      <p className="mb-6 text-sm sm:text-base">{desc}</p>

      <button
        onClick={onClick}
        className="bg-white text-black px-5 py-2 rounded-lg w-full sm:w-auto"
      >
        {button}
      </button>
    </div>
  );
}

/* 🔹 REPORT PAGE */
function Reports() {
  return <h2 className="text-xl font-semibold">Reports Page</h2>;
}