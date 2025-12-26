// utils/upload.ts - FIXED to use itemcode in 'item' and barcode in 'barcode'
import * as SecureStore from "expo-secure-store";
import { createEnhancedAPI } from "./api";

// Helper function to get user ID from SecureStore
async function getCurrentUserId(): Promise<string> {
  let userId = await SecureStore.getItemAsync("user_id");
  
  if (userId) {
    console.log(`✅ Found user_id: "${userId}"`);
    return userId;
  }
  
  const fallbackKeys = ["userid", "userId", "username", "user"];
  
  for (const key of fallbackKeys) {
    const value = await SecureStore.getItemAsync(key);
    if (value) {
      console.log(`✅ Found user with fallback key "${key}": "${value}"`);
      return value;
    }
  }
  
  console.warn("⚠️ No user ID found in SecureStore!");
  return "UNKNOWN_USER";
}

export async function uploadPendingOrders(orders: any[]) {
  try {
    console.log("\n🔥 === UPLOAD STARTED ===");
    console.log(`📤 Uploading ${orders.length} stock counts`);
    
    // Check authentication
    const token = await SecureStore.getItemAsync("token");
    if (!token) {
      throw new Error("Authentication token not found. Please login again.");
    }

    const currentUser = await getCurrentUserId();
    console.log("👤 Current user:", currentUser);

    const api = await createEnhancedAPI();
    
    // 🎯 DEBUG: Check what we're about to send
    console.log("\n🔍 === FIRST ORDER ANALYSIS ===");
    if (orders.length > 0) {
      const first = orders[0];
      console.log("Order object keys:", Object.keys(first));
      console.log("📦 itemcode:", first.itemcode);
      console.log("📦 barcode:", first.barcode);
      console.log("📦 product_name:", first.product_name);
      console.log("📦 quantity:", first.quantity);
      console.log("📦 userid:", first.userid);
      
      // Validation checks
      if (!first.itemcode) {
        console.error("❌ CRITICAL ERROR: itemcode is missing!");
        throw new Error("Cannot upload: itemcode is missing");
      } else if (first.itemcode === first.barcode) {
        console.error("❌ CRITICAL ERROR: itemcode equals barcode!");
        console.error("   itemcode should be product code, not full barcode");
        throw new Error("Invalid data: itemcode should not equal barcode");
      } else if (first.itemcode.length > 10 && /^\d+$/.test(first.itemcode)) {
        console.warn("⚠️ WARNING: itemcode looks like barcode (long number)");
      } else {
        console.log("✅ itemcode looks valid (short product code)");
      }
      
      if (!first.barcode) {
        console.error("❌ WARNING: barcode is missing!");
      }
    }
    console.log("🔍 === END ANALYSIS ===\n");
    
    // 🎯 Format for API - Map fields correctly
    const formattedOrders = orders.map((order, index) => {
      const userId = order.userid || currentUser;
      
      // Validate itemcode
      if (!order.itemcode) {
        console.error(`❌ Order ${index + 1}: Missing itemcode for barcode ${order.barcode}`);
        throw new Error(`Order ${index + 1} missing itemcode`);
      }
      
      return {
        item: order.itemcode,        // ✅ Product code (e.g., "00073")
        barcode: order.barcode || "", // ✅ Full barcode (e.g., "00073002 : 1")
        qty: order.quantity || 0,
        remark: "Stock Count Entry",
        date1: order.count_date || order.order_date || new Date().toISOString().split('T')[0],
        text1: userId,
        mrp: order.mrp || 0
      };
    });

    // Final validation before upload
    console.log("\n🔍 === VALIDATING FORMATTED ORDERS ===");
    const invalidOrders = formattedOrders.filter((o, idx) => {
      const hasItem = !!o.item;
      const itemEqualsBarcode = o.item === o.barcode;
      
      if (!hasItem) {
        console.error(`❌ Order ${idx + 1}: Missing 'item' field`);
        return true;
      }
      
      if (itemEqualsBarcode) {
        console.error(`❌ Order ${idx + 1}: item equals barcode (${o.item})`);
        return true;
      }
      
      return false;
    });
    
    if (invalidOrders.length > 0) {
      console.error(`\n❌ CRITICAL: ${invalidOrders.length} orders have invalid itemcode!`);
      console.error("Invalid orders:", JSON.stringify(invalidOrders, null, 2));
      throw new Error(`${invalidOrders.length} orders missing valid product code. Cannot upload.`);
    }
    
    console.log(`✅ All ${formattedOrders.length} orders validated successfully`);
    console.log("=== VALIDATION COMPLETE ===\n");

    console.log("\n📦 === ALL FORMATTED ORDERS ===");
    formattedOrders.forEach((order, idx) => {
      console.log(`\nOrder ${idx + 1}:`);
      console.log(`  item: "${order.item}"`);
      console.log(`  barcode: "${order.barcode}"`);
      console.log(`  qty: ${order.qty}`);
      console.log(`  Match: ${order.item === order.barcode ? '❌ SAME' : '✅ DIFFERENT'}`);
    });
    console.log("\n📦 === END ALL ORDERS ===\n");
    
    console.log(`👤 Uploading as user: ${formattedOrders[0]?.text1}`);
    console.log(`📤 Sending ${formattedOrders.length} orders to /upload-orders`);

    // Send to API
    const res = await api.post("/upload-orders", { 
      orders: formattedOrders
    });

    console.log("✅ Upload response:", res.data);
    console.log("🔥 === UPLOAD COMPLETED ===\n");

    return {
      success: true,
      message: res.data?.message || "Orders uploaded successfully",
      uploaded_count: formattedOrders.length,
      status: "success"
    };
    
  } catch (error: any) {
    console.error("\n❌ === UPLOAD FAILED ===");
    console.error("Error:", error.response?.data || error.message);
    console.error("=== END ERROR ===\n");
    
    if (error.response?.status === 401) {
      throw new Error("Authentication failed. Please login again.");
    } else if (error.response?.status === 400) {
      throw new Error("Invalid data: " + (error.response.data?.message || "Check your data"));
    } else if (error.code === "NETWORK_ERROR") {
      throw new Error("Network error. Check your connection.");
    } else {
      throw new Error(error.message || "Upload failed");
    }
  }
}

// Alternative batch upload (backward compatibility)
export async function uploadOrdersBatch(orders: any[]) {
  try {
    const token = await SecureStore.getItemAsync("token");
    if (!token) {
      throw new Error("Authentication required");
    }

    const api = await createEnhancedAPI();
    
    const response = await api.post("/api/orders/batch", {
      orders: orders,
      sync_timestamp: new Date().toISOString()
    });

    return response.data;
  } catch (error: any) {
    console.error("Batch upload error:", error);
    throw error;
  }
}