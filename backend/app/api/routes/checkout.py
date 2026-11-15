from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from sqlmodel import select
from app.main import templates
from app.api.deps import SessionDep
from app.models import Order, OrderItem, CartItem, Watch

router = APIRouter()

class OrderRequest(BaseModel):
    address: str
    phone: str
    payment_method: str

@router.get("/checkout", response_class=HTMLResponse)
async def checkout_page(request: Request):
    return templates.TemplateResponse(request=request, name="checkout.html", context={})

@router.post("/api/orders")
async def place_order(order_req: OrderRequest, session: SessionDep):
    cart_items = session.exec(select(CartItem).where(CartItem.user_id == 1)).all()
    if not cart_items:
        return {"status": "error", "message": "Cart is empty!"}
    
    order = Order(address=order_req.address, phone=order_req.phone, payment_method=order_req.payment_method, total_amount=0)
    session.add(order)
    session.commit()
    session.refresh(order)

    total = 0
    for item in cart_items:
        watch = session.get(Watch, item.watch_id)
        if watch:
            session.add(OrderItem(order_id=order.id, watch_id=watch.id, quantity=item.quantity, price=watch.price))
            total += watch.price * item.quantity

    order.total_amount = total
    session.add(order)
    for item in cart_items:
        session.delete(item)
    session.commit()
    
    return {"status": "success", "order_id": order.id, "total": total}