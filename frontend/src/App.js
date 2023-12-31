import {BrowserRouter, Routes, Route} from "react-router-dom"
import './index.css';
import axios from "axios";

import Home from "./pages/home/Home";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Forgot from "./pages/auth/Forgot";
import Reset from "./pages/auth/Reset";
import Sidebar from "./components/Sidebar";
import Layout from "./components/Layout";
import Dashboard from "./pages/dasboard/Dashboard";
import AddProduct from "./pages/addProduct/AddProduct";

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useDispatch } from "react-redux";
import { useEffect } from "react";
import { getLoginStatus } from "./services/authService";
import { SET_LOGIN } from "./redux/features/auth/authSlice";


axios.defaults.withCredentials = true

function App() {
  const dispatch = useDispatch()

  useEffect(() => {
    async function loginStatus() {
      const status = await getLoginStatus()
      dispatch(SET_LOGIN(status))
    }
    loginStatus()
  },[dispatch])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />}></Route>

        <Route path="/login" element={<Login />}></Route>
        <Route path="/register" element={<Register />}></Route>
        <Route path="/forgotpassword" element={<Forgot />}></Route>
        <Route path="/resetpassword/:resetToken" element={<Reset />}></Route>

        <Route path="/dashboard" element={
          <Sidebar>
            <Layout>
              <Dashboard />
            </Layout>
          </Sidebar>}>
        </Route>

        <Route path="/add-product" element={
          <Sidebar>
            <Layout>
              <AddProduct />
            </Layout>
          </Sidebar>}>
        </Route>



      </Routes>

      <ToastContainer />
      
    </BrowserRouter>
  );
}

export default App;
