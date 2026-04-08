from fastapi import APIRouter, HTTPException
from typing import List, Dict
from schemas.auction import AuctionListingCreate, BidCreate, AuctionResponse
from services.auction_service import auction_service

router = APIRouter()

@router.post("/create", response_model=dict)
async def create_auction(listing: AuctionListingCreate):
    try:
        auction_id = await auction_service.create_listing(listing.dict())
        return {"success": True, "auction_id": auction_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/list", response_model=List[dict])
async def list_auctions():
    return await auction_service.get_all_listings()

@router.get("/my-listings/{profile_id}", response_model=List[dict])
async def my_listings(profile_id: str):
    return await auction_service.get_farmer_listings(profile_id)

@router.get("/market-intelligence", response_model=dict)
async def market_intelligence():
    return await auction_service.get_market_intelligence()

@router.post("/bid", response_model=dict)
async def place_bid(bid: BidCreate):
    try:
        success = await auction_service.place_bid(bid.auction_id, bid.buyer_name, bid.bid_amount)
        return {"success": success}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/recommendation/{auction_id}", response_model=dict)
async def get_recommendation(auction_id: str):
    # Fetch listing first
    all_listings = await auction_service.get_all_listings()
    listing = next((l for l in all_listings if l["_id"] == auction_id), None)
    if not listing:
        raise HTTPException(status_code=404, detail="Auction not found")
        
    return await auction_service.get_sell_recommendation(listing)
