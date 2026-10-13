import os
import random
import time
import datetime
import asyncio
import logging
import smtplib
import ssl
from email.message import EmailMessage
from html import escape
import json
import aiohttp
from aiohttp import web
from aiogram import Bot, Dispatcher
from aiogram.client.default import DefaultBotProperties
from aiogram.filters import CommandStart, Command
from aiogram.types import Message, InlineKeyboardMarkup, InlineKeyboardButton, CallbackQuery
from aiogram.enums import ParseMode

logging.basicConfig(level=logging.INFO)

# ── Config ───────────────────────────────────────────────────────────────────
TOKEN          = os.getenv("BOT_TOKEN", "7969562725:AAHQiUes57T3_0pX15g9L82bF4-1rllgU60")
ADMIN_EMAIL    = "ydvhrsh1604@gmail.com"
DATABASE_URL   = os.getenv(
    "DATABASE_URL",
    "postgresql://neondb_owner:npg_ISrJagmCF4W3@ep-crimson-cloud-b5s6gc0y-pooler.c-7.us-east-2.aws.neon.tech/neondb"
)
db_pool        = None

CONFIG_FILE = os.path.join(os.path.dirname(__file__), "bot_config.json")
BOT_CONFIG = {}
KNOWN_USER_IDS = set()

DEFAULT_BOT_CONFIG = {
    "product_name": "Рега",
    "support_handle": "@ashley_graves3",
    "support_url": "https://t.me/ashley_graves3",
    "website_url": os.getenv("WEBSITE_URL", "https://dragonx-gamma.vercel.app"),
    "reviews_url": os.getenv("REVIEWS_URL", "https://dragonx-gamma.vercel.app"),
    "exchanger_1_name": "🔄 Обменник 1 (Eva)",
    "exchanger_1_url": "https://t.me/Eva_obmen",
    "exchanger_2_name": "🔄 Обменник 2 (Sum Exc)",
    "exchanger_2_url": "https://t.me/sum_exc",
    "ltc_address": "ltc1qr5xhqe9tdd5lekrxurfftdv9hhaaqche2urvhr",
    "maintenance_mode": False,
    "maintenance_text": "⚠️ Бот временно находится на техническом обслуживании. Свяжитесь с оператором: @ashley_graves3",
    "districts": [
        {"id": "district_chilanzer", "name": "Чиланзор", "coords": "41.2721, 69.2045", "active": True},
        {"id": "district_yashnabad", "name": "Яшнабад", "coords": "41.2985, 69.3241", "active": True},
        {"id": "district_ulugbek", "name": "Ulugbek", "coords": "41.3412, 69.4520", "active": True}
    ],
    "packages": [
        {"key": "buy_2", "qty_num": 2, "label_ru": "2 штук", "label_en": "2 pcs", "label_uz": "2 ta", "price_usd": 25, "stock": 50, "active": True},
        {"key": "buy_3", "qty_num": 3, "label_ru": "3 штук", "label_en": "3 pcs", "label_uz": "3 ta", "price_usd": 35, "stock": 40, "active": True},
        {"key": "buy_5", "qty_num": 5, "label_ru": "5 штук", "label_en": "5 pcs", "label_uz": "5 ta", "price_usd": 55, "stock": 30, "active": True},
        {"key": "buy_10", "qty_num": 10, "label_ru": "10 штук", "label_en": "10 pcs", "label_uz": "10 ta", "price_usd": 108, "stock": 20, "active": True},
        {"key": "buy_20", "qty_num": 20, "label_ru": "20 штук", "label_en": "20 pcs", "label_uz": "20 ta", "price_usd": 210, "stock": 15, "active": True},
        {"key": "buy_50", "qty_num": 50, "label_ru": "50 штук", "label_en": "50 pcs", "label_uz": "50 ta", "price_usd": 510, "stock": 10, "active": True},
        {"key": "buy_100", "qty_num": 100, "label_ru": "100 штук", "label_en": "100 pcs", "label_uz": "100 ta", "price_usd": 1000, "stock": 5, "active": True}
    ]
}

# Dynamic stock inventory managed via Admin Panel or Morning Update
INVENTORY_STOCKS = {
    "buy_2": 50,
    "buy_3": 40,
    "buy_5": 30,
    "buy_10": 20,
    "buy_20": 15,
    "buy_50": 10,
    "buy_100": 5
}

def load_bot_config():
    global BOT_CONFIG, INVENTORY_STOCKS
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, "r", encoding="utf-8") as f:
                BOT_CONFIG = json.load(f)
                logging.info(f"Loaded dynamic bot config from {CONFIG_FILE}")
                # Synchronize inventory stocks from packages
                for pkg in BOT_CONFIG.get("packages", []):
                    k = pkg.get("key")
                    if k and "stock" in pkg:
                        INVENTORY_STOCKS[k] = pkg["stock"]
                return
        except Exception as e:
            logging.error(f"Error loading {CONFIG_FILE}: {e}")
    BOT_CONFIG = dict(DEFAULT_BOT_CONFIG)
    save_bot_config()

def save_bot_config():
    try:
        with open(CONFIG_FILE, "w", encoding="utf-8") as f:
            json.dump(BOT_CONFIG, f, ensure_ascii=False, indent=2)
    except Exception as e:
        logging.error(f"Error saving {CONFIG_FILE}: {e}")
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running() and db_pool:
            loop.create_task(db_upsert_config(BOT_CONFIG))
    except Exception:
        pass

def get_product_name() -> str:
    return BOT_CONFIG.get("product_name", "Рега")

def get_support_handle() -> str:
    return BOT_CONFIG.get("support_handle", "@ashley_graves3")

def get_support_url() -> str:
    handle = get_support_handle().replace("@", "")
    return BOT_CONFIG.get("support_url") or f"https://t.me/{handle}"

def get_website_url() -> str:
    return BOT_CONFIG.get("website_url", "https://dragonx-gamma.vercel.app")

def get_reviews_url() -> str:
    return BOT_CONFIG.get("reviews_url", "https://dragonx-gamma.vercel.app")

def get_exchanger_1() -> str:
    return BOT_CONFIG.get("exchanger_1_url", "https://t.me/Eva_obmen")

def get_exchanger_2() -> str:
    return BOT_CONFIG.get("exchanger_2_url", "https://t.me/sum_exc")

def get_ltc_address() -> str:
    return BOT_CONFIG.get("ltc_address", "ltc1qr5xhqe9tdd5lekrxurfftdv9hhaaqche2urvhr")

def is_maintenance_mode() -> bool:
    return bool(BOT_CONFIG.get("maintenance_mode", False))

def get_districts() -> list:
    return [d for d in BOT_CONFIG.get("districts", []) if d.get("active", True)]

def get_packages() -> list:
    return [p for p in BOT_CONFIG.get("packages", []) if p.get("active", True)]

# Backward compatibility aliases
SUPPORT_HANDLE = get_support_handle()
SUPPORT_URL    = get_support_url()
WEBSITE_URL    = get_website_url()
REVIEWS_URL    = get_reviews_url()
EXCHANGER_1_URL = get_exchanger_1()
EXCHANGER_2_URL = get_exchanger_2()
LTC_ADDRESS    = get_ltc_address()

# SMTP Config for sending notification emails (optional, uses fallback logging if unconfigured)
SMTP_SERVER  = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT    = int(os.getenv("SMTP_PORT", 587))
SMTP_USER    = os.getenv("SMTP_USER", "")
SMTP_PASS    = os.getenv("SMTP_PASS", "")

bot = Bot(token=TOKEN, default=DefaultBotProperties(parse_mode=ParseMode.HTML))
dp  = Dispatcher()

bot_info_cache = None
DB_FILE = os.path.join(os.path.dirname(__file__), "orders_db.json")
ACTIVE_ORDERS = {}          # Persistent orders storage
PROCESSED_TX_HASHES = set()
USER_LANGUAGES = {}         # { user_id: 'ru' | 'en' | 'uz' }
USER_CAPTCHAS = {}          # { user_id: {'ans': int, 'verified': bool} }
USER_DISTRICTS = {}         # { user_id: {'ru': str, 'en': str, 'uz': str} }

DEFAULT_SEED_ORDERS = {
    "DRGX-8634764266-8265": {
        "id": "DRGX-8634764266-8265",
        "user_id": 8634764266,
        "user_data": {
            "id": 8634764266,
            "username": "dragon_buyer",
            "first_name": "Клиент #8634764266",
            "last_name": "",
            "lang": "ru"
        },
        "created_at": 1791892427.0,
        "product": "Рега",
        "qty": "2 штук",
        "price": "26$",
        "total_amount": 26.4,
        "currency": "USD",
        "pack_key": "buy_2",
        "district": "Чиланзор",
        "location": "Чиланзор, тайник готовится курьером",
        "coordinates": "41.2721, 69.2045",
        "status": "paid",
        "pickup_status": "waiting",
        "tracking_code": "DRGX-TRK-8265",
        "notes": "Оплачено в блокчейне LTC (0.40608 LTC). TxID: f1500bf280ad33816fe71ad4cbffff0da51df7b2a7e78c20e51d55dd9234c384",
        "tx_info": {
            "hash": "f1500bf280ad33816fe71ad4cbffff0da51df7b2a7e78c20e51d55dd9234c384",
            "amount_ltc": 0.40608,
            "confirmations": 2
        },
        "updated_at": 1791892427.0
    },
    "DRGX-9024-8142": {
        "id": "DRGX-9024-8142",
        "user_id": 90248142,
        "user_data": {
            "id": 90248142,
            "username": "tashkent_vip",
            "first_name": "Алексей",
            "last_name": "VIP",
            "lang": "ru"
        },
        "created_at": time.time() - 3600 * 2,
        "product": "Рега",
        "qty": "2 штук",
        "price": "25$",
        "total_amount": 25.0,
        "currency": "USD",
        "pack_key": "buy_2",
        "district": "Чиланзор",
        "location": "Чиланзор, квартал 9, дом 14, магнит под металлическим отливом",
        "coordinates": "41.2721, 69.2045",
        "status": "drop_ready",
        "pickup_status": "ready",
        "tracking_code": "DRGX-TRK-8142",
        "notes": "Дроп свежий, защитная метка X-42. Координаты подтверждены курьером.",
        "updated_at": time.time() - 3600 * 1
    },
    "DRGX-5519-9311": {
        "id": "DRGX-5519-9311",
        "user_id": 55199311,
        "user_data": {
            "id": 55199311,
            "username": "sergey_tash",
            "first_name": "Сергей",
            "last_name": "К.",
            "lang": "ru"
        },
        "created_at": time.time() - 3600 * 5,
        "product": "Рега",
        "qty": "5 штук",
        "price": "55$",
        "total_amount": 55.0,
        "currency": "USD",
        "pack_key": "buy_5",
        "district": "Яшнабад",
        "location": "Яшнабад, ул. Султанали Машхади, тайник в нише кирпичной кладки",
        "coordinates": "41.2985, 69.3241",
        "status": "picked_up",
        "pickup_status": "picked_up",
        "picked_up_at": time.time() - 3600 * 1.5,
        "tracking_code": "DRGX-TRK-9311",
        "notes": "Клиент успешно забрал заказ в 14:15, тайник чист.",
        "updated_at": time.time() - 3600 * 1.5
    },
    "DRGX-1204-4420": {
        "id": "DRGX-1204-4420",
        "user_id": 12044420,
        "user_data": {
            "id": 12044420,
            "username": "ulugbek_client",
            "first_name": "Гость",
            "last_name": "",
            "lang": "ru"
        },
        "created_at": time.time() - 3600 * 8,
        "product": "Рега",
        "qty": "10 штук",
        "price": "108$",
        "total_amount": 108.0,
        "currency": "USD",
        "pack_key": "buy_10",
        "district": "Ulugbek",
        "location": "Пос. Улугбек, парковая зона, опора освещения №7, магнитный бокс",
        "coordinates": "41.3412, 69.4520",
        "status": "paid",
        "pickup_status": "preparing",
        "tracking_code": "DRGX-TRK-4420",
        "notes": "Оплата LTC подтверждена в блокчейне. Курьер закладывает дроп.",
        "updated_at": time.time() - 3600 * 6
    }
}


