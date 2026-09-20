import { Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import DonorProfile from './pages/DonorProfile.jsx';
import FindDonors from './pages/FindDonors.jsx';

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <DonorProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/find"
          element={
            <ProtectedRoute>
              <FindDonors />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}