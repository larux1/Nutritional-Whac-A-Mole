import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Link, Navigate, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "./App.css";

// API Configuration
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Auth Context
import { createContext, useContext } from "react";
const AuthContext = createContext(null);

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("token");
    if (token) {
      axios.get(`${API}/users/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(response => {
        setUser(response.data);
      })
      .catch(error => {
        console.error("Error fetching user:", error);
        localStorage.removeItem("token");
      })
      .finally(() => {
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username, password) => {
    try {
      const response = await axios.post(`${API}/login`, new URLSearchParams({
        username,
        password
      }), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      
      localStorage.setItem("token", response.data.access_token);
      
      // Fetch user data
      const userResponse = await axios.get(`${API}/users/me`, {
        headers: { Authorization: `Bearer ${response.data.access_token}` }
      });
      
      setUser(userResponse.data);
      return true;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    }
  };

  const register = async (userData) => {
    try {
      await axios.post(`${API}/register`, userData);
      return true;
    } catch (error) {
      console.error("Registration error:", error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, register, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

function useAuth() {
  return useContext(AuthContext);
}

// Auth Guards
function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="flex h-screen items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
    </div>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

// Components
function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 to-purple-900 text-white">
      <div className="container mx-auto px-4 py-20">
        <h1 className="text-6xl font-bold text-center mb-8">Welcome to Game Hub</h1>
        
        <div className="max-w-3xl mx-auto">
          <p className="text-xl text-center mb-12">
            Choose a game and challenge yourself!
          </p>
          
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Whac-A-Deficiency Game Card */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl overflow-hidden transform hover:scale-105 transition-all duration-300">
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-2">Whac-A-Deficiency</h2>
                <p className="text-gray-200 mb-6">
                  Whack those nutritional deficiencies as they pop out of a plate of spaghetti!
                </p>
                <button 
                  onClick={() => navigate('/whac-a-deficiency')}
                  className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition"
                >
                  Play Now
                </button>
              </div>
            </div>
            
            {/* Paris Metro Game Card */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl overflow-hidden transform hover:scale-105 transition-all duration-300">
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-2">Paris Fast-Route Challenge</h2>
                <p className="text-gray-200 mb-6">
                  Find the fastest route between Paris metro stations and test your knowledge!
                </p>
                <button 
                  onClick={() => navigate('/paris-metro')}
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition"
                >
                  Play Now
                </button>
              </div>
            </div>
          </div>
          
          {/* Highscores Button */}
          <div className="text-center">
            <button 
              onClick={() => navigate('/highscores')}
              className="py-3 px-6 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold transition"
            >
              View Highscores
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const from = location.state?.from?.pathname || "/";
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    const success = await login(username, password);
    if (success) {
      navigate(from, { replace: true });
    } else {
      setError("Invalid username or password");
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-900 to-purple-900">
      <div className="bg-white/10 backdrop-blur-lg p-8 rounded-xl shadow-xl w-full max-w-md">
        <h2 className="text-3xl font-bold text-white mb-6 text-center">Login</h2>
        
        {error && (
          <div className="bg-red-600/80 text-white p-3 rounded-lg mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-white mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-3 bg-white/20 border border-white/30 rounded-lg text-white"
              required
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-white mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 bg-white/20 border border-white/30 rounded-lg text-white"
              required
            />
          </div>
          
          <button 
            type="submit"
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition"
          >
            Login
          </button>
        </form>
        
        <div className="mt-4 text-center text-white">
          <p>Don't have an account? <Link to="/register" className="text-blue-300 hover:underline">Register</Link></p>
        </div>
      </div>
    </div>
  );
}

function Register() {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    email: "",
    full_name: "",
    company: ""
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    const success = await register(formData);
    if (success) {
      setSuccess(true);
      setTimeout(() => navigate("/login"), 2000);
    } else {
      setError("Registration failed. Username may already be taken.");
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-900 to-purple-900">
      <div className="bg-white/10 backdrop-blur-lg p-8 rounded-xl shadow-xl w-full max-w-md">
        <h2 className="text-3xl font-bold text-white mb-6 text-center">Register</h2>
        
        {error && (
          <div className="bg-red-600/80 text-white p-3 rounded-lg mb-4">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-600/80 text-white p-3 rounded-lg mb-4">
            Registration successful! Redirecting to login...
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-white mb-1">Username*</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="w-full p-3 bg-white/20 border border-white/30 rounded-lg text-white"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-white mb-1">Password*</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full p-3 bg-white/20 border border-white/30 rounded-lg text-white"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-white mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full p-3 bg-white/20 border border-white/30 rounded-lg text-white"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-white mb-1">Full Name</label>
            <input
              type="text"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              className="w-full p-3 bg-white/20 border border-white/30 rounded-lg text-white"
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-white mb-1">Company</label>
            <input
              type="text"
              name="company"
              value={formData.company}
              onChange={handleChange}
              className="w-full p-3 bg-white/20 border border-white/30 rounded-lg text-white"
            />
          </div>
          
          <button 
            type="submit"
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition"
          >
            Register
          </button>
        </form>
        
        <div className="mt-4 text-center text-white">
          <p>Already have an account? <Link to="/login" className="text-blue-300 hover:underline">Login</Link></p>
        </div>
      </div>
    </div>
  );
}

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="bg-gray-900 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold">Game Hub</Link>
        
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <span>Welcome, {user.username}</span>
              <button 
                onClick={() => navigate('/highscores')}
                className="py-2 px-4 bg-purple-700 rounded hover:bg-purple-800 transition"
              >
                Highscores
              </button>
              <button 
                onClick={logout}
                className="py-2 px-4 bg-red-700 rounded hover:bg-red-800 transition"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="py-2 px-4 bg-blue-700 rounded hover:bg-blue-800 transition">Login</Link>
              <Link to="/register" className="py-2 px-4 bg-green-700 rounded hover:bg-green-800 transition">Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

// Placeholder components for the games (to be implemented)
function WhacADeficiency() {
  return <div className="p-8">
    <h1 className="text-3xl font-bold mb-4">Whac-A-Deficiency Game</h1>
    <p>Coming soon...</p>
  </div>;
}

function ParisMetro() {
  return <div className="p-8">
    <h1 className="text-3xl font-bold mb-4">Paris Metro Game</h1>
    <p>Coming soon...</p>
  </div>;
}

function Highscores() {
  return <div className="p-8">
    <h1 className="text-3xl font-bold mb-4">Highscores</h1>
    <p>Coming soon...</p>
  </div>;
}

function NotFound() {
  return <div className="p-8">
    <h1 className="text-3xl font-bold mb-4">404 - Page Not Found</h1>
    <p>The page you are looking for does not exist.</p>
    <Link to="/" className="text-blue-500 hover:underline">Go back to home</Link>
  </div>;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen bg-gray-100">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            <Route path="/" element={
              <>
                <Navbar />
                <Home />
              </>
            } />
            
            <Route path="/whac-a-deficiency" element={
              <RequireAuth>
                <Navbar />
                <WhacADeficiency />
              </RequireAuth>
            } />
            
            <Route path="/paris-metro" element={
              <RequireAuth>
                <Navbar />
                <ParisMetro />
              </RequireAuth>
            } />
            
            <Route path="/highscores" element={
              <RequireAuth>
                <Navbar />
                <Highscores />
              </RequireAuth>
            } />
            
            <Route path="*" element={
              <>
                <Navbar />
                <NotFound />
              </>
            } />
          </Routes>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;