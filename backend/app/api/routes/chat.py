from fastapi import APIRouter
from pydantic import BaseModel
import ollama
import json
import re

router = APIRouter()

class ChatRequest(BaseModel):
    message: str

@router.post("/api/chat")
async def chat_endpoint(request: ChatRequest):
    try:
        system_prompt = '''You are WatchVerse AI, a polite shopping assistant.
        Available watches: ID 1: Titan (৳5495), ID 2: Timex (৳8995), ID 3: Patek (৳250000), ID 4: Casio (৳4500), ID 5: Fossil (৳19995), ID 6: Tissot (৳45000).
        
        IMPORTANT RULES:
        1. If the user wants to ADD a watch, reply ONLY with: {"action": "add", "watch_id": ID}
        2. If the user wants to REMOVE a watch, reply ONLY with: {"action": "remove", "watch_id": ID}
        3. If the user wants to REMOVE ALL items, reply ONLY with: {"action": "remove_all"}
        4. If the user wants to CHECKOUT or BUY or PROCEED, reply ONLY with: {"action": "checkout"}
        5. For any other normal question, reply normally without JSON.
        Do not add any extra text if you are outputting JSON.'''

        response = ollama.chat(model='qwen2.5-coder:1.5b', messages=[
            {'role': 'system', 'content': system_prompt},
            {'role': 'user', 'content': request.message},
        ])
        
        ai_reply = response["message"]["content"]
        
        # AI jodi JSON format e reply dey, take dhore felbo
        json_match = re.search(r'\{.*\}', ai_reply, re.DOTALL)
        if json_match:
            try:
                action_data = json.loads(json_match.group(0))
                action = action_data.get("action")
                
                # ACTION 1: ADD
                if action == "add":
                    return {
                        "reply": "✅ Done! I have added that watch to your cart.",
                        "action": "refresh_cart",
                        "watch_id": action_data.get("watch_id"),
                        "cart_action": "add"
                    }
                
                # ACTION 2: REMOVE ONE
                elif action == "remove":
                    return {
                        "reply": "🗑️ Done! I have removed that watch from your cart.",
                        "action": "refresh_cart",
                        "watch_id": action_data.get("watch_id"),
                        "cart_action": "remove"
                    }
                
                # ACTION 3: REMOVE ALL
                elif action == "remove_all":
                    return {
                        "reply": "🗑️ Done! I have removed all items from your cart.",
                        "action": "refresh_cart",
                        "cart_action": "remove_all"
                    }
                
                # ACTION 4: CHECKOUT
                elif action == "checkout":
                    return {
                        "reply": "🛒 Redirecting you to the checkout page...",
                        "action": "checkout"
                    }
                    
            except Exception as e:
                pass # JSON parse fail korle normal text hishebe dekhabe
        
        return {"reply": ai_reply}
        
    except Exception as e:
        return {"reply": f"Sorry, amar AI brain e error holo: {str(e)}"}