from pathlib import Path

import sentry_sdk
from fastapi import FastAPI
from fastapi.routing import APIRoute
from starlette.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles        
from fastapi.templating import Jinja2Templates

from app.api.main import api_router
from app.core.config import settings



def custom_generate_unique_id(route: APIRoute) -> str:
    return f"{route.tags[0]}-{route.name}"


if settings.SENTRY_DSN and settings.FASTAPI_ENV != "development":
    sentry_sdk.init(dsn=str(settings.SENTRY_DSN), enable_tracing=True)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    generate_unique_id_function=custom_generate_unique_id,
)

# ==========================================
# EIKHANE THEKE ADD KORO
# ==========================================
BASE_DIR = Path(__file__).resolve().parent

# HTML Templates setup
templates = Jinja2Templates(directory=str(BASE_DIR / "templates"))

# CSS/JS Static files setup
app.mount("/static", StaticFiles(directory=str(BASE_DIR / "static")), name="static")
# ==========================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_HOST],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)

# Tomar Home Page (Direct root / e thakbe, tai eita alada kore include korte hobe)
from app.api.routes import home
app.include_router(home.router, tags=["home"])

from app.api.routes import watches
app.include_router(watches.router, tags=["watches"])

from app.api.routes import cart
app.include_router(cart.router, tags=["cart"])

from app.api.routes import chat
app.include_router(chat.router, tags=["chat"])

from app.api.routes import checkout
app.include_router(checkout.router, tags=["checkout"])

