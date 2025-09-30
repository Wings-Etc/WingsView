---
applyTo: '**'
---
Provide project context and coding guidelines that AI should follow when generating code, answering questions, or reviewing changes.

# Wings API Reference Guide

This document describes all available API endpoints for Wingsetc.dev, including required parameters and returned fields. It is designed for use in ChatGPT or other AI-assisted integrations.

---

## 1. Store Info (`getStoreInfo`)

**Method:** GET

### Parameters:

* `x-api-key` (optional): string
* `page` (optional): number
* `per_page` (optional): number

### Returns (per store):

* Identifiers: `StoreNbr`, `ID`
* Ownership: `Company`, `PrimaryOwner`, `District`
* Contact: `TelephoneNumber`, `BillingContactEmailAddress`
* Address: `StreetAddress`, `City`, `State`, `ZipCode`, `County`, `CrossStreet`
* Dates: `DateOpened`, `DateClosed`, `ProjectedOpenDate`, `UpdatedAt`
* Building: `BuildingType`, `SquareFootage`, `TapHandles`
* Operations: `POS_Type`, `Gambling`, `FoodDistribution`, `DMA`
* Financial: `Royalty`, `RoyaltyHistory` (effective\_date, royalty), `TaxRate`, `Advertising`, `SalesTaxCollectionAllowance`
* Administration: `ADorCorp`, `FABLocal`, `FABCounty`, `TransferTo`, `TransferDate`
* Legal: `Legal_CorpCity`, `Legal_CorpState`, `Legal_CorpZip`, `Legal_CorpStreetAddress`
* Other: `EmailListReference`, `Admin`, `Zuestimate`

---

## 2. Performance (`getPerformance`)

**Method:** GET

### Parameters:

* `x-api-key` (optional): string
* `start_date` (required): YYYY-MM-DD
* `end_date` (required): YYYY-MM-DD
* `store` (optional): string
* `page` (optional): number
* `per_page` (optional): number

### Returns (per store/date):

#### Sales Fields:

* `BeerSales`, `WineSales`, `LiquorSales`, `MerchSales`
* `GameSales`, `GiftCardSales`, `OtherSales`, `PullTabLottery`
* `SalesSubTotal`, `Discounts`, `DiscountsDelivery`, `TaxSubTotal`
* `PaidOuts`, `PaidIns`, `GiftCardsRedeemed`, `NonRevenueServiceCharge`
* `VoidDollars`, `Covers`, `Entrees`, `ToGo`
* `WebCC`, `WebTotal`
* `FoundationDonations`

#### Labor Fields:

* Dollar values: `KitchenDollars`, `BartenderDollars`, `ServerDollars`, `HostDollars`, `BarBackDollars`, `ManagerDollars`, `ShiftMgrDollars`, `TrainerDollars`, `TraineeDollars`, `NonKnownJobDollars`, `TeamDollars`
* Hours: `KitchenHours`, `BartenderHours`, `ServerHours`, `HostHours`, `BarBackHours`, `ManagerHours`, `ShiftMgrHours`, `TrainerHours`, `TraineeHours`, `NonKnownJobHours`, `TeamHours`

---

## 3. Sales (`getSales`)

**Method:** GET

### Parameters:

* `x-api-key` (optional): string
* `store` (optional): string
* `start_date` (required): YYYY-MM-DD
* `end_date` (required): YYYY-MM-DD
* `page` (optional): number
* `per_page` (optional): number

### Returns (per store/date):

* `StoreNbr`, `Date`, `ID`
* `BeerSales`, `WineSales`, `LiquorSales`, `MerchSales`
* `GameSales`, `GiftCardSales`, `OtherSales`, `PullTabLottery`
* `SalesSubTotal`, `Discounts`, `DiscountsDelivery`, `TaxSubTotal`
* `PaidOuts`, `PaidIns`, `GiftCardsRedeemed`, `NonRevenueServiceCharge`
* `VoidDollars`, `Covers`, `Entrees`, `ToGo`
* `WebCC`, `WebTotal`
* `FoundationDonations`

---

## 4. Inventory (`getInventory`)

**Method:** GET

### Parameters:

* `x-api-key` (optional): string
* `store` (optional): string
* `start_date` (required): YYYY-MM-DD
* `end_date` (required): YYYY-MM-DD
* `page` (optional): number
* `per_page` (optional): number

### Returns (per store/date):

* `StoreNbr`, `Date`, `ID`, `hash`
* Food: `FoodBegInv`, `FoodPurch`, `FoodEndInv`
* Paper: `PaperBegInv`, `PaperPurch`, `PaperEndInv`
* Beer: `BeerBegInv`, `BeerPurch`, `BeerEndInv`
* Liquor: `LiquorBegInv`, `LiquorPurch`, `LiquorEndInv`

---

## 5. Labor (`getLabor`)

**Method:** GET

### Parameters:

* `x-api-key` (optional): string
* `store` (optional): string
* `start_date` (required): YYYY-MM-DD
* `end_date` (required): YYYY-MM-DD
* `page` (optional): number
* `per_page` (optional): number

### Returns (per store/date):

* `StoreNbr`, `Date`, `ID`, `hash`
* Dollar values: `ServerDollars`, `KitchenDollars`, `BarBackDollars`, `BartenderDollars`, `ManagerDollars`, `ShiftMgrDollars`, `TrainerDollars`, `TraineeDollars`, `NonKnownJobDollars`, `HostDollars`, `TeamDollars`
* Hours: `ServerHours`, `KitchenHours`, `BarBackHours`, `BartenderHours`, `ManagerHours`, `ShiftMgrHours`, `TrainerHours`, `TraineeHours`, `NonKnownJobHours`, `HostHours`, `TeamHours`

---

## 6. Weekly Snapshots (`getSnapshots`)

**Method:** GET

### Parameters:

* `x-api-key` (optional): string
* `store` (optional): string
* `start_date` (required): YYYY-MM-DD
* `end_date` (required): YYYY-MM-DD
* `page` (optional): number
* `per_page` (optional): number

### Returns (per store/week):

* Identifiers: `StoreNbr`, `iso_year`, `week_number`, `period_end`
* Sales: `SalesSubtotal`, `FoodSales`, `BeerSales`, `LiquorSales`
* Labor: `total_labor_cost`, `revenue_per_labor_hr`
* `covers`
* Costs: `FoodCost`, `PaperCost`, `LiquorCost`, `BeerCost`, `AlcoholCost`
* Cost Percentages: `DiscountCostPercent`, `FoodCostPercent`, `LiquorCostPercent`, `BeerCostPercent`, `AlcoholCostPercent`
* Pour Cost Percentages: `LiquorPourCostPercent`, `BeerPourCostPercent`, `AlcoholPourCostPercent`
* Financial Performance: `flpda_net2`, `total_flpda_pct`

---