import os
import random
import time
import datetime
import asyncio
import logging
import smtplib
from email.message import EmailMessage
from html import escape
import aiohttp
from aiohttp import web
from aiogram import Bot, Dispatcher
from aiogram.client.default import DefaultBotProperties
from aiogram.filters import CommandStart
from aiogram.types import Message, InlineKeyboardMarkup, InlineKeyboardButton, CallbackQuery
from aiogram.enums import ParseMode

logging.basicConfig(level=logging.INFO)

# ── Config ───────────────────────────────────────────────────────────────────
TOKEN        = os.getenv("BOT_TOKEN")
SUPPORT_HANDLE = "@Dgx464"
SUPPORT_URL   = "https://t.me/Dgx464"
WEBSITE_URL   = os.getenv("WEBSITE_URL", "")
REVIEWS_URL   = os.getenv("REVIEWS_URL", WEBSITE_URL)
CONVERTER_URL  = "https://t.me/Eva_obmen"
LTC_ADDRESS  = "ltc1qr5xhqe9tdd5lekrxurfftdv9hhaaqche2urvhr"
ADMIN_EMAIL  = "ydvhrsh1604@gmail.com"

# SMTP Config for sending notification emails (optional, uses fallback logging if unconfigured)
SMTP_SERVER  = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT    = int(os.getenv("SMTP_PORT", 587))
SMTP_USER    = os.getenv("SMTP_USER", "")
SMTP_PASS    = os.getenv("SMTP_PASS", "")

if not TOKEN:
    raise ValueError("BOT_TOKEN environment variable is not set! Set it in Render → Environment.")

bot = Bot(token=TOKEN, default=DefaultBotProperties(parse_mode=ParseMode.HTML))
dp  = Dispatcher()

bot_info_cache = None
ACTIVE_ORDERS = {}          # { order_code: {'user_id': int, 'created_at': float, 'qty': str, 'price': str, 'pack_key': str} }
PROCESSED_TX_HASHES = set()
USER_LANGUAGES = {}         # { user_id: 'ru' | 'en' | 'uz' }
USER_CAPTCHAS = {}          # { user_id: {'ans': int, 'verified': bool} }

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


async def get_bot_username() -> str:
    global bot_info_cache
    if not bot_info_cache:
        try:
            bot_info_cache = await bot.get_me()
        except Exception as e:
            logging.error(f"Failed to fetch bot info: {e}")
    if bot_info_cache and bot_info_cache.username:
        return bot_info_cache.username
    return os.getenv("BOT_USERNAME", "") or "DragonX_Bot"


async def init_historical_txs(address: str):
    """
    Loads pre-existing historical transaction hashes into PROCESSED_TX_HASHES
    on startup so old transactions are never matched against new orders.
    """
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
    """
    Queries Litecoin blockchain API for a NEW, UNPROCESSED incoming transaction
    received AFTER min_timestamp.
    """
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
    """
    Non-blocking email dispatch helper function.
    Sends notification to ydvhrsh1604@gmail.com
    """
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


async def notify_admin_email(order_code: str, user_info: dict, qty: str, price: str, tx_info: dict):
    subject = f"🐉 [NEW PAID ORDER] Dragon-X Order {order_code} ({price})"
    body = (
        f"=== SUCCESSFUL TRANSACTION CONFIRMED ===\n"
        f"Order ID: {order_code}\n"
        f"Timestamp: {datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}\n\n"
        f"USER DETAILS:\n"
        f"- Telegram ID: {user_info.get('id')}\n"
        f"- Username: @{user_info.get('username', 'N/A')}\n"
        f"- Full Name: {user_info.get('first_name', '')} {user_info.get('last_name', '')}\n"
        f"- Selected Language: {user_info.get('lang', 'ru')}\n\n"
        f"ORDER DETAILS:\n"
        f"- Product: Прегабалин (Pregabalin)\n"
        f"- Volume: {qty}\n"
        f"- Price: {price}\n"
        f"- Region: Ташкент\n"
        f"- District: Мирабад\n\n"
        f"TRANSACTION DETAILS:\n"
        f"- Network: Litecoin (LTC)\n"
        f"- Wallet: {LTC_ADDRESS}\n"
        f"- TxID Hash: {tx_info.get('hash')}\n"
        f"- Amount Received: {tx_info.get('amount_ltc')} LTC\n"
        f"- Confirmations: {tx_info.get('confirmations')}\n\n"
        f"REFERRAL REWARD:\n"
        f"- 2% cashback credited to referrer balance.\n"
    )
    await asyncio.to_thread(send_email_in_thread, subject, body)


