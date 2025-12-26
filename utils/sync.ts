// utils/sync.ts - COMPLETE CODE FOR MST (Stock Taking)
import * as SQLite from "expo-sqlite";

const db = SQLite.openDatabaseSync("magicpedia.db");

// Type definition for stock count with product data
interface StockCountRow {
  id: number;
  product_name: string;
  scanned_barcode: string;
  product_barcode: string;
  quantity: number;
  count_date: string;
  userid: string;
  sync_status: string;
  created_at: string;
  itemcode: string;
  product_name_from_master: string;
  stock_quantity: number;
  salesprice: number;
  mrp: number;
  cost: number;
  batch_supplier: string | null;
}

// Save master data
export const saveMasterData = async (data: any[]) => {
  try {
    await db.withTransactionAsync(async () => {
      for (const item of data) {
        await db.runAsync(
          'INSERT OR REPLACE INTO master_data (code, name, place) VALUES (?, ?, ?)',
          [item.code, item.name, item.place || null]
        );
      }
    });
    console.log(`✅ Saved ${data.length} master records`);
  } catch (error) {
    console.error("❌ Error saving master data:", error);
    throw error;
  }
};

// Save product data
export const saveProductData = async (data: any[]) => {
  try {
    await db.withTransactionAsync(async () => {
      for (const item of data) {
        await db.runAsync(
          'INSERT OR REPLACE INTO product_data (code, name, barcode, quantity, salesprice, bmrp, cost, batch_supplier) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [
            item.code || item.product_code,
            item.name || item.product_name,
            item.barcode,
            item.quantity || item.stock || 0,
            item.salesprice || item.selling_price || 0,
            item.bmrp || item.mrp || 0,
            item.cost || item.purchase_price || 0,
            item.batch_supplier || item.supplier || null
          ]
        );
      }
    });
    console.log(`✅ Saved ${data.length} product records`);
  } catch (error) {
    console.error("❌ Error saving product data:", error);
    throw error;
  }
};

// Get local data statistics
export const getLocalDataStats = async () => {
  try {
    const masterCountResult = await db.getFirstAsync(
      'SELECT COUNT(*) as count FROM master_data'
    ) as {count: number};
    
    const productCountResult = await db.getFirstAsync(
      'SELECT COUNT(*) as count FROM product_data'
    ) as {count: number};
    
    const pendingStockCountsResult = await db.getFirstAsync(
      'SELECT COUNT(*) as count FROM stock_count WHERE sync_status = ?', 
      ['pending']
    ) as {count: number};
    
    const lastSyncedResult = await db.getFirstAsync(
      'SELECT last_synced FROM sync_info WHERE id = 1'
    ) as {last_synced: string} | null;

    return {
      masterCount: masterCountResult?.count || 0,
      productCount: productCountResult?.count || 0,
      pendingOrders: pendingStockCountsResult?.count || 0,
      lastSynced: lastSyncedResult?.last_synced || null
    };
  } catch (error) {
    console.error("❌ Error getting local stats:", error);
    return {
      masterCount: 0,
      productCount: 0,
      pendingOrders: 0,
      lastSynced: null
    };
  }
};