# ── Neon PostgreSQL Database Engine ──────────────────────────────────────────

def sanitize_db_url(url: str) -> str:
    if not url:
        return ""
    return url.split("?")[0]


async def init_neon_db():
    global db_pool
    if not DATABASE_URL:
        logging.info("DATABASE_URL not set, operating with local JSON storage.")
        return

    try:
        import asyncpg
        ssl_ctx = ssl.create_default_context()
        ssl_ctx.check_hostname = False
        ssl_ctx.verify_mode = ssl.CERT_NONE

        clean_url = sanitize_db_url(DATABASE_URL)
        db_pool = await asyncpg.create_pool(
            clean_url,
            ssl=ssl_ctx,
            min_size=1,
            max_size=5,
            command_timeout=15
        )
        logging.info("✅ Connected to Neon PostgreSQL pool successfully!")

        async with db_pool.acquire() as conn:
            await conn.execute("""
            CREATE TABLE IF NOT EXISTS orders (
                id VARCHAR(64) PRIMARY KEY,
                user_id BIGINT,
                customer_name VARCHAR(255),
                telegram VARCHAR(128),
                product VARCHAR(128),
                qty VARCHAR(64),
                total_amount NUMERIC(10, 2),
                currency VARCHAR(16) DEFAULT 'USD',
                district VARCHAR(128),
                location TEXT,
                coordinates VARCHAR(128),
                status VARCHAR(64),
                pickup_status VARCHAR(64),
                tracking_code VARCHAR(128),
                tx_hash VARCHAR(256),
                notes TEXT,
                created_at DOUBLE PRECISION,
                updated_at DOUBLE PRECISION,
                order_data JSONB
            );
            """)

            await conn.execute("""
            CREATE TABLE IF NOT EXISTS bot_config (
                key VARCHAR(64) PRIMARY KEY,
                config_data JSONB,
                updated_at DOUBLE PRECISION
            );
            """)

            await conn.execute("""
            CREATE TABLE IF NOT EXISTS inventory_stocks (
                pack_key VARCHAR(64) PRIMARY KEY,
                stock INT,
                updated_at DOUBLE PRECISION
            );
            """)

        # Pull latest orders and config from Neon into memory
        await db_refresh_orders()
        await db_refresh_config()
        logging.info(f"✅ Synced from Neon DB: {len(ACTIVE_ORDERS)} orders loaded.")
    except Exception as e:
        logging.error(f"⚠️ Neon DB init error (falling back to JSON): {e}")


async def db_refresh_orders():
    global ACTIVE_ORDERS
    if not db_pool:
        return
    try:
        async with db_pool.acquire() as conn:
            rows = await conn.fetch("SELECT id, order_data FROM orders;")
            for r in rows:
                oid = r['id']
                raw_data = r['order_data']
                if raw_data:
                    if isinstance(raw_data, str):
                        ACTIVE_ORDERS[oid] = json.loads(raw_data)
                    else:
                        ACTIVE_ORDERS[oid] = raw_data
    except Exception as e:
        logging.warning(f"Error fetching orders from Neon: {e}")


async def db_refresh_config():
    global BOT_CONFIG, INVENTORY_STOCKS
    if not db_pool:
        return
    try:
        async with db_pool.acquire() as conn:
            row = await conn.fetchrow("SELECT config_data FROM bot_config WHERE key = 'main_config';")
            if row and row['config_data']:
                raw = row['config_data']
                cfg = json.loads(raw) if isinstance(raw, str) else raw
                if isinstance(cfg, dict):
                    BOT_CONFIG.update(cfg)
                    for pkg in BOT_CONFIG.get("packages", []):
                        k = pkg.get("key")
                        if k and "stock" in pkg:
                            INVENTORY_STOCKS[k] = pkg["stock"]
    except Exception as e:
        logging.warning(f"Error fetching config from Neon: {e}")


async def db_upsert_order(o: dict):
    if not db_pool or not isinstance(o, dict) or not o.get('id'):
        return
    try:
        oid = o['id']
        user_meta = o.get("user_data", {}) if isinstance(o.get("user_data"), dict) else {}
        u_name = user_meta.get("username") or o.get("username") or ""
        tg = f"@{u_name}" if u_name and not u_name.startswith("@") else (u_name or "—")
        c_name = f"{user_meta.get('first_name', '')} {user_meta.get('last_name', '')}".strip() or tg or f"Client {o.get('user_id')}"
        tot_amt = float(o.get("total_amount") or 25.0)
        tx_info = o.get("tx_info") or {}
        tx_h = tx_info.get("hash") if isinstance(tx_info, dict) else ""

        async with db_pool.acquire() as conn:
            await conn.execute("""
            INSERT INTO orders (
                id, user_id, customer_name, telegram, product, qty, total_amount, currency,
                district, location, coordinates, status, pickup_status, tracking_code,
                tx_hash, notes, created_at, updated_at, order_data
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
            ) ON CONFLICT (id) DO UPDATE SET
                status = EXCLUDED.status,
                pickup_status = EXCLUDED.pickup_status,
                location = EXCLUDED.location,
                coordinates = EXCLUDED.coordinates,
                notes = EXCLUDED.notes,
                updated_at = EXCLUDED.updated_at,
                order_data = EXCLUDED.order_data;
            """,
            oid,
            int(o.get("user_id") or 0),
            c_name,
            tg,
            o.get("product", "Рега"),
            o.get("qty", "2 штук"),
            tot_amt,
            o.get("currency", "USD"),
            o.get("district", "Чиланзор"),
            o.get("location", ""),
            o.get("coordinates", ""),
            o.get("status", "paid"),
            o.get("pickup_status", "waiting"),
            o.get("tracking_code", ""),
            tx_h,
            o.get("notes", ""),
            float(o.get("created_at") or 0.0),
            float(o.get("updated_at") or 0.0),
            json.dumps(o)
            )
    except Exception as e:
        logging.error(f"Failed to upsert order {o.get('id')} to Neon: {e}")


async def db_sync_all_orders():
    if not db_pool:
        return
    for o in list(ACTIVE_ORDERS.values()):
        await db_upsert_order(o)


async def db_delete_order(order_id: str):
    if not db_pool or not order_id:
        return
    try:
        async with db_pool.acquire() as conn:
            await conn.execute("DELETE FROM orders WHERE id = $1;", order_id)
    except Exception as e:
        logging.error(f"Failed to delete order {order_id} from Neon: {e}")


async def db_upsert_config(cfg: dict):
    if not db_pool or not isinstance(cfg, dict):
        return
    try:
        async with db_pool.acquire() as conn:
            await conn.execute("""
            INSERT INTO bot_config (key, config_data, updated_at)
            VALUES ('main_config', $1, EXTRACT(EPOCH FROM NOW()))
            ON CONFLICT (key) DO UPDATE SET
                config_data = EXCLUDED.config_data,
                updated_at = EXCLUDED.updated_at;
            """, json.dumps(cfg))
    except Exception as e:
        logging.error(f"Failed to upsert config to Neon: {e}")


def load_orders():
    global ACTIVE_ORDERS
    if os.path.exists(DB_FILE):
        try:
            with open(DB_FILE, "r", encoding="utf-8") as f:
                ACTIVE_ORDERS = json.load(f)
                logging.info(f"Loaded {len(ACTIVE_ORDERS)} orders from {DB_FILE}")
                return
        except Exception as e:
            logging.error(f"Error loading {DB_FILE}: {e}")
    ACTIVE_ORDERS = dict(DEFAULT_SEED_ORDERS)
    save_orders()


def save_orders(specific_order_id=None):
    try:
        with open(DB_FILE, "w", encoding="utf-8") as f:
            json.dump(ACTIVE_ORDERS, f, ensure_ascii=False, indent=2)
    except Exception as e:
        logging.error(f"Error saving {DB_FILE}: {e}")
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running() and db_pool:
            if specific_order_id and specific_order_id in ACTIVE_ORDERS:
                loop.create_task(db_upsert_order(ACTIVE_ORDERS[specific_order_id]))
            else:
                loop.create_task(db_sync_all_orders())
    except Exception:
        pass


async def get_bot_username() -> str:
    global bot_info_cache
    if not bot_info_cache:
        try:
            bot_info_cache = await bot.get_me()
        except Exception as e:
            logging.error(f"Failed to fetch bot info: {e}")
    if bot_info_cache and bot_info_cache.username:
        return bot_info_cache.username
    return os.getenv("BOT_USERNAME", "") or "yuan_rndiBOT"


async def init_historical_txs(address: str):
    url = f"https://api.blockcypher.com/v1/ltc/main/addrs/{address}/full?limit=20"
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url, timeout=5) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    for tx in data.get('txs', []):
                        tx_hash = tx.get('hash')
                        if tx_hash:
                            PROCESSED_TX_HASHES.add(tx_hash)
                    logging.info(f"Initialized {len(PROCESSED_TX_HASHES)} historical LTC transactions as processed.")
    except Exception as e:
        logging.warning(f"Failed to pre-populate historical LTC transactions: {e}")


async def check_new_ltc_transaction(address: str, min_timestamp: float):
    url_blockcypher = f"https://api.blockcypher.com/v1/ltc/main/addrs/{address}/full?limit=10"
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url_blockcypher, timeout=5) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    for tx in data.get('txs', []):
                        tx_hash = tx.get('hash')
                        if not tx_hash or tx_hash in PROCESSED_TX_HASHES:
                            continue

                        received_str = tx.get('received') or tx.get('confirmed')
                        tx_time = 0
                        if received_str:
                            try:
                                clean_str = received_str.split('.')[0].replace('Z', '')
                                dt = datetime.datetime.strptime(clean_str, "%Y-%m-%dT%H:%M:%S")
                                tx_time = dt.replace(tzinfo=datetime.timezone.utc).timestamp()
                            except Exception:
                                pass

                        if tx_time >= (min_timestamp - 120):
                            outputs = tx.get('outputs', [])
                            received_sat = sum(out.get('value', 0) for out in outputs if address in out.get('addresses', []))
                            if received_sat > 0:
                                return {
                                    'hash': tx_hash,
                                    'amount_ltc': received_sat / 1e8,
                                    'confirmations': tx.get('confirmations', 0)
                                }
    except Exception as e:
        logging.warning(f"LTC check new transaction error: {e}")
    return None


def send_email_in_thread(subject: str, body: str):
    logging.info(f"--- [ORDER NOTIFICATION FOR ADMIN] ---\nTo: {ADMIN_EMAIL}\nSubject: {subject}\n\n{body}")
    if SMTP_USER and SMTP_PASS:
        try:
            msg = EmailMessage()
            msg.set_content(body)
            msg['Subject'] = subject
            msg['From'] = SMTP_USER
            msg['To'] = ADMIN_EMAIL
            with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
                server.starttls()
                server.login(SMTP_USER, SMTP_PASS)
                server.send_message(msg)
            logging.info(f"Email successfully dispatched to {ADMIN_EMAIL}")
        except Exception as e:
            logging.error(f"SMTP email sending failed: {e}")


async def notify_admin_email(order_code: str, user_info: dict, qty: str, price: str, tx_info: dict, district: str = "Чиланзор"):
    subject = f"🐉 [NEW PAID ORDER] Dragon-X Order {order_code} ({price})"
    body = (
        "=== SUCCESSFUL TRANSACTION CONFIRMED ===\n"
        f"Order ID: {order_code}\n"
        f"Timestamp: {datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}\n\n"
        "USER DETAILS:\n"
        f"- Telegram ID: {user_info.get('id')}\n"
        f"- Username: @{user_info.get('username', 'N/A')}\n"
        f"- Full Name: {user_info.get('first_name', '')} {user_info.get('last_name', '')}\n"
        f"- Selected Language: {user_info.get('lang', 'ru')}\n\n"
        "ORDER DETAILS:\n"
        "- Product: Rega (Рега)\n"
        f"- Volume: {qty}\n"
        f"- Price: {price}\n"
        "- Region: Tashkent\n"
        f"- District: {district}\n\n"
        "TRANSACTION DETAILS:\n"
        "- Network: Litecoin (LTC)\n"
        f"- Wallet: {LTC_ADDRESS}\n"
        f"- TxID Hash: {tx_info.get('hash')}\n"
        f"- Amount Received: {tx_info.get('amount_ltc')} LTC\n"
        f"- Confirmations: {tx_info.get('confirmations')}\n\n"
        "REFERRAL REWARD:\n"
        "- 2% cashback credited to referrer balance.\n"
    )
    await asyncio.to_thread(send_email_in_thread, subject, body)


