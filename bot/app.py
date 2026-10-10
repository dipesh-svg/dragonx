import os
import asyncio
import logging
from html import escape
from aiohttp import web
from aiogram import Bot, Dispatcher
from aiogram.client.default import DefaultBotProperties
from aiogram.filters import CommandStart
from aiogram.types import Message, InlineKeyboardMarkup, InlineKeyboardButton, CallbackQuery
from aiogram.enums import ParseMode

logging.basicConfig(level=logging.INFO)

# ── Config ───────────────────────────────────────────────────────────────────
TOKEN        = os.getenv("BOT_TOKEN")
BOT_USERNAME  = os.getenv("BOT_USERNAME", "")
SUPPORT_HANDLE = "@Dgx464"
SUPPORT_URL   = "https://t.me/Dgx464"
WEBSITE_URL   = os.getenv("WEBSITE_URL", "")
REVIEWS_URL   = os.getenv("REVIEWS_URL", WEBSITE_URL)
CONVERTER_URL  = "https://t.me/Eva_obmen"
LTC_ADDRESS  = "ltc1qr5xhqe9tdd5lekrxurfftdv9hhaaqche2urvhr"

if not TOKEN:
    raise ValueError("BOT_TOKEN environment variable is not set! Set it in Render → Environment.")

bot = Bot(token=TOKEN, default=DefaultBotProperties(parse_mode=ParseMode.HTML))
dp  = Dispatcher()


# ── Keyboards ────────────────────────────────────────────────────────────────

def home_keyboard():
    # Always-present rows (callback_data only — never empty)
    rows = [
        [
            InlineKeyboardButton(text="🛍 Купить товар",     callback_data="catalog"),
            InlineKeyboardButton(text="💬 Поддержка",        callback_data="support")
        ],
        [
            InlineKeyboardButton(text="📜 Правила",          callback_data="rules"),
            InlineKeyboardButton(text="👥 Пригласить друга", callback_data="referral")
        ],
        [
            InlineKeyboardButton(text="🔄 Наш обмен",        url=CONVERTER_URL)
        ]
    ]
    # Only add URL buttons when the URL is actually configured
    if WEBSITE_URL:
        rows.insert(2, [InlineKeyboardButton(text="🌐 Наш сайт", url=WEBSITE_URL)])
    if REVIEWS_URL:
        rows.insert(3, [InlineKeyboardButton(text="⭐ Отзывы",   url=REVIEWS_URL)])
    return InlineKeyboardMarkup(inline_keyboard=rows)


def back_home():
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="🔙 Главное меню", callback_data="home")]
    ])


# ── Handlers ─────────────────────────────────────────────────────────────────

@dp.message(CommandStart())
async def start(message: Message):
    user_id = message.from_user.id
    referral_link = (
        f"https://t.me/{BOT_USERNAME}?start=ref_{user_id}"
        if BOT_USERNAME else "Ссылка будет доступна после настройки BOT_USERNAME."
    )
    await message.answer(
        "🐉 <b>Добро пожаловать в DRAGON-X!</b>\n\n"
        "Выберите нужный раздел в меню ниже.\n\n"
        "💰 <b>Ваш баланс:</b> 0.00 $\n"
        "🎁 <b>Реферальный бонус:</b> 2% от всех заказов друзей\n\n"
        f"👥 <b>Ваша реферальная ссылка:</b>\n<code>{escape(referral_link)}</code>\n\n"
        "💡 <i>Приглашайте друзей по вашей ссылка и получайте 2% от суммы каждого их заказа прямо на ваш баланс!</i>",
        reply_markup=home_keyboard()
    )