// 🎯 Get pending stock counts with itemcode and barcode separated
export const getPendingOrders = async () => {
  try {
    // JOIN with product_data to get the correct product code
    const stockCounts = await db.getAllAsync(
      `SELECT 
         s.id,
         s.product_name,
         s.barcode as scanned_barcode,
         s.quantity,
         s.count_date,
         s.userid,
         s.sync_status,
         s.created_at,
         p.code as itemcode,
         p.barcode as product_barcode,
         p.name as product_name_from_master,
         p.quantity as stock_quantity,
         p.salesprice,
         p.bmrp as mrp,
         p.cost,
         p.batch_supplier
       FROM stock_count s 
       LEFT JOIN product_data p ON s.barcode = p.barcode
       WHERE s.sync_status = ? 
       ORDER BY s.created_at`,
      ['pending']
    ) as StockCountRow[];
    
    console.log("\n📊 === getPendingOrders() DEBUG ===");
    console.log(`Total stock counts fetched: ${stockCounts.length}`);
    
    // 🚨 Check for missing product codes
    const missingProducts = stockCounts.filter(s => !s.itemcode);
    
    if (missingProducts.length > 0) {
      console.error(`\n❌ CRITICAL: ${missingProducts.length} stock counts without product match!`);
      console.error("Missing barcodes:", missingProducts.map(m => m.scanned_barcode).join(", "));
      
      // Show detailed error to user
      const barcodeList = missingProducts.map(m => m.scanned_barcode).join(", ");
      throw new Error(
        `Cannot upload: ${missingProducts.length} item(s) not found in product database.\n\n` +
        `Missing barcodes: ${barcodeList}\n\n` +
        `Solution: Please sync/download product data from server first, or remove these items from stock count.`
      );
    }
    
    if (stockCounts.length > 0) {
      console.log("\n🔍 First stock count:");
      const first = stockCounts[0];
      console.log("  - ID:", first.id);
      console.log("  - Product name:", first.product_name);
      console.log("  - itemcode (product code):", first.itemcode);
      console.log("  - scanned_barcode:", first.scanned_barcode);
      console.log("  - product_barcode:", first.product_barcode);
      console.log("  - quantity:", first.quantity);
      console.log("  - userid:", first.userid);
      
      if (!first.itemcode) {
        console.error("❌ CRITICAL: No itemcode found for barcode:", first.scanned_barcode);
      } else {
        console.log("✅ Valid itemcode found:", first.itemcode);
        console.log("✅ Will upload: item =", first.itemcode, ", barcode =", first.scanned_barcode);
      }
    }
    
    // 🎯 Map to clean format with SEPARATE itemcode and barcode columns
    const formattedOrders = stockCounts.map((stock: StockCountRow) => ({
      id: stock.id,
      product_name: stock.product_name || stock.product_name_from_master,
      itemcode: stock.itemcode,           // ✅ Product code (e.g., "00073")
      barcode: stock.scanned_barcode,     // ✅ Full barcode (e.g., "00073002 : 1")
      quantity: stock.quantity,
      count_date: stock.count_date,
      order_date: stock.count_date,
      userid: stock.userid,
      sync_status: stock.sync_status,
      created_at: stock.created_at,
      mrp: stock.mrp || 0,
      salesprice: stock.salesprice || 0,
      cost: stock.cost || 0,
      stock_quantity: stock.stock_quantity || 0,
      batch_supplier: stock.batch_supplier
    }));
    
    console.log(`\n✅ Processed ${formattedOrders.length} stock counts`);
    console.log("📊 Sample formatted order:");
    if (formattedOrders.length > 0) {
      console.log("   - itemcode (will go to 'item' column):", formattedOrders[0].itemcode);
      console.log("   - barcode (will go to 'barcode' column):", formattedOrders[0].barcode);
    }
    console.log("📊 === END DEBUG ===\n");
    
    return formattedOrders;
  } catch (error) {
    console.error("❌ Error getting pending stock counts:", error);
    throw error;
  }
};

// Mark stock counts as synced
export const markOrdersAsSynced = async () => {
  try {
    const result = await db.runAsync(
      'UPDATE stock_count SET sync_status = ? WHERE sync_status = ?',
      ['synced', 'pending']
    );
    
    console.log("✅ Stock counts marked as synced");
    console.log(`   Affected rows: ${result.changes}`);
    
    return result.changes;
  } catch (error) {
    console.error("❌ Error marking stock counts as synced:", error);
    throw error;
  }
};

// Update last synced timestamp
export const updateLastSynced = async () => {
  try {
    const now = new Date().toISOString();
    await db.runAsync(
      'INSERT OR REPLACE INTO sync_info (id, last_synced) VALUES (1, ?)',
      [now]
    );
    console.log("✅ Last sync timestamp updated:", now);
  } catch (error) {
    console.error("❌ Error updating sync timestamp:", error);
    throw error;
  }
};

// Clean up duplicate stock counts
export const cleanupDuplicateOrders = async () => {
  try {
    console.log("🧹 Cleaning up duplicate stock counts...");
    
    interface DuplicateRow {
      barcode: string;
      count_date: string;
      userid: string;
      duplicate_count: number;
      stock_ids: string;
      latest_quantity: number;
      latest_created_at: string;
    }
    
    const duplicates = await db.getAllAsync(`
      SELECT 
        barcode, 
        count_date, 
        userid, 
        COUNT(*) as duplicate_count,
        GROUP_CONCAT(id) as stock_ids,
        MAX(quantity) as latest_quantity,
        MAX(created_at) as latest_created_at
      FROM stock_count 
      WHERE sync_status = 'pending'
      GROUP BY barcode, count_date, userid
      HAVING COUNT(*) > 1
    `) as DuplicateRow[];

    console.log(`Found ${duplicates.length} sets of duplicates to clean up`);

    if (duplicates.length === 0) {
      console.log("✅ No duplicates found");
      return 0;
    }

    let totalDeleted = 0;

    for (const duplicate of duplicates) {
      const stockIds = duplicate.stock_ids.split(',').map((id: string) => parseInt(id));
      
      console.log(`\nProcessing duplicates for barcode: ${duplicate.barcode}`);
      console.log(`  - Found ${duplicate.duplicate_count} duplicates`);
      
      const stockIdToKeep = stockIds[0];
      const stockIdsToDelete = stockIds.slice(1);
      
      await db.runAsync(
        `UPDATE stock_count 
         SET quantity = ? 
         WHERE id = ?`,
        [duplicate.latest_quantity, stockIdToKeep]
      );
      
      if (stockIdsToDelete.length > 0) {
        const placeholders = stockIdsToDelete.map(() => '?').join(',');
        await db.runAsync(
          `DELETE FROM stock_count 
           WHERE id IN (${placeholders})`,
          stockIdsToDelete
        );
        
        totalDeleted += stockIdsToDelete.length;
      }
    }
    
    console.log(`\n✅ Cleanup complete: Removed ${totalDeleted} duplicate records`);
    
    return duplicates.length;
  } catch (error) {
    console.error("❌ Error cleaning up duplicate stock counts:", error);
    throw error;
  }
};

