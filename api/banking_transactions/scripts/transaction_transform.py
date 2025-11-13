"""
Transform and enrich transaction data
Business logic for data processing

This module takes raw GoCardless transaction data and enriches it:
- Formats text (camel case)
- Detects cardholder for credit cards
- Categorises transactions based on merchant matching
- Assigns icons based on category
- Extracts relevant fields
- Prepares for Notion upload
"""
import re
from .transaction_config import logger

# ============================================================================
# ICON URL CONFIGURATION
# ============================================================================

# Base URL for your icons (update with your Cloudflare tunnel domain)
ICON_BASE_URL = "https://static.broomfield.family/static/icons/transactions"

# ============================================================================
# CATEGORY TO ICON MAPPING
# ============================================================================

CATEGORY_ICONS = {
    # Bills
    "Bills:Council Tax": f"{ICON_BASE_URL}/bills_council_tax.png",
    "Bills:Healthclub": f"{ICON_BASE_URL}/bills_healthclub.png",
    "Bills:Home Insurance": f"{ICON_BASE_URL}/bills_home_insurance.png",
    "Bills:Learning": f"{ICON_BASE_URL}/bills_learning.png",
    "Bills:Mortgage": f"{ICON_BASE_URL}/bills_mortgage.png",
    "Bills:TV Licence": f"{ICON_BASE_URL}/bills_tv_licence.png",
    "Bills:Utilities": f"{ICON_BASE_URL}/bills_utilities.png",
    
    # Expenses
    "Expenses:Bank Fee": f"{ICON_BASE_URL}/expenses_bank_fee.png",
    "Expenses:Business Expense": f"{ICON_BASE_URL}/expenses_business_expense.png",
    "Expenses:Income Tax": f"{ICON_BASE_URL}/expenses_income_tax.png",
    "Expenses:Investment Expense": f"{ICON_BASE_URL}/expenses_investment_expense.png",
    "Expenses:Savings Expense": f"{ICON_BASE_URL}/expenses_savings_expense.png",
    
    # Income
    "Income:Child Benefit": f"{ICON_BASE_URL}/income_child_benefit.png",
    "Income:Dividends": f"{ICON_BASE_URL}/income_dividends.png",
    "Income:Interest": f"{ICON_BASE_URL}/income_interest.png",
    "Income:Invoice Payment": f"{ICON_BASE_URL}/income_invoice_payment.png",
    "Income:Misc Income": f"{ICON_BASE_URL}/income_misc_income.png",
    "Income:Salary": f"{ICON_BASE_URL}/income_salary.png",
    
    # Other
    "Other:Excluded Investment Transaction": f"{ICON_BASE_URL}/other_excluded_investment.png",
    "Other:Excluded Transaction": f"{ICON_BASE_URL}/other_excluded_transaction.png",
    "Other:Internal Transfer": f"{ICON_BASE_URL}/other_internal_transfer.png",
    
    # Spending
    "Spending:Car Costs": f"{ICON_BASE_URL}/spending_car_costs.png",
    "Spending:Charity": f"{ICON_BASE_URL}/spending_charity.png",
    "Spending:Gifting": f"{ICON_BASE_URL}/spending_gifting.png",
    "Spending:Groceries": f"{ICON_BASE_URL}/spending_groceries.png",
    "Spending:Holiday": f"{ICON_BASE_URL}/spending_holiday.png",
    "Spending:Home": f"{ICON_BASE_URL}/spending_home.png",
    "Spending:Miscellaneous": f"{ICON_BASE_URL}/spending_miscellaneous.png",
    "Spending:Outings": f"{ICON_BASE_URL}/spending_outings.png",
    "Spending:Personal Care": f"{ICON_BASE_URL}/spending_personal_care.png",
    "Spending:Pet": f"{ICON_BASE_URL}/spending_pet.png",
    "Spending:Transportation": f"{ICON_BASE_URL}/spending_transportation.png",
    
    # Split - Used when breaking down single transaction into multiple smaller ones
    "Split Transaction": f"{ICON_BASE_URL}/split_transaction.png",
}

# ============================================================================
# MERCHANT TO CATEGORY MAPPING
# ============================================================================