@dp.callback_query()
async def menu(callback: CallbackQuery):
    data = callback.data
    await callback.answer()

    # ── Home ─────────────────────────────────────────────────────────────────
    if data == "home":
        await callback.message.answer(
            "🐉 <b>DRAGON-X</b> — Главное меню",
            reply_markup=home_keyboard()
        )

    # ── Rules ─────────────────────────────────────────────────────────────────
    elif data == "rules":
        await callback.message.answer(
            "📜 <b>Правила DRAGON-X</b>\n\n"
            "• Предоставляйте достоверную информацию.\n"
            "• Не отправляйте пароли и секретные ключи.\n"
            "• Обращайтесь в поддержку при возникновении вопросов.\n"
            "• Все операции должны соответствовать применимому законодательству.",
            reply_markup=back_home()
        )

    # ── Referral (Invite a Friend - 2% Bonus) ─────────────────────────────────
    elif data == "referral":
        user_id = callback.from_user.id
        link = (
            f"https://t.me/{BOT_USERNAME}?start=ref_{user_id}"
            if BOT_USERNAME else "Настройте BOT_USERNAME в Render."
        )
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
            reply_markup=back_home()
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

    # ── 4th Page: Price Section & Quantity Options (Mirabad, Tashkent) ───────
    elif data == "district_mirabad" or data == "product_pregabalin":
        keyboard = InlineKeyboardMarkup(inline_keyboard=[
            [
                InlineKeyboardButton(text="2 шт — 25$",   callback_data="buy_2"),
                InlineKeyboardButton(text="3 шт — 35$",   callback_data="buy_3")
            ],
            [
                InlineKeyboardButton(text="5 шт — 55$",   callback_data="buy_5"),
                InlineKeyboardButton(text="10 шт — 108$", callback_data="buy_10")
            ],
            [
                InlineKeyboardButton(text="20 шт — 210$", callback_data="buy_20"),
                InlineKeyboardButton(text="50 шт — 510$", callback_data="buy_50")
            ],
            [
                InlineKeyboardButton(text="100 шт — 1000$", callback_data="buy_100")
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
            "💰 <b>Прайс-лист / Варианты фасовки:</b>\n"
            "• 2 штук — <b>25$</b>\n"
            "• 3 штук — <b>35$</b>\n"
            "• 5 штук — <b>55$</b>\n"
            "• 10 штук — <b>108$</b>\n"
            "• 20 штук — <b>210$</b>\n"
            "• 50 штук — <b>510$</b>\n"
            "• 100 штук — <b>1000$</b>\n\n"
            "💳 <b>Оплата принимается на LTC адрес:</b>\n"
            f"<code>{LTC_ADDRESS}</code>\n\n"
            "👇 Выберите нужную фасовку для оформления заказа:",
            reply_markup=keyboard
        )

    # ── Order Confirmation for Quantity ──────────────────────────────────────
    elif data.startswith("buy_"):
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
        keyboard = InlineKeyboardMarkup(inline_keyboard=[
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
            "💳 <b>Реквизиты для оплаты LTC:</b>\n"
            f"<code>{LTC_ADDRESS}</code>\n\n"
            "После перевода средств нажмите кнопку ниже для связи с оператором.",
            reply_markup=keyboard
        )

    # ── Fallback ──────────────────────────────────────────────────────────────
    else:
        await callback.message.answer("❓ Неизвестный раздел.", reply_markup=back_home())


# ── Health-check web server (satisfies Render's port requirement) ─────────────

async def health_check(request):
    return web.Response(text="OK - Dragon-X Bot is running 🐉")


async def run_web_server():
    port = int(os.getenv("PORT", 10000))
    app  = web.Application()
    app.router.add_get("/", health_check)
    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, "0.0.0.0", port)
    await site.start()
    logging.info(f"Health-check server running on port {port}")


# ── Main: run bot + web server concurrently ───────────────────────────────────

async def main():
    await bot.delete_webhook(drop_pending_updates=True)
    logging.info("Webhook deleted. Starting polling...")
    await asyncio.gather(
        run_web_server(),
        dp.start_polling(bot)
    )


if __name__ == "__main__":
    asyncio.run(main())