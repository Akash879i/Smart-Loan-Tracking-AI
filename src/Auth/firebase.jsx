import { createContext, useContext, useEffect, useState } from "react";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import {
  getFirestore,
  setDoc,
  doc,
  getDocs,
  where,
  query,
  collection,
  addDoc,
  deleteDoc,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: "loantracker2.firebasestorage.app",
  messagingSenderId: "678175338729",
  appId: "1:678175338729:web:e3a04a10fd3e6832d54078",
  measurementId: "G-CH3VT54ZCZ",
  databaseURL:"https://loantracker2-default-rtdb.firebaseio.com/"
};

const app = initializeApp(firebaseConfig);
const FirebaseAuth = getAuth(app);
const db = getFirestore(app);
const GoogleProvider = new GoogleAuthProvider();

const FirebaseContext = createContext(null);
export const useFirebase = () => useContext(FirebaseContext);

export const Firebaseprovider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔥 AUTH LISTENER (VERY IMPORTANT)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(FirebaseAuth, (u) => {
      setUser(u);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // AUTH
  const Signup = (email, password) =>
    createUserWithEmailAndPassword(FirebaseAuth, email, password);

  const Login = (email, password) =>
    signInWithEmailAndPassword(FirebaseAuth, email, password);

  const Google = () => signInWithPopup(FirebaseAuth, GoogleProvider);

  const Logout = async () => {
    await signOut(FirebaseAuth);
  };

  // 🔥 LOANS
  const addLoan = async (data) => {
    if (!user) throw new Error("No user");

    return await addDoc(collection(db, "loanApplications"), {
      ...data,
      userId: user.uid,
      createdAt: Date.now(),
    });
  };

  const getUserLoans = async () => {
    if (!user) return [];

    const q = query(
      collection(db, "loanApplications"),
      where("userId", "==", user.uid)
    );

    const snap = await getDocs(q);

    return snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  };

  // 🔥 DOCUMENTS
  const addDocument = async (data) => {
    if (!user) throw new Error("No user");

    return await addDoc(collection(db, "documents"), {
      ...data,
      userId: user.uid,
      createdAt: Date.now(),
    });
  };

  const getUserDocuments = async () => {
    if (!user) return [];

    const q = query(
      collection(db, "documents"),
      where("userId", "==", user.uid)
    );

    const snap = await getDocs(q);

    return snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  };

  const deleteDocument = async (id) => {
    await deleteDoc(doc(db, "documents", id));
  };

  return (
    <FirebaseContext.Provider
      value={{
        user,
        loading,
        Signup,
        Login,
        Google,
        Logout,
        addLoan,
        getUserLoans,
        addDocument,
        getUserDocuments,
        deleteDocument,
      }}
    >
      {children}
    </FirebaseContext.Provider>
  );
};