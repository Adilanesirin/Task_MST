// utils/sync.ts
import { getDatabase } from "./database";

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

// SQL-safe literal escape — used for execAsync which does not support bind params
const sqlEscape = (v: any): string => {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'number') return isNaN(v) ? '0' : String(v);
  return "'" + String(v).replace(/'/g, "''") + "'";
};
export const saveMasterData = async (data: any[]) => {
  const db = getDatabase();
  console.log(`💾 Saving ${data.length} master records...`);
  const startTime = Date.now();
  const validData = data.filter(item => item.code && item.name);

  try {
    try { await db.execAsync('ROLLBACK;'); } catch (_) { }

    await db.execAsync('DELETE FROM master_data;');

    const CHUNK_SIZE = 500;
    for (let i = 0; i < validData.length; i += CHUNK_SIZE) {
      const chunk = validData.slice(i, i + CHUNK_SIZE);
      const valueRows = chunk.map((item: any) =>
        `(${sqlEscape(item.code)},${sqlEscape(item.name)},${sqlEscape(item.place)})`
      ).join(',');
      await db.execAsync(
        `INSERT OR REPLACE INTO master_data (code, name, place) VALUES ${valueRows};`
      );
      console.log(`📊 Master progress: ${Math.min(i + CHUNK_SIZE, validData.length)}/${validData.length}`);
    }

    const verifyResult = await db.getFirstAsync('SELECT COUNT(*) as count FROM master_data') as { count: number };
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ Master saved: ${verifyResult?.count || 0} records in ${duration}s`);

  } catch (error) {
    console.error("❌ Error saving master data:", error);
    throw error;
  }
};

export const saveProductData = async (data: any[]) => {
  const db = getDatabase();
  console.log(`💾 Starting to save ${data.length} product records...`);
  const startTime = Date.now();
  const CHUNK_SIZE = 500;

  try {
    // Same ROLLBACK guard as saveMasterData
    try { await db.execAsync('ROLLBACK;'); } catch (_) { }

    // Delete existing product data (auto-commit)
    await db.execAsync('DELETE FROM product_data;');

    for (let i = 0; i < data.length; i += CHUNK_SIZE) {
      const chunk = data.slice(i, i + CHUNK_SIZE);
      const valueRows = chunk.map((item: any) => {
        const code = sqlEscape(item.code || item.product_code);
        const name = sqlEscape(item.name || item.product_name || 'Unknown');
        const barcode = sqlEscape(item.barcode || `CODE_${item.code}`);
        const qty = sqlEscape(typeof item.quantity === 'number' ? item.quantity : 0);
        const sp = sqlEscape(typeof item.salesprice === 'number' ? item.salesprice : 0);
        const bmrp = sqlEscape(typeof item.bmrp === 'number' ? item.bmrp : 0);
        const cost = sqlEscape(typeof item.cost === 'number' ? item.cost : 0);
        const batch = sqlEscape(item.batch_supplier);
        return `(${code},${name},${barcode},${qty},${sp},${bmrp},${cost},${batch})`;
      }).join(',');
      await db.execAsync(
        `INSERT OR REPLACE INTO product_data (code, name, barcode, quantity, salesprice, bmrp, cost, batch_supplier) VALUES ${valueRows};`
      );
      console.log(`✅ Product progress: ${Math.min(i + CHUNK_SIZE, data.length)} / ${data.length}`);
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ Product save completed: ${data.length} records in ${duration}s`);
    return { success: true, total: data.length };

  } catch (error) {
    console.error("❌ Error saving product data:", error);
    throw error;
  }
};

