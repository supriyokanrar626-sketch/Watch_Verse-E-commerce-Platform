# ⌚ WatchVerse - AI-Powered E-commerce Platform

WatchVerse is a premium watch e-commerce website featuring an integrated AI shopping assistant built with FastAPI, PostgreSQL, and Ollama.

## 🚀 Features
- **Premium Storefront:** Modern UI built with Jinja2, Tailwind CSS, and Stitch (Home, Watches, Product Details, Cart, Checkout).
- **Full E-commerce Flow:** Add to cart, update quantity, remove items, and place orders (Mock COD Checkout).
- **AI Shopping Assistant (Ollama + Qwen2.5-coder):**
  - Chat with the AI in natural language.
  - The AI can directly Add/Remove items from your cart.
  - The AI can redirect you to the checkout page automatically.

## 🛠️ Tech Stack
- **Backend:** FastAPI, Python, SQLModel
- **Database:** PostgreSQL (running via Docker)
- **Frontend:** Jinja2 Templating, HTML, Tailwind CSS, Vanilla JS
- **AI Integration:** Ollama (Local LLM - `qwen2.5-coder:1.5b`)

## 📸 Screenshots

### Home Page
<img width="1920" height="1080" alt="Screenshot (161)" src="https://github.com/user-attachments/assets/71570be8-37bb-4c81-93dd-990f7556dbb8" />


### AI Chatbot (Cart Update)
<img width="1920" height="1080" alt="Screenshot (167)" src="https://github.com/user-attachments/assets/8fb22ed0-9a44-4867-8517-dfa740c9c891" />


## ⚙️ How to Run Locally

1. **Start Database (Docker):**
   ```bash
   docker compose up -d db
    
Install Dependencies:
 ```bash
 cd backend
 uv sync
 ```
Run Backend Server:

```bash
uv run fastapi dev app/main.py
```
Start AI Model (Ollama):
Open a new terminal and run:

```bash
ollama run qwen2.5-coder:1.5b
```
Access the App:
Open your browser and go to http://127.0.0.1:8000

📌 Note
The AI assistant uses a local Ollama model. For cloud deployments, the AI model may need to be swapped to a cloud API (like Groq) due to RAM limitations.

