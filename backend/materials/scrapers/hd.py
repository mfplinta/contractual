import os
import psutil
import json
import threading
from filelock import FileLock
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.common.exceptions import WebDriverException

# --- CONFIGURATION ---
HEADLESS = False
LOCK_FILE = "/tmp/homedepot_selenium.lock"
CHROME_PATH = None

class SeleniumEnforcer:
    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        """Standard Singleton pattern to ensure only one object exists in this process."""
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super(SeleniumEnforcer, cls).__new__(cls)
                    cls._instance.driver = None
        return cls._instance

    def _cleanup_system_processes(self):
        """The 'Nuclear Option': Kills any existing Chrome/Driver processes on the OS."""
        print("Cleaning up existing Chrome processes...")
        for proc in psutil.process_iter(['pid', 'name']):
            try:
                name = proc.info['name'].lower()
                if "chromedriver" in name or "chrome" in name:
                    # Don't kill the current script process
                    if proc.pid != os.getpid():
                        proc.kill()
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                pass

    def _start_driver(self):
        """Initializes the Chrome driver with specified options."""
        self._cleanup_system_processes()
        
        options = Options()
        if HEADLESS:
            options.add_argument("--headless=new")
        
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_experimental_option("detach", True)
        options.add_experimental_option("excludeSwitches", ["enable-automation"])

        self.driver = webdriver.Chrome(options=options)
        print("Selenium Driver started successfully.")

    def get_driver(self):
        """Returns the active driver, or restarts it if it's dead."""
        try:
            if self.driver is None:
                self._start_driver()
            else:
                # Heartbeat check: triggers an error if browser is closed
                _ = self.driver.current_url 
        except (WebDriverException, Exception):
            print("Driver lost. Restarting...")
            self._start_driver()
        return self.driver

    def get_product_data(self, store_sku, size='600'):
        """Main scraping logic wrapped in a process lock."""
        # The FileLock ensures multiple Django workers don't clash
        with FileLock(LOCK_FILE):
            driver = self.get_driver()
            
            try:
                driver.get(f'https://www.homedepot.com/p/{store_sku}')
                
                # Extract script data
                element = driver.find_element(By.XPATH, '/html/body/script[1]')
                inner_html = element.get_attribute('innerHTML')
                
                # Parsing logic
                raw_json = inner_html.split('window.__APOLLO_STATE__=')[1].split('\n')[0].rstrip(';')
                json_data = json.loads(raw_json)

                # Locate Catalog
                catalog = next((v for k, v in json_data.items() if k.startswith('base-catalog')), None)
                if not catalog:
                    return {"error": "Catalog data not found"}

                # Locate Pricing
                pricing = next((v for k, v in catalog.items() if k.startswith('pricing')), None)
                images = catalog.get('media', {}).get('images', [])

                return {
                    'image': images[0]['url'].replace('<SIZE>', size) if images else None,
                    'price': pricing.get('value') if pricing else "N/A",
                    'sku': store_sku
                }

            except Exception as e:
                return {"error": f"Scrape failed: {str(e)}"}

# Global instance to be imported by Django views
scraper = SeleniumEnforcer()