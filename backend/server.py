from fastapi import FastAPI, APIRouter, HTTPException, Depends, Body, Request
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Dict, Optional, Union, Any
import uuid
from datetime import datetime, timedelta
import json
import random
from fastapi.responses import JSONResponse
import jwt
from passlib.context import CryptContext

# Basic setup
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security setup
SECRET_KEY = "SECRET_KEY_CHANGE_LATER_FOR_PRODUCTION"  # In production use os.environ.get("SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/login")

# Models
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    email: Optional[str] = None
    full_name: Optional[str] = None
    company: Optional[str] = None
    hashed_password: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserCreate(BaseModel):
    username: str
    email: Optional[str] = None
    password: str
    full_name: Optional[str] = None
    company: Optional[str] = None

class UserResponse(BaseModel):
    id: str
    username: str
    email: Optional[str] = None
    full_name: Optional[str] = None
    company: Optional[str] = None

class GameScore(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    game_type: str  # "whac_a_deficiency" or "paris_metro"
    score: int
    time_taken: Optional[float] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class GameScoreCreate(BaseModel):
    game_type: str
    score: int
    time_taken: Optional[float] = None

class WhacDeficiency(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    points: int
    appearance_rate: float
    description: str
    icon: str

# Security functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

async def get_user(username: str):
    user = await db.users.find_one({"username": username})
    if user:
        return User(**user)

async def authenticate_user(username: str, password: str):
    user = await get_user(username)
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except Exception:
        raise credentials_exception
    user = await get_user(username=token_data.username)
    if user is None:
        raise credentials_exception
    return user

# Auth routes
@api_router.post("/login", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@api_router.post("/register", response_model=UserResponse)
async def register_user(user_create: UserCreate):
    # Check if user already exists
    existing_user = await db.users.find_one({"username": user_create.username})
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    # Create new user
    hashed_password = get_password_hash(user_create.password)
    user_data = user_create.dict()
    user_data.pop("password")
    user_data["hashed_password"] = hashed_password
    
    user_obj = User(**user_data)
    await db.users.insert_one(user_obj.dict())
    
    return UserResponse(**user_obj.dict())

@api_router.get("/users/me", response_model=UserResponse)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return UserResponse(**current_user.dict())

# Game Score Routes
@api_router.post("/scores", response_model=GameScore)
async def create_score(
    score: GameScoreCreate,
    current_user: User = Depends(get_current_user)
):
    game_score = GameScore(
        user_id=current_user.id,
        game_type=score.game_type,
        score=score.score,
        time_taken=score.time_taken
    )
    await db.scores.insert_one(game_score.dict())
    return game_score

@api_router.get("/scores/highscores/{game_type}", response_model=List[Dict[str, Any]])
async def get_highscores(game_type: str):
    pipeline = [
        {"$match": {"game_type": game_type}},
        {"$sort": {"score": -1}},
        {"$limit": 10},
        {
            "$lookup": {
                "from": "users",
                "localField": "user_id",
                "foreignField": "id",
                "as": "user"
            }
        },
        {"$unwind": "$user"},
        {
            "$project": {
                "_id": 0,
                "id": 1,
                "score": 1,
                "time_taken": 1,
                "created_at": 1,
                "username": "$user.username",
                "company": "$user.company"
            }
        }
    ]
    
    highscores = await db.scores.aggregate(pipeline).to_list(10)
    return highscores

@api_router.get("/scores/user", response_model=List[GameScore])
async def get_user_scores(current_user: User = Depends(get_current_user)):
    scores = await db.scores.find({"user_id": current_user.id}).to_list(100)
    return [GameScore(**score) for score in scores]

# Whac-A-Deficiency Game Routes
@api_router.get("/whac-a-deficiency/deficiencies", response_model=List[WhacDeficiency])
async def get_deficiencies():
    # For now, return a hardcoded list of deficiencies
    deficiencies = [
        {
            "id": str(uuid.uuid4()),
            "name": "Calcium",
            "points": 10,
            "appearance_rate": 0.3,
            "description": "Essential for bone health",
            "icon": "🦴"
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Vitamin D",
            "points": 15,
            "appearance_rate": 0.2,
            "description": "Helps with calcium absorption",
            "icon": "☁️"
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Iron",
            "points": 20,
            "appearance_rate": 0.2,
            "description": "Crucial for blood health",
            "icon": "🔴"
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Magnesium",
            "points": 25,
            "appearance_rate": 0.15,
            "description": "Important for muscle function",
            "icon": "⚡"
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Vitamin B12",
            "points": 30,
            "appearance_rate": 0.1,
            "description": "Critical for nerve function",
            "icon": "🧠"
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Zinc",
            "points": 35,
            "appearance_rate": 0.05,
            "description": "Supports immune system",
            "icon": "🛡️"
        }
    ]
    
    return [WhacDeficiency(**deficiency) for deficiency in deficiencies]

# Paris Metro Game Routes
# For now, we'll use a simplified version of the Paris metro data
STATIONS = {
    "station1": {"name": "Bastille", "connections": [("station2", 2), ("station5", 4)]},
    "station2": {"name": "Nation", "connections": [("station1", 2), ("station3", 3)]},
    "station3": {"name": "Denfert-Rochereau", "connections": [("station2", 3), ("station4", 2)]},
    "station4": {"name": "Montparnasse", "connections": [("station3", 2), ("station6", 3)]},
    "station5": {"name": "République", "connections": [("station1", 4), ("station6", 5)]},
    "station6": {"name": "Châtelet", "connections": [("station4", 3), ("station5", 5)]}
}

@api_router.get("/paris-metro/stations")
async def get_stations():
    # Convert the Python dict to a format suitable for the frontend
    formatted_stations = {}
    for station_id, station_data in STATIONS.items():
        formatted_stations[station_id] = {
            "name": station_data["name"],
            "connections": [
                {"to": conn[0], "time": conn[1]} for conn in station_data["connections"]
            ]
        }
    return formatted_stations

@api_router.post("/paris-metro/check-route")
async def check_route(route: List[str] = Body(...)):
    # Check if the route is valid
    if len(route) < 2:
        return {"valid": False, "message": "Route must have at least two stations"}
    
    # Check if the stations exist
    for station_id in route:
        if station_id not in STATIONS:
            return {"valid": False, "message": f"Station {station_id} does not exist"}
    
    # Calculate the total time of the route
    total_time = 0
    for i in range(len(route) - 1):
        from_station = route[i]
        to_station = route[i + 1]
        
        # Check if there's a direct connection
        connection_found = False
        for conn in STATIONS[from_station]["connections"]:
            if conn[0] == to_station:
                total_time += conn[1]
                connection_found = True
                break
        
        if not connection_found:
            return {"valid": False, "message": f"No direct connection from {STATIONS[from_station]['name']} to {STATIONS[to_station]['name']}"}
    
    # Calculate the optimal route using Dijkstra's algorithm
    optimal_route, optimal_time = dijkstra(STATIONS, route[0], route[-1])
    
    return {
        "valid": True,
        "route_time": total_time,
        "optimal_time": optimal_time,
        "optimal_route": optimal_route,
        "score": calculate_score(total_time, optimal_time)
    }

def dijkstra(graph, start, end):
    """
    Simple implementation of Dijkstra's algorithm to find the shortest path
    """
    # Initialize distances with infinity for all nodes except the start node
    distances = {node: float('infinity') for node in graph}
    distances[start] = 0
    
    # Initialize visited nodes and previous nodes
    visited = set()
    previous = {node: None for node in graph}
    
    while len(visited) < len(graph):
        # Find the unvisited node with the smallest distance
        current = None
        min_distance = float('infinity')
        for node in graph:
            if node not in visited and distances[node] < min_distance:
                current = node
                min_distance = distances[node]
        
        # If we can't find any more nodes to visit, break
        if current is None or distances[current] == float('infinity'):
            break
        
        visited.add(current)
        
        # If we reached the end, break
        if current == end:
            break
        
        # Update distances to neighbors
        for neighbor, time in graph[current]["connections"]:
            if neighbor not in visited:
                distance = distances[current] + time
                if distance < distances[neighbor]:
                    distances[neighbor] = distance
                    previous[neighbor] = current
    
    # Reconstruct the path
    path = []
    current = end
    while current is not None:
        path.append(current)
        current = previous[current]
    
    path.reverse()
    
    return path, distances[end]

def calculate_score(route_time, optimal_time):
    """
    Calculate a score based on how close the route is to the optimal route
    """
    if route_time == optimal_time:
        return 100  # Perfect score
    
    # Penalty for longer routes
    penalty = (route_time - optimal_time) / optimal_time * 100
    score = max(0, 100 - penalty)
    
    return int(score)

# Root route (for health check)
@api_router.get("/")
async def root():
    return {"message": "Game API is running"}

# Include the router in the main app
app.include_router(api_router)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
