import { useState, useEffect, useRef } from "react";
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
      <div className="container mx-auto px-4 py-12 md:py-20">
        <div className="flex flex-col items-center mb-10">
          <img 
            src="https://www.silamir.com/wp-content/uploads/2024/09/silamir-group-featured-image-1200-630px.jpg" 
            alt="Silamir Logo" 
            className="h-16 md:h-20 mb-8"
          />
          <h1 className="text-4xl md:text-6xl font-bold text-center mb-4">Welcome to Game Hub</h1>
          <p className="text-lg md:text-xl text-center max-w-2xl">
            Choose a game and challenge yourself! Created by Silamir.
          </p>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6 md:gap-8 mb-12">
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
            <label className="block text-white mb-1">Email*</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full p-3 bg-white/20 border border-white/30 rounded-lg text-white"
              required
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
        <div className="flex items-center gap-3">
          <img 
            src="https://www.silamir.com/wp-content/uploads/2024/09/silamir-group-featured-image-1200-630px.jpg" 
            alt="Silamir Logo" 
            className="h-10 mr-2"
          />
          <Link to="/" className="text-2xl font-bold">Game Hub</Link>
        </div>
        
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

// Whac-A-Deficiency Game
function WhacADeficiency() {
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [deficiencies, setDeficiencies] = useState([]);
  const [activeHoles, setActiveHoles] = useState({});
  const [deficiencyTypes, setDeficiencyTypes] = useState([]);
  const [difficulty, setDifficulty] = useState('normal');
  const [scorePopups, setScorePopups] = useState([]);
  const [gameSpeed, setGameSpeed] = useState(1000); // Temps entre les apparitions en ms
  const [comboCount, setComboCount] = useState(0);
  const [lastWhackTime, setLastWhackTime] = useState(0);
  const [comboMultiplier, setComboMultiplier] = useState(1);
  const [gameMode, setGameMode] = useState('standard'); // 'standard' ou 'survival'
  const [survivalLevel, setSurvivalLevel] = useState(1);
  const { user } = useAuth();
  
  const plateRef = useRef(null);
  const holes = 9; // Nombre de trous dans le plateau de jeu
  
  // Récupérer les types de déficiences depuis le backend
  useEffect(() => {
    const fetchDeficiencyTypes = async () => {
      try {
        const response = await axios.get(`${API}/whac-a-deficiency/deficiencies`);
        setDeficiencyTypes(response.data);
      } catch (error) {
        console.error("Error fetching deficiencies:", error);
      }
    };
    
    fetchDeficiencyTypes();
  }, []);
  
  // Minuteur de jeu
  useEffect(() => {
    if (!gameStarted || gameOver) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [gameStarted, gameOver]);
  
  // Mode survie - augmenter la difficulté progressivement
  useEffect(() => {
    if (!gameStarted || gameOver || gameMode !== 'survival') return;
    
    // Augmenter le niveau de survie toutes les 15 secondes
    const survivalTimer = setInterval(() => {
      setSurvivalLevel(prev => {
        const newLevel = prev + 1;
        // Réduire le temps entre les apparitions au fur et à mesure
        setGameSpeed(currentSpeed => Math.max(300, currentSpeed - 100));
        return newLevel;
      });
    }, 15000);
    
    return () => clearInterval(survivalTimer);
  }, [gameStarted, gameOver, gameMode]);
  
  // Gestion du combo
  useEffect(() => {
    if (comboCount === 0) {
      setComboMultiplier(1);
      return;
    }
    
    // Définir le multiplicateur en fonction du nombre de combos
    if (comboCount >= 10) setComboMultiplier(3);
    else if (comboCount >= 5) setComboMultiplier(2);
    else if (comboCount >= 3) setComboMultiplier(1.5);
    else setComboMultiplier(1);
    
    // Réinitialiser le combo après 2 secondes d'inactivité
    const comboTimer = setTimeout(() => {
      setComboCount(0);
    }, 2000);
    
    return () => clearTimeout(comboTimer);
  }, [comboCount]);
  
  // Faire apparaître les déficiences
  useEffect(() => {
    if (!gameStarted || gameOver || deficiencyTypes.length === 0) return;
    
    // Calculer le temps entre les apparitions en fonction de la difficulté et du mode
    let spawnTime;
    if (gameMode === 'survival') {
      // En mode survie, le temps diminue avec le niveau
      spawnTime = Math.max(300, gameSpeed - (survivalLevel * 50));
    } else {
      // En mode standard, le temps dépend de la difficulté
      spawnTime = difficulty === 'easy' ? gameSpeed * 1.5 : 
                  difficulty === 'normal' ? gameSpeed : 
                  gameSpeed * 0.7;
    }
    
    const spawnInterval = setInterval(() => {
      // Choisir un trou aléatoire qui n'est pas actif
      const availableHoles = Array.from({ length: holes }, (_, i) => i + 1)
        .filter(hole => !activeHoles[hole]);
      
      if (availableHoles.length === 0) return;
      
      const randomHole = availableHoles[Math.floor(Math.random() * availableHoles.length)];
      
      // Sélectionner un type de déficience en fonction du taux d'apparition
      let totalRate = 0;
      
      // Ajuster les taux d'apparition en mode survie pour plus de malus
      const adjustedDeficiencyTypes = [...deficiencyTypes].map(type => {
        if (gameMode === 'survival' && survivalLevel > 3) {
          // Augmenter l'apparition des malus en mode survie avancé
          if (type.type === 'malus') {
            return { ...type, appearance_rate: type.appearance_rate * (1 + (survivalLevel * 0.1)) };
          }
        }
        return type;
      });
      
      adjustedDeficiencyTypes.forEach(type => {
        totalRate += type.appearance_rate;
      });
      
      let randomRate = Math.random() * totalRate;
      let selectedDeficiency = null;
      
      for (const deficiency of adjustedDeficiencyTypes) {
        randomRate -= deficiency.appearance_rate;
        if (randomRate <= 0) {
          selectedDeficiency = deficiency;
          break;
        }
      }
      
      if (!selectedDeficiency) {
        selectedDeficiency = adjustedDeficiencyTypes[0];
      }
      
      // Calculer la durée d'apparition en fonction de la difficulté et du type
      let duration;
      if (gameMode === 'survival') {
        // En mode survie, la durée diminue avec le niveau
        duration = Math.max(800, 2000 - (survivalLevel * 100));
      } else {
        // En mode standard, la durée dépend de la difficulté
        const baseDuration = difficulty === 'easy' ? 2500 : 
                            difficulty === 'normal' ? 2000 : 
                            1500;
        
        // Les bonus et malus apparaissent plus brièvement
        if (selectedDeficiency.type === 'bonus' || selectedDeficiency.type === 'malus') {
          duration = baseDuration * 0.7;
        } else {
          duration = baseDuration;
        }
      }
      
      // Créer une nouvelle déficience
      const newDeficiency = {
        id: Date.now().toString(),
        type: selectedDeficiency,
        hole: randomHole,
        duration: duration
      };
      
      setDeficiencies(prev => [...prev, newDeficiency]);
      setActiveHoles(prev => ({ ...prev, [randomHole]: true }));
      
      // Supprimer automatiquement la déficience après sa durée
      setTimeout(() => {
        setDeficiencies(prev => prev.filter(d => d.id !== newDeficiency.id));
        setActiveHoles(prev => {
          const newHoles = { ...prev };
          delete newHoles[randomHole];
          return newHoles;
        });
      }, newDeficiency.duration);
      
    }, spawnTime);
    
    return () => clearInterval(spawnInterval);
  }, [gameStarted, gameOver, deficiencyTypes, difficulty, activeHoles, gameSpeed, gameMode, survivalLevel]);
  
  // Démarrer le jeu
  const startGame = () => {
    setGameStarted(true);
    setGameOver(false);
    setScore(0);
    setTimeLeft(gameMode === 'survival' ? 60 : 60); // Mode survie sans limite de temps
    setDeficiencies([]);
    setActiveHoles({});
    setScorePopups([]);
    setComboCount(0);
    setComboMultiplier(1);
    setSurvivalLevel(1);
    setGameSpeed(1000);
  };
  
  // Terminer le jeu
  const endGame = async () => {
    setGameOver(true);
    setGameStarted(false);
    
    // Sauvegarder le score dans le backend
    try {
      await axios.post(
        `${API}/scores`, 
        {
          game_type: "whac_a_deficiency",
          score: score,
          time_taken: gameMode === 'survival' ? survivalLevel * 15 : 60
        },
        {
          headers: { 
            Authorization: `Bearer ${localStorage.getItem("token")}` 
          }
        }
      );
    } catch (error) {
      console.error("Error saving score:", error);
    }
  };
  
  // Gérer le fait de taper une déficience
  const whackDeficiency = (deficiency, event) => {
    if (!gameStarted || gameOver) return;
    
    // Supprimer la déficience du jeu
    setDeficiencies(prev => prev.filter(d => d.id !== deficiency.id));
    
    // Libérer le trou
    setActiveHoles(prev => {
      const newHoles = { ...prev };
      delete newHoles[deficiency.hole];
      return newHoles;
    });
    
    const now = Date.now();
    const timeSinceLastWhack = now - lastWhackTime;
    setLastWhackTime(now);
    
    // Gérer le combo
    if (deficiency.type.type === 'malus') {
      // Réinitialiser le combo si on tape un malus
      setComboCount(0);
    } else if (timeSinceLastWhack < 1500) {
      // Augmenter le combo si on tape rapidement
      setComboCount(prev => prev + 1);
    } else {
      // Réinitialiser le combo si on tape trop lentement
      setComboCount(1);
    }
    
    // Calculer les points gagnés
    let pointsEarned = deficiency.type.points;
    
    // Appliquer le multiplicateur de combo
    if (deficiency.type.type !== 'malus') {
      pointsEarned = Math.round(pointsEarned * comboMultiplier);
    }
    
    // Ajouter/soustraire les points
    setScore(prev => Math.max(0, prev + pointsEarned));
    
    // En mode survie, gérer les effets spéciaux des malus
    if (gameMode === 'survival' && deficiency.type.type === 'malus') {
      // Réduire le temps restant pour les malus
      if (deficiency.type.name === 'Ananas') {
        setTimeLeft(prev => Math.max(5, prev - 5)); // -5 secondes pour l'ananas
      } else {
        setTimeLeft(prev => Math.max(1, prev - 2)); // -2 secondes pour les autres malus
      }
    }
    
    // Créer une popup de score
    if (event && plateRef.current) {
      const rect = plateRef.current.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      const popup = {
        id: Date.now().toString(),
        points: pointsEarned,
        x,
        y,
        type: deficiency.type.type // Pour styliser différemment selon le type
      };
      
      setScorePopups(prev => [...prev, popup]);
      
      // Supprimer la popup après l'animation
      setTimeout(() => {
        setScorePopups(prev => prev.filter(p => p.id !== popup.id));
      }, 1000);
    }
  };
  
  // Calculer la position de chaque trou sur le plateau
  const getHolePosition = (holeNumber) => {
    // Les positions sont basées sur une grille 3x3
    const row = Math.floor((holeNumber - 1) / 3);
    const col = (holeNumber - 1) % 3;
    
    // Calculer les positions en pourcentage
    const top = 20 + row * 30; // 20%, 50%, 80%
    const left = 20 + col * 30; // 20%, 50%, 80%
    
    return { top: `${top}%`, left: `${left}%` };
  };
  
  // Obtenir la couleur en fonction du type de déficience
  const getDeficiencyColor = (type) => {
    switch (type) {
      case 'bonus':
        return 'bg-green-500';
      case 'malus':
        return 'bg-red-500';
      default:
        return 'bg-blue-500';
    }
  };
  
  return (
    <div className="flex flex-col items-center min-h-screen bg-gradient-to-b from-amber-700 to-red-900 p-6">
      <h1 className="text-4xl font-bold text-white mb-4">Whac-A-Deficiency</h1>
      
      {/* Contrôles du jeu */}
      <div className="bg-white/10 backdrop-blur-lg p-4 rounded-xl w-full max-w-3xl mb-6">
        <div className="flex flex-wrap justify-between items-center">
          <div className="text-white">
            <div className="text-xl font-bold">Score: {score}</div>
            <div>Temps: {timeLeft} secondes</div>
            {comboCount > 2 && (
              <div className="mt-1 animate-pulse">
                <span className="font-bold text-yellow-400">COMBO x{comboCount}</span>
                <span className="ml-2 text-green-400">({comboMultiplier}x)</span>
              </div>
            )}
            {gameMode === 'survival' && gameStarted && (
              <div className="mt-1">
                <span className="font-bold text-purple-400">Niveau {survivalLevel}</span>
              </div>
            )}
          </div>
          
          {!gameStarted && !gameOver && (
            <div className="flex flex-wrap gap-3">
              <div className="flex flex-col gap-2">
                <select 
                  value={difficulty}
                  onChange={e => setDifficulty(e.target.value)}
                  className="bg-white/20 border border-white/30 rounded px-3 py-2 text-white"
                  disabled={gameMode === 'survival'}
                >
                  <option value="easy">Facile</option>
                  <option value="normal">Normal</option>
                  <option value="hard">Difficile</option>
                </select>
                
                <select 
                  value={gameMode}
                  onChange={e => setGameMode(e.target.value)}
                  className="bg-white/20 border border-white/30 rounded px-3 py-2 text-white"
                >
                  <option value="standard">Mode Standard</option>
                  <option value="survival">Mode Survie</option>
                </select>
              </div>
              
              <button 
                onClick={startGame}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-bold transition"
              >
                Démarrer
              </button>
            </div>
          )}
          
          {gameOver && (
            <div className="flex items-center gap-4">
              <div className="text-white text-2xl font-bold">Game Over!</div>
              <button 
                onClick={startGame}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-bold transition"
              >
                Rejouer
              </button>
            </div>
          )}
          
          {gameStarted && (
            <button 
              onClick={endGame}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-bold transition"
            >
              Terminer
            </button>
          )}
        </div>
      </div>
      
      {/* Plateau de jeu */}
      <div 
        ref={plateRef}
        className="spaghetti-plate relative mx-auto shadow-2xl mb-8"
        style={{
          backgroundColor: "#FCF5E5",
          backgroundImage: `url(https://images.pexels.com/photos/6249720/pexels-photo-6249720.jpeg)`,
          backgroundSize: "cover",
          backgroundPosition: "center"
        }}
      >
        {/* Barre de progression du mode survie */}
        {gameMode === 'survival' && gameStarted && (
          <div className="absolute top-0 left-0 w-full h-3 bg-gray-800/50">
            <div 
              className="h-full bg-purple-600 transition-all duration-300"
              style={{ width: `${Math.min(100, (survivalLevel / 10) * 100)}%` }}
            ></div>
          </div>
        )}
        
        {/* Trous */}
        {Array.from({ length: holes }, (_, i) => i + 1).map(holeNumber => {
          const position = getHolePosition(holeNumber);
          const deficiency = deficiencies.find(d => d.hole === holeNumber);
          
          return (
            <div 
              key={holeNumber}
              className="absolute w-20 h-20 flex items-center justify-center"
              style={{
                top: position.top,
                left: position.left,
                transform: 'translate(-50%, -50%)'
              }}
            >
              {deficiency && (
                <div 
                  className={`whac-deficiency cursor-pointer select-none`}
                  onClick={(e) => whackDeficiency(deficiency, e)}
                >
                  <div className={`rounded-full p-2 shadow-lg ${
                    deficiency.type.type === 'bonus' ? 'bg-green-100' : 
                    deficiency.type.type === 'malus' ? 'bg-red-100' : 
                    'bg-white'
                  }`}>
                    <div className="text-4xl">{deficiency.type.icon}</div>
                    <div className={`text-xs font-bold ${
                      deficiency.type.type === 'bonus' ? 'text-green-700' : 
                      deficiency.type.type === 'malus' ? 'text-red-700' : 
                      'text-gray-800'
                    }`}>{deficiency.type.name}</div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        
        {/* Popups de score */}
        {scorePopups.map(popup => (
          <div
            key={popup.id}
            className={`score-popup font-bold text-xl ${
              popup.points > 0 ? 'text-green-400' : 'text-red-400'
            }`}
            style={{
              left: `${popup.x}px`,
              top: `${popup.y}px`
            }}
          >
            {popup.points > 0 ? `+${popup.points}` : popup.points}
          </div>
        ))}
      </div>
      
      {/* Instructions */}
      <div className="bg-white/10 backdrop-blur-lg p-6 rounded-xl w-full max-w-3xl text-white">
        <h2 className="text-2xl font-bold mb-3">Comment jouer</h2>
        <p className="mb-3">Cliquez sur les éléments nutritionnels lorsqu'ils apparaissent dans le plat de spaghetti!</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
          <div className="bg-blue-900/30 p-4 rounded-lg">
            <h3 className="text-xl font-bold mb-2 text-blue-300">Déficiences</h3>
            <p className="mb-2">Tapez dessus pour gagner des points!</p>
            <div className="grid gap-2">
              {deficiencyTypes.filter(d => d.type === 'deficiency').slice(0, 3).map(deficiency => (
                <div key={deficiency.id} className="bg-white/20 p-3 rounded-lg flex items-center gap-3">
                  <div className="text-4xl">{deficiency.icon}</div>
                  <div>
                    <div className="font-bold">{deficiency.name}</div>
                    <div className="text-sm opacity-80">{deficiency.points} pts</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-green-900/30 p-4 rounded-lg">
            <h3 className="text-xl font-bold mb-2 text-green-300">Bonus</h3>
            <p className="mb-2">Tapez dessus pour des points supplémentaires!</p>
            <div className="grid gap-2">
              {deficiencyTypes.filter(d => d.type === 'bonus').map(deficiency => (
                <div key={deficiency.id} className="bg-white/20 p-3 rounded-lg flex items-center gap-3">
                  <div className="text-4xl">{deficiency.icon}</div>
                  <div>
                    <div className="font-bold">{deficiency.name}</div>
                    <div className="text-sm opacity-80">{deficiency.points} pts</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-red-900/30 p-4 rounded-lg">
            <h3 className="text-xl font-bold mb-2 text-red-300">Malus</h3>
            <p className="mb-2">Évitez de taper dessus ou perdez des points!</p>
            <div className="grid gap-2">
              {deficiencyTypes.filter(d => d.type === 'malus').slice(0, 3).map(deficiency => (
                <div key={deficiency.id} className="bg-white/20 p-3 rounded-lg flex items-center gap-3">
                  <div className="text-4xl">{deficiency.icon}</div>
                  <div>
                    <div className="font-bold">{deficiency.name}</div>
                    <div className="text-sm opacity-80">{deficiency.points} pts</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="bg-yellow-900/30 p-4 rounded-lg">
          <h3 className="text-xl font-bold mb-2 text-yellow-300">Astuces</h3>
          <ul className="list-disc list-inside space-y-1">
            <li>Tapez rapidement pour enchaîner des combos et multiplier vos points!</li>
            <li>En mode survie, la difficulté augmente toutes les 15 secondes!</li>
            <li>Les bonus et les déficiences rapportent des points, les malus en font perdre!</li>
            <li>En mode survie, les malus peuvent également réduire votre temps restant!</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// Paris Metro Game
function ParisMetro() {
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [stations, setStations] = useState({});
  const [selectedStations, setSelectedStations] = useState([]);
  const [route, setRoute] = useState([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [result, setResult] = useState(null);
  const [difficulty, setDifficulty] = useState('normal');
  const [inputMethod, setInputMethod] = useState('map');
  const [stationFrom, setStationFrom] = useState('');
  const [stationTo, setStationTo] = useState('');
  const mapRef = useRef(null);
  
  // Fetch stations from backend
  useEffect(() => {
    const fetchStations = async () => {
      try {
        const response = await axios.get(`${API}/paris-metro/stations`);
        setStations(response.data);
      } catch (error) {
        console.error("Error fetching stations:", error);
      }
    };
    
    fetchStations();
  }, []);
  
  // Game timer
  useEffect(() => {
    if (!gameStarted || gameOver) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          checkRoute(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [gameStarted, gameOver]);
  
  // Start the game
  const startGame = () => {
    // Reset state
    setGameStarted(true);
    setGameOver(false);
    setSelectedStations([]);
    setRoute([]);
    setScore(0);
    setResult(null);
    
    // Set time based on difficulty
    setTimeLeft(
      difficulty === 'easy' ? 45 : 
      difficulty === 'normal' ? 30 : 
      20
    );
    
    // Pick random stations for challenge
    const stationIds = Object.keys(stations);
    if (stationIds.length >= 2) {
      const station1 = stationIds[Math.floor(Math.random() * stationIds.length)];
      
      // Make sure we pick a different second station
      let station2;
      do {
        station2 = stationIds[Math.floor(Math.random() * stationIds.length)];
      } while (station2 === station1);
      
      setSelectedStations([station1, station2]);
    }
  };
  
  // Handle station selection on the map
  const selectStation = (stationId) => {
    if (!gameStarted || gameOver) return;
    
    setRoute(prev => {
      // If this station is already the last one in the route, remove it
      if (prev.length > 0 && prev[prev.length - 1] === stationId) {
        return prev.slice(0, -1);
      }
      
      // Add the station to the route
      return [...prev, stationId];
    });
  };
  
  // Check if the proposed route is valid
  const checkRoute = async (timeUp = false) => {
    if (route.length < 2) {
      setResult({
        valid: false,
        message: "Route must have at least two stations"
      });
      return;
    }
    
    try {
      const response = await axios.post(`${API}/paris-metro/check-route`, route);
      
      // Update the result
      setResult(response.data);
      
      // If the route is valid, update the score and end the game
      if (response.data.valid) {
        setScore(response.data.score);
        
        // Submit score to backend
        try {
          await axios.post(
            `${API}/scores`, 
            {
              game_type: "paris_metro",
              score: response.data.score,
              time_taken: difficulty === 'easy' ? 45 - timeLeft : 
                         difficulty === 'normal' ? 30 - timeLeft : 
                         20 - timeLeft
            },
            {
              headers: { 
                Authorization: `Bearer ${localStorage.getItem("token")}` 
              }
            }
          );
        } catch (error) {
          console.error("Error saving score:", error);
        }
      }
      
      // End the game
      setGameOver(true);
      setGameStarted(false);
      
    } catch (error) {
      console.error("Error checking route:", error);
      setResult({
        valid: false,
        message: "Error checking route"
      });
    }
  };
  
  // Handle form submission for text input method
  const handleFormSubmit = (e) => {
    e.preventDefault();
    
    if (!stationFrom || !stationTo) {
      setResult({
        valid: false,
        message: "Please select both departure and arrival stations"
      });
      return;
    }
    
    // Convert station names to IDs
    const fromId = Object.keys(stations).find(
      id => stations[id].name.toLowerCase() === stationFrom.toLowerCase()
    );
    
    const toId = Object.keys(stations).find(
      id => stations[id].name.toLowerCase() === stationTo.toLowerCase()
    );
    
    if (!fromId || !toId) {
      setResult({
        valid: false,
        message: "One or both stations not found"
      });
      return;
    }
    
    // Set the route and check it
    setRoute([fromId, toId]);
    setTimeout(() => checkRoute(), 100);
  };
  
  return (
    <div className="flex flex-col items-center min-h-screen bg-gradient-to-b from-blue-900 to-purple-900 p-6">
      <h1 className="text-4xl font-bold text-white mb-4">Paris Fast-Route Challenge</h1>
      
      {/* Game Controls */}
      <div className="bg-white/10 backdrop-blur-lg p-4 rounded-xl w-full max-w-4xl mb-6">
        <div className="flex flex-wrap justify-between items-center">
          <div className="text-white">
            {selectedStations.length === 2 && stations[selectedStations[0]] && stations[selectedStations[1]] && (
              <div>
                <div className="text-xl font-bold">Find the fastest route:</div>
                <div>From: {stations[selectedStations[0]].name}</div>
                <div>To: {stations[selectedStations[1]].name}</div>
              </div>
            )}
            
            {gameStarted && (
              <div className="mt-2">Time left: {timeLeft} seconds</div>
            )}
            
            {gameOver && score > 0 && (
              <div className="text-xl font-bold mt-2">Score: {score}</div>
            )}
          </div>
          
          {!gameStarted && !gameOver && (
            <div className="flex flex-wrap gap-3 mt-2 md:mt-0">
              <select 
                value={difficulty}
                onChange={e => setDifficulty(e.target.value)}
                className="bg-white/20 border border-white/30 rounded px-3 py-2 text-white"
              >
                <option value="easy">Easy (45s)</option>
                <option value="normal">Normal (30s)</option>
                <option value="hard">Hard (20s)</option>
              </select>
              
              <select 
                value={inputMethod}
                onChange={e => setInputMethod(e.target.value)}
                className="bg-white/20 border border-white/30 rounded px-3 py-2 text-white"
              >
                <option value="map">Map Selection</option>
                <option value="text">Text Input</option>
              </select>
              
              <button 
                onClick={startGame}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold transition"
              >
                Start Challenge
              </button>
            </div>
          )}
          
          {gameStarted && inputMethod === 'map' && (
            <div className="flex flex-wrap gap-3 mt-2 md:mt-0">
              <button 
                onClick={() => checkRoute()}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-bold transition"
              >
                Submit Route
              </button>
              
              <button 
                onClick={() => setRoute([])}
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-2 rounded-lg font-bold transition"
              >
                Clear Route
              </button>
            </div>
          )}
          
          {gameOver && (
            <div className="flex flex-wrap gap-3 mt-4 md:mt-0">
              <button 
                onClick={startGame}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold transition"
              >
                New Challenge
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Result Display */}
      {result && (
        <div className={`bg-white/10 backdrop-blur-lg p-4 rounded-xl w-full max-w-4xl mb-6 ${
          result.valid ? 'border-2 border-green-500' : 'border-2 border-red-500'
        }`}>
          <div className="text-white">
            <div className="text-xl font-bold mb-2">
              {result.valid ? "Route Valid!" : "Route Invalid!"}
            </div>
            
            {result.message && (
              <div className="mb-3">{result.message}</div>
            )}
            
            {result.valid && (
              <>
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <div className="font-bold">Your Route Time:</div>
                    <div>{result.route_time} minutes</div>
                  </div>
                  <div>
                    <div className="font-bold">Optimal Route Time:</div>
                    <div>{result.optimal_time} minutes</div>
                  </div>
                </div>
                
                <div>
                  <div className="font-bold mb-1">Optimal Route:</div>
                  <div className="flex flex-wrap gap-2">
                    {result.optimal_route.map((stationId, index) => (
                      <span key={stationId} className="flex items-center">
                        {stations[stationId]?.name}
                        {index < result.optimal_route.length - 1 && (
                          <span className="mx-1">→</span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      
      {/* Game Board - Map or Text Input */}
      <div className="bg-white/10 backdrop-blur-lg p-4 rounded-xl w-full max-w-4xl mb-6">
        {inputMethod === 'map' ? (
          <div className="relative" ref={mapRef}>
            {/* Metro Map Background */}
            <div 
              className="rounded-lg overflow-hidden relative"
              style={{
                backgroundImage: `url(https://images.unsplash.com/photo-1736117705678-4d7d49850205)`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                minHeight: "500px"
              }}
            >
              {/* Station Markers */}
              {Object.entries(stations).map(([stationId, station]) => {
                // Random positions for demo, would be replaced with actual coordinates in a real implementation
                const top = 10 + Math.random() * 80;
                const left = 10 + Math.random() * 80;
                
                const isSelected = selectedStations.includes(stationId);
                const isInRoute = route.includes(stationId);
                const isStart = route.length > 0 && route[0] === stationId;
                const isEnd = route.length > 1 && route[route.length - 1] === stationId;
                
                return (
                  <div
                    key={stationId}
                    className={`absolute w-6 h-6 rounded-full flex items-center justify-center cursor-pointer metro-station ${
                      isSelected ? 'bg-yellow-500 shadow-lg' : 
                      isInRoute ? 'bg-green-500 shadow-lg' : 
                      'bg-gray-200 hover:bg-gray-300'
                    } ${isInRoute ? 'selected' : ''}`}
                    style={{
                      top: `${top}%`,
                      left: `${left}%`,
                      transform: 'translate(-50%, -50%)',
                      zIndex: isInRoute ? 10 : 5
                    }}
                    onClick={() => selectStation(stationId)}
                  >
                    {isStart && <div className="absolute -top-6 text-white font-bold">Start</div>}
                    {isEnd && <div className="absolute -bottom-6 text-white font-bold">End</div>}
                  </div>
                );
              })}
              
              {/* Route Lines */}
              {route.length > 1 && (
                <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{ zIndex: 2 }}>
                  {route.map((stationId, index) => {
                    if (index === 0) return null;
                    
                    const prevStationId = route[index - 1];
                    
                    // Get position of stations (randomly generated in this demo)
                    const stations = document.querySelectorAll('.metro-station');
                    const prevStation = Array.from(stations).find(
                      el => el.getAttribute('key') === prevStationId
                    );
                    const currStation = Array.from(stations).find(
                      el => el.getAttribute('key') === stationId
                    );
                    
                    if (!prevStation || !currStation) return null;
                    
                    const prevRect = prevStation.getBoundingClientRect();
                    const currRect = currStation.getBoundingClientRect();
                    const mapRect = mapRef.current.getBoundingClientRect();
                    
                    const x1 = prevRect.left + prevRect.width / 2 - mapRect.left;
                    const y1 = prevRect.top + prevRect.height / 2 - mapRect.top;
                    const x2 = currRect.left + currRect.width / 2 - mapRect.left;
                    const y2 = currRect.top + currRect.height / 2 - mapRect.top;
                    
                    return (
                      <line
                        key={`${prevStationId}-${stationId}`}
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        className="metro-line highlighted"
                        stroke="#22c55e"
                        strokeLinecap="round"
                      />
                    );
                  })}
                </svg>
              )}
            </div>
            
            {/* Selected Route Display */}
            {route.length > 0 && (
              <div className="mt-4 p-3 bg-white/20 rounded-lg">
                <div className="text-white font-bold mb-2">Your Route:</div>
                <div className="flex flex-wrap gap-2 text-white">
                  {route.map((stationId, index) => (
                    <span key={stationId} className="flex items-center">
                      {stations[stationId]?.name}
                      {index < route.length - 1 && (
                        <span className="mx-1">→</span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleFormSubmit} className="text-white">
            <div className="text-xl font-bold mb-4">Enter your route:</div>
            
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block mb-2">From Station:</label>
                <input
                  type="text"
                  value={stationFrom}
                  onChange={e => setStationFrom(e.target.value)}
                  list="station-list"
                  className="w-full p-3 bg-white/20 border border-white/30 rounded-lg text-white"
                  placeholder="Start typing station name..."
                  required
                />
              </div>
              
              <div>
                <label className="block mb-2">To Station:</label>
                <input
                  type="text"
                  value={stationTo}
                  onChange={e => setStationTo(e.target.value)}
                  list="station-list"
                  className="w-full p-3 bg-white/20 border border-white/30 rounded-lg text-white"
                  placeholder="Start typing station name..."
                  required
                />
              </div>
            </div>
            
            <button 
              type="submit"
              disabled={!gameStarted || gameOver}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-bold transition disabled:opacity-50"
            >
              Submit Route
            </button>
            
            {/* Datalist for station autocomplete */}
            <datalist id="station-list">
              {Object.values(stations).map(station => (
                <option key={station.name} value={station.name} />
              ))}
            </datalist>
          </form>
        )}
      </div>
      
      {/* Instructions */}
      <div className="bg-white/10 backdrop-blur-lg p-6 rounded-xl w-full max-w-4xl text-white">
        <h2 className="text-2xl font-bold mb-3">How to Play</h2>
        <p className="mb-3">Find the fastest route between the two highlighted stations on the Paris metro map.</p>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-xl font-bold mb-2">Map Selection Mode:</h3>
            <ol className="list-decimal list-inside space-y-1">
              <li>Click on stations to create your route</li>
              <li>Click a station again to remove it from the end of your route</li>
              <li>Click "Submit Route" when you're ready</li>
              <li>The closer your route time is to the optimal time, the higher your score!</li>
            </ol>
          </div>
          
          <div>
            <h3 className="text-xl font-bold mb-2">Text Input Mode:</h3>
            <ol className="list-decimal list-inside space-y-1">
              <li>Type the names of your starting and ending stations</li>
              <li>Use the autocomplete to find stations</li>
              <li>Click "Submit Route" when you're ready</li>
              <li>The system will evaluate the direct connection between the two stations</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

function Highscores() {
  const [activeGame, setActiveGame] = useState('whac_a_deficiency');
  const [highscores, setHighscores] = useState([]);
  const [userScores, setUserScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  
  // Fetch highscores and user scores
  useEffect(() => {
    const fetchScores = async () => {
      setLoading(true);
      try {
        // Fetch highscores for the selected game
        const highscoresResponse = await axios.get(
          `${API}/scores/highscores/${activeGame}`,
          {
            headers: { 
              Authorization: `Bearer ${localStorage.getItem("token")}` 
            }
          }
        );
        
        setHighscores(highscoresResponse.data);
        
        // Fetch user's personal scores
        const userScoresResponse = await axios.get(
          `${API}/scores/user`,
          {
            headers: { 
              Authorization: `Bearer ${localStorage.getItem("token")}` 
            }
          }
        );
        
        // Filter scores for the active game
        const filteredScores = userScoresResponse.data
          .filter(score => score.game_type === activeGame)
          .sort((a, b) => b.score - a.score);
        
        setUserScores(filteredScores);
      } catch (error) {
        console.error("Error fetching scores:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchScores();
  }, [activeGame, user]);
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 to-indigo-900 p-6">
      <div className="container mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8 text-center">Highscores</h1>
        
        {/* Game selector */}
        <div className="bg-white/10 backdrop-blur-lg p-4 rounded-xl mb-8 flex justify-center">
          <div className="inline-flex rounded-md shadow-sm" role="group">
            <button
              type="button"
              className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
                activeGame === 'whac_a_deficiency'
                  ? 'bg-green-600 text-white'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
              onClick={() => setActiveGame('whac_a_deficiency')}
            >
              Whac-A-Deficiency
            </button>
            <button
              type="button"
              className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
                activeGame === 'paris_metro'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
              onClick={() => setActiveGame('paris_metro')}
            >
              Paris Fast-Route
            </button>
          </div>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
          {/* Global Highscores */}
          <div className="bg-white/10 backdrop-blur-lg p-6 rounded-xl">
            <h2 className="text-2xl font-bold text-white mb-4">
              {activeGame === 'whac_a_deficiency' ? 'Whac-A-Deficiency' : 'Paris Fast-Route'} - Global Highscores
            </h2>
            
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
              </div>
            ) : highscores.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-white">
                  <thead className="border-b border-white/20">
                    <tr>
                      <th className="py-3 px-4 text-left">Rank</th>
                      <th className="py-3 px-4 text-left">Player</th>
                      <th className="py-3 px-4 text-left">Score</th>
                      <th className="py-3 px-4 text-left">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {highscores.map((score, index) => (
                      <tr key={score.id} className="border-b border-white/10">
                        <td className="py-3 px-4">
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}`}
                        </td>
                        <td className="py-3 px-4">
                          {score.username}
                          {score.company && (
                            <span className="text-xs ml-2 opacity-70">({score.company})</span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-bold">{score.score}</td>
                        <td className="py-3 px-4 text-sm opacity-70">{formatDate(score.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-white text-center py-8">
                No highscores available yet. Be the first to play!
              </div>
            )}
          </div>
          
          {/* Your Personal Scores */}
          <div className="bg-white/10 backdrop-blur-lg p-6 rounded-xl">
            <h2 className="text-2xl font-bold text-white mb-4">Your Personal Best Scores</h2>
            
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
              </div>
            ) : userScores.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-white">
                  <thead className="border-b border-white/20">
                    <tr>
                      <th className="py-3 px-4 text-left">Rank</th>
                      <th className="py-3 px-4 text-left">Score</th>
                      <th className="py-3 px-4 text-left">Time Taken</th>
                      <th className="py-3 px-4 text-left">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userScores.map((score, index) => (
                      <tr key={score.id} className="border-b border-white/10">
                        <td className="py-3 px-4">
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}`}
                        </td>
                        <td className="py-3 px-4 font-bold">{score.score}</td>
                        <td className="py-3 px-4">
                          {score.time_taken ? `${score.time_taken}s` : 'N/A'}
                        </td>
                        <td className="py-3 px-4 text-sm opacity-70">{formatDate(score.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-white text-center py-8">
                You haven't played {activeGame === 'whac_a_deficiency' ? 'Whac-A-Deficiency' : 'Paris Fast-Route'} yet!
              </div>
            )}
            
            <div className="mt-6 flex justify-center">
              <Link 
                to={activeGame === 'whac_a_deficiency' ? '/whac-a-deficiency' : '/paris-metro'}
                className={`px-6 py-3 rounded-lg font-bold transition ${
                  activeGame === 'whac_a_deficiency' 
                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                Play {activeGame === 'whac_a_deficiency' ? 'Whac-A-Deficiency' : 'Paris Fast-Route'}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
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