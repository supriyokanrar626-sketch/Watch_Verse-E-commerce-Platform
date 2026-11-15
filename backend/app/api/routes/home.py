from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse
from sqlmodel import select
from app.main import templates
from app.api.deps import SessionDep
from app.models import Watch

router = APIRouter()


@router.get("/", response_class=HTMLResponse)
async def home(request: Request, session: SessionDep):
    # Database theke prothom 4 ta watch niye ashbe
    statement = select(Watch).limit(4)
    featured_watches = session.exec(statement).all()

    return templates.TemplateResponse(
        request=request,
        name="home.html",
        context={"featured_watches": featured_watches},
    )