# Exact merchant matches (after normalisation)
EXACT_MERCHANT_MAP = {
    # Groceries
    "tesco": "Spending:Groceries",
    "sainsburys": "Spending:Groceries",
    "sainsbury": "Spending:Groceries",
    "asda": "Spending:Groceries",
    "morrisons": "Spending:Groceries",
    "waitrose": "Spending:Groceries",
    "aldi": "Spending:Groceries",
    "lidl": "Spending:Groceries",
    "coop": "Spending:Groceries",
    "marks and spencer": "Spending:Groceries",
    "ms": "Spending:Groceries",
    
    # Transportation - Fuel
    "shell": "Spending:Car Costs",
    "bp": "Spending:Car Costs",
    "esso": "Spending:Car Costs",
    "texaco": "Spending:Car Costs",
    
    # Transportation - Public Transport
    "tfl": "Spending:Transportation",
    "transport for london": "Spending:Transportation",
    "national rail": "Spending:Transportation",
    "trainline": "Spending:Transportation",
    "uber": "Spending:Transportation",
    
    # Outings - Restaurants
    "nandos": "Spending:Outings",
    "pizza hut": "Spending:Outings",
    "dominos": "Spending:Outings",
    "mcdonalds": "Spending:Outings",
    "kfc": "Spending:Outings",
    "burger king": "Spending:Outings",
    "greggs": "Spending:Outings",
    "subway": "Spending:Outings",
    "wagamama": "Spending:Outings",
    "zizzi": "Spending:Outings",
    "pizza express": "Spending:Outings",
    
    # Outings - Coffee
    "starbucks": "Spending:Outings",
    "costa": "Spending:Outings",
    "costa coffee": "Spending:Outings",
    "pret": "Spending:Outings",
    "pret a manger": "Spending:Outings",
    "caffe nero": "Spending:Outings",
    
    # Home - DIY
    "bq": "Spending:Home",
    "homebase": "Spending:Home",
    "wickes": "Spending:Home",
    "screwfix": "Spending:Home",
    "ikea": "Spending:Home",
    "toolstation": "Spending:Home",
    
    # Home - Other
    "amazon": "Spending:Home",
    "ebay": "Spending:Home",
    "argos": "Spending:Home",
    "john lewis": "Spending:Home",
    "currys": "Spending:Home",
    
    # Personal Care
    "boots": "Spending:Personal Care",
    "superdrug": "Spending:Personal Care",
    
    # Pet
    "pets at home": "Spending:Pet",
    "petsathome": "Spending:Pet",
    
    # Charity
    "oxfam": "Spending:Charity",
    "british heart foundation": "Spending:Charity",
    "cancer research": "Spending:Charity",
    "save the children": "Spending:Charity",
    
    # Bills - Utilities
    "octopus": "Bills:Utilities",
    "thames water": "Bills:Utilities",
    "vodafone": "Bills:Utilities",
    "ee": "Bills:Utilities",
    "o2": "Bills:Utilities",
}

# ============================================================================
# KEYWORD PATTERNS
# ============================================================================

# If no exact match, check if any of these keywords appear
KEYWORD_PATTERNS = {
    "Spending:Groceries": [
        "supermarket", "grocery", "groceries", "food", "tesco", "sainsbury", 
        "asda", "morrisons", "aldi", "lidl", "waitrose", "coop"
    ],
    
    "Spending:Car Costs": [
        "petrol", "diesel", "fuel", "shell", "bp", "esso", "garage", 
        "mot", "car wash", "parking"
    ],
    
    "Spending:Transportation": [
        "train", "rail", "bus", "tube", "metro", "tfl", "transport", 
        "taxi", "uber", "ticket"
    ],
    
    "Spending:Outings": [
        "restaurant", "cafe", "coffee", "pub", "bar", "pizza", "takeaway", 
        "cinema", "theatre", "starbucks", "costa"
    ],
    
    "Spending:Holiday": [
        "hotel", "booking", "airbnb", "flight", "airline", "easyjet", 
        "ryanair", "holiday", "travel"
    ],
    
    "Spending:Home": [
        "amazon", "ebay", "argos", "ikea", "homebase", "diy"
    ],
    
    "Bills:Utilities": [
        "electric", "gas", "water", "broadband", "internet", "mobile", 
        "phone", "council tax"
    ],
    
    "Bills:Mortgage": [
        "mortgage", "loan"
    ],
    
    "Income:Salary": [
        "salary", "wage", "payment from"
    ],
    
    "Other:Internal Transfer": [
        "transfer", "transfer to", "transfer from"
    ],
    
    "Spending:Pet": [
        "vet", "pet", "dog", "cat"
    ],
    
    "Spending:Charity": [
        "charity", "donation", "oxfam", "justgiving"
    ]
}

# ============================================================================
# TEXT FORMATTING
# ============================================================================

def to_camel_case(text):
    """
    Convert text to Camel Case for better readability.
    
    Examples:
        "TESCO STORES 1234" → "Tesco Stores 1234"
        "shell fuel station" → "Shell Fuel Station"
    
    Args:
        text: Input string
        
    Returns:
        Formatted string, or empty string if input was None/empty
    """
    if not text:
        return ""
    return ' '.join(word.capitalize() for word in text.split())


