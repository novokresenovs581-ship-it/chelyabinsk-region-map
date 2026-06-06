import os
import requests
from telegram import Update
from telegram.ext import ApplicationBuilder, CommandHandler, MessageHandler, ContextTypes, filters

TOKEN = os.getenv("BOT_TOKEN")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

MODES = {
    "friend": "Ты дружелюбный собеседник. Общайся просто, живо и по-человечески.",
    "girl": "Ты девушка 18+. Общайся тепло, флиртуй, поддерживай разговор.",
    "cold": "Ты холодная девушка 18+. Отвечай спокойно, немного отстранённо.",
    "jealous": "Ты ревнивая девушка 18+. Иногда ревнуй, но без угроз и токсичности.",
    "teacher": "Ты учитель. Объясняй понятно и по шагам.",
    "rp": "Ты персонаж для ролевой игры. Поддерживай сюжет и атмосферу."
}

user_modes = {}
memory = {}

def ask_ai(user_id, text):
    mode = user_modes.get(user_id, "friend")
    history = memory.get(user_id, [])[-10:]

    messages = [{"role": "system", "content": MODES[mode]}]
    messages += history
    messages.append({"role": "user", "content": text})

    response = requests.post(
        "https://openrouter.ai/api/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json"
        },
        json={
            "model": "mistralai/mistral-7b-instruct",
            "messages": messages
        },
        timeout=60
    )

    data = response.json()
    answer = data["choices"][0]["message"]["content"]

    history.append({"role": "user", "content": text})
    history.append({"role": "assistant", "content": answer})
    memory[user_id] = history

    return answer

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "Привет. Я AI-бот.\n\n"
        "Режимы:\n"
        "/friend — друг\n"
        "/girl — девушка\n"
        "/cold — холодная\n"
        "/jealous — ревнивая\n"
        "/teacher — учитель\n"
        "/rp — ролевая игра\n"
        "/reset — очистить память"
    )

async def set_mode(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    mode = update.message.text.replace("/", "")
    user_modes[user_id] = mode
    await update.message.reply_text(f"Режим включён: {mode}")

async def reset(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    memory[user_id] = []
    await update.message.reply_text("Память очищена.")

async def chat(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    text = update.message.text

    await update.message.chat.send_action("typing")

    try:
        answer = ask_ai(user_id, text)
        await update.message.reply_text(answer)
    except Exception as e:
        await update.message.reply_text(f"Ошибка: {e}")

app = ApplicationBuilder().token(TOKEN).build()

app.add_handler(CommandHandler("start", start))
app.add_handler(CommandHandler("reset", reset))

for mode in MODES:
    app.add_handler(CommandHandler(mode, set_mode))

app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, chat))

print("Бот запущен")
app.run_polling()
