import logging
from datetime import datetime, timedelta
from core.security import hash_password
from database import Base, SessionLocal, engine
import models  # Ensures all models are registered
from models.contact import Contact
from models.conversation import Conversation, ConversationMember
from models.message import Message
from models.user import User

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

SEED_USERS = [
    {
        "username": "alex",
        "display_name": "Alex Rivera",
        "about": "Building software & drinking coffee ☕",
        "avatar_url": "https://api.dicebear.com/9.x/thumbs/svg?seed=alex",
    },
    {
        "username": "sarah",
        "display_name": "Sarah Chen",
        "about": "Design systems & accessibility",
        "avatar_url": "https://api.dicebear.com/9.x/thumbs/svg?seed=sarah",
    },
    {
        "username": "marcus",
        "display_name": "Marcus Vance",
        "about": "Distributed systems geek",
        "avatar_url": "https://api.dicebear.com/9.x/thumbs/svg?seed=marcus",
    },
    {
        "username": "elena",
        "display_name": "Elena Rostova",
        "about": "Security research & cryptography",
        "avatar_url": "https://api.dicebear.com/9.x/thumbs/svg?seed=elena",
    },
    {
        "username": "david",
        "display_name": "David Kim",
        "about": "Product engineer @ Signal clone",
        "avatar_url": "https://api.dicebear.com/9.x/thumbs/svg?seed=david",
    },
    {
        "username": "priya",
        "display_name": "Priya Sharma",
        "about": "Fullstack web developer",
        "avatar_url": "https://api.dicebear.com/9.x/thumbs/svg?seed=priya",
    },
    {
        "username": "jordan",
        "display_name": "Jordan Lee",
        "about": "DevOps & cloud infra",
        "avatar_url": "https://api.dicebear.com/9.x/thumbs/svg?seed=jordan",
    },
    {
        "username": "taylor",
        "display_name": "Taylor Swift",
        "about": "Singer, songwriter & coder",
        "avatar_url": "https://api.dicebear.com/9.x/thumbs/svg?seed=taylor",
    },
]


def seed():
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        if db.query(User).first():
            logger.info("Database already seeded. Skipping.")
            return

        logger.info("Seeding database...")
        default_pwd = hash_password("password123")

        # 1. Create Users
        users_by_username = {}
        for u_data in SEED_USERS:
            user = User(
                username=u_data["username"],
                display_name=u_data["display_name"],
                about=u_data["about"],
                avatar_url=u_data["avatar_url"],
                hashed_password=default_pwd,
                is_online=True if u_data["username"] in ["alex", "sarah", "david"] else False,
            )
            db.add(user)
            db.flush()
            users_by_username[user.username] = user

        # 2. Create All-to-All Contacts (so every user has all other users as contacts)
        all_users = list(users_by_username.values())
        for u1 in all_users:
            for u2 in all_users:
                if u1.id != u2.id:
                    db.add(Contact(owner_id=u1.id, contact_id=u2.id))

        # 3. Create Direct Conversations & Messages
        direct_chats = [
            ("alex", "sarah", [
                ("sarah", "Hey Alex! Did you review the new design system tokens?", 10),
                ("alex", "Yes! The Tailwind v4 oklch palette looks super clean.", 8),
                ("sarah", "Great! Let me know if you need any component tweaks.", 5),
                ("alex", "Will do! Starting on real-time messaging now.", 1),
            ]),
            ("alex", "marcus", [
                ("marcus", "Yo Alex, did the WebSocket endpoint handle reconnects properly?", 15),
                ("alex", "Yeah, the connection manager handles reconnects seamlessly.", 12),
            ]),
            ("alex", "elena", [
                ("elena", "Hey, checked out the crypto module specs.", 30),
                ("alex", "Nice, keeping auth simple for now with JWTs.", 25),
            ]),
        ]

        now = datetime.utcnow()

        for u1, u2, msgs in direct_chats:
            user1 = users_by_username[u1]
            user2 = users_by_username[u2]
            conv = Conversation(type="direct", created_by=user1.id)
            db.add(conv)
            db.flush()
            db.add(ConversationMember(conversation_id=conv.id, user_id=user1.id, role="member"))
            db.add(ConversationMember(conversation_id=conv.id, user_id=user2.id, role="member"))

            for sender_uname, body, minutes_ago in msgs:
                msg = Message(
                    conversation_id=conv.id,
                    sender_id=users_by_username[sender_uname].id,
                    body=body,
                    status="read",
                    created_at=now - timedelta(minutes=minutes_ago),
                )
                db.add(msg)
                conv.updated_at = now - timedelta(minutes=minutes_ago)

        db.commit()
        logger.info("Successfully seeded database with users, contacts, conversations, and initial messages!")

    except Exception as e:
        db.rollback()
        logger.error(f"Error seeding database: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