# ── Keyboards & Multi-Language UI Helpers ─────────────────────────────────────

def language_keyboard():
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="🇷🇺 Русский",   callback_data="setlang_ru")],
        [InlineKeyboardButton(text="🇬🇧 English",   callback_data="setlang_en")],
        [InlineKeyboardButton(text="🇺🇿 O'zbekcha", callback_data="setlang_uz")]
    ])


def home_keyboard(lang="ru"):
    txt_catalog = {"ru": "🛍 Купить товар", "en": "🛍 Buy Products", "uz": "🛍 Mahsulot sotib olish"}[lang]
    txt_orders  = {"ru": "📦 Мои заказы / Трекинг", "en": "📦 My Orders / Tracking", "uz": "📦 Buyurtmalarim / Kuzatish"}[lang]
    txt_support = {"ru": "💬 Поддержка",    "en": "💬 Support",      "uz": "💬 Qo'llab-quvvatlash"}[lang]
    txt_rules   = {"ru": "📜 Правила",      "en": "📜 Rules",        "uz": "📜 Qoidalar"}[lang]
    txt_ref     = {"ru": "👥 Пригласить друга", "en": "👥 Invite Friend", "uz": "👥 Do'stlarni taklif qilish"}[lang]
    txt_site    = {"ru": "🌐 Наш сайт",     "en": "🌐 Website",      "uz": "🌐 Bizning sayt"}[lang]
    txt_rev     = {"ru": "⭐ Отзывы",       "en": "⭐ Reviews",      "uz": "⭐ Sharhlar"}[lang]

    rows = [
        [
            InlineKeyboardButton(text=txt_catalog, callback_data="catalog"),
            InlineKeyboardButton(text=txt_orders,  callback_data="orders")
        ],
        [
            InlineKeyboardButton(text=txt_support, callback_data="support"),
            InlineKeyboardButton(text=txt_rules,   callback_data="rules")
        ],
        [
            InlineKeyboardButton(text=txt_ref,     callback_data="referral")
        ]
    ]
    if WEBSITE_URL:
        rows.append([InlineKeyboardButton(text=txt_site, url=WEBSITE_URL)])
    if REVIEWS_URL:
        rows.append([InlineKeyboardButton(text=txt_rev,  url=REVIEWS_URL)])
    return InlineKeyboardMarkup(inline_keyboard=rows)


def back_home(lang="ru"):
    lbl = {"ru": "🔙 Главное меню", "en": "🔙 Main Menu", "uz": "🔙 Asosiy menyu"}[lang]
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text=lbl, callback_data="home")]
    ])


def generate_captcha(user_id: int, lang: str):
    num1 = random.randint(2, 8)
    num2 = random.randint(1, 9)
    correct = num1 + num2
    wrong1 = correct + random.choice([-2, -1, 1, 2])
    wrong2 = correct + random.choice([-4, -3, 3, 4])
    options = [correct, wrong1, wrong2]
    random.shuffle(options)

    USER_CAPTCHAS[user_id] = {'ans': correct, 'verified': False}

    prompt = {
        "ru": f"🛡 <b>Проверка безопасности (Капча):</b>\n\nПожалуйста, решите математический пример для доступа к боту:\n<b>{num1} + {num2} = ?</b>",
        "en": f"🛡 <b>Security Verification (Captcha):</b>\n\nPlease solve the math problem to unlock the bot:\n<b>{num1} + {num2} = ?</b>",
        "uz": f"🛡 <b>Xavfsizlik tekshiruvi (Kapcha):</b>\n\nBotdan foydalanish uchun misolni yeching:\n<b>{num1} + {num2} = ?</b>"
    }[lang]

    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text=str(opt), callback_data=f"captcha_{opt}") for opt in options]
    ])
    return prompt, keyboard


# ── Handlers ─────────────────────────────────────────────────────────────────

@dp.message(CommandStart())
async def start(message: Message):
    user_id = message.from_user.id
    USER_LANGUAGES.setdefault(user_id, "ru")
    await message.answer(
        "🌐 <b>Выберите язык / Select Language / Tilni tanlang:</b>",
        reply_markup=language_keyboard()
    )


