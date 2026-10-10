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
        f"- Product: Pregabalin\n"
        f"- Volume: {qty}\n"
        f"- Price: {price}\n"
        f"- Region: Tashkent\n"
        f"- District: Mirabad\n\n"
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


# ── Keyboards & Multi-Language UI Helpers ─────────────────────────────────────

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

    # ── Orders ────────────────────────────────────────────────────────────────
    elif data == "orders":
        no_orders_txt = {
            "ru": "📋 У вас пока нет заказов.",
            "en": "📋 You have no active orders yet.",
            "uz": "📋 Sizda hali buyurtmalar yo'q."
        }[lang]
        await callback.message.answer(no_orders_txt, reply_markup=back_home(lang))

    # ── Catalogue ────────────────────────────────────────────────────────────
    elif data == "catalog":
        btn_preg  = {"ru": "💊 Прегабалин", "en": "💊 Pregabalin", "uz": "💊 Pregabalin"}[lang]
        btn_home  = {"ru": "🔙 Главное меню", "en": "🔙 Main Menu", "uz": "🔙 Asosiy menyu"}[lang]

        keyboard = InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text=btn_preg, callback_data="category_medical")],
            [InlineKeyboardButton(text=btn_home, callback_data="home")]
        ])

        cat_txt = {
            "ru": "🛍 <b>Каталог товаров DRAGON-X</b>\n\nВыберите препарат для заказа:",
            "en": "🛍 <b>DRAGON-X Product Catalog</b>\n\nSelect a product to order:",
            "uz": "🛍 <b>DRAGON-X Mahsulotlar katalogi</b>\n\nBuyurtma berish uchun mahsulotni tanlang:"
        }[lang]
        await callback.message.answer(cat_txt, reply_markup=keyboard)

    # ── Product Selection -> Region Step ─────────────────────────────────────
    elif data == "category_medical":
        btn_reg  = {"ru": "📍 Выбрать регион", "en": "📍 Select Region", "uz": "📍 Hududni tanlash"}[lang]
        btn_cat  = {"ru": "🔙 Каталог",          "en": "🔙 Catalog",       "uz": "🔙 Katalog"}[lang]

        keyboard = InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text=btn_reg, callback_data="select_region")],
            [InlineKeyboardButton(text=btn_cat, callback_data="catalog")]
        ])

        prod_txt = {
            "ru": "💊 <b>Прегабалин (Pregabalin)</b>\n\nПерейдите к выбору региона доставки и выдачи:",
            "en": "💊 <b>Pregabalin</b>\n\nProceed to select delivery region:",
            "uz": "💊 <b>Pregabalin</b>\n\nYetkazib berish hududini tanlashga o'ting:"
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

    # ── Tashkent -> District Selection (Mirabad) ──────────────────────────────
    elif data == "region_tashkent":
        btn_mir  = {"ru": "📍 Мирабад",         "en": "📍 Mirabad",         "uz": "📍 Mirobod"}[lang]
        btn_reg  = {"ru": "🔙 К выбору региона", "en": "🔙 Select Region",   "uz": "🔙 Hududga qaytish"}[lang]
        btn_home = {"ru": "🔙 Главное меню",     "en": "🔙 Main Menu",       "uz": "🔙 Asosiy menyu"}[lang]

        keyboard = InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text=btn_mir,  callback_data="district_mirabad")],
            [InlineKeyboardButton(text=btn_reg,  callback_data="select_region")],
            [InlineKeyboardButton(text=btn_home, callback_data="home")]
        ])

        dist_txt = {
            "ru": "📍 <b>Регион: Ташкент</b>\n\n🏘 <b>Выберите район:</b>\n• <b>Мирабад</b>",
            "en": "📍 <b>Region: Tashkent</b>\n\n🏘 <b>Select District:</b>\n• <b>Mirabad</b>",
            "uz": "📍 <b>Hudud: Toshkent</b>\n\n🏘 <b>Tuman tanlang:</b>\n• <b>Mirobod</b>"
        }[lang]
        await callback.message.answer(dist_txt, reply_markup=keyboard)

    # ── 4th Page: Price Section & Quantity Options with Stock Verification ───
    elif data == "district_mirabad" or data == "product_pregabalin":
        lbl_stock = {"ru": "в наличии", "en": "in stock", "uz": "mavjud"}[lang]
        btn_op    = {"ru": "💬 Написать оператору", "en": "💬 Contact Operator", "uz": "💬 Operatorga yozish"}[lang]
        btn_dist  = {"ru": "🔙 К выбору района",    "en": "🔙 Select District",  "uz": "🔙 Tumanga qaytish"}[lang]
        btn_home  = {"ru": "🔙 Главное меню",        "en": "🔙 Main Menu",        "uz": "🔙 Asosiy menyu"}[lang]

        keyboard = InlineKeyboardMarkup(inline_keyboard=[
            [
                InlineKeyboardButton(text=f"2 pcs — 25$ ({INVENTORY_STOCKS.get('buy_2', 0)} {lbl_stock})",   callback_data="buy_2"),
                InlineKeyboardButton(text=f"3 pcs — 35$ ({INVENTORY_STOCKS.get('buy_3', 0)} {lbl_stock})",   callback_data="buy_3")
            ],
            [
                InlineKeyboardButton(text=f"5 pcs — 55$ ({INVENTORY_STOCKS.get('buy_5', 0)} {lbl_stock})",   callback_data="buy_5"),
                InlineKeyboardButton(text=f"10 pcs — 108$ ({INVENTORY_STOCKS.get('buy_10', 0)} {lbl_stock})", callback_data="buy_10")
            ],
            [
                InlineKeyboardButton(text=f"20 pcs — 210$ ({INVENTORY_STOCKS.get('buy_20', 0)} {lbl_stock})", callback_data="buy_20"),
                InlineKeyboardButton(text=f"50 pcs — 510$ ({INVENTORY_STOCKS.get('buy_50', 0)} {lbl_stock})", callback_data="buy_50")
            ],
            [
                InlineKeyboardButton(text=f"100 pcs — 1000$ ({INVENTORY_STOCKS.get('buy_100', 0)} {lbl_stock})", callback_data="buy_100")
            ],
            [
                InlineKeyboardButton(text=btn_op,   url=SUPPORT_URL)
            ],
            [
                InlineKeyboardButton(text=btn_dist, callback_data="region_tashkent"),
                InlineKeyboardButton(text=btn_home, callback_data="home")
            ]
        ])

        st2   = INVENTORY_STOCKS.get('buy_2', 0)
        st3   = INVENTORY_STOCKS.get('buy_3', 0)
        st5   = INVENTORY_STOCKS.get('buy_5', 0)
        st10  = INVENTORY_STOCKS.get('buy_10', 0)
        st20  = INVENTORY_STOCKS.get('buy_20', 0)
        st50  = INVENTORY_STOCKS.get('buy_50', 0)
        st100 = INVENTORY_STOCKS.get('buy_100', 0)

        price_txt = {
            "ru": "💊 <b>Прегабалин (Pregabalin)</b>\n"
                  "📍 <b>Регион:</b> Ташкент\n"
                  "🏘 <b>Район:</b> Мирабад\n\n"
                  "💰 <b>Прайс-лист и остатки на сегодня:</b>\n"
                  f"• 2 штук — <b>25$</b> [В наличии: {st2}]\n"
                  f"• 3 штук — <b>35$</b> [В наличии: {st3}]\n"
                  f"• 5 штук — <b>55$</b> [В наличии: {st5}]\n"
                  f"• 10 штук — <b>108$</b> [В наличии: {st10}]\n"
                  f"• 20 штук — <b>210$</b> [В наличии: {st20}]\n"
                  f"• 50 штук — <b>510$</b> [В наличии: {st50}]\n"
                  f"• 100 штук — <b>1000$</b> [В наличии: {st100}]\n\n"
                  "💳 <b>Оплата принимается на LTC адрес:</b>\n"
                  f"<code>{LTC_ADDRESS}</code>\n\n"
                  "👇 Выберите нужную фасовку для оформления заказа:",
            "en": "💊 <b>Pregabalin</b>\n"
                  "📍 <b>Region:</b> Tashkent\n"
                  "🏘 <b>District:</b> Mirabad\n\n"
                  "💰 <b>Price List & Today's Stock:</b>\n"
                  f"• 2 pcs — <b>25$</b> [In stock: {st2}]\n"
                  f"• 3 pcs — <b>35$</b> [In stock: {st3}]\n"
                  f"• 5 pcs — <b>55$</b> [In stock: {st5}]\n"
                  f"• 10 pcs — <b>108$</b> [In stock: {st10}]\n"
                  f"• 20 pcs — <b>210$</b> [In stock: {st20}]\n"
                  f"• 50 pcs — <b>510$</b> [In stock: {st50}]\n"
                  f"• 100 pcs — <b>1000$</b> [In stock: {st100}]\n\n"
                  "💳 <b>Payment accepted via LTC address:</b>\n"
                  f"<code>{LTC_ADDRESS}</code>\n\n"
                  "👇 Select desired quantity to order:",
            "uz": "💊 <b>Pregabalin</b>\n"
                  "📍 <b>Hudud:</b> Toshkent\n"
                  "🏘 <b>Tuman:</b> Mirobod\n\n"
                  "💰 <b>Narxlar va bugungi mavjudlik:</b>\n"
                  f"• 2 ta — <b>25$</b> [Mavjud: {st2}]\n"
                  f"• 3 ta — <b>35$</b> [Mavjud: {st3}]\n"
                  f"• 5 ta — <b>55$</b> [Mavjud: {st5}]\n"
                  f"• 10 ta — <b>108$</b> [Mavjud: {st10}]\n"
                  f"• 20 ta — <b>210$</b> [Mavjud: {st20}]\n"
                  f"• 50 ta — <b>510$</b> [Mavjud: {st50}]\n"
                  f"• 100 ta — <b>1000$</b> [Mavjud: {st100}]\n\n"
                  "💳 <b>To'lov LTC manzili orqali:</b>\n"
                  f"<code>{LTC_ADDRESS}</code>\n\n"
                  "👇 Buyurtma uchun miqdorni tanlang:"
        }[lang]
        await callback.message.answer(price_txt, reply_markup=keyboard)

    # ── Order Confirmation with Stock Check & Unique Reference ID ─────────────
    elif data.startswith("buy_"):
        stock_count = INVENTORY_STOCKS.get(data, 0)
        if stock_count <= 0:
            btn_op    = {"ru": "💬 Связаться с оператором", "en": "💬 Contact Operator", "uz": "💬 Operatorga yozish"}[lang]
            btn_price = {"ru": "🔙 К прайс-листу",        "en": "🔙 Back to Price List", "uz": "🔙 Narxlarga qaytish"}[lang]
            keyboard = InlineKeyboardMarkup(inline_keyboard=[
                [InlineKeyboardButton(text=btn_op,    url=SUPPORT_URL)],
                [InlineKeyboardButton(text=btn_price, callback_data="district_mirabad")]
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

        qty_map = {
            "buy_2":   ({"ru": "2 штук", "en": "2 pcs", "uz": "2 ta"}, "25$"),
            "buy_3":   ({"ru": "3 штук", "en": "3 pcs", "uz": "3 ta"}, "35$"),
            "buy_5":   ({"ru": "5 штук", "en": "5 pcs", "uz": "5 ta"}, "55$"),
            "buy_10":  ({"ru": "10 штук", "en": "10 pcs", "uz": "10 ta"}, "108$"),
            "buy_20":  ({"ru": "20 штук", "en": "20 pcs", "uz": "20 ta"}, "210$"),
            "buy_50":  ({"ru": "50 штук", "en": "50 pcs", "uz": "50 ta"}, "510$"),
            "buy_100": ({"ru": "100 штук", "en": "100 pcs", "uz": "100 ta"}, "1000$"),
        }
        qty_data = qty_map.get(data, ({"ru": "штук", "en": "pcs", "uz": "ta"}, "N/A"))
        qty_label = qty_data[0][lang]
        price_val = qty_data[1]
        
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
            'qty': qty_label,
            'price': price_val,
            'pack_key': data
        }

        btn_verify = {"ru": "🔍 Проверить транзакцию LTC", "en": "🔍 Verify LTC Transaction", "uz": "🔍 LTC Tranzaksiyani tekshirish"}[lang]
        btn_pay    = {"ru": "💬 Оплатить и связаться с оператором", "en": "💬 Pay & Contact Operator", "uz": "💬 To'lov va Operatorga yozish"}[lang]
        btn_price  = {"ru": "🔙 К прайс-листу", "en": "🔙 Back to Price List", "uz": "🔙 Narxlarga qaytish"}[lang]
        btn_home   = {"ru": "🔙 Главное меню", "en": "🔙 Main Menu", "uz": "🔙 Asosiy menyu"}[lang]

        keyboard = InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text=btn_verify, callback_data=f"check_tx_{unique_order_id}")],
            [InlineKeyboardButton(text=btn_pay,    url=SUPPORT_URL)],
            [InlineKeyboardButton(text=btn_price,  callback_data="district_mirabad")],
            [InlineKeyboardButton(text=btn_home,   callback_data="home")]
        ])

        order_checkout_txt = {
            "ru": "📦 <b>Оформление заказа — DRAGON-X</b>\n\n"
                  "📍 <b>Регион:</b> Ташкент\n"
                  "🏘 <b>Район:</b> Мирабад\n"
                  "💊 <b>Препарат:</b> Прегабалин\n"
                  f"📊 <b>Объем:</b> {qty_label}\n"
                  f"💵 <b>Сумма к оплате:</b> {price_val}\n\n"
                  f"🔑 <b>Ваш уникальный ID заказа / клиента:</b>\n"
                  f"<code>{unique_order_id}</code>\n\n"
                  "💳 <b>Реквизиты для оплаты LTC:</b>\n"
                  f"<code>{LTC_ADDRESS}</code>\n\n"
                  "📌 <b>Инструкция по оплате:</b>\n"
                  "1. Переведите сумму заказа в LTC на адрес выше.\n"
                  "2. После перевода нажмите кнопку <b>🔍 Проверить транзакцию LTC</b> для авто-проверки в блокчейне!",
            "en": "📦 <b>Order Checkout — DRAGON-X</b>\n\n"
                  "📍 <b>Region:</b> Tashkent\n"
                  "🏘 <b>District:</b> Mirabad\n"
                  "💊 <b>Product:</b> Pregabalin\n"
                  f"📊 <b>Volume:</b> {qty_label}\n"
                  f"💵 <b>Total Amount:</b> {price_val}\n\n"
                  f"🔑 <b>Your Unique Order / Client ID:</b>\n"
                  f"<code>{unique_order_id}</code>\n\n"
                  "💳 <b>LTC Payment Address:</b>\n"
                  f"<code>{LTC_ADDRESS}</code>\n\n"
                  "📌 <b>Payment Instructions:</b>\n"
                  "1. Send the order amount in LTC to the address above.\n"
                  "2. After sending, click <b>🔍 Verify LTC Transaction</b> for automated blockchain check!",
            "uz": "📦 <b>Buyurtmani rasmiylashtirish — DRAGON-X</b>\n\n"
                  "📍 <b>Hudud:</b> Toshkent\n"
                  "🏘 <b>Tuman:</b> Mirobod\n"
                  "💊 <b>Mahsulot:</b> Pregabalin\n"
                  f"📊 <b>Hajmi:</b> {qty_label}\n"
                  f"💵 <b>To'lov summasi:</b> {price_val}\n\n"
                  f"🔑 <b>Sizning noyob buyurtma ID:</b>\n"
                  f"<code>{unique_order_id}</code>\n\n"
                  "💳 <b>LTC To'lov manzili:</b>\n"
                  f"<code>{LTC_ADDRESS}</code>\n\n"
                  "📌 <b>To'lov yo'riqnomasi:</b>\n"
                  "1. Yuqoridagi manzilga LTC to'lovini yuboring.\n"
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
        
        new_tx = await check_new_ltc_transaction(LTC_ADDRESS, min_time)
        
        if new_tx:
            PROCESSED_TX_HASHES.add(new_tx['hash'])
            
            if order_info and 'pack_key' in order_info:
                pk = order_info['pack_key']
                if pk in INVENTORY_STOCKS and INVENTORY_STOCKS[pk] > 0:
                    INVENTORY_STOCKS[pk] -= 1

            user_meta = order_info.get('user_data', {'id': user_id, 'username': callback.from_user.username, 'lang': lang}) if order_info else {'id': user_id, 'username': callback.from_user.username, 'lang': lang}
            qty_val = order_info.get('qty', 'N/A') if order_info else 'N/A'
            price_val = order_info.get('price', 'N/A') if order_info else 'N/A'
            
            asyncio.create_task(notify_admin_email(
                order_code=order_code,
                user_info=user_meta,
                qty=qty_val,
                price=price_val,
                tx_info=new_tx
            ))

            btn_get  = {"ru": "💬 Написать оператору для получения", "en": "💬 Message Operator for Pickup", "uz": "💬 Olish uchun operatorga yozish"}[lang]
            btn_home = {"ru": "🔙 Главное меню",                       "en": "🔙 Main Menu",                    "uz": "🔙 Asosiy menyu"}[lang]

            keyboard = InlineKeyboardMarkup(inline_keyboard=[
                [InlineKeyboardButton(text=btn_get,  url=SUPPORT_URL)],
                [InlineKeyboardButton(text=btn_home, callback_data="home")]
            ])

            success_txt = {
                "ru": "✅ <b>Новая транзакция обнаружена в блокчейне Litecoin!</b>\n\n"
                      f"🔑 <b>Код заказа:</b> <code>{order_code}</code>\n"
                      f"📊 <b>Статус:</b> Подтверждено ({new_tx['confirmations']} конф.)\n"
                      f"💰 <b>Получено:</b> {new_tx['amount_ltc']} LTC\n"
                      f"🔗 <b>TxID хэш:</b>\n<code>{new_tx['hash']}</code>\n\n"
                      "🎉 <b>Заказ успешно оплачен! Детали отправлены администратору на почту.</b>\n"
                      "Нажмите кнопку ниже, чтобы связаться с оператором и получить детали выдачи в районе <b>Мирабад</b>.",
                "en": "✅ <b>New Transaction Detected on Litecoin Blockchain!</b>\n\n"
                      f"🔑 <b>Order Code:</b> <code>{order_code}</code>\n"
                      f"📊 <b>Status:</b> Confirmed ({new_tx['confirmations']} confs)\n"
                      f"💰 <b>Received:</b> {new_tx['amount_ltc']} LTC\n"
                      f"🔗 <b>TxID Hash:</b>\n<code>{new_tx['hash']}</code>\n\n"
                      "🎉 <b>Order successfully paid! Details sent to admin.</b>\n"
                      "Click the button below to contact the operator and receive pickup/delivery details in <b>Mirabad</b>.",
                "uz": "✅ <b>Litecoin blokcheynida yangi tranzaksiya topildi!</b>\n\n"
                      f"🔑 <b>Buyurtma kodi:</b> <code>{order_code}</code>\n"
                      f"📊 <b>Holat:</b> Tasdiqlandi ({new_tx['confirmations']} tasdiq)\n"
                      f"💰 <b>Qabul qilindi:</b> {new_tx['amount_ltc']} LTC\n"
                      f"🔗 <b>TxID hesh:</b>\n<code>{new_tx['hash']}</code>\n\n"
                      "🎉 <b>Buyurtma muvaffaqiyatli to'landi!</b>\n"
                      "<b>Mirobod</b> tumanida olish uchun operator bilan bog'laning."
            }[lang]

            await callback.message.answer(success_txt, reply_markup=keyboard)
        else:
            btn_retry = {"ru": "🔄 Проверить еще раз",                 "en": "🔄 Check Again",      "uz": "🔄 Qayta tekshirish"}[lang]
            btn_op    = {"ru": "💬 Связаться с оператором напрямую", "en": "💬 Contact Operator", "uz": "💬 Operator bilan bog'lanish"}[lang]
            btn_home  = {"ru": "🔙 Главное меню",                      "en": "🔙 Main Menu",        "uz": "🔙 Asosiy menyu"}[lang]

            keyboard = InlineKeyboardMarkup(inline_keyboard=[
                [InlineKeyboardButton(text=btn_retry, callback_data=data)],
                [InlineKeyboardButton(text=btn_op,    url=SUPPORT_URL)],
                [InlineKeyboardButton(text=btn_home,  callback_data="home")]
            ])

            pending_txt = {
                "ru": "⏳ <b>Новая транзакция пока не найдена в сети Litecoin.</b>\n\n"
                      f"🔑 <b>Код заказа:</b> <code>{order_code}</code>\n"
                      "💳 <b>Адрес для оплаты LTC:</b>\n"
                      f"<code>{LTC_ADDRESS}</code>\n\n"
                      "💡 <i>Примечание: Проверяются только НОВЫЕ переводы, сделанные после оформления заказа. Если вы только что перевели средства, нажмите «Проверить еще раз» через 1–2 минуты.</i>",
                "en": "⏳ <b>New transaction not found on Litecoin network yet.</b>\n\n"
                      f"🔑 <b>Order Code:</b> <code>{order_code}</code>\n"
                      "💳 <b>LTC Payment Address:</b>\n"
                      f"<code>{LTC_ADDRESS}</code>\n\n"
                      "💡 <i>Note: Only NEW transfers sent after order creation are verified. If you just sent funds, click \"Check Again\" in 1–2 minutes.</i>",
                "uz": "⏳ <b>Litecoin tarmog'ida hali yangi tranzaksiya topilmadi.</b>\n\n"
                      f"🔑 <b>Buyurtma kodi:</b> <code>{order_code}</code>\n"
                      "💳 <b>LTC To'lov manzili:</b>\n"
                      f"<code>{LTC_ADDRESS}</code>\n\n"
                      "💡 <i>Eslatma: Faqat buyurtma yaratilgandan so'ng yuborilgan YANGI o'tkazmalar tekshiriladi. 1–2 daqiqadan so'ng qayta urinib ko'ring.</i>"
            }[lang]

            await callback.message.answer(pending_txt, reply_markup=keyboard)

    # ── Fallback ──────────────────────────────────────────────────────────────
    else:
        await callback.message.answer("❓ Unknown command / Неизвестный раздел.", reply_markup=back_home(lang))


@dp.message()
async def generic_message_handler(message: Message):
    user_id = message.from_user.id
    lang = USER_LANGUAGES.setdefault(user_id, "ru")
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
            await dp.start_polling(bot, handle_signals=False)
        except Exception as e:
            logging.error(f"Bot polling exception encountered: {e}. Retrying in 2 seconds...")
            await asyncio.sleep(2)


if __name__ == "__main__":
    asyncio.run(main())