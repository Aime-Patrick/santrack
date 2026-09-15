from playwright.sync_api import sync_playwright

url = "http://localhost:3000/verify/e36bae47-2e92-440c-91c1-d6083f746e6e"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 430, "height": 932}, device_scale_factor=1)
    page.goto(url, wait_until="networkidle")
    page.screenshot(path="C:/tmp/verify-before.png", full_page=True)
    print(page.title())
    print(page.locator("body").inner_text()[:5000])
    browser.close()