def normalise_text(text):
    """
    Normalise text for matching: lowercase, remove special chars.
    
    Examples:
        "Sainsbury's" → "sainsburys"
        "Co-Op" → "coop"
        "TESCO STORES" → "tesco stores"
    
    Args:
        text: Input string
        
    Returns:
        Normalised string
    """
    if not text:
        return ""
    
    # Lowercase
    text = text.lower()
    
    # Remove special characters (keep letters, numbers, spaces)
    text = re.sub(r'[^a-z0-9\s]', '', text)
    
    # Remove extra spaces
    text = ' '.join(text.split())
    
    return text


# ============================================================================
# INVERT TRANSACTION AMOUNT
# ============================================================================

def invert_amount(amount):
    """
    Invert the sign of a transaction amount.
    
    Converts positive to negative and vice versa.
    Useful for accounting systems where debits/credits are inverted.
    
    Examples:
        -50.00 → 50.00
        100.00 → -100.00
        0.00 → 0.00
    
    Args:
        amount: Float or int amount
        
    Returns:
        Inverted amount (same type as input)
    """
    return -amount


# ============================================================================
# CARDHOLDER DETECTION
# ============================================================================

def detect_cardholder(transaction_raw, account_type):
    """
    Detect cardholder for credit card transactions.
    
    For CARD accounts, looks at the additionalDataStructured.Name field
    which contains the cardholder's name on the card.
    
    Args:
        transaction_raw: Raw transaction dict from GoCardless
        account_type: Account type code (CACC, SVGS, CARD)
        
    Returns:
        "Josephine" if name contains "JOSEPHINE"
        "Anthony" for all other card transactions
        None for non-card accounts
    """
    # Only applicable for credit cards
    if account_type != "CARD":
        return None
    
    # Extract cardholder name from transaction data
    additional_data = transaction_raw.get("additionalDataStructured", {})
    cardholder_name = additional_data.get("Name", "")
    
    # Check if it's Josephine's card (case insensitive)
    if "JOSEPHINE" in cardholder_name.upper():
        return "Josephine"
    else:
        return "Anthony"

# ============================================================================
# CATEGORISATION LOGIC
# ============================================================================

def categorise_transaction(transaction):
    """
    Detect transaction category using priority-based matching.
    
    Priority order:
    1. Exact merchant name match (normalised)
    2. Keyword pattern matching
    3. Default to Uncategorised
    
    Args:
        transaction: Enriched transaction dict with:
            - merchant_name: Merchant/creditor name
            - transaction_name: Transaction description
            
    Returns:
        Category string (e.g., "Spending:Groceries")
    """
    merchant = transaction.get('merchant_name', '')
    txn_name = transaction.get('transaction_name', '')
    
    # Normalise for matching
    merchant_norm = normalise_text(merchant)
    txn_norm = normalise_text(txn_name)
    search_text = f"{merchant_norm} {txn_norm}" # Combines both Merchant Name and Transaction Name fields
    
    # ========================================
    # PRIORITY 1: EXACT MERCHANT MATCH
    # ========================================
    
    for exact_merchant, category in EXACT_MERCHANT_MAP.items():
        if exact_merchant in search_text:
            return category
    
    # ========================================
    # PRIORITY 2: KEYWORD PATTERN MATCH
    # ========================================
    
    for category, keywords in KEYWORD_PATTERNS.items():
        for keyword in keywords:
            keyword_norm = normalise_text(keyword)
            if keyword_norm in search_text:
                return category
    
    # ========================================
    # DEFAULT: UNCATEGORISED
    # ========================================
    
    return "Uncategorised"


def detect_category(transaction):
    """
    Detect transaction category based on merchant patterns.
    Uses the categorisation rules defined above.
    
    Args:
        transaction: Enriched transaction dict
        
    Returns:
        Category string (e.g., "Spending:Groceries")
    """
    return categorise_transaction(transaction)


def get_icon_for_category(category):
    """
    Get icon URL for a category.
    
    Args:
        category: Category string (e.g., "Spending:Groceries")
        
    Returns:
        Icon URL string, or None if not found
    """
    if category == "Uncategorised":
        return None
    return CATEGORY_ICONS.get(category, None)


def assign_icon(transaction):
    """
    Assign icon URL based on category.
    
    Args:
        transaction: Enriched transaction dict with 'category' field
        
    Returns:
        Icon URL string, or None if no category
    """
    category = transaction.get('category')
    
    if category:
        icon = get_icon_for_category(category)
        return icon
    
    return None

def get_primary_category(category):
    """
    Extract primary category from Parent:Child format.
    
    Examples:
        "Spending:Groceries" → "Spending"
        "Bills:Utilities" → "Bills"
    
    Args:
        category: Full category string
        
    Returns:
        Primary category string
    """
    if ':' in category:
        return category.split(':')[0]
    return category


def get_sub_category(category):
    """
    Extract sub-category from Parent:Child format.
    
    Examples:
        "Spending:Groceries" → "Groceries"
        "Bills:Utilities" → "Utilities"
    
    Args:
        category: Full category string
        
    Returns:
        Sub-category string, or None if no sub-category
    """
    if ':' in category:
        return category.split(':')[1]
    return None

