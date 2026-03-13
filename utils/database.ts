// utils/database.ts
import * as SQLite from "expo-sqlite";

// Track database instances to prevent multiple connections
let dbInstance: SQLite.SQLiteDatabase | null = null;
let isInitializing = false;

export const getDatabase = (): SQLite.SQLiteDatabase => {
  if (!dbInstance) {
    dbInstance = SQLite.openDatabaseSync("magicpedia.db");
    // WAL mode allows concurrent reads + writes without locking
    try {
      dbInstance.execSync("PRAGMA journal_mode=WAL;");
      dbInstance.execSync("PRAGMA busy_timeout=30000;");
    } catch (_) { }
    console.log("✅ New database connection created");
  }
  return dbInstance;
};

export const closeDatabase = () => {
  if (dbInstance) {
    try {
      dbInstance.closeSync();
    } catch (_) { }
    dbInstance = null;
    console.log("✅ Database connection released");
  }
};

export const initDatabase = async () => {
  // Prevent multiple simultaneous initializations
  if (isInitializing) {
    console.log("⚠️ Database initialization already in progress");
    return;
  }

  isInitializing = true;
  const db = getDatabase();

  try {
    // Check if batch_supplier column exists in product_data
    let batchSupplierExists = false;
    try {
      const checkResult = await db.getAllAsync(
        "PRAGMA table_info(product_data)"
      ) as any[];

      if (checkResult && Array.isArray(checkResult)) {
        batchSupplierExists = checkResult.some(
          (column: any) => column.name === "batch_supplier"
        );
      }
    } catch (e) {
      console.log("📋 Table might not exist yet, will create it");
    }

    // ✅ Create all tables including stock_count
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS master_data (
        code TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        place TEXT
      );

      CREATE TABLE IF NOT EXISTS product_data (
        code TEXT NOT NULL,
        name TEXT,
        barcode TEXT PRIMARY KEY,
        quantity NUMERIC,
        salesprice NUMERIC,
        bmrp NUMERIC,
        cost NUMERIC,
        batch_supplier TEXT
      );

      CREATE TABLE IF NOT EXISTS orders_to_sync (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        supplier_code TEXT DEFAULT '',
        userid TEXT NOT NULL,
        barcode TEXT NOT NULL,
        quantity NUMERIC NOT NULL,
        rate NUMERIC NOT NULL,
        mrp NUMERIC NOT NULL,
        order_date TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        sync_status TEXT DEFAULT 'pending',
        FOREIGN KEY (barcode) REFERENCES product_data (barcode)
      );

      CREATE TABLE IF NOT EXISTS stock_count (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_name TEXT NOT NULL,
        barcode TEXT NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 0,
        count_date TEXT NOT NULL,
        userid TEXT NOT NULL,
        sync_status TEXT DEFAULT 'pending',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS sync_info (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        last_synced TEXT
      );
    `);

    // Add batch_supplier column if it doesn't exist
    if (!batchSupplierExists) {
      try {
        await db.execAsync(`
          ALTER TABLE product_data ADD COLUMN batch_supplier TEXT;
        `);
        console.log("✅ Added missing batch_supplier column to product_data");
      } catch (alterError: any) {
        // Column might already exist
        if (!alterError?.message?.includes('duplicate column')) {
          console.warn("⚠️ Column add warning:", alterError);
        }
      }
    }
    try {
      await db.execAsync(`ALTER TABLE orders_to_sync ADD COLUMN itemcode TEXT NOT NULL DEFAULT ''`);
    } catch (e) { /* already exists */ }
    try {
      await db.execAsync(`ALTER TABLE orders_to_sync ADD COLUMN product_name TEXT`);
    } catch (e) { /* already exists */ }
    try {
      await db.execAsync(`ALTER TABLE orders_to_sync ADD COLUMN is_manual_entry INTEGER DEFAULT 0`);
    } catch (e) { /* already exists */ }

    console.log("✅ Database initialized successfully with all tables.");
  } catch (err) {
    console.error("❌ Error initializing DB:", err);

    // Don't throw error for duplicate column issues
    if (err instanceof Error && err.message.includes('duplicate column name')) {
      console.warn("⚠️ Duplicate column error, but continuing...");
      return;
    }
    throw err;
  } finally {
    isInitializing = false;
  }
};

export const insertMasterData = async (data: Array<{ code: string, name: string, place?: string }>) => {
  const db = getDatabase();
  try {
    await db.withTransactionAsync(async () => {
      for (const item of data) {
        await db.runAsync(
          'INSERT OR REPLACE INTO master_data (code, name, place) VALUES (?, ?, ?)',
          [item.code, item.name, item.place || null]
        );
      }
    });
    console.log(`✅ Inserted ${data.length} master data records`);
  } catch (err) {
    try { await db.execAsync('ROLLBACK'); } catch (_) { }
    console.error("❌ Error inserting master data:", err);
    throw err;
  }
};
export const insertProductData = async (data: Array<{
  code: string,
  name?: string,
  barcode?: string,
  quantity?: number,
  salesprice?: number,
  bmrp?: number,
  cost?: number,
  batch_supplier?: string
}>) => {
  const db = getDatabase();
  try {
    await db.withTransactionAsync(async () => {
      for (const item of data) {
        await db.runAsync(
          'INSERT OR REPLACE INTO product_data (code, name, barcode, quantity, salesprice, bmrp, cost, batch_supplier) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [
            item.code,
            item.name || null,
            item.barcode || null,
            item.quantity || 0,
            item.salesprice || 0,
            item.bmrp || 0,
            item.cost || 0,
            item.batch_supplier || null
          ]
        );
      }
    });


    console.log(`✅ Inserted ${data.length} product data records`);
  } catch (err) {
    try { await db.execAsync('ROLLBACK'); } catch (_) { }
    console.error("❌ Error inserting product data:", err);
    throw err;
  }
};

export const getAllSuppliers = async () => {
  const db = getDatabase();
  try {
    const result = await db.getAllAsync('SELECT * FROM master_data ORDER BY name');
    console.log(`✅ Retrieved ${result.length} suppliers`);
    return result;
  } catch (err) {
    console.error("❌ Error fetching suppliers:", err);
    throw err;
  }
};

export const getProductByBarcode = async (barcode: string) => {
  const db = getDatabase();
  try {
    const result = await db.getFirstAsync(
      'SELECT * FROM product_data WHERE barcode = ?',
      [barcode]
    );
    return result;
  } catch (err) {
    console.error("❌ Error fetching product by barcode:", err);
    throw err;
  }
};

export const updateSyncTimestamp = async (timestamp: string) => {
  const db = getDatabase();
  try {
    await db.runAsync(
      'INSERT OR REPLACE INTO sync_info (id, last_synced) VALUES (1, ?)',
      [timestamp]
    );
    console.log("✅ Sync timestamp updated");
  } catch (err) {
    console.error("❌ Error updating sync timestamp:", err);
    throw err;
  }
};

export const getLastSyncTimestamp = async (): Promise<string | null> => {
  const db = getDatabase();
  try {
    const result = await db.getFirstAsync('SELECT last_synced FROM sync_info WHERE id = 1') as { last_synced: string } | null;
    return result?.last_synced || null;
  } catch (err) {
    console.error("❌ Error getting last sync timestamp:", err);
    return null;
  }
};

// Get pending orders for upload
export const getPendingOrders = async () => {
  const db = getDatabase();
  try {
    const result = await db.getAllAsync(
      'SELECT * FROM orders_to_sync WHERE sync_status = ? ORDER BY created_at',
      ['pending']
    );
    console.log(`✅ Retrieved ${result.length} pending orders`);
    return result;
  } catch (err) {
    console.error("❌ Error fetching pending orders:", err);
    return [];
  }
};

// Mark orders as synced
export const markOrdersAsSynced = async () => {
  const db = getDatabase();
  try {
    await db.runAsync(
      'UPDATE orders_to_sync SET sync_status = ? WHERE sync_status = ?',
      ['synced', 'pending']
    );
    console.log("✅ Orders marked as synced");
  } catch (err) {
    console.error("❌ Error marking orders as synced:", err);
    throw err;
  }
};

// Save order to sync table
export const saveOrderToSync = async (order: {
  supplier_code: string;
  userid: string;
  barcode: string;
  quantity: number;
  rate: number;
  mrp: number;
  order_date: string;
}) => {
  const db = getDatabase();
  try {
    await db.runAsync(
      'INSERT INTO orders_to_sync (supplier_code, userid, barcode, quantity, rate, mrp, order_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [order.supplier_code, order.userid, order.barcode, order.quantity, order.rate, order.mrp, order.order_date]
    );
    console.log("✅ Order saved for sync");
  } catch (err) {
    console.error("❌ Error saving order to sync:", err);
    throw err;
  }
};

// 🆕 Stock count helper functions
export const saveStockCount = async (stockCount: {
  product_name: string;
  barcode: string;
  quantity: number;
  count_date: string;
  userid: string;
}) => {
  const db = getDatabase();
  try {
    await db.runAsync(
      'INSERT INTO stock_count (product_name, barcode, quantity, count_date, userid) VALUES (?, ?, ?, ?, ?)',
      [stockCount.product_name, stockCount.barcode, stockCount.quantity, stockCount.count_date, stockCount.userid]
    );
    console.log("✅ Stock count saved");
  } catch (err) {
    console.error("❌ Error saving stock count:", err);
    throw err;
  }
};

export const getPendingStockCounts = async () => {
  const db = getDatabase();
  try {
    const result = await db.getAllAsync(
      'SELECT * FROM stock_count WHERE sync_status = ? ORDER BY created_at',
      ['pending']
    );
    console.log(`✅ Retrieved ${result.length} pending stock counts`);
    return result;
  } catch (err) {
    console.error("❌ Error fetching pending stock counts:", err);
    return [];
  }
};

export const markStockCountsAsSynced = async () => {
  const db = getDatabase();
  try {
    const result = await db.runAsync(
      'UPDATE stock_count SET sync_status = ? WHERE sync_status = ?',
      ['synced', 'pending']
    );
    console.log("✅ Stock counts marked as synced");
    return result.changes;
  } catch (err) {
    console.error("❌ Error marking stock counts as synced:", err);
    throw err;
  }
};

// Export the database getter function instead of the instance
export default getDatabase;