@dp.callback_query()
async def menu(callback: CallbackQuery):
    data = callback.data
    user_id = callback.from_user.id
    lang = USER_LANGUAGES.get(user_id, "ru")
    await callback.answer()

    # ── Language Selection ───────────────────────────────────────────────────
    if data.startswith("setlang_"):
        selected_lang = data.replace("setlang_", "")
        USER_LANGUAGES[user_id] = selected_lang
        prompt, kb = generate_captcha(user_id, selected_lang)
        await callback.message.answer(prompt, reply_markup=kb)

    # ── Captcha Verification Handler ─────────────────────────────────────────
    elif data.startswith("captcha_"):
        selected_ans = int(data.replace("captcha_", ""))
        captcha_info = USER_CAPTCHAS.get(user_id, {})
        if captcha_info.get('ans') == selected_ans:
            USER_CAPTCHAS[user_id]['verified'] = True
            username = await get_bot_username()
            referral_link = f"https://t.me/{username}?start=ref_{user_id}"

            welcome_txt = {
                "ru": "🐉 <b>Добро пожаловать в DRAGON-X!</b>\n\n"
                      "Выберите нужный раздел в меню ниже.\n\n"
                      "💰 <b>Ваш баланс:</b> 0.00 $\n"
                      "🎁 <b>Реферальный бонус:</b> 2% от всех заказов друзей\n\n"
                      f"👥 <b>Ваша реферальная ссылка:</b>\n<code>{escape(referral_link)}</code>\n\n"
                      "💡 <i>Приглашайте друзей по вашей ссылке и получайте 2% от суммы каждого их заказа прямо на ваш баланс!</i>",
                "en": "🐉 <b>Welcome to DRAGON-X!</b>\n\n"
                      "Select a section from the menu below.\n\n"
                      "💰 <b>Your Balance:</b> 0.00 $\n"
                      "🎁 <b>Referral Bonus:</b> 2% from all friend orders\n\n"
                      f"👥 <b>Your Referral Link:</b>\n<code>{escape(referral_link)}</code>\n\n"
                      "💡 <i>Invite friends and earn 2% cashback directly into your balance for every order they make!</i>",
                "uz": "🐉 <b>DRAGON-X ga xush kelibsiz!</b>\n\n"
                      "Quyidagi menyudan kerakli bo'limni tanlang.\n\n"
                      "💰 <b>Sizning balansingiz:</b> 0.00 $\n"
                      "🎁 <b>Referal bonus:</b> Do'stlar buyurtmalaridan 2%\n\n"
                      f"👥 <b>Sizning referal havolangiz:</b>\n<code>{escape(referral_link)}</code>\n\n"
                      "💡 <i>Do'stlaringizni taklif qiling va har bir buyurtmadan 2% balansingizga oling!</i>"
            }[lang]
            await callback.message.answer(welcome_txt, reply_markup=home_keyboard(lang))
        else:
            alert_msg = {
                "ru": "❌ <b>Неверный ответ на капчу! Попробуйте еще раз:</b>",
                "en": "❌ <b>Incorrect captcha answer! Please try again:</b>",
                "uz": "❌ <b>Noto'g'ri javob! Qayta urinib ko'ring:</b>"
            }[lang]
            prompt, kb = generate_captcha(user_id, lang)
            await callback.message.answer(f"{alert_msg}\n\n{prompt}", reply_markup=kb)

    # ── Security Check Guard ────────────────────────────────────────────────
    elif not USER_CAPTCHAS.get(user_id, {}).get('verified', False) and data != "home":
        prompt, kb = generate_captcha(user_id, lang)
        await callback.message.answer(prompt, reply_markup=kb)

    # ── Home ─────────────────────────────────────────────────────────────────
    elif data == "home":
        txt_home = {
            "ru": "🐉 <b>DRAGON-X</b> — Главное меню",
            "en": "🐉 <b>DRAGON-X</b> — Main Menu",
            "uz": "🐉 <b>DRAGON-X</b> — Asosiy menyu"
        }[lang]
        await callback.message.answer(txt_home, reply_markup=home_keyboard(lang))

    # ── Rules ─────────────────────────────────────────────────────────────────
    elif data == "rules":
        rules_txt = {
            "ru": "📜 <b>Правила DRAGON-X</b>\n\n"
                  "• Предоставляйте достоверную информацию.\n"
                  "• Не отправляйте пароли и секретные ключи.\n"
                  "• Обращайтесь в поддержку при возникновении вопросов.\n"
                  "• Все операции должны соответствовать применимому законодательству.",
            "en": "📜 <b>DRAGON-X Rules</b>\n\n"
                  "• Provide accurate information.\n"
                  "• Never share passwords or secret keys.\n"
                  "• Contact support if you have questions.\n"
                  "• All operations must comply with applicable law.",
            "uz": "📜 <b>DRAGON-X Qoidalari</b>\n\n"
                  "• Aniq va to'g'ri ma'lumot bering.\n"
                  "• Parol va maxfiy kalitlarni ulashmang.\n"
                  "• Savollar bo'lsa qo'llab-quvvatlash xizmatiga murojaat qiling."
        }[lang]
        await callback.message.answer(rules_txt, reply_markup=back_home(lang))

    # ── Referral ──────────────────────────────────────────────────────────────
    elif data == "referral":
        username = await get_bot_username()
        link = f"https://t.me/{username}?start=ref_{user_id}"
        share_url = f"https://t.me/share/url?url={escape(link)}&text=🐉%20Присоединяйся%20к%20DRAGON-X!"
        
        btn_share = {"ru": "🔗 Поделиться ссылкой", "en": "🔗 Share Link", "uz": "🔗 Havolani ulashish"}[lang]
        btn_bal   = {"ru": "💰 Мой баланс",         "en": "💰 My Balance", "uz": "💰 Mening balansim"}[lang]
        btn_terms = {"ru": "📜 Условия программы",  "en": "📜 Terms",      "uz": "📜 Shartlar"}[lang]
        btn_home  = {"ru": "🔙 Главное меню",       "en": "🔙 Main Menu",  "uz": "🔙 Asosiy menyu"}[lang]

        keyboard = InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text=btn_share, url=share_url)],
            [InlineKeyboardButton(text=btn_bal,   callback_data="my_balance")],
            [InlineKeyboardButton(text=btn_terms, callback_data="referral_terms")],
            [InlineKeyboardButton(text=btn_home,  callback_data="home")]
        ])

        ref_txt = {
            "ru": "🎁 <b>Партнерская программа DRAGON-X (2% Кэшбэк)</b>\n\n"
                  "👥 <b>Ваша реферальная ссылка:</b>\n"
                  f"<code>{escape(link)}</code>\n\n"
                  "📊 <b>Ваша статистика:</b>\n"
                  "• Приглашено друзей: <b>0</b>\n"
                  "• Начислено бонусов (2%): <b>0.00 $</b>\n"
                  "• Текущий баланс: <b>0.00 $</b>\n\n"
                  "💎 <b>Как это работает?</b>\n"
                  "1️⃣ Отправьте вашу персональную ссылку другу.\n"
                  "2️⃣ При каждом заказе вашего друга вы получаете <b>2% от суммы его заказа</b> прямо на ваш баланс!\n"
                  "3️⃣ Средства с баланса можно использовать для оплаты покупок или вывести через оператора.\n\n"
                  "⚡ <i>Пример: При заказе друга на 100$, вы моментально получаете 2$ на баланс!</i>",
            "en": "🎁 <b>DRAGON-X Referral Program (2% Cashback)</b>\n\n"
                  "👥 <b>Your Referral Link:</b>\n"
                  f"<code>{escape(link)}</code>\n\n"
                  "📊 <b>Your Statistics:</b>\n"
                  "• Invited friends: <b>0</b>\n"
                  "• Bonus earned (2%): <b>0.00 $</b>\n"
                  "• Current balance: <b>0.00 $</b>\n\n"
                  "💎 <b>How it works:</b>\n"
                  "1️⃣ Share your link with a friend.\n"
                  "2️⃣ Earn <b>2% cashback</b> on every order they complete!\n"
                  "3️⃣ Use your balance for future purchases or withdraw via support.\n\n"
                  "⚡ <i>Example: If your friend orders $100, you instantly get $2 on your balance!</i>",
            "uz": "🎁 <b>DRAGON-X Referal Dasturi (2% Keshbek)</b>\n\n"
                  "👥 <b>Sizning referal havolangiz:</b>\n"
                  f"<code>{escape(link)}</code>\n\n"
                  "📊 <b>Statistika:</b>\n"
                  "• Taklif qilingan do'stlar: <b>0</b>\n"
                  "• Ishlangan bonus (2%): <b>0.00 $</b>\n"
                  "• Joriy balans: <b>0.00 $</b>\n\n"
                  "💎 <b>Qanday ishlaydi?</b>\n"
                  "1️⃣ Do'stingizga havolangizni yuboring.\n"
                  "2️⃣ Har bir buyurtmadan <b>2% keshbek</b> balansingizga oling!"
        }[lang]
        await callback.message.answer(ref_txt, reply_markup=keyboard)

    # ── My Balance Handler ───────────────────────────────────────────────────
    elif data == "my_balance":
        btn_op   = {"ru": "💬 Написать оператору", "en": "💬 Contact Operator", "uz": "💬 Operatorga yozish"}[lang]
        btn_ref  = {"ru": "👥 Пригласить друга",   "en": "👥 Invite Friend",    "uz": "👥 Do'stlarni taklif qilish"}[lang]
        btn_home = {"ru": "🔙 Главное меню",       "en": "🔙 Main Menu",        "uz": "🔙 Asosiy menyu"}[lang]

        keyboard = InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text=btn_op,   url=SUPPORT_URL)],
            [InlineKeyboardButton(text=btn_ref,  callback_data="referral")],
            [InlineKeyboardButton(text=btn_home, callback_data="home")]
        ])

        bal_txt = {
            "ru": "💰 <b>Ваш финансовый баланс</b>\n\n"
                  "💵 Доступно на балансе: <b>0.00 $</b>\n"
                  "🎁 Заработано с рефералов (2%): <b>0.00 $</b>\n"
                  "🛍 Совершено покупок: <b>0</b>\n\n"
                  "💡 <i>Пополняйте баланс через партнерскую программу, приглашая друзей. 2% от всех их покупок начисляются вам автоматически!</i>",
            "en": "💰 <b>Your Financial Balance</b>\n\n"
                  "💵 Available Balance: <b>0.00 $</b>\n"
                  "🎁 Referral Cashback (2%): <b>0.00 $</b>\n"
                  "🛍 Orders Completed: <b>0</b>\n\n"
                  "💡 <i>Earn 2% cashback directly into your balance by inviting friends with your referral link!</i>",
            "uz": "💰 <b>Sizning moliyaviy balansingiz</b>\n\n"
                  "💵 Mavjud balans: <b>0.00 $</b>\n"
                  "🎁 Referallardan daromad (2%): <b>0.00 $</b>\n"
                  "🛍 Bajarilgan buyurtmalar: <b>0</b>"
        }[lang]
        await callback.message.answer(bal_txt, reply_markup=keyboard)

    # ── Referral Terms Handler ───────────────────────────────────────────────
    elif data == "referral_terms":
        btn_back = {"ru": "🔙 К реферальной программе", "en": "🔙 Back to Referral", "uz": "🔙 Referal bo'limiga"}[lang]
        btn_home = {"ru": "🔙 Главное меню",             "en": "🔙 Main Menu",        "uz": "🔙 Asosiy menyu"}[lang]

        keyboard = InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text=btn_back, callback_data="referral")],
            [InlineKeyboardButton(text=btn_home, callback_data="home")]
        ])

        terms_txt = {
            "ru": "📜 <b>Условия партнерской программы DRAGON-X</b>\n\n"
                  "1. <b>Вознаграждение 2%:</b> Вы получаете 2% от суммы любого заказа, совершенного пользователем, зарегистрированным по вашей ссылке.\n"
                  "2. <b>Пожизненный доход:</b> Бонус 2% начисляется с каждого повторного заказа ваших рефералов без ограничений по времени.\n"
                  "3. <b>Использование средств:</b> Баланс можно применить для получения скидки до 100% на товары DRAGON-X или вывести.\n"
                  "4. <b>Честная игра:</b> Запрещена автоматическая накрутка аккаунтов. При нарушении баланс аннулируется.",
            "en": "📜 <b>DRAGON-X Referral Program Terms</b>\n\n"
                  "1. <b>2% Reward:</b> Earn 2% of total order value for every customer registered via your link.\n"
                  "2. <b>Lifetime Income:</b> Earnings apply to all repeat orders made by your referred users.\n"
                  "3. <b>Balance Usage:</b> Use your balance for up to 100% discount on orders or withdraw.\n"
                  "4. <b>Fair Use:</b> Spam or fake account creation leads to balance forfeiture.",
            "uz": "📜 <b>DRAGON-X Referal Dasturi Shartlari</b>\n\n"
                  "1. <b>2% Mukofot:</b> Havolangiz orqali ro'yxatdan o'tgan har bir mijoz buyurtmasidan 2% olasiz.\n"
                  "2. <b>Umrbod Daromad:</b> Barcha takroriy buyurtmalardan 2% beriladi."
        }[lang]
        await callback.message.answer(terms_txt, reply_markup=keyboard)

    # ── Support ───────────────────────────────────────────────────────────────
    elif data == "support":
        btn_op   = {"ru": "💬 Написать оператору", "en": "💬 Contact Operator", "uz": "💬 Operatorga yozish"}[lang]
        btn_bulk = {"ru": "📦 Оптовый запрос",      "en": "📦 Bulk Inquiry",     "uz": "📦 Ulgurji so'rov"}[lang]
        btn_home = {"ru": "🔙 Главное меню",       "en": "🔙 Main Menu",        "uz": "🔙 Asosiy menyu"}[lang]

        keyboard = InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text=btn_op,   url=SUPPORT_URL)],
            [InlineKeyboardButton(text=btn_bulk, url=SUPPORT_URL)],
            [InlineKeyboardButton(text=btn_home, callback_data="home")]
        ])

        supp_txt = {
            "ru": "💬 <b>Поддержка DRAGON-X</b>\n\nНажмите кнопку ниже, чтобы перейти к диалогу с оператором.\nМы ответим как можно скорее.",
            "en": "💬 <b>DRAGON-X Support</b>\n\nClick the button below to message our support operator.\nWe respond as quickly as possible.",
            "uz": "💬 <b>DRAGON-X Qo'llab-quvvatlash</b>\n\nOperator bilan bog'lanish uchun quyidagi tugmani bosing."
        }[lang]
        await callback.message.answer(supp_txt, reply_markup=keyboard)

    # ── Orders & Live Location Tracking ──────────────────────────────────────
    elif data == "orders" or data.startswith("orders_refresh"):
        user_orders = [o for o in ACTIVE_ORDERS.values() if o.get('user_id') == user_id]
        if not user_orders:
            btn_buy  = {"ru": "🛍 Перейти в каталог",  "en": "🛍 Browse Catalog",   "uz": "🛍 Mahsulotlar katalogi"}[lang]
            btn_home = {"ru": "🔙 Главное меню",        "en": "🔙 Main Menu",        "uz": "🔙 Asosiy menyu"}[lang]
            kb = InlineKeyboardMarkup(inline_keyboard=[
                [InlineKeyboardButton(text=btn_buy,  callback_data="catalog")],
                [InlineKeyboardButton(text=btn_home, callback_data="home")]
            ])
            no_orders_txt = {
                "ru": "📋 <b>У вас пока нет активных заказов.</b>\n\nВыберите фасовку препарата <b>Рега</b> в каталоге, чтобы оформить заказ!",
                "en": "📋 <b>You have no active orders yet.</b>\n\nSelect a pack of <b>Rega</b> in the catalog to place an order!",
                "uz": "📋 <b>Sizda hali faol buyurtmalar yo'q.</b>\n\nBuyurtma berish uchun katalogdan <b>Rega</b> ni tanlang!"
            }[lang]
            await callback.message.answer(no_orders_txt, reply_markup=kb)
        else:
            user_orders.sort(key=lambda x: x.get('created_at', 0), reverse=True)
            header = {
                "ru": "📦 <b>Ваши заказы и статус доставки DRAGON-X:</b>\n",
                "en": "📦 <b>Your Orders & Delivery Status — DRAGON-X:</b>\n",
                "uz": "📦 <b>Buyurtmalaringiz va yetkazish holati:</b>\n"
            }[lang]
            msg_lines = [header]

            for o in user_orders[:4]:
                oid = o.get('id', 'N/A')
                status = o.get('status', 'pending')
                qty_val = o.get('qty', '2 штук')
                price_val = o.get('price', '25$')
                dist_val = o.get('district', 'Чиланзор')
                coords_val = o.get('coordinates', '')
                loc_val = o.get('location', '')

                if status == 'picked_up':
                    status_badge = "✅ <b>ЗАБРАН КЛИЕНТОМ (Picked Up)</b>"
                    status_desc = "🎉 <i>Заказ успешно получен. Выдача полностью завершена.</i>"
                elif status == 'drop_ready':
                    status_badge = "📍 <b>ГОТОВ К ВЫДАЧЕ (Локация выдана)</b>"
                    status_desc = f"🧭 <b>GPS Координаты:</b> <code>{coords_val}</code>\n📌 <b>Тайник / Ориентир:</b> {loc_val}"
                    if coords_val:
                        status_desc += f"\n🗺 <a href='https://maps.google.com/?q={coords_val}'>Открыть локацию на карте</a>"
                elif status == 'paid':
                    status_badge = "💳 <b>ОПЛАЧЕН (LTC подтвержден)</b>"
                    status_desc = f"⏳ Курьер готовит тайник/дроп в районе <b>{dist_val}</b>. Скоро координаты появятся здесь!"
                else:
                    status_badge = "⏳ <b>ОЖИДАЕТ ОПЛАТЫ LTC</b>"
                    status_desc = "Переведите средства на LTC адрес для завершения."

                msg_lines.append(
                    f"────────────────────────\n"
                    f"🔑 <b>Заказ:</b> <code>{oid}</code>\n"
                    f"💊 <b>Товар:</b> Рега ({qty_val}) — <b>{price_val}</b>\n"
                    f"📍 <b>Район:</b> {dist_val}\n"
                    f"📊 <b>Статус:</b> {status_badge}\n"
                    f"{status_desc}\n"
                )

            btn_ref  = {"ru": "🔄 Обновить статус",     "en": "🔄 Refresh Status",    "uz": "🔄 Yangilash"}[lang]
            btn_op   = {"ru": "💬 Связаться с оператором", "en": "💬 Contact Operator", "uz": "💬 Operatorga yozish"}[lang]
            btn_home = {"ru": "🔙 Главное меню",        "en": "🔙 Main Menu",        "uz": "🔙 Asosiy menyu"}[lang]
            kb = InlineKeyboardMarkup(inline_keyboard=[
                [InlineKeyboardButton(text=btn_ref,  callback_data="orders_refresh")],
                [InlineKeyboardButton(text=btn_op,   url=SUPPORT_URL)],
                [InlineKeyboardButton(text=btn_home, callback_data="home")]
            ])
            await callback.message.answer("\n".join(msg_lines), reply_markup=kb, disable_web_page_preview=True)

    # ── Catalogue ────────────────────────────────────────────────────────────
    elif data == "catalog":
        p_name = get_product_name()
        btn_rega  = {"ru": f"💊 {p_name}", "en": f"💊 {p_name}", "uz": f"💊 {p_name}"}[lang]
        btn_home  = {"ru": "🔙 Главное меню", "en": "🔙 Main Menu", "uz": "🔙 Asosiy menyu"}[lang]

        keyboard = InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text=btn_rega, callback_data="category_medical")],
            [InlineKeyboardButton(text=btn_home, callback_data="home")]
        ])

        cat_txt = {
            "ru": f"🛍 <b>Каталог товаров DRAGON-X</b>\n\n• 💊 <b>{p_name}</b>",
            "en": f"🛍 <b>DRAGON-X Product Catalog</b>\n\n• 💊 <b>{p_name}</b>",
            "uz": f"🛍 <b>DRAGON-X Mahsulotlar katalogi</b>\n\n• 💊 <b>{p_name}</b>"
        }[lang]
        await callback.message.answer(cat_txt, reply_markup=keyboard)

    # ── Product Selection -> Region Step ─────────────────────────────────────
    elif data == "category_medical":
        p_name = get_product_name()
        btn_reg  = {"ru": "📍 Выбрать регион", "en": "📍 Select Region", "uz": "📍 Hududni tanlash"}[lang]
        btn_cat  = {"ru": "🔙 Каталог",          "en": "🔙 Catalog",       "uz": "🔙 Katalog"}[lang]

        keyboard = InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text=btn_reg, callback_data="select_region")],
            [InlineKeyboardButton(text=btn_cat, callback_data="catalog")]
        ])

        prod_txt = {
            "ru": f"💊 <b>{p_name}</b>\n\nПерейдите к выбору региона доставки и выдачи:",
            "en": f"💊 <b>{p_name}</b>\n\nProceed to select delivery region:",
            "uz": f"💊 <b>{p_name}</b>\n\nYetkazib berish hududini tanlashga o'ting:"
        }[lang]
        await callback.message.answer(prod_txt, reply_markup=keyboard)

    # ── 3rd Page: Region Selection (Tashkent) ────────────────────────────────
    elif data == "select_region":
        btn_tash = {"ru": "📍 Ташкент", "en": "📍 Tashkent", "uz": "📍 Toshkent"}[lang]
        btn_back = {"ru": "🔙 Назад",     "en": "🔙 Back",     "uz": "🔙 Orqaga"}[lang]

        keyboard = InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text=btn_tash, callback_data="region_tashkent")],
            [InlineKeyboardButton(text=btn_back, callback_data="category_medical")]
        ])

        reg_txt = {
            "ru": "📍 <b>Выбор региона</b>\n\nДоступный регион для заказа:\n• <b>Ташкент</b>",
            "en": "📍 <b>Select Region</b>\n\nAvailable region for order:\n• <b>Tashkent</b>",
            "uz": "📍 <b>Hududni tanlash</b>\n\nMavjud hudud:\n• <b>Toshkent</b>"
        }[lang]
        await callback.message.answer(reg_txt, reply_markup=keyboard)

    # ── Tashkent -> District Selection (Dynamic from BOT_CONFIG) ─────────────
    elif data == "region_tashkent":
        active_dists = get_districts()
        btn_reg  = {"ru": "🔙 К выбору региона", "en": "🔙 Select Region",   "uz": "🔙 Hududga qaytish"}[lang]
        btn_home = {"ru": "🔙 Главное меню",     "en": "🔙 Main Menu",       "uz": "🔙 Asosiy menyu"}[lang]

        kb_rows = []
        for d in active_dists:
            kb_rows.append([InlineKeyboardButton(text=f"📍 {d['name']}", callback_data=d["id"])])
        kb_rows.append([InlineKeyboardButton(text=btn_reg, callback_data="select_region")])
        kb_rows.append([InlineKeyboardButton(text=btn_home, callback_data="home")])

        keyboard = InlineKeyboardMarkup(inline_keyboard=kb_rows)

        dist_bullets = "\n".join([f"• <b>{d['name']}</b>" for d in active_dists]) or "• <b>Чиланзор</b>\n• <b>Яшнабад</b>\n• <b>Ulugbek</b>"
        dist_txt = {
            "ru": f"📍 <b>Регион: Ташкент</b>\n\n🏘 <b>Выберите район:</b>\n{dist_bullets}",
            "en": f"📍 <b>Region: Tashkent</b>\n\n🏘 <b>Select District:</b>\n{dist_bullets}",
            "uz": f"📍 <b>Hudud: Toshkent</b>\n\n🏘 <b>Tuman tanlang:</b>\n{dist_bullets}"
        }[lang]
        await callback.message.answer(dist_txt, reply_markup=keyboard)

    # ── 4th Page: Price Section & Quantity Options with Stock Verification ───
    elif data.startswith("district_") or data.startswith("dist_") or data == "product_pregabalin":
        active_dists = get_districts()
        found_dist = next((d for d in active_dists if d["id"] == data), None)
        if found_dist:
            USER_DISTRICTS[user_id] = {"ru": found_dist["name"], "en": found_dist["name"], "uz": found_dist["name"]}
        else:
            district_map = {
                "district_chilanzer": {"ru": "Чиланзор", "en": "Chilanzar", "uz": "Chilonzor"},
                "district_yashnabad": {"ru": "Яшнабад",  "en": "Yashnabad",  "uz": "Yashnobod"},
                "district_ulugbek":   {"ru": "Ulugbek",   "en": "Ulugbek",   "uz": "Ulug'bek"},
            }
            if data in district_map:
                USER_DISTRICTS[user_id] = district_map[data]

        cur_district = USER_DISTRICTS.get(user_id, {"ru": "Чиланзор", "en": "Chilanzar", "uz": "Chilonzor"})[lang]
        lbl_stock = {"ru": "в наличии", "en": "in stock", "uz": "mavjud"}[lang]
        btn_op    = {"ru": "💬 Написать оператору", "en": "💬 Contact Operator", "uz": "💬 Operatorga yozish"}[lang]
        btn_dist  = {"ru": "🔙 К выбору района",    "en": "🔙 Select District",  "uz": "🔙 Tumanga qaytish"}[lang]
        btn_home  = {"ru": "🔙 Главное меню",        "en": "🔙 Main Menu",        "uz": "🔙 Asosiy menyu"}[lang]

        active_pkgs = get_packages()
        kb_rows = []
        row = []
        for pkg in active_pkgs:
            k = pkg["key"]
            stk = INVENTORY_STOCKS.get(k, pkg.get("stock", 0))
            q_num = pkg.get("qty_num", 2)
            p_usd = pkg.get("price_usd", 25)
            row.append(InlineKeyboardButton(text=f"{q_num} pcs — {p_usd}$ ({stk} {lbl_stock})", callback_data=k))
            if len(row) == 2:
                kb_rows.append(row)
                row = []
        if row:
            kb_rows.append(row)

        kb_rows.append([InlineKeyboardButton(text=btn_op, url=get_support_url())])
        kb_rows.append([
            InlineKeyboardButton(text=btn_dist, callback_data="region_tashkent"),
            InlineKeyboardButton(text=btn_home, callback_data="home")
        ])
        keyboard = InlineKeyboardMarkup(inline_keyboard=kb_rows)

        price_bullets = "\n".join([
            f"• {p.get('qty_num', 2)} штук — <b>{p.get('price_usd', 25)}$</b> [В наличии: {INVENTORY_STOCKS.get(p['key'], p.get('stock', 0))}]"
            for p in active_pkgs
        ])

        p_name = get_product_name()
        ltc_addr = get_ltc_address()

        price_txt = {
            "ru": f"💊 <b>{p_name}</b>\n"
                  f"📍 <b>Регион:</b> Ташкент\n"
                  f"🏘 <b>Район:</b> {cur_district}\n\n"
                  "💰 <b>Прайс-лист и остатки на сегодня:</b>\n"
                  f"{price_bullets}\n\n"
                  "💳 <b>Оплата принимается на LTC адрес:</b> (нажмите, чтобы открыть)\n"
                  f"<tg-spoiler>{ltc_addr}</tg-spoiler>\n\n"
                  "👇 Выберите нужную фасовку для оформления заказа:",
            "en": f"💊 <b>{p_name}</b>\n"
                  f"📍 <b>Region:</b> Tashkent\n"
                  f"🏘 <b>District:</b> {cur_district}\n\n"
                  "💰 <b>Price List & Today's Stock:</b>\n"
                  f"{price_bullets}\n\n"
                  "💳 <b>Payment accepted via LTC address:</b> (tap to reveal)\n"
                  f"<tg-spoiler>{ltc_addr}</tg-spoiler>\n\n"
                  "👇 Select desired quantity to order:",
            "uz": f"💊 <b>{p_name}</b>\n"
                  f"📍 <b>Hudud:</b> Toshkent\n"
                  f"🏘 <b>Tuman:</b> {cur_district}\n\n"
                  "💰 <b>Narxlar va bugungi mavjudlik:</b>\n"
                  f"{price_bullets}\n\n"
                  "💳 <b>To'lov LTC manzili orqali:</b> (ko'rish uchun bosing)\n"
                  f"<tg-spoiler>{ltc_addr}</tg-spoiler>\n\n"
                  "👇 Buyurtma uchun miqdorni tanlang:"
        }[lang]
        await callback.message.answer(price_txt, reply_markup=keyboard)

    # ── Order Confirmation with Stock Check & Unique Reference ID ─────────────
    elif data.startswith("buy_"):
        cur_district = USER_DISTRICTS.get(user_id, {"ru": "Чиланзор", "en": "Chilanzar", "uz": "Chilonzor"})[lang]
        active_pkgs = get_packages()
        pkg = next((p for p in active_pkgs if p["key"] == data), None)

        stock_count = INVENTORY_STOCKS.get(data, pkg.get("stock", 0) if pkg else 0)
        if stock_count <= 0:
            btn_op    = {"ru": "💬 Связаться с оператором", "en": "💬 Contact Operator", "uz": "💬 Operatorga yozish"}[lang]
            btn_price = {"ru": "🔙 К выбору района",      "en": "🔙 Select District",    "uz": "🔙 Tumanga qaytish"}[lang]
            keyboard = InlineKeyboardMarkup(inline_keyboard=[
                [InlineKeyboardButton(text=btn_op,    url=get_support_url())],
                [InlineKeyboardButton(text=btn_price, callback_data="region_tashkent")]
            ])
            out_txt = {
                "ru": "❌ <b>Данный объем временно распродан на сегодня!</b>\n\nАдминистратор обновляет каталог каждое утро. Выберите другой объем или напишите оператору.",
                "en": "❌ <b>This volume is currently sold out for today!</b>\n\nThe administrator updates stock every morning. Please select another volume or contact support.",
                "uz": "❌ <b>Ushbu miqdor bugun sotib bo'lindi!</b>\n\nBoshqa miqdorni tanlang yoki operatorga yozing."
            }[lang]
            await callback.message.answer(out_txt, reply_markup=keyboard)
            return

        order_rand = random.randint(1000, 9999)
        unique_order_id = f"DRGX-{user_id}-{order_rand}"

        if pkg:
            qty_label = pkg.get(f"label_{lang}", pkg.get("label_ru", f"{pkg.get('qty_num', 2)} шт"))
            price_val = f"{pkg.get('price_usd', 25)}$"
            total_amt = float(pkg.get("price_usd", 25))
        else:
            qty_label = "2 штук"
            price_val = "25$"
            total_amt = 25.0

        p_name = get_product_name()
        ltc_addr = get_ltc_address()

        d_item = next((d for d in get_districts() if d.get("name") == cur_district), None)
        def_coords = d_item.get("coords") if d_item else "41.2721, 69.2045"

        ACTIVE_ORDERS[unique_order_id] = {
            'id': unique_order_id,
            'user_id': user_id,
            'user_data': {
                'id': user_id,
                'username': callback.from_user.username or '',
                'first_name': callback.from_user.first_name or '',
                'last_name': callback.from_user.last_name or '',
                'lang': lang
            },
            'created_at': time.time(),
            'product': p_name,
            'qty': qty_label,
            'price': price_val,
            'total_amount': total_amt,
            'currency': "USD",
            'pack_key': data,
            'district': cur_district,
            'location': f"Ташкент, {cur_district} (Координаты выдаются после подтверждения оплаты)",
            'coordinates': def_coords,
            'status': "pending",
            'pickup_status': "waiting_payment",
            'tracking_code': f"DRGX-TRK-{order_rand}",
            'notes': "Ожидает проверки оплаты LTC",
            'updated_at': time.time()
        }
        save_orders()

        btn_verify = {"ru": "🔍 Проверить транзакцию LTC", "en": "🔍 Verify LTC Transaction", "uz": "🔍 LTC Tranzaksiyani tekshirish"}[lang]
        btn_ex1    = {"ru": "🔄 Обменник 1", "en": "🔄 Exchanger 1", "uz": "🔄 Ayirboshlash 1"}[lang]
        btn_ex2    = {"ru": "🔄 Обменник 2", "en": "🔄 Exchanger 2", "uz": "🔄 Ayirboshlash 2"}[lang]
        btn_pay    = {"ru": "💬 Оплатить и связаться с оператором", "en": "💬 Pay & Contact Operator", "uz": "💬 To'lov va Operatorga yozish"}[lang]
        btn_price  = {"ru": "🔙 К прайс-листу", "en": "🔙 Back to Price List", "uz": "🔙 Narxlarga qaytish"}[lang]
        btn_home   = {"ru": "🔙 Главное меню", "en": "🔙 Main Menu", "uz": "🔙 Asosiy menyu"}[lang]

        keyboard = InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text=btn_verify, callback_data=f"check_tx_{unique_order_id}")],
            [
                InlineKeyboardButton(text=btn_ex1, url=get_exchanger_1()),
                InlineKeyboardButton(text=btn_ex2, url=get_exchanger_2())
            ],
            [InlineKeyboardButton(text=btn_pay,    url=get_support_url())],
            [InlineKeyboardButton(text=btn_price,  callback_data="region_tashkent")],
            [InlineKeyboardButton(text=btn_home,   callback_data="home")]
        ])

        order_checkout_txt = {
            "ru": "📦 <b>Оформление заказа — DRAGON-X</b>\n\n"
                  "📍 <b>Регион:</b> Ташкент\n"
                  f"🏘 <b>Район:</b> {cur_district}\n"
                  f"💊 <b>{p_name}</b>\n"
                  f"📊 <b>Объем:</b> {qty_label}\n"
                  f"💵 <b>Сумма к оплате:</b> {price_val}\n\n"
                  f"🔑 <b>Ваш уникальный ID заказа / клиента:</b>\n"
                  f"<code>{unique_order_id}</code>\n\n"
                  "💳 <b>Реквизиты для оплаты LTC:</b> (нажмите, чтобы открыть)\n"
                  f"<tg-spoiler>{ltc_addr}</tg-spoiler>\n\n"
                  "📌 <b>Инструкция по оплате:</b>\n"
                  "1. Нажмите на скрытый текст выше, чтобы увидеть LTC адрес, и переведите сумму заказа.\n"
                  "2. После перевода нажмите кнопку <b>🔍 Проверить транзакцию LTC</b> для авто-проверки в блокчейне!",
            "en": "📦 <b>Order Checkout — DRAGON-X</b>\n\n"
                  "📍 <b>Region:</b> Tashkent\n"
                  f"🏘 <b>District:</b> {cur_district}\n"
                  f"💊 <b>Product:</b> {p_name}\n"
                  f"📊 <b>Volume:</b> {qty_label}\n"
                  f"💵 <b>Total Amount:</b> {price_val}\n\n"
                  f"🔑 <b>Your Unique Order / Client ID:</b>\n"
                  f"<code>{unique_order_id}</code>\n\n"
                  "💳 <b>LTC Payment Address:</b> (tap to reveal)\n"
                  f"<tg-spoiler>{ltc_addr}</tg-spoiler>\n\n"
                  "📌 <b>Payment Instructions:</b>\n"
                  "1. Tap the spoiler above to reveal the LTC address, and send the order amount.\n"
                  "2. After sending, click <b>🔍 Verify LTC Transaction</b> for automated blockchain check!",
            "uz": "📦 <b>Buyurtmani rasmiylashtirish — DRAGON-X</b>\n\n"
                  "📍 <b>Hudud:</b> Toshkent\n"
                  f"🏘 <b>Tuman:</b> {cur_district}\n"
                  f"💊 <b>Mahsulot:</b> {p_name}\n"
                  f"📊 <b>Hajmi:</b> {qty_label}\n"
                  f"💵 <b>To'lov summasi:</b> {price_val}\n\n"
                  f"🔑 <b>Sizning noyob buyurtma ID:</b>\n"
                  f"<code>{unique_order_id}</code>\n\n"
                  "💳 <b>LTC To'lov manzili:</b> (ko'rish uchun bosing)\n"
                  f"<tg-spoiler>{ltc_addr}</tg-spoiler>\n\n"
                  "📌 <b>To'lov yo'riqnomasi:</b>\n"
                  "1. LTC manzilini ko'rish uchun yuqoridagi spoylerga bosing va to'lovni yuboring.\n"
                  "2. Yuborgandan so'ng blokcheynda tekshirish uchun <b>🔍 LTC Tranzaksiyani tekshirish</b> tugmasini bosing!"
        }[lang]

        await callback.message.answer(order_checkout_txt, reply_markup=keyboard)

    # ── Automatic LTC Blockchain Transaction Verification & Admin Email Handler ─
    elif data.startswith("check_tx_"):
        order_code = data.replace("check_tx_", "")
        order_info = ACTIVE_ORDERS.get(order_code)
        
        min_time = order_info['created_at'] if order_info else (time.time() - 900)

        checking_msg = {
            "ru": "🔎 <b>Проверка сети Litecoin... Пожалуйста, подождите.</b>",
            "en": "🔎 <b>Checking Litecoin network... Please wait.</b>",
            "uz": "🔎 <b>Litecoin tarmog'i tekshirilmoqda... Iltimos kuting.</b>"
        }[lang]
        await callback.message.answer(checking_msg)
        
        new_tx = await check_new_ltc_transaction(get_ltc_address(), min_time)
        
        if new_tx:
            PROCESSED_TX_HASHES.add(new_tx['hash'])
            
            if order_info and 'pack_key' in order_info:
                pk = order_info['pack_key']
                if pk in INVENTORY_STOCKS and INVENTORY_STOCKS[pk] > 0:
                    INVENTORY_STOCKS[pk] -= 1

            user_meta = order_info.get('user_data', {'id': user_id, 'username': callback.from_user.username, 'lang': lang}) if order_info else {'id': user_id, 'username': callback.from_user.username, 'lang': lang}
            qty_val = order_info.get('qty', 'N/A') if order_info else 'N/A'
            price_val = order_info.get('price', 'N/A') if order_info else 'N/A'
            order_district = order_info.get('district', 'Чиланзор') if order_info else 'Чиланзор'
            
            if not order_info:
                d_item = next((d for d in get_districts() if d.get("name") == order_district), None)
                def_coords = d_item.get("coords") if d_item else "41.2721, 69.2045"
                p_name = get_product_name()
                ltc_amt = float(new_tx.get('amount_ltc', 0.406))
                approx_usd = round(ltc_amt * 65.0, 2)
                if approx_usd < 10:
                    approx_usd = 25.0

                order_info = {
                    'id': order_code,
                    'user_id': user_id,
                    'user_data': user_meta,
                    'created_at': time.time(),
                    'product': p_name,
                    'qty': qty_val if qty_val != 'N/A' else '2 штук',
                    'price': f"{int(approx_usd)}$",
                    'total_amount': approx_usd,
                    'currency': 'USD',
                    'district': order_district,
                    'location': f"Ташкент, {order_district} (Координаты выдаются после подтверждения оплаты)",
                    'coordinates': def_coords,
                    'status': 'paid',
                    'pickup_status': 'paid_preparing',
                    'tracking_code': f"DRGX-TRK-{order_code[-4:]}",
                    'notes': f"Оплачено в блокчейне LTC ({new_tx.get('amount_ltc')} LTC)",
                    'tx_info': new_tx,
                    'updated_at': time.time()
                }
                ACTIVE_ORDERS[order_code] = order_info
            else:
                order_info['status'] = 'paid'
                order_info['pickup_status'] = 'paid_preparing'
                order_info['tx_info'] = new_tx
                order_info['updated_at'] = time.time()

            save_orders()

            asyncio.create_task(notify_admin_email(
                order_code=order_code,
                user_info=user_meta,
                qty=qty_val,
                price=price_val,
                tx_info=new_tx,
                district=order_district
            ))

            btn_get  = {"ru": "💬 Написать оператору для получения", "en": "💬 Message Operator for Pickup", "uz": "💬 Olish uchun operatorga yozish"}[lang]
            btn_home = {"ru": "🔙 Главное меню",                       "en": "🔙 Main Menu",                    "uz": "🔙 Asosiy menyu"}[lang]

            keyboard = InlineKeyboardMarkup(inline_keyboard=[
                [InlineKeyboardButton(text=btn_get,  url=get_support_url())],
                [InlineKeyboardButton(text=btn_home, callback_data="home")]
            ])

            success_txt = {
                "ru": "✅ <b>Новая транзакция обнаружена в блокчейне Litecoin!</b>\n\n"
                      f"🔑 <b>Код заказа:</b> <code>{order_code}</code>\n"
                      f"📊 <b>Статус:</b> Подтверждено ({new_tx['confirmations']} конф.)\n"
                      f"💰 <b>Получено:</b> {new_tx['amount_ltc']} LTC\n"
                      f"🔗 <b>TxID хэш:</b>\n<code>{new_tx['hash']}</code>\n\n"
                      "🎉 <b>Заказ успешно оплачен! Детали отправлены администратору на почту.</b>\n"
                      f"Нажмите кнопку ниже, чтобы связаться с оператором и получить детали выдачи в районе <b>{order_district}</b>.",
                "en": "✅ <b>New Transaction Detected on Litecoin Blockchain!</b>\n\n"
                      f"🔑 <b>Order Code:</b> <code>{order_code}</code>\n"
                      f"📊 <b>Status:</b> Confirmed ({new_tx['confirmations']} confs)\n"
                      f"💰 <b>Received:</b> {new_tx['amount_ltc']} LTC\n"
                      f"🔗 <b>TxID Hash:</b>\n<code>{new_tx['hash']}</code>\n\n"
                      "🎉 <b>Order successfully paid! Details sent to admin.</b>\n"
                      f"Click the button below to contact the operator and receive pickup/delivery details in <b>{order_district}</b>.",
                "uz": "✅ <b>Litecoin blokcheynida yangi tranzaksiya topildi!</b>\n\n"
                      f"🔑 <b>Buyurtma kodi:</b> <code>{order_code}</code>\n"
                      f"📊 <b>Holat:</b> Tasdiqlandi ({new_tx['confirmations']} tasdiq)\n"
                      f"💰 <b>Qabul qilindi:</b> {new_tx['amount_ltc']} LTC\n"
                      f"🔗 <b>TxID hesh:</b>\n<code>{new_tx['hash']}</code>\n\n"
                      "🎉 <b>Buyurtma muvaffaqiyatli to'landi!</b>\n"
                      f"<b>{order_district}</b> tumanida olish uchun operator bilan bog'laning."
            }[lang]

            await callback.message.answer(success_txt, reply_markup=keyboard)
        else:
            btn_retry = {"ru": "🔄 Проверить еще раз",                 "en": "🔄 Check Again",      "uz": "🔄 Qayta tekshirish"}[lang]
            btn_ex1   = {"ru": "🔄 Обменник 1",                        "en": "🔄 Exchanger 1",      "uz": "🔄 Ayirboshlash 1"}[lang]
            btn_ex2   = {"ru": "🔄 Обменник 2",                        "en": "🔄 Exchanger 2",      "uz": "🔄 Ayirboshlash 2"}[lang]
            btn_op    = {"ru": "💬 Связаться с оператором напрямую", "en": "💬 Contact Operator", "uz": "💬 Operator bilan bog'lanish"}[lang]
            btn_home  = {"ru": "🔙 Главное меню",                      "en": "🔙 Main Menu",        "uz": "🔙 Asosiy menyu"}[lang]

            ltc_addr = get_ltc_address()
            keyboard = InlineKeyboardMarkup(inline_keyboard=[
                [InlineKeyboardButton(text=btn_retry, callback_data=data)],
                [
                    InlineKeyboardButton(text=btn_ex1, url=get_exchanger_1()),
                    InlineKeyboardButton(text=btn_ex2, url=get_exchanger_2())
                ],
                [InlineKeyboardButton(text=btn_op,    url=get_support_url())],
                [InlineKeyboardButton(text=btn_home,  callback_data="home")]
            ])

            pending_txt = {
                "ru": "⏳ <b>Новая транзакция пока не найдена в сети Litecoin.</b>\n\n"
                      f"🔑 <b>Код заказа:</b> <code>{order_code}</code>\n"
                      "💳 <b>Адрес для оплаты LTC:</b> (нажмите, чтобы открыть)\n"
                      f"<tg-spoiler>{ltc_addr}</tg-spoiler>\n\n"
                      "💡 <i>Примечание: Проверяются только НОВЫЕ переводы, сделанные после оформления заказа. Если вы только что перевели средства, нажмите «Проверить еще раз» через 1–2 минуты.</i>",
                "en": "⏳ <b>New transaction not found on Litecoin network yet.</b>\n\n"
                      f"🔑 <b>Order Code:</b> <code>{order_code}</code>\n"
                      "💳 <b>LTC Payment Address:</b> (tap to reveal)\n"
                      f"<tg-spoiler>{ltc_addr}</tg-spoiler>\n\n"
                      "💡 <i>Note: Only NEW transfers sent after order creation are verified. If you just sent funds, click \"Check Again\" in 1–2 minutes.</i>",
                "uz": "⏳ <b>Litecoin tarmog'ida hali yangi tranzaksiya topilmadi.</b>\n\n"
                      f"🔑 <b>Buyurtma kodi:</b> <code>{order_code}</code>\n"
                      "💳 <b>LTC To'lov manzili:</b> (ko'rish uchun bosing)\n"
                      f"<tg-spoiler>{ltc_addr}</tg-spoiler>\n\n"
                      "💡 <i>Eslatma: Faqat buyurtma yaratilgandan so'ng yuborilgan YANGI o'tkazmalar tekshiriladi. 1–2 daqiqadan so'ng qayta urinib ko'ring.</i>"
            }[lang]

            await callback.message.answer(pending_txt, reply_markup=keyboard)

    # ── Fallback ──────────────────────────────────────────────────────────────
    else:
        await callback.message.answer("❓ Unknown command / Неизвестный раздел.", reply_markup=back_home(lang))