# ============================================================================
# TRANSACTION TRANSFORMATION
# ============================================================================

def transform_transaction(txn_raw, account_info, booked_list):
    """
    Transform a single raw transaction into enriched format.
    
    Takes the raw JSON from GoCardless and extracts/formats all the
    fields we need for Notion, plus adds enriched data like cardholder,
    category, and icon.
    
    Args:
        txn_raw: Raw transaction dict from GoCardless
        account_info: Account metadata dict
        booked_list: List of booked transactions (to determine status)
        
    Returns:
        Enriched transaction dict ready for Notion, or None if invalid
    """
    # Get transaction ID - required field
    transaction_id = txn_raw.get("internalTransactionId")
    
    if not transaction_id:
        logger.warning(f"Transaction missing ID, skipping: {txn_raw}")
        return None
    
    # ========================================
    # EXTRACT BASIC DATA
    # ========================================
    
    # Date (prefer bookingDate, fallback to valueDate)
    booking_date = txn_raw.get("bookingDate") or txn_raw.get("valueDate")
    
    # Amount and currency
    amount_data = txn_raw.get("transactionAmount", {})
    amount = float(amount_data.get("amount", 0))

    # Invert the amount (positive becomes negative, negative becomes positive)
    amount = invert_amount(amount)

    currency = amount_data.get("currency", "GBP")
    
    # ========================================
    # EXTRACT AND FORMAT NAMES
    # ========================================
    
    # Debtor name (who paid) - format to camel case
    debtor_name = to_camel_case(txn_raw.get("debtorName", ""))
    
    # Creditor name (who received) - format to camel case
    creditor_name = to_camel_case(txn_raw.get("creditorName", ""))
    
    # Merchant name (use creditor first, fallback to debtor)
    merchant_name = creditor_name or debtor_name or ""
    
    # ========================================
    # EXTRACT REMITTANCE INFO (DESCRIPTION)
    # ========================================
    
    # Some transactions have description in array, some in string
    remittance_array = txn_raw.get("remittanceInformationUnstructuredArray", [])
    remittance = to_camel_case(
        txn_raw.get("remittanceInformationUnstructured", "") or
        (remittance_array[0] if remittance_array else "")
    )
    
    # Transaction name - use remittance as the main description
    transaction_name = remittance or "Unknown Transaction"
    
    # ========================================
    # DETECT CARDHOLDER (FOR CREDIT CARDS)
    # ========================================
    
    cardholder = detect_cardholder(txn_raw, account_info['account_type'])
    if cardholder:
        logger.debug(f"Detected cardholder: {cardholder}")
    
    # ========================================
    # DETERMINE STATUS
    # ========================================
    
    # Check if this transaction is in the booked list
    status = "booked" if txn_raw in booked_list else "pending"
    payment_status = "Cleared" if txn_raw in booked_list else "Pending"

    
    # ========================================
    # BUILD ENRICHED TRANSACTION
    # ========================================
    
    enriched = {
        "transaction_id": transaction_id,
        "booking_date": booking_date,
        "amount": amount,
        "currency": currency,
        "merchant_name": merchant_name,
        "transaction_name": transaction_name,
        "status": status,
        "payment_status": payment_status,
        "account_id": account_info['account_id'],
        "last_four": account_info['last_four'],
        "account_type": account_info['account_type'],
        "institution_name": account_info['institution_name'],
        "cardholder": cardholder,
        "raw_data": txn_raw  # Keep raw data for debugging
    }
    
    # ========================================
    # DETECT CATEGORY AND ASSIGN ICON
    # ========================================
    
    # Detect category (must be done after enriched dict is created)
    category = detect_category(enriched)
    enriched['category'] = category
    
    # Assign icon based on category
    icon = assign_icon(enriched)
    enriched['icon'] = icon
    
    return enriched


def transform_transactions(raw_response, account_info):
    """
    Transform all transactions from raw API response.
    
    Processes both booked and pending transactions, enriching each one.
    
    Args:
        raw_response: Complete GoCardless API response
        account_info: Account metadata dict
        
    Returns:
        List of enriched transaction dicts
    """
    # Extract booked and pending lists
    booked = raw_response.get("transactions", {}).get("booked", [])
    pending = raw_response.get("transactions", {}).get("pending", [])
    
    logger.info(f"Account {account_info['last_four']}: {len(booked)} booked, {len(pending)} pending")
    
    # Process each transaction
    enriched_transactions = []
    
    for txn_raw in booked + pending:
        # Transform this transaction
        enriched = transform_transaction(txn_raw, account_info, booked)
        
        # Only add if transformation was successful
        if enriched:
            enriched_transactions.append(enriched)
    
    return enriched_transactions
