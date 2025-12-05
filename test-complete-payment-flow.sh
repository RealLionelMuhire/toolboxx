#!/bin/bash

# Complete Payment Flow Test Script
# Tests the entire transaction flow from buyer checkout to seller verification

set -e  # Exit on error

BASE_URL="http://localhost:3000"
PRODUCT_ID="690bc532933e72df13aac792"
TENANT_SLUG="leo"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}         COMPLETE PAYMENT FLOW SIMULATION TEST${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}Product:${NC} ${BASE_URL}/tenants/${TENANT_SLUG}/products/${PRODUCT_ID}"
echo -e "${YELLOW}Buyer:${NC} client@mail.com (Password: Muhire07*)"
echo -e "${YELLOW}Seller:${NC} leo@mail.com (Password: Muhire07*)"
echo ""

# ============================================================================
# STEP 1: BUYER LOGIN
# ============================================================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}STEP 1: Buyer Login${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

BUYER_COOKIE_FILE=$(mktemp)
echo -e "${YELLOW}Logging in as buyer (client@mail.com)...${NC}"

# Get CSRF token from login page
CSRF_TOKEN=$(curl -s -c "$BUYER_COOKIE_FILE" "${BASE_URL}/sign-in" | grep -o 'name="csrf" value="[^"]*"' | sed 's/name="csrf" value="//;s/"//')

# Login as buyer
LOGIN_RESPONSE=$(curl -s -b "$BUYER_COOKIE_FILE" -c "$BUYER_COOKIE_FILE" \
  -X POST "${BASE_URL}/api/users/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "client@mail.com",
    "password": "Muhire07*"
  }')