@dp.message()
async def generic_message_handler(message: Message):
    user_id = message.from_user.id
    KNOWN_USER_IDS.add(user_id)
    lang = USER_LANGUAGES.setdefault(user_id, "ru")

    if is_maintenance_mode():
        m_txt = BOT_CONFIG.get("maintenance_text", "⚠️ Бот временно находится на техническом обслуживании.")
        kb = InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text="💬 Связаться с оператором", url=get_support_url())]
        ])
        await message.answer(m_txt, reply_markup=kb)
        return

    if not USER_CAPTCHAS.get(user_id, {}).get('verified', False):
        prompt, kb = generate_captcha(user_id, lang)
        await message.answer(
            f"🐉 <b>Welcome to DRAGON-X!</b>\n\n{prompt}",
            reply_markup=kb
        )
    else:
        await message.answer(
            "🐉 <b>DRAGON-X</b>\n\n"
            "Выберите нужный раздел в меню ниже / Select a section from the menu below:",
            reply_markup=home_keyboard(lang)
        )


# ── Commands: /track & /orders ───────────────────────────────────────────────

@dp.message(Command("track"))
@dp.message(Command("orders"))
async def track_orders_command(message: Message):
    user_id = message.from_user.id
    lang = USER_LANGUAGES.get(user_id, "ru")
    user_orders = [o for o in ACTIVE_ORDERS.values() if o.get('user_id') == user_id]
    if not user_orders:
        btn_buy  = {"ru": "🛍 В каталог товаров",  "en": "🛍 Browse Catalog",   "uz": "🛍 Mahsulotlar katalogi"}[lang]
        kb = InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text=btn_buy, callback_data="catalog")],
            [InlineKeyboardButton(text="🔙 Главное меню", callback_data="home")]
        ])
        await message.answer(
            "📋 <b>У вас пока нет активных заказов.</b>\n\nОформите заказ в каталоге, чтобы отслеживать статус и локацию выдачи!",
            reply_markup=kb
        )
        return

    user_orders.sort(key=lambda x: x.get('created_at', 0), reverse=True)
    msg_parts = ["📦 <b>Ваши заказы и координаты выдачи (DRAGON-X):</b>\n"]
    for o in user_orders[:4]:
        oid = o.get('id', 'N/A')
        status = o.get('status', 'pending')
        qty_val = o.get('qty', '2 штук')
        price_val = o.get('price', '25$')
        dist_val = o.get('district', 'Чиланзор')
        coords_val = o.get('coordinates', '')
        loc_val = o.get('location', '')

        if status == 'picked_up':
            status_badge = "✅ <b>ЗАБРАН (Picked Up)</b>"
            status_desc = "🎉 <i>Выдача завершена. Заказ успешно получен!</i>"
        elif status == 'drop_ready':
            status_badge = "📍 <b>ГОТОВ К ВЫДАЧЕ (Локация выдана)</b>"
            status_desc = f"🧭 GPS: <code>{coords_val}</code>\n📌 Тайник: {loc_val}"
            if coords_val:
                status_desc += f"\n🗺 <a href='https://maps.google.com/?q={coords_val}'>Открыть карту</a>"
        elif status == 'paid':
            status_badge = "💳 <b>ОПЛАЧЕН (LTC подтвержден)</b>"
            status_desc = f"Курьер готовит тайник в районе {dist_val}."
        else:
            status_badge = "⏳ <b>ОЖИДАЕТ ОПЛАТЫ LTC</b>"
            status_desc = "Ожидание транзакции в блокчейне."

        msg_parts.append(
            f"────────────────────────\n"
            f"🔑 <b>Заказ:</b> <code>{oid}</code>\n"
            f"💊 Товар: <b>Рега</b> ({qty_val}) — <b>{price_val}</b>\n"
            f"📍 Район: <b>{dist_val}</b>\n"
            f"📊 Статус: {status_badge}\n"
            f"{status_desc}\n"
        )

    kb = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="🔄 Обновить статус", callback_data="orders_refresh")],
        [InlineKeyboardButton(text="💬 Написать оператору", url=SUPPORT_URL)],
        [InlineKeyboardButton(text="🔙 Главное меню", callback_data="home")]
    ])
    await message.answer("\n".join(msg_parts), reply_markup=kb, disable_web_page_preview=True)


