import { Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import DonorProfile from './pages/DonorProfile.jsx';
import FindDonors from './pages/FindDonors.jsx';
import NewRequest from './pages/NewRequest.jsx';
import MyRequests from './pages/MyRequests.jsx';
import DonorRequests from './pages/DonorRequests.jsx';

// Wrap a page so only logged-in users can open it
const guard = (page) => <ProtectedRoute>{page}</ProtectedRoute>;

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile" element={guard(<DonorProfile />)} />
        <Route path="/find" element={guard(<FindDonors />)} />
        <Route path="/request/new" element={guard(<NewRequest />)} />
        <Route path="/my-requests" element={guard(<MyRequests />)} />
        <Route path="/donor-requests" element={guard(<DonorRequests />)} />
      </Routes>
    </>
  );
}