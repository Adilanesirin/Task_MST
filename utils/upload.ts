// utils/upload.ts - FIXED to use itemcode in 'item' and barcode in 'barcode'
import * as SecureStore from "expo-secure-store";
import { createEnhancedAPI } from "./api";


const sortChronologically = (items: any[]) => {
  return [...items].sort((a, b) => {
    const dateA = new Date(a.created_at || 0).getTime();
    const dateB = new Date(b.created_at || 0).getTime();
    if (dateA !== dateB) {
      return dateA - dateB;
    }
    return (a.id || 0) - (b.id || 0);
  });
};

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
    console.log("📤 Starting upload of", orders.length, "orders");
    
    const token = await SecureStore.getItemAsync("token");
    if (!token) {
      throw new Error("Authentication token not found. Please login again.");
    }

    const api = await createEnhancedAPI();
    
    const formattedOrders = orders.map((order, index) => {
      const isManualEntry = order.is_manual_entry === 1 || order.is_manual_entry === '1' || order.is_manual_entry === true;
      
      const formattedOrder: any = {
        supplier_code: order.supplier_code,
        user_id: order.userid,
        barcode: order.barcode,
        quantity: order.quantity,
        qty: order.quantity,   
        rate: order.rate,
        mrp: order.mrp,
        order_date: order.order_date, // ✅ correct field
        created_at: order.created_at,
        original_index: index,
        discount: 0,
        pnfcharges: 0,
        exceiseduty: 0,
        salestax: 0,
        freightcharge: 0,
        othercharges: 0,
        cessoned: 0,
        cess: 0,
        taxcode: 'NT',
        otype: 'O',                  // ✅ backend needs this
      };

      if (isManualEntry) {
        formattedOrder.code = order.barcode;
        formattedOrder.item = order.barcode || '';
        formattedOrder.ioflag = -100;
      } else {
        formattedOrder.code = order.itemcode; // ✅ correct field
        formattedOrder.item = order.itemcode || ''; 
        formattedOrder.ioflag = 0;
      }

      return formattedOrder;
    });

    const sortedOrders = sortChronologically(formattedOrders);

    const invalidOrders = sortedOrders.filter((o) => !o.code);
    if (invalidOrders.length > 0) {
      throw new Error(`${invalidOrders.length} orders missing itemcode. Cannot upload.`);
    }


    const res = await api.post("/upload-orders", { 
      orders: sortedOrders,
      total_orders: sortedOrders.length,
      transaction_type: 'ORDER',
      upload_sequence: 'chronological'
    });


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