# ── REST API with CORS for Real-Time Admin Synchronization ───────────────────

def cors_response(data=None, text=None, status=200):
    headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS, PUT, PATCH, DELETE",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With"
    }
    if text is not None:
        return web.Response(text=text, status=status, headers=headers)
    return web.json_response(data if data is not None else {}, status=status, headers=headers)


async def options_handler(request):
    return cors_response(text="", status=204)


async def health_check(request):
    username = await get_bot_username()
    return cors_response({
        "status": "ok",
        "bot": f"@{username}",
        "version": "2026.10.13-master",
        "orders_count": len(ACTIVE_ORDERS),
        "server_time": time.time(),
        "message": "Dragon-X Bot & Real-Time Dispatch Gateway is running 🐉"
    })


async def get_orders_api(request):
    if db_pool:
        try:
            await db_refresh_orders()
        except Exception:
            pass
    orders_list = []
    for oid, o in sorted(ACTIVE_ORDERS.items(), key=lambda x: x[1].get('created_at', 0), reverse=True):
        user_meta = o.get('user_data', {}) if isinstance(o.get('user_data'), dict) else {}
        username = user_meta.get('username') or o.get('username') or ''
        tg_handle = f"@{username}" if username and not username.startswith('@') else (username or '—')
        first_name = user_meta.get('first_name', '')
        last_name = user_meta.get('last_name', '')
        customer_name = f"{first_name} {last_name}".strip() or tg_handle or f"Клиент {o.get('user_id', '')}"

        qty_str = o.get('qty', '2 штук')
        price_str = o.get('price', '25$')
        total_amount = o.get('total_amount')
        if total_amount is None:
            try:
                total_amount = float(str(price_str).replace('$', '').strip())
            except Exception:
                total_amount = 25.0

        created_ts = o.get('created_at', time.time())
        created_iso = datetime.datetime.fromtimestamp(created_ts, datetime.timezone.utc).isoformat()

        orders_list.append({
            "id": oid,
            "createdAt": created_iso,
            "createdTimestamp": created_ts,
            "customerId": f"DRGX-{o.get('user_id', 'VIP')}",
            "userId": o.get('user_id'),
            "customerName": customer_name,
            "telegram": tg_handle,
            "product": o.get('product', 'Рега'),
            "qty": qty_str,
            "items": [
                {
                    "name": o.get('product', 'Рега'),
                    "packCount": qty_str,
                    "quantity": 1,
                    "unitPriceBase": total_amount
                }
            ],
            "totalPacks": 1,
            "totalAmount": total_amount,
            "currency": "USD",
            "district": o.get('district', 'Чиланзор'),
            "deliveryLocation": o.get('location') or f"Ташкент, {o.get('district', 'Чиланзор')}",
            "coordinates": o.get('coordinates', '41.2721, 69.2045'),
            "status": o.get('status', 'pending'),
            "pickupStatus": o.get('pickup_status', 'waiting'),
            "pickedUpAt": o.get('picked_up_at'),
            "trackingCode": o.get('tracking_code', f"DRGX-TRK-{oid[-4:]}"),
            "notes": o.get('notes', ''),
            "txHash": o.get('tx_info', {}).get('hash', '') if isinstance(o.get('tx_info'), dict) else ''
        })
    return cors_response(orders_list)