# ── Keyboards & Multi-Language UI ─────────────────────────────────────────────

def language_keyboard():
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="🇷🇺 Русский",   callback_data="setlang_ru")],
        [InlineKeyboardButton(text="🇬🇧 English",   callback_data="setlang_en")],
        [InlineKeyboardButton(text="🇺🇿 O'zbekcha", callback_data="setlang_uz")]
    ])


def home_keyboard(lang="ru"):
    txt_catalog = {"ru": "🛍 Купить товар", "en": "🛍 Buy Products", "uz": "🛍 Mahsulot sotib olish"}[lang]
    txt_support = {"ru": "💬 Поддержка",    "en": "💬 Support",      "uz": "💬 Qo'llab-quvvatlash"}[lang]
    txt_rules   = {"ru": "📜 Правила",      "en": "📜 Rules",        "uz": "📜 Qoidalar"}[lang]
    txt_ref     = {"ru": "👥 Пригласить друга", "en": "👥 Invite Friend", "uz": "👥 Do'stlarni taklif qilish"}[lang]
    txt_ex      = {"ru": "🔄 Наш обмен",    "en": "🔄 Exchanger",    "uz": "🔄 Almashtirish"}[lang]
    txt_site    = {"ru": "🌐 Наш сайт",     "en": "🌐 Website",      "uz": "🌐 Bizning sayt"}[lang]
    txt_rev     = {"ru": "⭐ Отзывы",       "en": "⭐ Reviews",      "uz": "⭐ Sharhlar"}[lang]

    rows = [
        [
            InlineKeyboardButton(text=txt_catalog, callback_data="catalog"),
            InlineKeyboardButton(text=txt_support, callback_data="support")
        ],
        [
            InlineKeyboardButton(text=txt_rules, callback_data="rules"),
            InlineKeyboardButton(text=txt_ref,   callback_data="referral")
        ],
        [
            InlineKeyboardButton(text=txt_ex,    url=CONVERTER_URL)
        ]
    ]
    if WEBSITE_URL:
        rows.insert(2, [InlineKeyboardButton(text=txt_site, url=WEBSITE_URL)])
    if REVIEWS_URL:
        rows.insert(3, [InlineKeyboardButton(text=txt_rev,  url=REVIEWS_URL)])
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
        await callback.message.answer(
            "🐉 <b>DRAGON-X</b> — Main Menu",
            reply_markup=home_keyboard(lang)
        )

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
        
        keyboard = InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text="🔗 Поделиться ссылкой", url=share_url)],
            [InlineKeyboardButton(text="💰 Мой баланс",         callback_data="my_balance")],
            [InlineKeyboardButton(text="📜 Условия программы",  callback_data="referral_terms")],
            [InlineKeyboardButton(text="🔙 Главное меню",       callback_data="home")]
        ])
        await callback.message.answer(
            "🎁 <b>Партнерская программа DRAGON-X (2% Кэшбэк)</b>\n\n"
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
            reply_markup=keyboard
        )

    # ── My Balance Handler ───────────────────────────────────────────────────
    elif data == "my_balance":
        keyboard = InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text="💬 Написать оператору", url=SUPPORT_URL)],
            [InlineKeyboardButton(text="👥 Пригласить друга",   callback_data="referral")],
            [InlineKeyboardButton(text="🔙 Главное меню",       callback_data="home")]
        ])
        await callback.message.answer(
            "💰 <b>Ваш финансовый баланс</b>\n\n"
            "💵 Доступно на балансе: <b>0.00 $</b>\n"
            "🎁 Заработано с рефералов (2%): <b>0.00 $</b>\n"
            "🛍 Совершено покупок: <b>0</b>\n\n"
            "💡 <i>Пополняйте баланс через партнерскую программу, приглашая друзей. 2% от всех их покупок начисляются вам автоматически!</i>",
            reply_markup=keyboard
        )

    # ── Referral Terms Handler ───────────────────────────────────────────────
    elif data == "referral_terms":
        keyboard = InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text="🔙 К реферальной программе", callback_data="referral")],
            [InlineKeyboardButton(text="🔙 Главное меню",             callback_data="home")]
        ])
        await callback.message.answer(
            "📜 <b>Условия партнерской программы DRAGON-X</b>\n\n"
            "1. <b>Вознаграждение 2%:</b> Вы получаете 2% от суммы любого заказа, совершенного пользователем, зарегистрированным по вашей ссылке.\n"
            "2. <b>Пожизненный доход:</b> Бонус 2% начисляется с каждого повторного заказа ваших рефералов без ограничений по времени.\n"
            "3. <b>Использование средств:</b> Баланс можно применить для получения скидки до 100% на товары DRAGON-X или вывести.\n"
            "4. <b>Честная игра:</b> Запрещена автоматическая накрутка аккаунтов. При нарушении баланс аннулируется.",
            reply_markup=keyboard
        )

    # ── Support ───────────────────────────────────────────────────────────────
    elif data == "support":
        keyboard = InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text="💬 Написать оператору", url=SUPPORT_URL)],
            [InlineKeyboardButton(text="📦 Оптовый запрос",      url=SUPPORT_URL)],
            [InlineKeyboardButton(text="🔙 Главное меню",        callback_data="home")]
        ])
        await callback.message.answer(
            "💬 <b>Поддержка DRAGON-X</b>\n\n"
            "Нажмите кнопку ниже, чтобы перейти к диалогу с оператором.\n"
            "Мы ответим как можно скорее.",
            reply_markup=keyboard
        )

    # ── Orders ────────────────────────────────────────────────────────────────
    elif data == "orders":
        await callback.message.answer(
            "📋 У вас пока нет заказов.",
            reply_markup=back_home(lang)
        )

    # ── Catalogue ────────────────────────────────────────────────────────────
    elif data == "catalog":
        keyboard = InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text="💊 Прегабалин", callback_data="category_medical")],
            [InlineKeyboardButton(text="🔙 Главное меню", callback_data="home")]
        ])
        await callback.message.answer(
            "🛍 <b>Каталог товаров DRAGON-X</b>\n\n"
            "Выберите препарат для заказа:",
            reply_markup=keyboard
        )

    # ── Product Selection -> Region Step ─────────────────────────────────────
    elif data == "category_medical":
        keyboard = InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text="📍 Выбрать регион", callback_data="select_region")],
            [InlineKeyboardButton(text="🔙 Каталог",          callback_data="catalog")]
        ])
        await callback.message.answer(
            "💊 <b>Прегабалин (Pregabalin)</b>\n\n"
            "Перейдите к выбору региона доставки и выдачи:",
            reply_markup=keyboard
        )

    # ── 3rd Page: Region Selection (Tashkent) ────────────────────────────────
    elif data == "select_region":
        keyboard = InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text="📍 Ташкент", callback_data="region_tashkent")],
            [InlineKeyboardButton(text="🔙 Назад",     callback_data="category_medical")]
        ])
        await callback.message.answer(
            "📍 <b>Выбор региона</b>\n\n"
            "Доступный регион для заказа:\n"
            "• <b>Ташкент</b>",
            reply_markup=keyboard
        )

    # ── Tashkent -> District Selection (Mirabad) ──────────────────────────────
    elif data == "region_tashkent":
        keyboard = InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text="📍 Мирабад", callback_data="district_mirabad")],
            [InlineKeyboardButton(text="🔙 К выбору региона", callback_data="select_region")],
            [InlineKeyboardButton(text="🔙 Главное меню",     callback_data="home")]
        ])
        await callback.message.answer(
            "📍 <b>Регион: Ташкент</b>\n\n"
            "🏘 <b>Выберите район:</b>\n"
            "• <b>Мирабад</b>",
            reply_markup=keyboard
        )

    # ── 4th Page: Price Section & Quantity Options with Stock Verification ───
    elif data == "district_mirabad" or data == "product_pregabalin":
        keyboard = InlineKeyboardMarkup(inline_keyboard=[
            [
                InlineKeyboardButton(text=f"2 шт — 25$ ({INVENTORY_STOCKS.get('buy_2', 0)} в наличии)",   callback_data="buy_2"),
                InlineKeyboardButton(text=f"3 шт — 35$ ({INVENTORY_STOCKS.get('buy_3', 0)} в наличии)",   callback_data="buy_3")
            ],
            [
                InlineKeyboardButton(text=f"5 шт — 55$ ({INVENTORY_STOCKS.get('buy_5', 0)} в наличии)",   callback_data="buy_5"),
                InlineKeyboardButton(text=f"10 шт — 108$ ({INVENTORY_STOCKS.get('buy_10', 0)} в наличии)", callback_data="buy_10")
            ],
            [
                InlineKeyboardButton(text=f"20 шт — 210$ ({INVENTORY_STOCKS.get('buy_20', 0)} в наличии)", callback_data="buy_20"),
                InlineKeyboardButton(text=f"50 шт — 510$ ({INVENTORY_STOCKS.get('buy_50', 0)} в наличии)", callback_data="buy_50")
            ],
            [
                InlineKeyboardButton(text=f"100 шт — 1000$ ({INVENTORY_STOCKS.get('buy_100', 0)} в наличии)", callback_data="buy_100")
            ],
            [
                InlineKeyboardButton(text="💬 Написать оператору", url=SUPPORT_URL)
            ],
            [
                InlineKeyboardButton(text="🔙 К выбору района", callback_data="region_tashkent"),
                InlineKeyboardButton(text="🔙 Главное меню",     callback_data="home")
            ]
        ])
        await callback.message.answer(
            "💊 <b>Прегабалин (Pregabalin)</b>\n"
            "📍 <b>Регион:</b> Ташкент\n"
            "🏘 <b>Район:</b> Мирабад\n\n"
            "💰 <b>Прайс-лист и остатки на сегодня:</b>\n"
            f"• 2 штук — <b>25$</b> [В наличии: {INVENTORY_STOCKS.get('buy_2', 0)}]\n"
            f"• 3 штук — <b>35$</b> [В наличии: {INVENTORY_STOCKS.get('buy_3', 0)}]\n"
            f"• 5 штук — <b>55$</b> [В наличии: {INVENTORY_STOCKS.get('buy_5', 0)}]\n"
            f"• 10 штук — <b>108$</b> [В наличии: {INVENTORY_STOCKS.get('buy_10', 0)}]\n"
            f"• 20 штук — <b>210$</b> [В наличии: {INVENTORY_STOCKS.get('buy_20', 0)}]\n"
            f"• 50 штук — <b>510$</b> [В наличии: {INVENTORY_STOCKS.get('buy_50', 0)}]\n"
            f"• 100 штук — <b>1000$</b> [В наличии: {INVENTORY_STOCKS.get('buy_100', 0)}]\n\n"
            "💳 <b>Оплата принимается на LTC адрес:</b>\n"
            f"<code>{LTC_ADDRESS}</code>\n\n"
            "👇 Выберите нужную фасовку для оформления заказа:",
            reply_markup=keyboard
        )

    # ── Order Confirmation with Stock Check & Unique Reference ID ─────────────
    elif data.startswith("buy_"):
        stock_count = INVENTORY_STOCKS.get(data, 0)
        if stock_count <= 0:
            keyboard = InlineKeyboardMarkup(inline_keyboard=[
                [InlineKeyboardButton(text="💬 Связаться с оператором", url=SUPPORT_URL)],
                [InlineKeyboardButton(text="🔙 К прайс-листу",        callback_data="district_mirabad")]
            ])
            await callback.message.answer(
                "❌ <b>Данный объем временно распродан на сегодня!</b>\n\n"
                "Администратор обновляет каталог каждое утро. Выберите другой объем или напишите оператору.",
                reply_markup=keyboard
            )
            return

        order_rand = random.randint(1000, 9999)
        unique_order_id = f"DRGX-{user_id}-{order_rand}"

        qty_map = {
            "buy_2":   ("2 штук", "25$"),
            "buy_3":   ("3 штук", "35$"),
            "buy_5":   ("5 штук", "55$"),
            "buy_10":  ("10 штук", "108$"),
            "buy_20":  ("20 штук", "210$"),
            "buy_50":  ("50 штук", "510$"),
            "buy_100": ("100 штук", "1000$"),
        }
        qty_info = qty_map.get(data, ("штук", "уточняйте"))
        
        ACTIVE_ORDERS[unique_order_id] = {
            'user_id': user_id,
            'user_data': {
                'id': user_id,
                'username': callback.from_user.username,
                'first_name': callback.from_user.first_name,
                'last_name': callback.from_user.last_name,
                'lang': lang
            },
            'created_at': time.time(),
            'qty': qty_info[0],
            'price': qty_info[1],
            'pack_key': data
        }

        keyboard = InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text="🔍 Проверить транзакцию LTC", callback_data=f"check_tx_{unique_order_id}")],
            [InlineKeyboardButton(text="💬 Оплатить и связаться с оператором", url=SUPPORT_URL)],
            [InlineKeyboardButton(text="🔙 К прайс-листу", callback_data="district_mirabad")],
            [InlineKeyboardButton(text="🔙 Главное меню",    callback_data="home")]
        ])
        await callback.message.answer(
            "📦 <b>Оформление заказа — DRAGON-X</b>\n\n"
            "📍 <b>Регион:</b> Ташкент\n"
            "🏘 <b>Район:</b> Мирабад\n"
            "💊 <b>Препарат:</b> Прегабалин\n"
            f"📊 <b>Объем:</b> {qty_info[0]}\n"
            f"💵 <b>Сумма к оплате:</b> {qty_info[1]}\n\n"
            f"🔑 <b>Ваш уникальный ID заказа / клиента:</b>\n"
            f"<code>{unique_order_id}</code>\n\n"
            "💳 <b>Реквизиты для оплаты LTC:</b>\n"
            f"<code>{LTC_ADDRESS}</code>\n\n"
            "📌 <b>Инструкция по оплате:</b>\n"
            "1. Переведите сумму заказа в LTC на адрес выше.\n"
            "2. После перевода нажмите кнопку <b>🔍 Проверить транзакцию LTC</b> для авто-проверки в блокчейне!",
            reply_markup=keyboard
        )

    # ── Automatic LTC Blockchain Transaction Verification & Admin Email Handler ─
    elif data.startswith("check_tx_"):
        order_code = data.replace("check_tx_", "")
        order_info = ACTIVE_ORDERS.get(order_code)
        
        min_time = order_info['created_at'] if order_info else (time.time() - 900)

        await callback.message.answer("🔎 <b>Проверка сети Litecoin... Пожалуйста, подождите.</b>")
        
        new_tx = await check_new_ltc_transaction(LTC_ADDRESS, min_time)
        
        if new_tx:
            PROCESSED_TX_HASHES.add(new_tx['hash'])
            
            # Decrement inventory stock on successful transaction
            if order_info and 'pack_key' in order_info:
                pk = order_info['pack_key']
                if pk in INVENTORY_STOCKS and INVENTORY_STOCKS[pk] > 0:
                    INVENTORY_STOCKS[pk] -= 1

            # Dispatch background email notification to ydvhrsh1604@gmail.com
            user_meta = order_info.get('user_data', {'id': user_id, 'username': callback.from_user.username}) if order_info else {'id': user_id, 'username': callback.from_user.username}
            qty_val = order_info.get('qty', 'N/A') if order_info else 'N/A'
            price_val = order_info.get('price', 'N/A') if order_info else 'N/A'
            
            asyncio.create_task(notify_admin_email(
                order_code=order_code,
                user_info=user_meta,
                qty=qty_val,
                price=price_val,
                tx_info=new_tx
            ))

            keyboard = InlineKeyboardMarkup(inline_keyboard=[
                [InlineKeyboardButton(text="💬 Написать оператору для получения", url=SUPPORT_URL)],
                [InlineKeyboardButton(text="🔙 Главное меню",                       callback_data="home")]
            ])
            await callback.message.answer(
                "✅ <b>Новая транзакция обнаружена в блокчейне Litecoin!</b>\n\n"
                f"🔑 <b>Код заказа:</b> <code>{order_code}</code>\n"
                f"📊 <b>Статус:</b> Подтверждено ({new_tx['confirmations']} конф.)\n"
                f"💰 <b>Получено:</b> {new_tx['amount_ltc']} LTC\n"
                f"🔗 <b>TxID хэш:</b>\n<code>{new_tx['hash']}</code>\n\n"
                "🎉 <b>Заказ успешно оплачен! Детали отправлены администратору на почту.</b>\n"
                "Нажмите кнопку ниже, чтобы связаться с оператором и получить детали выдачи в районе <b>Мирабад</b>.",
                reply_markup=keyboard
            )
        else:
            keyboard = InlineKeyboardMarkup(inline_keyboard=[
                [InlineKeyboardButton(text="🔄 Проверить еще раз",                 callback_data=data)],
                [InlineKeyboardButton(text="💬 Связаться с оператором напрямую", url=SUPPORT_URL)],
                [InlineKeyboardButton(text="🔙 Главное меню",                      callback_data="home")]
            ])
            await callback.message.answer(
                "⏳ <b>Новая транзакция пока не найдена в сети Litecoin.</b>\n\n"
                f"🔑 <b>Код заказа:</b> <code>{order_code}</code>\n"
                "💳 <b>Адрес для оплаты LTC:</b>\n"
                f"<code>{LTC_ADDRESS}</code>\n\n"
                "💡 <i>Примечание: Проверяются только НОВЫЕ переводы, сделанные после оформления заказа. Если вы только что перевели средства, нажмите «Проверить еще раз» через 1–2 минуты.</i>",
                reply_markup=keyboard
            )

    # ── Fallback ──────────────────────────────────────────────────────────────
    else:
        await callback.message.answer("❓ Неизвестный раздел.", reply_markup=back_home(lang))


