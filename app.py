import sys
import os

# Ensure bot directory is in python path
current_dir = os.path.dirname(os.path.abspath(__file__))
bot_dir = os.path.join(current_dir, "bot")
if bot_dir not in sys.path:
    sys.path.insert(0, bot_dir)

os.chdir(bot_dir)

import app

if __name__ == "__main__":
    import asyncio
    asyncio.run(app.main())
