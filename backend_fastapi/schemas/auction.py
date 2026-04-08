from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class AuctionListingCreate(BaseModel):
    farm_profile_id: str
    crop_name: str
    quantity: float
    unit: str = "kg"
    quality_grade: str # A, B, C
    expected_price: float
    location: str
    harvest_date: str
    image_url: Optional[str] = None
    shelf_life_days: Optional[int] = None
    storage_status: Optional[str] = None # Cold, Ambient, etc.
    packaging_type: Optional[str] = None

class BidCreate(BaseModel):
    auction_id: str
    buyer_name: str
    bid_amount: float

class AuctionResponse(BaseModel):
    id: str
    farm_profile_id: str
    crop_name: str
    quantity: float
    unit: str
    quality_grade: str
    expected_price: float
    current_highest_bid: float
    total_bids: int
    status: str # active, pending, sold, expired
    created_at: datetime
    image_url: Optional[str]
    harvest_date: str