async def create_order_api(request):
    try:
        data = await request.json()
        order_id = data.get('id') or f"DRGX-ADM-{random.randint(1000, 9999)}"
        district = data.get('district') or 'Чиланзор'
        def_coords = "41.2721, 69.2045" if "Чиланзор" in district else ("41.2985, 69.3241" if "Яшнабад" in district else "41.3412, 69.4520")

        qty = data.get('qty', '2 штук')
        total_amount = float(data.get('totalAmount') or data.get('price') or 25.0)

        order_record = {
            'id': order_id,
            'user_id': data.get('userId') or random.randint(10000000, 99999999),
            'user_data': {
                'username': (data.get('telegram') or '').replace('@', ''),
                'first_name': data.get('customerName') or 'Клиент',
                'lang': 'ru'
            },
            'created_at': time.time(),
            'product': data.get('product') or 'Рега',
            'qty': qty,
            'price': f"{int(total_amount)}$",
            'total_amount': total_amount,
            'currency': 'USD',
            'district': district,
            'location': data.get('location') or data.get('deliveryLocation') or f"Ташкент, {district}",
            'coordinates': data.get('coordinates') or def_coords,
            'status': data.get('status') or 'paid',
            'pickup_status': 'ready' if data.get('status') == 'drop_ready' else 'waiting',
            'tracking_code': data.get('trackingCode') or f"DRGX-TRK-{random.randint(1000, 9999)}",
            'notes': data.get('notes') or 'Создан через панель оператора',
            'updated_at': time.time()
        }
        ACTIVE_ORDERS[order_id] = order_record
        save_orders()
        return cors_response({"status": "success", "order": order_record})
    except Exception as e:
        return cors_response({"status": "error", "message": str(e)}, status=400)