export const debugProductData = async () => {
  const db = getDatabase();
  try {
    console.log("\n🔍 === DEBUGGING PRODUCT DATA ===");
    const duplicates = await db.getAllAsync(`SELECT barcode, COUNT(*) as count FROM product_data GROUP BY barcode HAVING COUNT(*) > 1`) as Array<{ barcode: string, count: number }>;
    if (duplicates.length > 0) {
      console.log(`⚠️ Found ${duplicates.length} duplicate barcodes:`);
      duplicates.slice(0, 5).forEach(d => console.log(`  - Barcode: ${d.barcode}, Count: ${d.count}`));
    } else {
      console.log("✅ No duplicate barcodes found");
    }
    const total = await db.getFirstAsync('SELECT COUNT(*) as count FROM product_data') as { count: number };
    console.log(`📊 Total products: ${total.count}`);
    const nullBarcodes = await db.getFirstAsync('SELECT COUNT(*) as count FROM product_data WHERE barcode IS NULL OR barcode = ""') as { count: number };
    if (nullBarcodes.count > 0) console.log(`⚠️ Found ${nullBarcodes.count} products with null/empty barcodes`);
    const syntheticBarcodes = await db.getFirstAsync('SELECT COUNT(*) as count FROM product_data WHERE barcode LIKE "CODE_%"') as { count: number };
    if (syntheticBarcodes.count > 0) console.log(`ℹ️ Found ${syntheticBarcodes.count} products with synthetic barcodes`);
    const nullCodes = await db.getFirstAsync('SELECT COUNT(*) as count FROM product_data WHERE code IS NULL OR code = ""') as { count: number };
    if (nullCodes.count > 0) console.log(`⚠️ Found ${nullCodes.count} products with null/empty codes`);
    const samples = await db.getAllAsync('SELECT code, barcode, name FROM product_data LIMIT 3') as Array<{ code: string, barcode: string, name: string }>;
    console.log("🔍 Sample products:");
    samples.forEach(s => console.log(`  - Code: ${s.code}, Barcode: ${s.barcode}, Name: ${s.name}`));
    console.log("=== DEBUG COMPLETE ===\n");
    return { totalProducts: total.count, duplicateBarcodes: duplicates.length, nullBarcodes: nullBarcodes.count, syntheticBarcodes: syntheticBarcodes.count, nullCodes: nullCodes.count };
  } catch (error) {
    console.error("❌ Debug failed:", error);
    throw error;
  }
};

export const getLocalDataStats = async () => {
  const db = getDatabase();
  try {
    const masterCountResult = await db.getFirstAsync('SELECT COUNT(*) as count FROM master_data') as { count: number };
    const productCountResult = await db.getFirstAsync('SELECT COUNT(*) as count FROM product_data') as { count: number };
    const pendingStockCountsResult = await db.getFirstAsync('SELECT COUNT(*) as count FROM stock_count WHERE sync_status = ?', ['pending']) as { count: number };
    const lastSyncedResult = await db.getFirstAsync('SELECT last_synced FROM sync_info WHERE id = 1') as { last_synced: string } | null;
    return {
      masterCount: masterCountResult?.count || 0,
      productCount: productCountResult?.count || 0,
      pendingOrders: pendingStockCountsResult?.count || 0,
      lastSynced: lastSyncedResult?.last_synced || null
    };
  } catch (error) {
    console.error("❌ Error getting local stats:", error);
    return { masterCount: 0, productCount: 0, pendingOrders: 0, lastSynced: null };
  }
};

export const getPendingOrders = async () => {
  const db = getDatabase();
  try {
    const orders = await db.getAllAsync(
      `SELECT id, userid, itemcode, barcode, quantity, rate, mrp, order_date, sync_status, created_at, product_name, is_manual_entry
       FROM orders_to_sync WHERE sync_status = 'pending' ORDER BY created_at`
    ) as any[];
    console.log(`\n📊 Total pending orders fetched: ${orders.length}`);
    if (orders.length > 0) console.log("📊 Sample order:", orders[0]);
    return orders;
  } catch (error) {
    console.error("❌ Error getting pending orders:", error);
    throw error;
  }
};

export const markOrdersAsSynced = async () => {
  const db = getDatabase();
  try {
    const result = await db.runAsync('UPDATE orders_to_sync SET sync_status = ? WHERE sync_status = ?', ['synced', 'pending']);
    console.log("✅ Orders marked as synced");
    return result.changes;
  } catch (error) {
    console.error("❌ Error marking orders as synced:", error);
    throw error;
  }
};

export const updateLastSynced = async () => {
  const db = getDatabase();
  try {
    const now = new Date().toISOString();
    await db.runAsync('INSERT OR REPLACE INTO sync_info (id, last_synced) VALUES (1, ?)', [now]);
    console.log("✅ Last sync timestamp updated:", now);
  } catch (error) {
    console.error("❌ Error updating sync timestamp:", error);
    throw error;
  }
};

