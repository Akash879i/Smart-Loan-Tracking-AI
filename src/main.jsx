import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import Signup from './Pages/Signup.jsx'
import Login from "./Pages/Login.jsx"
import Dashboard from "./Components/Dashboard.jsx"
import { Firebaseprovider } from './Auth/firebase.jsx'
import {BrowserRouter,Routes,Route} from "react-router-dom"


createRoot(document.getElementById('root')).render(
  <Firebaseprovider>
  <BrowserRouter>
  <Routes>
          <Route path='/' element={<App />} />
          <Route path='/authcard' element={<Signup />} />
          <Route path='/login' element={<Login />} />
          <Route path='/dashboard' element={<Dashboard />} />

        </Routes>
  </BrowserRouter>
  </Firebaseprovider>

)