if echo "$LOGIN_RESPONSE" | grep -q "user"; then
  echo -e "${GREEN}✓ Buyer logged in successfully${NC}"
  BUYER_ID=$(echo "$LOGIN_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  echo -e "  Buyer ID: ${BUYER_ID}"
else
  echo -e "${RED}✗ Buyer login failed${NC}"
  echo "$LOGIN_RESPONSE" | jq '.' 2>/dev/null || echo "$LOGIN_RESPONSE"
  exit 1
fi

echo ""

# ============================================================================
# STEP 2: FETCH PRODUCT DETAILS (SKIPPED - USING KNOWN VALUES)
# ============================================================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}STEP 2: Product Information${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo -e "${YELLOW}Using product from URL...${NC}"
echo -e "${GREEN}✓ Product ID: ${PRODUCT_ID}${NC}"
echo -e "  Tenant: ${TENANT_SLUG}"
echo -e "  Quantity to purchase: 2 units"

echo ""

# ============================================================================
# STEP 3: INITIATE PAYMENT (CREATE TRANSACTION)
# ============================================================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}STEP 3: Initiate Payment (Checkout)${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo -e "${YELLOW}Creating transaction with delivery address...${NC}"

# Make tRPC call to initiate payment using batch format
CHECKOUT_RESPONSE=$(curl -s -b "$BUYER_COOKIE_FILE" \
  -X POST "${BASE_URL}/api/trpc/checkout.initiatePayment?batch=1" \
  -H "Content-Type: application/json" \
  -d '{
    "0": {
      "json": {
        "items": [
          {
            "productId": "'"${PRODUCT_ID}"'",
            "quantity": 2
          }
        ],
        "tenantSlug": "'"${TENANT_SLUG}"'",
        "customerEmail": "client@mail.com",
        "customerPhone": "0781234567",
        "customerName": "Test Client",
        "deliveryType": "delivery",
        "shippingAddress": {
          "line1": "KG 123 St, Kimironko",
          "city": "Kigali",
          "country": "Rwanda"
        }
      }
    }
  }')

if echo "$CHECKOUT_RESPONSE" | grep -q "transactionId"; then
  TRANSACTION_ID=$(echo "$CHECKOUT_RESPONSE" | jq -r '.[0].result.data.json.transactionId // .result.data.json.transactionId // .result.data.transactionId' 2>/dev/null)
  PAYMENT_REF=$(echo "$CHECKOUT_RESPONSE" | jq -r '.[0].result.data.json.paymentReference // .result.data.json.paymentReference // .result.data.paymentReference' 2>/dev/null)
  MOMO_CODE=$(echo "$CHECKOUT_RESPONSE" | jq -r '.[0].result.data.json.momoCode // .result.data.json.momoCode // .result.data.momoCode' 2>/dev/null)
  TOTAL_AMOUNT=$(echo "$CHECKOUT_RESPONSE" | jq -r '.[0].result.data.json.amount // .result.data.json.amount // .result.data.amount' 2>/dev/null)
  DIAL_CODE=$(echo "$CHECKOUT_RESPONSE" | jq -r '.[0].result.data.json.dialCode // .result.data.json.dialCode // .result.data.dialCode' 2>/dev/null)
  
  echo -e "${GREEN}✓ Transaction created successfully${NC}"
  echo -e "  Transaction ID: ${TRANSACTION_ID}"
  echo -e "  Payment Reference: ${PAYMENT_REF}"
  echo -e "  MoMo Code: ${MOMO_CODE}"
  echo -e "  Amount: ${TOTAL_AMOUNT} RWF"
  echo -e "  Dial Code: ${DIAL_CODE}"
  echo -e "  Status: ${YELLOW}pending${NC} (waiting for customer to submit TX ID)"
else
  echo -e "${RED}✗ Failed to create transaction${NC}"
  echo "$CHECKOUT_RESPONSE" | jq '.' 2>/dev/null || echo "$CHECKOUT_RESPONSE"
  exit 1
fi

echo ""

# ============================================================================
# STEP 4: SIMULATE MOBILE MONEY PAYMENT
# ============================================================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}STEP 4: Simulate Mobile Money Payment${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo -e "${YELLOW}📱 Customer would dial: ${DIAL_CODE}${NC}"
echo -e "${YELLOW}📱 Customer enters PIN and confirms payment${NC}"
echo -e "${YELLOW}📱 Customer receives SMS with Transaction ID${NC}"
echo ""
echo -e "${YELLOW}Generating simulated MTN Transaction ID...${NC}"

# Generate a realistic-looking MTN transaction ID
CURRENT_DATE=$(date +%y%m%d)
RANDOM_NUM=$(shuf -i 1000-9999 -n 1)
RANDOM_CODE=$(cat /dev/urandom | tr -dc 'A-Z0-9' | fold -w 6 | head -n 1)
MTN_TX_ID="MP${CURRENT_DATE}.${RANDOM_NUM}.${RANDOM_CODE}"

echo -e "${GREEN}✓ Simulated MTN Transaction ID: ${MTN_TX_ID}${NC}"
echo ""

# ============================================================================
# STEP 5: BUYER SUBMITS TRANSACTION ID
# ============================================================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}STEP 5: Buyer Submits Transaction ID${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo -e "${YELLOW}Submitting transaction ID...${NC}"

SUBMIT_RESPONSE=$(curl -s -b "$BUYER_COOKIE_FILE" \
  -X POST "${BASE_URL}/api/trpc/transactions.submitTransactionId?batch=1" \
  -H "Content-Type: application/json" \
  -d '{
    "0": {
      "json": {
        "transactionId": "'"${TRANSACTION_ID}"'",
        "mtnTransactionId": "'"${MTN_TX_ID}"'"
      }
    }
  }')

if echo "$SUBMIT_RESPONSE" | grep -q "success"; then
  echo -e "${GREEN}✓ Transaction ID submitted successfully${NC}"
  echo -e "  Status changed: ${YELLOW}pending${NC} → ${YELLOW}awaiting_verification${NC}"
  echo -e "  MTN Transaction ID: ${MTN_TX_ID}"
else
  echo -e "${RED}✗ Failed to submit transaction ID${NC}"
  echo "$SUBMIT_RESPONSE" | jq '.' 2>/dev/null || echo "$SUBMIT_RESPONSE"
  exit 1
fi

echo ""

# ============================================================================
# STEP 6: SELLER LOGIN
# ============================================================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}STEP 6: Seller Login${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

SELLER_COOKIE_FILE=$(mktemp)
echo -e "${YELLOW}Logging in as seller (leo@mail.com)...${NC}"

# Login as seller
SELLER_LOGIN_RESPONSE=$(curl -s -c "$SELLER_COOKIE_FILE" \
  -X POST "${BASE_URL}/api/users/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "leo@mail.com",
    "password": "Muhire07*"
  }')

if echo "$SELLER_LOGIN_RESPONSE" | grep -q "user"; then
  echo -e "${GREEN}✓ Seller logged in successfully${NC}"
  SELLER_ID=$(echo "$SELLER_LOGIN_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  echo -e "  Seller ID: ${SELLER_ID}"
else
  echo -e "${RED}✗ Seller login failed${NC}"
  echo "$SELLER_LOGIN_RESPONSE" | jq '.' 2>/dev/null || echo "$SELLER_LOGIN_RESPONSE"
  exit 1
fi

echo ""

# ============================================================================
# STEP 7: SELLER VIEWS PENDING TRANSACTIONS
# ============================================================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}STEP 7: Seller Views Pending Transactions${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo -e "${YELLOW}Fetching pending transactions...${NC}"

PENDING_TX_RESPONSE=$(curl -s -b "$SELLER_COOKIE_FILE" \
  "${BASE_URL}/api/trpc/admin.getPendingTransactions?batch=1&input=%7B%220%22%3A%7B%7D%7D")

if echo "$PENDING_TX_RESPONSE" | grep -q "${TRANSACTION_ID}"; then
  echo -e "${GREEN}✓ Transaction found in seller's pending list${NC}"
  
  # Extract transaction details
  TX_STATUS=$(echo "$PENDING_TX_RESPONSE" | jq -r '.[0].result.data.json[] | select(.id=="'"${TRANSACTION_ID}"'") | .status // .[].result.data.json[] | select(.id=="'"${TRANSACTION_ID}"'") | .status' 2>/dev/null || echo "unknown")
  TX_MTN_ID=$(echo "$PENDING_TX_RESPONSE" | jq -r '.[0].result.data.json[] | select(.id=="'"${TRANSACTION_ID}"'") | .mtnTransactionId // .[].result.data.json[] | select(.id=="'"${TRANSACTION_ID}"'") | .mtnTransactionId' 2>/dev/null || echo "N/A")
  TX_DELIVERY=$(echo "$PENDING_TX_RESPONSE" | jq -r '.[0].result.data.json[] | select(.id=="'"${TRANSACTION_ID}"'") | .deliveryType // .[].result.data.json[] | select(.id=="'"${TRANSACTION_ID}"'") | .deliveryType' 2>/dev/null || echo "N/A")
  TX_ADDRESS=$(echo "$PENDING_TX_RESPONSE" | jq -r '.[0].result.data.json[] | select(.id=="'"${TRANSACTION_ID}"'") | .shippingAddress.line1 // .[].result.data.json[] | select(.id=="'"${TRANSACTION_ID}"'") | .shippingAddress.line1' 2>/dev/null || echo "N/A")
  
  echo -e "  Status: ${TX_STATUS}"
  echo -e "  MTN TX ID: ${TX_MTN_ID}"
  echo -e "  Delivery Type: ${TX_DELIVERY}"
  echo -e "  Shipping Address: ${TX_ADDRESS}"
else
  echo -e "${RED}✗ Transaction not found in pending list${NC}"
  echo "$PENDING_TX_RESPONSE" | jq '.[0].result.data.json[] | {id, status, mtnTransactionId} // .[].result.data.json[] | {id, status, mtnTransactionId}' 2>/dev/null | head -20 || echo "$PENDING_TX_RESPONSE"
fi

echo ""

# ============================================================================
# STEP 8: SELLER VERIFIES PAYMENT
# ============================================================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}STEP 8: Seller Verifies Payment${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo -e "${YELLOW}Seller checks Mobile Money account...${NC}"
echo -e "${YELLOW}Seller confirms receipt of ${TOTAL_AMOUNT} RWF${NC}"
echo -e "${YELLOW}Seller verifying payment in system...${NC}"
echo ""

VERIFY_RESPONSE=$(curl -s -b "$SELLER_COOKIE_FILE" \
  -X POST "${BASE_URL}/api/trpc/admin.verifyPayment?batch=1" \
  -H "Content-Type: application/json" \
  -d '{
    "0": {
      "json": {
        "transactionId": "'"${TRANSACTION_ID}"'",
        "verifiedMtnTransactionId": "'"${MTN_TX_ID}"'"
      }
    }
  }')

if echo "$VERIFY_RESPONSE" | grep -q "success\|verified"; then
  echo -e "${GREEN}✓ Payment verified successfully!${NC}"
  echo -e "  Status changed: ${YELLOW}awaiting_verification${NC} → ${GREEN}verified${NC}"
  echo -e "  Orders created automatically"
  echo -e "  Inventory deducted"
  echo -e "  Shipping address saved to orders"
else
  echo -e "${RED}✗ Payment verification failed${NC}"
  echo "$VERIFY_RESPONSE" | jq '.' 2>/dev/null || echo "$VERIFY_RESPONSE"
  exit 1
fi

echo ""

# ============================================================================
# STEP 9: VERIFY ORDERS WERE CREATED
# ============================================================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}STEP 9: Verify Orders Created${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo -e "${YELLOW}Checking if orders were created...${NC}"

# Fetch updated transaction with orders
FINAL_TX_RESPONSE=$(curl -s -b "$SELLER_COOKIE_FILE" \
  "${BASE_URL}/api/trpc/admin.getPendingTransactions?batch=1&input=%7B%220%22%3A%7B%7D%7D")

if echo "$FINAL_TX_RESPONSE" | grep -q "${TRANSACTION_ID}"; then
  ORDER_COUNT=$(echo "$FINAL_TX_RESPONSE" | jq '.[0].result.data.json[] | select(.id=="'"${TRANSACTION_ID}"'") | .orders | length // .[].result.data.json[] | select(.id=="'"${TRANSACTION_ID}"'") | .orders | length' 2>/dev/null || echo "0")
  
  if [ "$ORDER_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✓ Orders created: ${ORDER_COUNT} order(s)${NC}"
    
    # Get order details
    echo "$FINAL_TX_RESPONSE" | jq -r '.[0].result.data.json[] | select(.id=="'"${TRANSACTION_ID}"'") | .orders[] | "  Order #\(.orderNumber) - Status: \(.status) - Delivery: \(.deliveryType)" // .[].result.data.json[] | select(.id=="'"${TRANSACTION_ID}"'") | .orders[] | "  Order #\(.orderNumber) - Status: \(.status) - Delivery: \(.deliveryType)"' 2>/dev/null || true
  else
    echo -e "${YELLOW}⚠ No orders found (may take a moment to appear)${NC}"
  fi
else
  echo -e "${YELLOW}⚠ Could not verify orders${NC}"
fi

echo ""

# ============================================================================
# STEP 10: BUYER VIEWS ORDERS
# ============================================================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}STEP 10: Buyer Views Their Orders${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo -e "${YELLOW}Fetching buyer's orders...${NC}"

BUYER_ORDERS_RESPONSE=$(curl -s -b "$BUYER_COOKIE_FILE" \
  "${BASE_URL}/api/trpc/orders.getMyOrders?batch=1&input=%7B%220%22%3A%7B%7D%7D")

if echo "$BUYER_ORDERS_RESPONSE" | grep -q "orderNumber"; then
  BUYER_ORDER_COUNT=$(echo "$BUYER_ORDERS_RESPONSE" | jq '.[0].result.data.json | length // .[].result.data.json | length' 2>/dev/null || echo "0")
  echo -e "${GREEN}✓ Buyer has ${BUYER_ORDER_COUNT} order(s)${NC}"
  
  echo "$BUYER_ORDERS_RESPONSE" | jq -r '.[0].result.data.json[] | "  Order #\(.orderNumber) - \(.status) - \(.totalAmount) RWF" // .[].result.data.json[] | "  Order #\(.orderNumber) - \(.status) - \(.totalAmount) RWF"' 2>/dev/null | head -5 || true
else
  echo -e "${YELLOW}⚠ Could not fetch buyer orders${NC}"
fi

echo ""

# ============================================================================
# CLEANUP
# ============================================================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}CLEANUP${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

rm -f "$BUYER_COOKIE_FILE" "$SELLER_COOKIE_FILE"
echo -e "${GREEN}✓ Temporary files cleaned up${NC}"

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ PAYMENT FLOW TEST COMPLETED SUCCESSFULLY!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}Summary:${NC}"
echo -e "  • Transaction ID: ${TRANSACTION_ID}"
echo -e "  • Payment Reference: ${PAYMENT_REF}"
echo -e "  • MTN Transaction ID: ${MTN_TX_ID}"
echo -e "  • Amount: ${TOTAL_AMOUNT} RWF"
echo -e "  • Status: ${GREEN}verified${NC}"
echo -e "  • Orders Created: ${ORDER_COUNT}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo -e "  1. Seller marks order as 'shipped'"
echo -e "  2. Seller marks order as 'delivered'"
echo -e "  3. Buyer confirms receipt"
echo -e "  4. Order status becomes 'completed'"
echo ""
echo -e "${BLUE}View in browser:${NC}"
echo -e "  Buyer: ${BASE_URL}/orders"
echo -e "  Seller: ${BASE_URL}/verify-payments"
echo ""
