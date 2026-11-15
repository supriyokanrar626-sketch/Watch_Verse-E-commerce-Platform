from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import HTMLResponse
from sqlmodel import select
from app.main import templates
from app.api.deps import SessionDep
from app.models import Watch

router = APIRouter()

@router.get("/watches", response_class=HTMLResponse)
async def list_watches(request: Request, session: SessionDep):
    # Database theke sob watch niye ashbe
    watches = session.exec(select(Watch)).all()
    return templates.TemplateResponse(
        request=request,
        name="watches/list.html",
        context={"watches": watches}
    )

# ==========================================
@router.get("/watches/{watch_id}", response_class=HTMLResponse)
async def watch_detail(request: Request, watch_id: int, session: SessionDep):
    watch = session.get(Watch, watch_id)
    if not watch:
        raise HTTPException(status_code=404, detail="Watch not found")
        
    return templates.TemplateResponse(
        request=request,
        name="watches/detail.html",
        context={"watch": watch}
    )