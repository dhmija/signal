import os
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from core.config import settings
from database import Base, engine
import models  # Ensures all models are registered with Base metadata before create_all
from routers import auth as auth_router
from routers import contacts as contacts_router
from routers import conversations as conversations_router
from routers import messages as messages_router
from routers import users as users_router
from routers import websocket as websocket_router


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    if settings.environment == "development":
        Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="Signal Clone API",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(auth_router.router)
app.include_router(contacts_router.router)
app.include_router(conversations_router.router)
app.include_router(messages_router.router)
app.include_router(users_router.router)
app.include_router(websocket_router.router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