async def update_order_api(request):
    try:
        data = await request.json()
        order_id = data.get('id')
        if not order_id or order_id not in ACTIVE_ORDERS:
            return cors_response({"status": "error", "message": f"Order {order_id} not found"}, status=404)

        order = ACTIVE_ORDERS[order_id]
        
        if 'status' in data:
            order['status'] = data['status']
            if data['status'] == 'picked_up' and not order.get('picked_up_at'):
                order['picked_up_at'] = time.time()
                order['pickup_status'] = 'picked_up'
            elif data['status'] == 'drop_ready':
                order['pickup_status'] = 'ready'

        if 'location' in data:
            order['location'] = data['location']
        if 'deliveryLocation' in data:
            order['location'] = data['deliveryLocation']
        if 'coordinates' in data:
            order['coordinates'] = data['coordinates']
        if 'district' in data:
            order['district'] = data['district']
        if 'notes' in data:
            order['notes'] = data['notes']
        if 'trackingCode' in data:
            order['tracking_code'] = data['trackingCode']
        if 'totalAmount' in data:
            try:
                order['total_amount'] = float(data['totalAmount'])
                order['price'] = f"{int(order['total_amount'])}$"
            except Exception:
                pass
        if 'qty' in data:
            order['qty'] = data['qty']

        order['updated_at'] = time.time()
        save_orders()

        # Send Telegram Notification to user if requested
        notify_requested = data.get('notifyCustomer', False)
        user_id = order.get('user_id')

        if notify_requested and user_id:
            try:
                status_val = order.get('status')
                if status_val == 'picked_up':
                    msg_text = (
                        f"🎉 <b>Заказ {order_id} отмечен как ЗАБРАН (Picked Up)!</b>\n\n"
                        f"💊 <b>Товар:</b> Рега ({order.get('qty', '')})\n"
                        f"📍 <b>Район:</b> {order.get('district', '')}\n\n"
                        "✅ Спасибо за покупку в <b>DRAGON-X</b>! Будем рады вашему отзыву.\n"
                        f"💬 Контакт оператора: {SUPPORT_HANDLE}"
                    )
                elif status_val == 'drop_ready':
                    coords = order.get('coordinates', '')
                    map_link = f"https://maps.google.com/?q={coords}" if coords else ""
                    msg_text = (
                        f"📍 <b>Локация и координаты для заказа {order_id} готовы:</b>\n\n"
                        f"🏘 <b>Район:</b> {order.get('district', '')}\n"
                        f"🧭 <b>GPS Координаты:</b> <code>{coords}</code>\n"
                        f"📌 <b>Ориентир / Тайник:</b> {order.get('location', '')}\n"
                        + (f"🗺 <b>Ссылка на карту:</b> {map_link}\n\n" if map_link else "\n")
                        + "💡 <i>После того как заберете заказ, статус будет обновлен на «Забран» (Picked Up).</i>"
                    )
                else:
                    msg_text = (
                        f"📦 <b>Обновление по заказу {order_id}:</b>\n\n"
                        f"Статус: <b>{status_val}</b>\n"
                        f"Детали: {order.get('location', '')}\n"
                        f"💬 Поддержка: {SUPPORT_HANDLE}"
                    )
                await bot.send_message(chat_id=user_id, text=msg_text)
                logging.info(f"Dispatched Telegram update to user {user_id} for {order_id}")
            except Exception as tg_err:
                logging.warning(f"Could not dispatch Telegram update to {user_id}: {tg_err}")

        return cors_response({"status": "success", "order": order})
    except Exception as e:
        return cors_response({"status": "error", "message": str(e)}, status=400)


async def pickup_order_api(request):
    try:
        data = await request.json()
        order_id = data.get('id')
        if not order_id or order_id not in ACTIVE_ORDERS:
            return cors_response({"status": "error", "message": f"Order {order_id} not found"}, status=404)

        order = ACTIVE_ORDERS[order_id]
        order['status'] = 'picked_up'
        order['pickup_status'] = 'picked_up'
        order['picked_up_at'] = time.time()
        order['updated_at'] = time.time()
        if data.get('notes'):
            order['notes'] = data['notes']
        save_orders()

        # Notify Customer in Telegram
        user_id = order.get('user_id')
        if data.get('notifyCustomer', True) and user_id:
            try:
                msg_text = (
                    f"✅ <b>Заказ {order_id} успешно ЗАБРАН (Picked Up)!</b>\n\n"
                    f"💊 <b>Товар:</b> Рега ({order.get('qty', '')})\n"
                    f"📍 <b>Район:</b> {order.get('district', '')}\n\n"
                    "Выдача полностью завершена. Спасибо, что доверяете DRAGON-X!\n"
                    f"💬 Оператор: {SUPPORT_HANDLE}"
                )
                await bot.send_message(chat_id=user_id, text=msg_text)
            except Exception as tg_err:
                logging.warning(f"Could not notify user {user_id} of pickup: {tg_err}")

        return cors_response({"status": "success", "order": order})
    except Exception as e:
        return cors_response({"status": "error", "message": str(e)}, status=400)


async def delete_order_api(request):
    try:
        data = await request.json()
        order_id = data.get('id')
        if order_id in ACTIVE_ORDERS:
            del ACTIVE_ORDERS[order_id]
            save_orders()
            if db_pool:
                asyncio.create_task(db_delete_order(order_id))
            return cors_response({"status": "success"})
        return cors_response({"status": "not_found"}, status=404)
    except Exception as e:
        return cors_response({"status": "error", "message": str(e)}, status=400)


async def get_stats_api(request):
    total_orders = len(ACTIVE_ORDERS)
    total_revenue = sum(o.get('total_amount', 0) for o in ACTIVE_ORDERS.values())
    active_del = sum(1 for o in ACTIVE_ORDERS.values() if o.get('status') in ['paid', 'drop_ready'])
    picked_up = sum(1 for o in ACTIVE_ORDERS.values() if o.get('status') == 'picked_up')
    unique_users = len(set(o.get('user_id') for o in ACTIVE_ORDERS.values() if o.get('user_id')))
    username = await get_bot_username()
    return cors_response({
        "status": "success",
        "botUsername": f"@{username}",
        "totalOrders": total_orders,
        "totalRevenue": round(total_revenue, 2),
        "activeDelivery": active_del,
        "pickedUpCount": picked_up,
        "totalClients": unique_users,
        "stocks": INVENTORY_STOCKS,
        "serverTime": time.time()
    })


async def get_stock_api(request):
    return cors_response(INVENTORY_STOCKS)


async def update_stock_api(request):
    try:
        data = await request.json()
        if isinstance(data, dict):
            INVENTORY_STOCKS.update(data)
            logging.info(f"Updated inventory stocks via Admin API: {INVENTORY_STOCKS}")
            return cors_response({"status": "success", "stocks": INVENTORY_STOCKS})
    except Exception as e:
        return cors_response({"status": "error", "message": str(e)}, status=400)
    return cors_response({"status": "invalid payload"}, status=400)


async def get_config_api(request):
    return cors_response({
        "status": "success",
        "config": BOT_CONFIG,
        "stocks": INVENTORY_STOCKS,
        "active_districts_count": len(get_districts()),
        "active_packages_count": len(get_packages()),
        "known_users_count": len(KNOWN_USER_IDS)
    })


async def update_config_api(request):
    try:
        data = await request.json()
        if not isinstance(data, dict):
            return cors_response({"status": "error", "message": "Payload must be a JSON object"}, status=400)

        # Dynamic fields update
        if "product_name" in data and data["product_name"]:
            BOT_CONFIG["product_name"] = str(data["product_name"]).strip()
        if "support_handle" in data and data["support_handle"]:
            handle = str(data["support_handle"]).strip()
            if not handle.startswith("@"):
                handle = f"@{handle}"
            BOT_CONFIG["support_handle"] = handle
            BOT_CONFIG["support_url"] = f"https://t.me/{handle.replace('@','')}"
        if "support_url" in data and data["support_url"]:
            BOT_CONFIG["support_url"] = str(data["support_url"]).strip()
        if "ltc_address" in data and data["ltc_address"]:
            BOT_CONFIG["ltc_address"] = str(data["ltc_address"]).strip()
        if "exchanger_1_url" in data and data["exchanger_1_url"]:
            BOT_CONFIG["exchanger_1_url"] = str(data["exchanger_1_url"]).strip()
        if "exchanger_2_url" in data and data["exchanger_2_url"]:
            BOT_CONFIG["exchanger_2_url"] = str(data["exchanger_2_url"]).strip()
        if "website_url" in data and data["website_url"]:
            BOT_CONFIG["website_url"] = str(data["website_url"]).strip()
        if "reviews_url" in data and data["reviews_url"]:
            BOT_CONFIG["reviews_url"] = str(data["reviews_url"]).strip()
        if "maintenance_mode" in data:
            BOT_CONFIG["maintenance_mode"] = bool(data["maintenance_mode"])
        if "maintenance_text" in data and data["maintenance_text"]:
            BOT_CONFIG["maintenance_text"] = str(data["maintenance_text"]).strip()
        if "districts" in data and isinstance(data["districts"], list):
            BOT_CONFIG["districts"] = data["districts"]
        if "packages" in data and isinstance(data["packages"], list):
            BOT_CONFIG["packages"] = data["packages"]
            for pkg in data["packages"]:
                k = pkg.get("key")
                if k and "stock" in pkg:
                    try:
                        INVENTORY_STOCKS[k] = int(pkg["stock"])
                    except Exception:
                        pass
        if "stocks" in data and isinstance(data["stocks"], dict):
            INVENTORY_STOCKS.update(data["stocks"])

        save_bot_config()
        logging.info(f"Bot config updated live via Admin Panel API: product={BOT_CONFIG.get('product_name')}, LTC={BOT_CONFIG.get('ltc_address')}")
        return cors_response({"status": "success", "config": BOT_CONFIG, "stocks": INVENTORY_STOCKS})
    except Exception as e:
        return cors_response({"status": "error", "message": str(e)}, status=400)


async def broadcast_api(request):
    try:
        data = await request.json()
        text = (data.get("message") or "").strip()
        if not text:
            return cors_response({"status": "error", "message": "Message text is required"}, status=400)

        # Collect target user IDs
        target_users = set(KNOWN_USER_IDS)
        for o in ACTIVE_ORDERS.values():
            uid = o.get("user_id")
            if uid:
                target_users.add(uid)

        sent = 0
        failed = 0
        for uid in target_users:
            try:
                await bot.send_message(chat_id=uid, text=text)
                sent += 1
                await asyncio.sleep(0.04)
            except Exception as e:
                logging.warning(f"Broadcast failed for user {uid}: {e}")
                failed += 1

        return cors_response({
            "status": "success",
            "total_recipients": len(target_users),
            "sent_count": sent,
            "failed_count": failed
        })
    except Exception as e:
        return cors_response({"status": "error", "message": str(e)}, status=400)


async def run_web_server():
    port = int(os.getenv("PORT", 10000))
    app  = web.Application()
    
    # Preflight CORS Handler
    app.router.add_route("OPTIONS", "/{tail:.*}", options_handler)
    
    # REST API Routes
    app.router.add_get("/", health_check)
    app.router.add_get("/api/ping", health_check)
    app.router.add_get("/api/health", health_check)
    app.router.add_get("/api/config", get_config_api)
    app.router.add_post("/api/config", update_config_api)
    app.router.add_post("/api/broadcast", broadcast_api)
    app.router.add_get("/api/orders", get_orders_api)
    app.router.add_post("/api/orders", create_order_api)
    app.router.add_post("/api/orders/update", update_order_api)
    app.router.add_post("/api/orders/pickup", pickup_order_api)
    app.router.add_post("/api/orders/delete", delete_order_api)
    app.router.add_get("/api/stats", get_stats_api)
    app.router.add_get("/api/stock", get_stock_api)
    app.router.add_post("/api/stock", update_stock_api)
    
    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, "0.0.0.0", port)
    await site.start()
    logging.info(f"Health-check & REST API server running on port {port}")


# ── Main: resilient polling & Web server runner ───────────────────────────────

async def main():
    await bot.delete_webhook(drop_pending_updates=True)
    logging.info("Webhook deleted. Fetching bot username...")
    username = await get_bot_username()
    logging.info(f"Bot info loaded: @{username}")

    # Load dynamic bot config & persistent orders
    load_bot_config()
    load_orders()

    # Connect to Neon PostgreSQL & sync persistent cloud database
    await init_neon_db()

    await init_historical_txs(get_ltc_address())

    # Run Web Server in background
    asyncio.create_task(run_web_server())

    # Resilient Polling Loop (Anti-Crash Guard)
    while True:
        try:
            logging.info("Starting bot polling...")
            await dp.start_polling(bot, handle_signals=False)
        except Exception as e:
            logging.error(f"Bot polling exception encountered: {e}. Retrying in 2 seconds...")
            await asyncio.sleep(2)


if __name__ == "__main__":
    asyncio.run(main())