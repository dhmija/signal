import logging
from core.security import hash_password
from database import Base, SessionLocal, engine
import models  # Ensures all models are registered
from models.contact import Contact
from models.conversation import Conversation, ConversationMember
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
    # Ensure tables exist
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # Check if already seeded
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

        # 2. Create Contacts
        alex = users_by_username["alex"]
        for username, user in users_by_username.items():
            if username != "alex":
                db.add(Contact(owner_id=alex.id, contact_id=user.id))
                db.add(Contact(owner_id=user.id, contact_id=alex.id))

        # 3. Create Direct Conversations
        direct_pairs = [
            ("alex", "sarah"),
            ("alex", "marcus"),
            ("alex", "elena"),
            ("alex", "david"),
            ("sarah", "marcus"),
        ]

        for u1, u2 in direct_pairs:
            user1 = users_by_username[u1]
            user2 = users_by_username[u2]
            conv = Conversation(type="direct", created_by=user1.id)
            db.add(conv)
            db.flush()
            db.add(ConversationMember(conversation_id=conv.id, user_id=user1.id, role="member"))
            db.add(ConversationMember(conversation_id=conv.id, user_id=user2.id, role="member"))

        # 4. Create Group Conversations
        group1 = Conversation(
            type="group",
            name="Frontend Guild",
            avatar_url="https://api.dicebear.com/9.x/identicon/svg?seed=frontend",
            created_by=alex.id,
        )
        db.add(group1)
        db.flush()

        for u_name in ["alex", "sarah", "priya", "david"]:
            role = "admin" if u_name == "alex" else "member"
            db.add(
                ConversationMember(
                    conversation_id=group1.id, user_id=users_by_username[u_name].id, role=role
                )
            )

        group2 = Conversation(
            type="group",
            name="Security & Architecture",
            avatar_url="https://api.dicebear.com/9.x/identicon/svg?seed=security",
            created_by=users_by_username["elena"].id,
        )
        db.add(group2)
        db.flush()

        for u_name in ["elena", "alex", "marcus", "jordan"]:
            role = "admin" if u_name == "elena" else "member"
            db.add(
                ConversationMember(
                    conversation_id=group2.id, user_id=users_by_username[u_name].id, role=role
                )
            )

        db.commit()
        logger.info("Successfully seeded database with 8 users, contacts, and conversations!")

    except Exception as e:
        db.rollback()
        logger.error(f"Error seeding database: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