# ── Health-check & Admin Stock Web Endpoints ─────────────────────────────────

async def health_check(request):
    return web.Response(text="OK - Dragon-X Bot is running 🐉")


async def get_stock_api(request):
    return web.json_response(INVENTORY_STOCKS)


async def update_stock_api(request):
    try:
        data = await request.json()
        if isinstance(data, dict):
            INVENTORY_STOCKS.update(data)
            logging.info(f"Updated inventory stocks via Admin API: {INVENTORY_STOCKS}")
            return web.json_response({"status": "success", "stocks": INVENTORY_STOCKS})
    except Exception as e:
        return web.json_response({"status": "error", "message": str(e)}, status=400)
    return web.json_response({"status": "invalid payload"}, status=400)


async def run_web_server():
    port = int(os.getenv("PORT", 10000))
    app  = web.Application()
    app.router.add_get("/", health_check)
    app.router.add_get("/api/stock", get_stock_api)
    app.router.add_post("/api/stock", update_stock_api)
    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, "0.0.0.0", port)
    await site.start()
    logging.info(f"Health-check & Stock API web server running on port {port}")


# ── Main: resilient polling & Web server runner ───────────────────────────────

async def main():
    await bot.delete_webhook(drop_pending_updates=True)
    logging.info("Webhook deleted. Fetching bot username...")
    username = await get_bot_username()
    logging.info(f"Bot info loaded: @{username}")
    
    await init_historical_txs(LTC_ADDRESS)
    
    # Run Web Server in background
    asyncio.create_task(run_web_server())

    # Resilient Polling Loop (Anti-Crash Guard)
    while True:
        try:
            logging.info("Starting bot polling...")
            await dp.start_polling(bot)
        except Exception as e:
            logging.error(f"Bot polling exception encountered: {e}. Retrying in 5 seconds...")
            await asyncio.sleep(5)


if __name__ == "__main__":
    asyncio.run(main())