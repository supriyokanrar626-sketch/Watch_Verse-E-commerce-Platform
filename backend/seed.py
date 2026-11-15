from sqlmodel import Session, select
from app.core.db import engine
from app.models import Watch, SQLModel

print("1. Starting script...")

print("2. Connecting to database and creating tables...")
try:
    SQLModel.metadata.create_all(engine)
    print("3. Tables created successfully!")
except Exception as e:
    print(f"❌ DATABASE CONNECTION FAILED: {e}")
    exit()

def seed_watches():
    print("4. Opening database session...")
    with Session(engine) as session:
        print("5. Checking existing watches...")
        existing = session.exec(select(Watch)).first()
        
        if existing:
            print("6. Watches already exist in database! Skipping insert.")
            return

        print("7. Inserting 6 watches...")
        watches = [
            Watch(brand="Titan", name="Titan Neo Blue Dial", price=5495, mrp=6995, image_url="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500", stock=5, description="Premium quartz watch with blue dial."),
            Watch(brand="Timex", name="Timex Waterbury Classic", price=8995, mrp=10995, image_url="https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=500", stock=8, description="Classic analog watch."),
            Watch(brand="Patek Philippe", name="Patek Calatrava", price=250000, mrp=260000, image_url="https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=500", stock=1, description="Luxury mechanical watch."),
            Watch(brand="Casio", name="Casio G-Shock", price=4500, mrp=5500, image_url="https://images.unsplash.com/photo-1594576722512-582bcd46fba3?w=500", stock=10, description="Rugged digital watch."),
            Watch(brand="Fossil", name="Fossil Gen 5", price=19995, mrp=22995, image_url="https://images.unsplash.com/photo-1619134778706-7015533a6150?w=500", stock=3, description="Smartwatch with modern design."),
            Watch(brand="Tissot", name="Tissot PRX", price=45000, mrp=50000, image_url="https://images.unsplash.com/photo-1622434641406-a158123450f9?w=500", stock=2, description="Swiss precision watch."),
        ]
        
        session.add_all(watches)
        session.commit()
        print("8. ✅ Successfully seeded watches!")

if __name__ == "__main__":
    print("0. Running main block...")
    seed_watches()
    print("9. Script finished.")