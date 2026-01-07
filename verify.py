
import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        console_logs = []
        page.on("console", lambda msg: console_logs.append(msg.text))
        await page.goto("http://localhost:5174")
        await page.screenshot(path="verification.png")
        await browser.close()
        for log in console_logs:
            print(log)

if __name__ == "__main__":
    asyncio.run(main())