export const cleanupDuplicateOrders = async () => {
  const db = getDatabase();
  try {
    console.log("🧹 Cleaning up duplicate stock counts...");
    interface DuplicateRow { barcode: string; count_date: string; userid: string; duplicate_count: number; stock_ids: string; latest_quantity: number; latest_created_at: string; }
    const duplicates = await db.getAllAsync(`
      SELECT barcode, count_date, userid, COUNT(*) as duplicate_count, GROUP_CONCAT(id) as stock_ids, MAX(quantity) as latest_quantity, MAX(created_at) as latest_created_at
      FROM stock_count WHERE sync_status = 'pending' GROUP BY barcode, count_date, userid HAVING COUNT(*) > 1
    `) as DuplicateRow[];
    if (duplicates.length === 0) { console.log("✅ No duplicates found"); return 0; }
    let totalDeleted = 0;
    for (const duplicate of duplicates) {
      const stockIds = duplicate.stock_ids.split(',').map((id: string) => parseInt(id));
      const stockIdToKeep = stockIds[0];
      const stockIdsToDelete = stockIds.slice(1);
      await db.runAsync(`UPDATE stock_count SET quantity = ? WHERE id = ?`, [duplicate.latest_quantity, stockIdToKeep]);
      if (stockIdsToDelete.length > 0) {
        const placeholders = stockIdsToDelete.map(() => '?').join(',');
        await db.runAsync(`DELETE FROM stock_count WHERE id IN (${placeholders})`, stockIdsToDelete);
        totalDeleted += stockIdsToDelete.length;
      }
    }
    console.log(`✅ Cleanup complete: Removed ${totalDeleted} duplicate records`);
    return duplicates.length;
  } catch (error) {
    console.error("❌ Error cleaning up duplicates:", error);
    throw error;
  }
};

export const removeOrphanedStockCounts = async () => {
  const db = getDatabase();
  try {
    console.log("\n🧹 === CLEANING ORPHANED/INVALID STOCK COUNTS ===");
    const orphaned = await db.getAllAsync(`
      SELECT s.id, s.barcode, s.product_name, s.quantity, p.code
      FROM stock_count s LEFT JOIN product_data p ON s.barcode = p.barcode
      WHERE (p.code IS NULL OR p.code = s.barcode) AND s.sync_status = 'pending'
    `) as Array<{ id: number, barcode: string, product_name: string, quantity: number, code: string | null }>;
    if (orphaned.length === 0) { console.log("✅ No orphaned stock counts found"); return 0; }
    console.log(`⚠️ Found ${orphaned.length} orphaned stock count(s)`);
    const result = await db.runAsync(`
      DELETE FROM stock_count WHERE id IN (
        SELECT s.id FROM stock_count s LEFT JOIN product_data p ON s.barcode = p.barcode
        WHERE (p.code IS NULL OR p.code = s.barcode) AND s.sync_status = 'pending'
      )
    `);
    console.log(`✅ Removed ${result.changes} orphaned stock count(s)`);
    return result.changes;
  } catch (error) {
    console.error("❌ Error removing orphaned stock counts:", error);
    throw error;
  }
};

export const clearAllSyncData = async () => {
  const db = getDatabase();
  try {
    const syncedResult = await db.runAsync('DELETE FROM stock_count WHERE sync_status = ?', ['synced']);
    const syncInfoResult = await db.runAsync('DELETE FROM sync_info');
    console.log("✅ All synced data cleared");
    return { deletedStockCounts: syncedResult.changes, deletedSyncInfo: syncInfoResult.changes };
  } catch (error) {
    console.error("❌ Error clearing sync data:", error);
    throw error;
  }
};

export const runInitialCleanup = async () => {
  try {
    console.log("\n🔧 === RUNNING INITIAL CLEANUP ===");
    const cleanedDuplicates = await cleanupDuplicateOrders();
    const cleanedOrphans = await removeOrphanedStockCounts();
    console.log("=== INITIAL CLEANUP COMPLETE ===\n");
    return { duplicates: cleanedDuplicates, orphans: cleanedOrphans };
  } catch (error) {
    console.error("❌ Initial cleanup failed:", error);
    return { duplicates: 0, orphans: 0 };
  }
};