// 🆕 Remove stock counts that don't have valid product codes
export const removeOrphanedStockCounts = async () => {
  try {
    console.log("\n🧹 === CLEANING ORPHANED/INVALID STOCK COUNTS ===");
    
    // Find stock counts without matching products OR where code equals barcode (invalid data)
    const orphaned = await db.getAllAsync(`
      SELECT s.id, s.barcode, s.product_name, s.quantity, p.code
      FROM stock_count s
      LEFT JOIN product_data p ON s.barcode = p.barcode
      WHERE (p.code IS NULL OR p.code = s.barcode) AND s.sync_status = 'pending'
    `) as Array<{id: number, barcode: string, product_name: string, quantity: number, code: string | null}>;

    if (orphaned.length === 0) {
      console.log("✅ No orphaned/invalid stock counts found");
      return 0;
    }

    console.log(`⚠️ Found ${orphaned.length} orphaned/invalid stock count(s):`);
    orphaned.forEach(item => {
      if (!item.code) {
        console.log(`   - ID: ${item.id}, Barcode: ${item.barcode} [NO PRODUCT MATCH]`);
      } else if (item.code === item.barcode) {
        console.log(`   - ID: ${item.id}, Barcode: ${item.barcode} [INVALID: code equals barcode]`);
      }
    });

    // Delete orphaned/invalid entries
    const result = await db.runAsync(`
      DELETE FROM stock_count 
      WHERE id IN (
        SELECT s.id 
        FROM stock_count s
        LEFT JOIN product_data p ON s.barcode = p.barcode
        WHERE (p.code IS NULL OR p.code = s.barcode) AND s.sync_status = 'pending'
      )
    `);

    console.log(`✅ Removed ${result.changes} orphaned/invalid stock count(s)`);
    console.log("=== CLEANUP COMPLETE ===\n");

    return result.changes;
  } catch (error) {
    console.error("❌ Error removing orphaned stock counts:", error);
    throw error;
  }
};

// Clear all sync data
export const clearAllSyncData = async () => {
  try {
    const syncedResult = await db.runAsync(
      'DELETE FROM stock_count WHERE sync_status = ?',
      ['synced']
    );
    
    const syncInfoResult = await db.runAsync('DELETE FROM sync_info');
    
    console.log("✅ All synced data cleared");
    console.log(`   Deleted ${syncedResult.changes} synced stock counts`);
    
    return {
      deletedStockCounts: syncedResult.changes,
      deletedSyncInfo: syncInfoResult.changes
    };
  } catch (error) {
    console.error("❌ Error clearing sync data:", error);
    throw error;
  }
};

// Run initial cleanup (duplicates + orphaned entries)
export const runInitialCleanup = async () => {
  try {
    console.log("\n🔧 === RUNNING INITIAL CLEANUP ===");
    
    // Clean duplicates
    const cleanedDuplicates = await cleanupDuplicateOrders();
    if (cleanedDuplicates > 0) {
      console.log(`✅ Cleaned up ${cleanedDuplicates} sets of duplicates`);
    }
    
    // Clean orphaned entries
    const cleanedOrphans = await removeOrphanedStockCounts();
    if (cleanedOrphans > 0) {
      console.log(`✅ Removed ${cleanedOrphans} orphaned entries`);
    }
    
    console.log("=== INITIAL CLEANUP COMPLETE ===\n");
    
    return {
      duplicates: cleanedDuplicates,
      orphans: cleanedOrphans
    };
  } catch (error) {
    console.error("❌ Initial cleanup failed:", error);
    return {
      duplicates: 0,
      orphans: 0
    };
  }
};