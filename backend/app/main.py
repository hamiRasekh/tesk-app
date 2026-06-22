from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import app as app_router
from app.routers import auth, projects, tasks

api = FastAPI(title="Void Spirit API", version="1.0.0")

origins = [o.strip() for o in settings.cors_origins.split(",") if o.strip()]
api.add_middleware(
    CORSMiddleware,
    allow_origins=origins + ["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api.include_router(auth.router)
api.include_router(tasks.router)
api.include_router(projects.router)
api.include_router(app_router.router)


@api.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "void-spirit-api"}
