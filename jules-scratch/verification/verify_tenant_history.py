
from playwright.sync_api import sync_playwright
import datetime

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()
    current_year = str(datetime.datetime.now().year)

    try:
        page.goto("http://localhost:3000/tenant-history")

        # Login
        page.wait_for_selector('input[type="password"]', timeout=60000)
        page.fill('input[type="password"]', current_year)
        page.click('button[type="submit"]')

        page.wait_for_selector('text="Select Shop & Year"', timeout=60000)

        # Select the first shop
        page.locator('label:has-text("Choose Shop") + div').click()
        page.locator('li[data-value]').first.click()

        # Select "All Years"
        page.locator('label:has-text("Select Year") + div').click()
        page.get_by_role("option", name="All Years").click()
        page.wait_for_timeout(2000)

        # Take a screenshot of the entire page
        page.screenshot(path="jules-scratch/verification/verification.png")
        print("Screenshot saved to jules-scratch/verification/verification.png")

    except Exception as e:
        print(f"An error occurred: {e}")
        # Take a screenshot even if there's an error for debugging
        page.screenshot(path="jules-scratch/verification/error.png")
        print("Error screenshot saved to jules-scratch/verification/error.png")

    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
