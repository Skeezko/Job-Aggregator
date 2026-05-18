"""
WeLoveDevs API client 
"""

import os
import time
import json
import requests
from dotenv import load_dotenv

load_dotenv()


class WeLoveDevsClient:
    BASE_URL = "https://epi-api.welovedevs.com"

    def __init__(self):
        self.api_key = os.getenv("API_KEY")
        if not self.api_key:
            raise ValueError("API_KEY missing in .env")

        self.headers = {
            "accept": "application/json",
            "X-API-Key": self.api_key,
        }

    def fetch_page(self, page=0, size=50):
        """Fetch one page of offers."""
        url = f"{self.BASE_URL}/v1"
        params = {"page": page, "size": size}
        response = requests.get(url, headers=self.headers, params=params)
        response.raise_for_status()
        return response.json()

  
    def fetch_all(self):
        """Fetch all offers across all pages."""
        all_offers = []
        page = 0

        while True:
            print(f"Fetching page {page}...")
            data = self.fetch_page(page=page, size=50)
            offers = data.get("values", [])

            if not offers:
                break

            all_offers.extend(offers)

            if len(offers) < 50:
                break

            page += 1
            time.sleep(1)  # rate limit

        return all_offers


if __name__ == "__main__":
    client = WeLoveDevsClient()

    # Test : fetch tout et sauvegarder
    offers = client.fetch_all()
    print(f"\nTotal fetched: {len(offers)} offers")

    # Sauvegarde dans data/raw/
    output_path = "data/raw/welovedevs_snapshot.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(offers, f, indent=2, ensure_ascii=False)

    print(f"Saved to {output_path}")