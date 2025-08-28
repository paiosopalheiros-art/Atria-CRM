from fastapi import FastAPI, APIRouter, HTTPException, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timedelta


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI(
    title="Web-Mobile Connect API",
    description="API para comunicação entre aplicação web e mobile",
    version="1.0.0"
)

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    status: str = "active"
    platform: str = "web"
    version: Optional[str] = "1.0.0"

class StatusCheckCreate(BaseModel):
    client_name: str
    platform: Optional[str] = "web"
    version: Optional[str] = "1.0.0"

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: str
    platform: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_active: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True

class UserCreate(BaseModel):
    name: str
    email: str
    platform: str = "web"

class ApiResponse(BaseModel):
    success: bool
    message: str
    data: Optional[dict] = None

class SystemStats(BaseModel):
    total_users: int
    active_sessions: int
    total_status_checks: int
    web_users: int
    mobile_users: int
    last_updated: datetime = Field(default_factory=datetime.utcnow)

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Web-Mobile Connect API", "version": "1.0.0", "status": "active"}

@api_router.get("/health")
async def health_check():
    try:
        # Test database connection
        await db.list_collection_names()
        return {"status": "healthy", "database": "connected", "timestamp": datetime.utcnow()}
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Database connection failed: {str(e)}")

# Status Check Routes (melhorados)
@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    try:
        status_dict = input.dict()
        status_obj = StatusCheck(**status_dict)
        result = await db.status_checks.insert_one(status_obj.dict())
        
        if result.inserted_id:
            return status_obj
        else:
            raise HTTPException(status_code=500, detail="Falha ao criar status check")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks(
    platform: Optional[str] = Query(None, description="Filtrar por plataforma (web/mobile)"),
    limit: int = Query(100, ge=1, le=1000, description="Limite de resultados")
):
    try:
        query = {}
        if platform:
            query["platform"] = platform
        
        status_checks = await db.status_checks.find(query).limit(limit).sort("timestamp", -1).to_list(limit)
        
        # Remove ObjectId from results
        for check in status_checks:
            if "_id" in check:
                del check["_id"]
        
        return [StatusCheck(**status_check) for status_check in status_checks]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao buscar status checks: {str(e)}")

# User Management Routes (novos)
@api_router.post("/users", response_model=User)
async def create_user(user_data: UserCreate):
    try:
        # Check if email already exists
        existing_user = await db.users.find_one({"email": user_data.email})
        if existing_user:
            raise HTTPException(status_code=400, detail="Email já cadastrado")
        
        user_dict = user_data.dict()
        user_obj = User(**user_dict)
        result = await db.users.insert_one(user_obj.dict())
        
        if result.inserted_id:
            return user_obj
        else:
            raise HTTPException(status_code=500, detail="Falha ao criar usuário")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")

@api_router.get("/users", response_model=List[User])
async def get_users(
    platform: Optional[str] = Query(None, description="Filtrar por plataforma"),
    active_only: bool = Query(True, description="Apenas usuários ativos")
):
    try:
        query = {}
        if platform:
            query["platform"] = platform
        if active_only:
            query["is_active"] = True
            
        users = await db.users.find(query).limit(100).sort("created_at", -1).to_list(100)
        return [User(**user) for user in users]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao buscar usuários: {str(e)}")

@api_router.get("/users/{user_id}", response_model=User)
async def get_user(user_id: str):
    try:
        user = await db.users.find_one({"id": user_id})
        if not user:
            raise HTTPException(status_code=404, detail="Usuário não encontrado")
        return User(**user)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")

@api_router.put("/users/{user_id}/activity")
async def update_user_activity(user_id: str):
    try:
        result = await db.users.update_one(
            {"id": user_id},
            {"$set": {"last_active": datetime.utcnow()}}
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Usuário não encontrado")
        return {"success": True, "message": "Atividade atualizada"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")

# System Stats Route (novo)
@api_router.get("/stats", response_model=SystemStats)
async def get_system_stats():
    try:
        total_users = await db.users.count_documents({})
        active_sessions = await db.users.count_documents({"is_active": True})
        total_status_checks = await db.status_checks.count_documents({})
        web_users = await db.users.count_documents({"platform": "web"})
        mobile_users = await db.users.count_documents({"platform": "mobile"})
        
        return SystemStats(
            total_users=total_users,
            active_sessions=active_sessions,
            total_status_checks=total_status_checks,
            web_users=web_users,
            mobile_users=mobile_users
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao buscar estatísticas: {str(e)}")

# Mobile Sync Routes (para comunicação com app móvel)
@api_router.post("/mobile/sync")
async def mobile_sync(user_id: str, last_sync: Optional[datetime] = None):
    try:
        # Update user activity
        await db.users.update_one(
            {"id": user_id},
            {"$set": {"last_active": datetime.utcnow()}}
        )
        
        # Get data since last sync
        query = {"timestamp": {"$gte": last_sync}} if last_sync else {}
        recent_data = await db.status_checks.find(query).limit(50).to_list(50)
        
        # Convert ObjectId to string to make it JSON serializable
        for item in recent_data:
            if "_id" in item:
                del item["_id"]  # Remove ObjectId field
        
        return {
            "success": True,
            "sync_time": datetime.utcnow(),
            "data_count": len(recent_data),
            "data": recent_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro na sincronização: {str(e)}")

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
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
