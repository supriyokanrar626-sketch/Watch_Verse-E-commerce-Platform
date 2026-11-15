from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from sqlmodel import select
from app.main import templates
from app.api.deps import SessionDep
from app.models import CartItem, Watch

router = APIRouter()


class AddToCartRequest(BaseModel):
    watch_id: int
    quantity: int = 1


@router.post("/api/cart/add")
async def add_to_cart(request: AddToCartRequest, session: SessionDep):
    # Check koro watch ta database e ache kina
    watch = session.get(Watch, request.watch_id)
    if not watch:
        return {"status": "error", "message": "Watch not found"}

    # Check koro user er cart e eta age theke ache kina
    statement = select(CartItem).where(
        CartItem.watch_id == request.watch_id, CartItem.user_id == 1
    )
    existing_item = session.exec(statement).first()

    if existing_item:
        existing_item.quantity += request.quantity
        session.add(existing_item)
    else:
        new_item = CartItem(
            watch_id=request.watch_id, quantity=request.quantity, user_id=1
        )
        session.add(new_item)

    session.commit()
    return {"status": "success", "message": f"{watch.name} added to cart!"}

@router.get("/api/cart")
async def get_cart(session: SessionDep):
    # Database theke user 1 er cart items niye ashbe
    cart_items = session.exec(select(CartItem).where(CartItem.user_id == 1)).all()
    
    result = []
    total_price = 0
    total_items = 0
    
    for item in cart_items:
        watch = session.get(Watch, item.watch_id)
        if watch:
            result.append({
                "id": watch.id,
                "name": watch.name,
                "brand": watch.brand,
                "price": watch.price,
                "image": watch.image_url,
                "quantity": item.quantity
            })
            total_price += watch.price * item.quantity
            total_items += item.quantity
            
    return {"items": result, "total_price": total_price, "total_items": total_items}

@router.get("/cart", response_class=HTMLResponse)
async def cart_page(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="cart.html",
        context={}
    )


class CartUpdateRequest(BaseModel):
    watch_id: int
    action: str # "increment", "decrement", "remove"


@router.post("/api/cart/update")
async def update_cart_item(req: CartUpdateRequest, session: SessionDep):
    statement = select(CartItem).where(CartItem.watch_id == req.watch_id, CartItem.user_id == 1)
    item = session.exec(statement).first()
    
    if not item:
        return {"status": "error", "message": "Item not in cart"}

    if req.action == "increment":
        item.quantity += 1
        session.add(item)
    elif req.action == "decrement":
        item.quantity -= 1
        if item.quantity <= 0:
            session.delete(item)
        else:
            session.add(item)
    elif req.action == "remove":
        session.delete(item)
        
    session.commit()
    return {"status": "success"}