import { useEffect, useState } from "react";
import { useFirebase } from "../Auth/firebase";
import { getFirestore, setDoc, doc, getDocs, where, query, collection } from "firebase/firestore";

export default function LoanApplications() {
  const firebase = useFirebase();

  const [loans, setLoans] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    type: "",
    amount: "",
    purpose: "",
    duration: "",
    status: "pending",
  });

  // 🔹 Fetch loans
  const fetchLoans = async () => {
    const data = await firebase.getUserLoans();
    setLoans(data);
  };

  useEffect(() => {
    fetchLoans();
  }, []);

  // 🔹 Handle input
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // 🔹 Submit form
  const handleSubmit = async () => {
    if (!form.type || !form.amount || !form.purpose) {
      alert("Please fill all required fields");
      return;
    }

    await firebase.addLoan({
      ...form,
      amount: Number(form.amount),
    });

    setShowModal(false);
    setForm({
      type: "",
      amount: "",
      purpose: "",
      duration: "",
      status: "pending",
    });

    fetchLoans();
  };

  return (
    <div>
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-semibold">Loan Applications</h1>
          <p className="text-gray-500">
            Manage your loan applications
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700"
        >
          + New Application
        </button>
      </div>

      {/* EMPTY STATE */}
      {loans.length === 0 ? (
        <div className="text-center bg-white p-10 rounded-xl shadow">
          <p className="text-gray-500 mb-4">
            No loan applications found
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="bg-green-600 text-white px-5 py-2 rounded-lg"
          >
            Create Application
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {loans.map((loan) => (
            <div
              key={loan.id}
              className="bg-white p-5 rounded-xl shadow"
            >
              <div className="flex justify-between">
                <h2 className="font-semibold text-lg">
                  {loan.type}
                </h2>
                <span className="text-sm bg-yellow-100 px-3 py-1 rounded-full">
                  {loan.status}
                </span>
              </div>

              <p className="text-gray-500">
                ₹{loan.amount}
              </p>
              <p className="text-sm text-gray-400">
                {loan.purpose}
              </p>
              <p className="text-sm text-gray-400">
                Duration: {loan.duration || "N/A"}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-lg rounded-2xl p-6">

            {/* HEADER */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                New Loan Application
              </h2>
              <button onClick={() => setShowModal(false)}>✕</button>
            </div>

            {/* FORM */}
            <div className="space-y-4">

              {/* TYPE */}
              <div>
                <label className="text-sm font-medium">
                  Loan Type *
                </label>
                <select
                  name="type"
                  value={form.type}
                  onChange={handleChange}
                  className="w-full border rounded-lg p-2 mt-1"
                >
                  <option value="">Select loan type</option>
                  <option>Personal Loan</option>
                  <option>Home Loan</option>
                  <option>Education Loan</option>
                </select>
              </div>

              {/* AMOUNT */}
              <div>
                <label className="text-sm font-medium">
                  Loan Amount (₹) *
                </label>
                <input
                  type="number"
                  name="amount"
                  value={form.amount}
                  onChange={handleChange}
                  className="w-full border rounded-lg p-2 mt-1"
                />
              </div>

              {/* PURPOSE */}
              <div>
                <label className="text-sm font-medium">
                  Purpose *
                </label>
                <textarea
                  name="purpose"
                  value={form.purpose}
                  onChange={handleChange}
                  className="w-full border rounded-lg p-2 mt-1"
                />
              </div>

              {/* DURATION */}
              <div>
                <label className="text-sm font-medium">
                  Duration
                </label>
                <select
                  name="duration"
                  value={form.duration}
                  onChange={handleChange}
                  className="w-full border rounded-lg p-2 mt-1"
                >
                  <option value="">Select duration</option>
                  <option>3 months</option>
                  <option>6 months</option>
                  <option>12 months</option>
                </select>
              </div>
            </div>

            {/* ACTIONS */}
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="bg-green-600 text-white px-5 py-2 rounded-lg"
              >
                Submit Application
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}