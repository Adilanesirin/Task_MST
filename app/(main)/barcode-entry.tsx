import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from 'expo-camera';
import Constants from 'expo-constants';
import { useLocalSearchParams, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import * as SQLite from "expo-sqlite";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

const isExpoGo = Constants.appOwnership === 'expo';

let Camera, useCameraDevice, useCodeScanner;
if (!isExpoGo) {
  const visionCamera = require('react-native-vision-camera');
  Camera = visionCamera.Camera;
  useCameraDevice = visionCamera.useCameraDevice;
  useCodeScanner = visionCamera.useCodeScanner;
}

let CameraKitCamera;
if (!isExpoGo) {
  const cameraKit = require('react-native-camera-kit');
  CameraKitCamera = cameraKit.Camera;
}

const db = SQLite.openDatabaseSync("magicpedia.db");

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 54 : 16,
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: '#f3f4f6',
  },
  backButton: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  topBarTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#3b82f6',
    marginLeft: 12,
  },
  scanButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 40,
    right: 16,
    zIndex: 50,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  header: {
    paddingTop: 8,
    paddingHorizontal: 16,
    backgroundColor: '#f3f4f6',
  },
  hiddenInput: {
    height: 1,
    width: 1,
    opacity: 0,
    position: 'absolute',
  },

  toggleContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    overflow: 'hidden',
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
  },
  toggleButtonLeft: {
    borderRightWidth: 1,
    borderRightColor: '#d1d5db',
  },
  toggleButtonActive: {
    backgroundColor: '#3b82f6',
  },
  toggleIcon: {
    marginRight: 6,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
  },
  toggleTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    fontSize: 16,
  },
  getButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  getButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
  suggestionsContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    marginTop: 8,
    marginHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  suggestionContent: {
    flex: 1,
    marginRight: 8,
  },
  suggestionName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 6,
  },
  suggestionDetailsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  detailChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  detailChipLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#555555',
    marginRight: 3,
  },
  detailChipValue: {
    fontSize: 11,
    fontWeight: '500',
    color: '#333333',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#374151',
  },
  emptyText: {
    textAlign: 'center',
    color: '#9ca3af',
    fontStyle: 'italic',
    marginTop: 16,
    fontSize: 16,
  },
  productCard: {
    marginBottom: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 1.5,
    elevation: 1.5,
    padding: 12,
  },
  latestProductCard: {
    backgroundColor: '#faf7e6',
    borderWidth: 1,
    borderColor: '#fabe09',
  },
  regularProductCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  productInfo: {
    flex: 1,
    marginRight: 12,
  },
  productName: {
    fontWeight: '600',
    fontSize: 16,
    color: '#1f2937',
    marginBottom: 4,
  },
  productBarcode: {
    fontSize: 14,
    color: '#6b7280',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    backgroundColor: '#3b82f6',
    padding: 8,
    borderRadius: 4,
  },
  deleteButton: {
    backgroundColor: '#ef4444',
    padding: 8,
    borderRadius: 4,
  },
  productDetails: {
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flexWrap: 'wrap',
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#4b5563',
  },

  mrpText: {
    fontWeight: '600',
    color: '#16a34a',
  },

  stockText: {
    fontWeight: '600',
    color: '#374151',
  },
  eQtyText: {
    fontWeight: '600',
    color: '#2563eb',
  },
  qtyButton: {
    backgroundColor: '#3b82f6',
    width: 30,
    height: 30,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    lineHeight: 22,
  },
  qtyInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 70,
    height: 33,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
    backgroundColor: '#ffffff',
  },

  saveButton: {
    marginTop: 24,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  saveButtonActive: {
    backgroundColor: '#fb923c',
  },
  saveButtonInactive: {
    backgroundColor: '#d1d5db',
  },
  saveButtonText: {
    color: '#ffffff',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    marginTop: 32,
    marginBottom: 24,
  },
  footerText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  variantsHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginTop: 8,
    marginBottom: 8,
    paddingHorizontal: 12,
  },
  scannerContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  scannerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 40,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20,
    padding: 8,
  },
  scanFrame: {
    width: 280,
    height: 280,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#3b82f6',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  instructionsContainer: {
    position: 'absolute',
    bottom: 100,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  instructionsText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  modalHeader: {
    backgroundColor: '#3b82f6',
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  modalCloseButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
  },
  modalContent: {
    padding: 20,
    paddingBottom: 200,
  },
  formGroup: {
    marginBottom: 24,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: '#ffffff',
    color: '#1f2937',
  },
  formInputDisabled: {
    backgroundColor: '#f3f4f6',
    color: '#6b7280',
  },
  modalButtonContainer: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#e5e7eb',
  },
  modalButtonSave: {
    backgroundColor: '#3b82f6',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonTextCancel: {
    color: '#374151',
  },
  modalButtonTextSave: {
    color: '#ffffff',
  },
  autocompleteContainer: {
    position: 'relative',
    zIndex: 1000,
  },
  autocompleteSuggestionsWrapper: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    maxHeight: 200,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderTopWidth: 0,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
    zIndex: 1001,
  },
  autocompleteSuggestionItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  autocompleteSuggestionText: {
    fontSize: 15,
    color: '#1f2937',
  },
});

const initOrdersTable = async () => {
  try {
    console.log("🔄 Initializing orders_to_sync table...");

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS orders_to_sync (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userid TEXT NOT NULL,
        itemcode TEXT NOT NULL,
        barcode TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        rate REAL NOT NULL,
        mrp REAL NOT NULL,
        order_date TEXT NOT NULL,
        sync_status TEXT DEFAULT 'pending',
        created_at TEXT NOT NULL,
        product_name TEXT,
        is_manual_entry INTEGER DEFAULT 0
      );
    `);

    // Migrate old table that had supplier_code NOT NULL
    try {
      const cols = await db.getAllAsync(`PRAGMA table_info(orders_to_sync)`) as Array<{ name: string }>;
      const hasSupplierCode = cols.some(c => c.name === 'supplier_code');
      if (hasSupplierCode) {
        console.log("🔄 Migrating orders_to_sync - removing supplier_code...");
        await db.execAsync(`DROP TABLE IF EXISTS orders_to_sync_new;`);
        await db.execAsync(`
          CREATE TABLE orders_to_sync_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userid TEXT NOT NULL,
            itemcode TEXT NOT NULL,
            barcode TEXT NOT NULL,
            quantity INTEGER NOT NULL,
            rate REAL NOT NULL,
            mrp REAL NOT NULL,
            order_date TEXT NOT NULL,
            sync_status TEXT DEFAULT 'pending',
            created_at TEXT NOT NULL,
            product_name TEXT,
            is_manual_entry INTEGER DEFAULT 0
          );
        `);
        await db.execAsync(`
          INSERT INTO orders_to_sync_new (userid, itemcode, barcode, quantity, rate, mrp, order_date, sync_status, created_at, product_name, is_manual_entry)
          SELECT userid, itemcode, barcode, quantity, rate, mrp, order_date, sync_status, created_at, product_name, is_manual_entry FROM orders_to_sync;
        `);
        await db.execAsync(`DROP TABLE orders_to_sync;`);
        await db.execAsync(`ALTER TABLE orders_to_sync_new RENAME TO orders_to_sync;`);
        console.log("✅ Migrated orders_to_sync successfully");
      }
    } catch (migrationError) {
      console.warn("⚠️ Migration warning:", migrationError);
    }

    console.log("✅ orders_to_sync table ready");

  } catch (error) {
    console.error("❌ Error initializing orders table:", error);
  }
};

const initPendingItemsTable = async () => {
  try {
    console.log("🔄 Initializing pending_items table...");

    // First, check if table exists
    const tableExists = await db.getFirstAsync(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='pending_items'"
    ) as any;

    if (!tableExists) {
      // Create new table with complete schema
      await db.execAsync(`
        CREATE TABLE pending_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          barcode TEXT NOT NULL,
          name TEXT,
          bmrp REAL DEFAULT 0,
          cost REAL DEFAULT 0,
          quantity INTEGER DEFAULT 0,
          eCost REAL DEFAULT 0,
          currentStock INTEGER DEFAULT 0,
          batchSupplier TEXT,
          scannedAt INTEGER,
          batch_supplier TEXT,
          product TEXT,
          brand TEXT,
          isManualEntry INTEGER DEFAULT 0
        );
      `);
      console.log("✅ Created pending_items table with complete schema");
      return;
    }

    // Table exists, get its column information
    const tableInfo = await db.getAllAsync(`PRAGMA table_info(pending_items)`) as Array<{ name: string }>;
    const existingColumns = tableInfo.map((col: any) => col.name);

    console.log("📋 Existing columns in pending_items:", existingColumns.join(", "));

    // Define required columns
    const requiredColumns = [
      'id', 'barcode', 'name', 'bmrp', 'cost',
      'quantity', 'eCost', 'currentStock', 'batchSupplier',
      'scannedAt', 'batch_supplier', 'product', 'brand', 'isManualEntry'
    ];

    const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));

    if (missingColumns.length > 0) {
      console.log("🔄 Migrating pending_items table - missing columns:", missingColumns.join(", "));

      // Create new table with complete schema
      await db.execAsync(`
        CREATE TABLE pending_items_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          barcode TEXT NOT NULL,
          name TEXT,
          bmrp REAL DEFAULT 0,
          cost REAL DEFAULT 0,
          quantity INTEGER DEFAULT 0,
          eCost REAL DEFAULT 0,
          currentStock INTEGER DEFAULT 0,
          batchSupplier TEXT,
          scannedAt INTEGER,
          batch_supplier TEXT,
          product TEXT,
          brand TEXT,
          isManualEntry INTEGER DEFAULT 0
        );
      `);

      // Build INSERT statement using only columns that exist in both tables
      const commonColumns = existingColumns.filter(col =>
        requiredColumns.includes(col) && col !== 'id'
      );

      if (commonColumns.length > 0) {
        const columnsList = commonColumns.join(', ');

        try {
          await db.execAsync(`
            INSERT INTO pending_items_new (${columnsList})
            SELECT ${columnsList}
            FROM pending_items
          `);
          console.log(`✅ Migrated ${commonColumns.length} columns of data`);
        } catch (copyError) {
          console.log("⚠️ Could not copy old data (table might be empty):", copyError);
        }
      }

      // Drop old table and rename new one
      await db.execAsync(`DROP TABLE pending_items`);
      await db.execAsync(`ALTER TABLE pending_items_new RENAME TO pending_items`);

      console.log("✅ Successfully migrated pending_items table");
    } else {
      console.log("✅ pending_items table already has all required columns");
    }

  } catch (error) {
    console.error("❌ Error initializing pending_items table:", error);
    // If all else fails, try to recreate the table from scratch
    try {
      console.log("🔄 Attempting to recreate table from scratch...");
      await db.execAsync(`DROP TABLE IF EXISTS pending_items`);
      await db.execAsync(`
        CREATE TABLE pending_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          barcode TEXT NOT NULL,
          name TEXT,
          bmrp REAL DEFAULT 0,
          cost REAL DEFAULT 0,
          quantity INTEGER DEFAULT 0,
          eCost REAL DEFAULT 0,
          currentStock INTEGER DEFAULT 0,
          batchSupplier TEXT,
          scannedAt INTEGER,
          batch_supplier TEXT,
          product TEXT,
          brand TEXT,
          isManualEntry INTEGER DEFAULT 0
        );
      `);
      console.log("✅ Successfully recreated pending_items table");
    } catch (recreateError) {
      console.error("❌ Failed to recreate table:", recreateError);
    }
  }
};

const debugManualEntry = async (barcode: string) => {
  console.log("\n🔍 === DEBUGGING MANUAL ENTRY ===");

  try {
    const pendingItem = await db.getFirstAsync(
      `SELECT barcode, name, isManualEntry, supplier_code FROM pending_items WHERE barcode = ?`,
      [barcode]
    ) as any;
    console.log("1️⃣ pending_items table:", JSON.stringify(pendingItem, null, 2));

    const syncOrder = await db.getFirstAsync(
      `SELECT barcode, product_name, is_manual_entry, itemcode FROM orders_to_sync WHERE barcode = ? ORDER BY created_at DESC LIMIT 1`,
      [barcode]
    ) as any;
    console.log("2️⃣ orders_to_sync table:", JSON.stringify(syncOrder, null, 2));

    const tableInfo = await db.getAllAsync(`PRAGMA table_info(pending_items)`);
    console.log("3️⃣ pending_items schema:");
    tableInfo.forEach((col: any) => {
      console.log(`   - ${col.name} (${col.type})`);
    });
  } catch (error) {
    console.error("Debug error:", error);
  }

  console.log("🔍 === END DEBUG ===\n");
};

const saveOrderToSync = async (orderData: {

  userid: string;
  itemcode: string;
  barcode: string;
  quantity: number;
  rate: number;
  mrp: number;
  order_date: string;
  product_name?: string;
  is_manual_entry?: number;
}) => {
  try {
    console.log("\n💾 === SAVING ORDER TO SYNC ===");
    console.log("📋 Input orderData:", JSON.stringify(orderData, null, 2));

    await db.runAsync(
  `INSERT INTO orders_to_sync 
  (userid, itemcode, barcode, quantity, rate, mrp, order_date, sync_status, created_at, product_name, is_manual_entry)
  VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', datetime('now'), ?, ?)`,
  [
    orderData.userid,               // → userid
    orderData.itemcode,             // → itemcode
    orderData.barcode,              // → barcode
    orderData.quantity,             // → quantity
    orderData.rate,                 // → rate
    orderData.mrp,                  // → mrp
    orderData.order_date,           // → order_date
    orderData.product_name || '',   // → product_name
    orderData.is_manual_entry || 0, // → is_manual_entry
  ]
);

    const saved = await db.getFirstAsync(
      `SELECT barcode, product_name, is_manual_entry FROM orders_to_sync WHERE barcode = ? ORDER BY id DESC LIMIT 1`,
      [orderData.barcode]
    );
    console.log("✅ Verified saved data:", JSON.stringify(saved, null, 2));
    console.log("💾 === END SAVING ===\n");

    return true;
  } catch (error: any) {
    console.error("❌ Error saving order to sync:", error);
    throw error;
  }
};
function QtyInput({ value, onChange, onEditingChange, onRefocusHidden }: { value: number; onChange: (n: number) => void; onEditingChange: (v: boolean) => void; onRefocusHidden: () => void; }) {  const [text, setText] = React.useState(String(value));

  React.useEffect(() => {
    setText(String(value));
  }, [value]);

  return (
    <TextInput
      style={styles.qtyInput}
      value={text}
      keyboardType="decimal-pad"
      inputMode="decimal"
      onChangeText={(val) => {
        // Allow digits, a single leading dot, or decimal like "0.5"
        const sanitized = val.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
        setText(sanitized);
        const num = parseFloat(sanitized);
        if (!isNaN(num) && num >= 0) onChange(num);
      }}
      onBlur={() => {
        onEditingChange(false);
        const num = parseFloat(text);
        const safe = isNaN(num) || num <= 0 ? 1 : num;
        setText(String(safe));
        onChange(safe);
        onRefocusHidden();
      }}
      onFocus={() => {
        onEditingChange(true);
        
        setText(text === '0' ? '' : text);
      }}
      cursorColor="#2563eb"
      caretHidden={false}
      selectTextOnFocus
    />
  );
}

export default function BarcodeEntry() {

  const params = useLocalSearchParams();


  const router = useRouter();

  const [scannedItems, setScannedItems] = useState<any[]>([]);
  const [hardwareScanValue, setHardwareScanValue] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [manualBarcode, setManualBarcode] = useState("");
  const [searchMode, setSearchMode] = useState<'barcode' | 'name'>('barcode');
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [showManualEntryModal, setShowManualEntryModal] = useState(false);
  const [manualEntryData, setManualEntryData] = useState({
    barcode: '',
    name: '',
    mrp: '',
    cost: '',
    quantity: '',
  });

  const [nameSuggestions, setNameSuggestions] = useState<string[]>([]);
  const [showNameSuggestions, setShowNameSuggestions] = useState(false);

  const [showScanner, setShowScanner] = useState(false);

// --- TEST SCANNER STATE ---
const [showLibPicker, setShowLibPicker] = useState(false);
const [activeTestLib, setActiveTestLib] = useState(null); // 'lib1' | 'lib2' | 'lib3'
const [testResult, setTestResult] = useState(null);        // { barcode, ms, lib }
  const [duplicatePrompt, setDuplicatePrompt] = useState(true);

  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  // Scanner performance monitoring
  const scanLockRef = useRef(false);
  const processingAlertRef = useRef(false);
  const inputRef = useRef<TextInput>(null);
  const isDBReady = useRef(false);
  const [isScanning, setIsScanning] = useState(false);
  const isEditingRef = useRef(false);

useEffect(() => {
    const initialize = async () => {
      console.log("🚀 Initializing BarcodeEntry component...");
      await initOrdersTable();
      await initPendingItemsTable();
      await loadPendingItems();
      const savedDuplicatePrompt = await SecureStore.getItemAsync("duplicatePrompt");
      if (savedDuplicatePrompt !== null) {
        setDuplicatePrompt(savedDuplicatePrompt !== "false");
      }
      isDBReady.current = true;
    };
    initialize();
  }, []);
useEffect(() => {
  if (!hardwareScanValue || !hardwareScanValue.trim()) return;

  if (isEditingRef.current) {
    setHardwareScanValue('');
    return;
  }

  const debounceTimer = setTimeout(() => {
    const trimmed = hardwareScanValue.trim();

    if (isEditingRef.current) {
      setHardwareScanValue('');
      return;
    }

    if (trimmed.length < 4) {
      setHardwareScanValue('');
      return;
    }

    console.log(`📟 Hardware scan detected: "${trimmed}"`);

    if (!isDBReady.current) {
      console.log("⏳ DB not ready yet, ignoring scan");
      setHardwareScanValue('');
      return;
    }

    setManualBarcode(trimmed);
    setHardwareScanValue('');
    handleBarCodeScanned({ data: trimmed }, 'scanner');
    setTimeout(() => setManualBarcode(''), 500);
  }, 600);

  return () => clearTimeout(debounceTimer);
}, [hardwareScanValue, isEditing]);
  // Auto-focus for hardware scanner
  useEffect(() => {
  if (searchMode === 'barcode' && !showManualEntryModal && !showScanner && !isEditing && !manualBarcode.length) {
    const timer = setTimeout(() => {
      if (!isEditing) inputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }
  // when user starts editing, cancel any pending focus back to hidden input
}, [searchMode, showManualEntryModal, showScanner]);
// ← REMOVED isEditing and manualBarcode from deps — this was causing hidden input
//    to re-grab focus every time user tapped visible input (isEditing changed to true)

  useEffect(() => {
    const resetTimer = setTimeout(() => {
      if (scanned && scanLockRef.current && showScanner) {
        console.log("⚠️ Auto-resetting stuck scanner...");
        setScanned(false);
        scanLockRef.current = false;
        processingAlertRef.current = false;
      }
    }, 5000);
    return () => clearTimeout(resetTimer);
  }, [scanned, showScanner]);

  const loadPendingItems = async () => {
    try {
      const rows = await db.getAllAsync(
        `SELECT 
        id,
        barcode,
        name,
        COALESCE(bmrp, 0) as bmrp,
        COALESCE(cost, 0) as cost,
        COALESCE(quantity, 0) as quantity,
        COALESCE(eCost, 0) as eCost,
        COALESCE(currentStock, 0) as currentStock,
        batchSupplier,
        scannedAt,
        batch_supplier,
        product,
        brand,
        COALESCE(isManualEntry, 0) as isManualEntry
      FROM pending_items 
      ORDER BY scannedAt DESC`
      );

      console.log(`📦 Loaded ${rows.length} pending items`);
      setScannedItems(rows);
    } catch (error) {
      console.error("❌ Error loading pending items:", error);
      setScannedItems([]);
    }
  };

  const savePendingItem = async (item: any) => {
    try {
      console.log("💾 Saving pending item:", item.barcode);

      await db.runAsync(
        `INSERT INTO pending_items 
        ( barcode, name, bmrp, cost, quantity, eCost, currentStock, batchSupplier, scannedAt, batch_supplier, product, brand, isManualEntry)
        VALUES (?,?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          item.barcode,
          item.name,
          item.bmrp || 0,
          item.cost || 0,
          item.quantity || 0,
          item.eCost || 0,
          item.currentStock || 0,
          item.batchSupplier || "",
          item.scannedAt,
          item.batch_supplier || "",
          item.product || "",
          item.brand || "",
          item.isManualEntry || 0
        ]
      );

      console.log("✅ Saved pending item:", item.barcode);

    } catch (error) {
      console.error("❌ Error saving pending item:", error);
    }
  };

  const deletePendingItem = async (itemId: number) => {
    try {
      await db.runAsync(
        "DELETE FROM pending_items WHERE id = ?",
        [itemId]
      );
      console.log(`🗑️ Deleted pending item: ${itemId}`);
    } catch (error) {
      console.error("Error deleting pending item:", error);
    }
  };

  const updatePendingItem = async (itemId: number, item: any) => {
    try {
      await db.runAsync(
        `UPDATE pending_items 
      SET quantity = ?, eCost = ?, cost = ?, bmrp = ?, batchSupplier = ?
      WHERE id = ?`,
        [item.quantity, item.eCost, item.cost, item.bmrp, item.batchSupplier, itemId]
      );
      console.log(`✏️ Updated pending item: ${itemId}`);
    } catch (error) {
      console.error("Error updating pending item:", error);
    }
  };

 const loadAllProducts = async () => {
  try {
    if (allProducts.length > 0) return; // already loaded, don't reload
    const rows = await db.getAllAsync(
      "SELECT code, name, barcode, quantity, bmrp, cost, batch_supplier FROM product_data LIMIT 5000"
    );
    setAllProducts(rows);
    console.log(`📚 Loaded ${rows.length} products for name search`);
  } catch (error) {
    console.error("Error loading products:", error);
  }
};
  useEffect(() => {
    if (params.updatedItem && params.itemIndex !== undefined) {
      const updatedItemParsed = JSON.parse(params.updatedItem as string);
      const item = scannedItems[parseInt(params.itemIndex as string)];
      if (item?.id) {
        db.runAsync(
          `UPDATE pending_items 
         SET quantity = ?, eCost = ?, cost = ?, bmrp = ?, batchSupplier = ? 
         WHERE id = ?`,
          [updatedItemParsed.quantity, updatedItemParsed.eCost, updatedItemParsed.cost, updatedItemParsed.bmrp, updatedItemParsed.batchSupplier, item.id]
        ).then(() => loadPendingItems());
      }
      router.setParams({ updatedItem: undefined, itemIndex: undefined });
    }
  }, [params.updatedItem, params.itemIndex]);

 const toggleSearchMode = () => {
  const newMode = searchMode === 'barcode' ? 'name' : 'barcode';
  setSearchMode(newMode);
  setManualBarcode('');
  setSuggestions([]);
  setShowSuggestions(false);
  inputRef.current?.focus();
  if (newMode === 'name') {
    loadAllProducts(); // ← load only when user actually needs name search
  }
};

  const handleSearchTextChange = (text: string) => {
    setManualBarcode(text);

    if (searchMode === 'name' && text.trim().length >= 2) {
      const searchLower = text.toLowerCase().trim();
      const filtered = allProducts.filter((product: any) =>
        product.name?.toLowerCase().includes(searchLower) ||
        product.brand?.toLowerCase().includes(searchLower) ||
        product.product?.toLowerCase().includes(searchLower)
      ).slice(0, 50);

      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleNameInputChange = (text: string) => {
    setManualEntryData({ ...manualEntryData, name: text });

    if (text.trim().length >= 1) {
      const searchLower = text.toLowerCase().trim();

      const uniqueNames = Array.from(
        new Set(
          allProducts
            .filter((product: any) =>
              product.name?.toLowerCase().startsWith(searchLower)
            )
            .map((product: any) => product.name)
            .filter((name: string) => name && name.trim() !== '')
        )
      ).sort((a, b) => a.localeCompare(b))
        .slice(0, 20);

      setNameSuggestions(uniqueNames);
      setShowNameSuggestions(uniqueNames.length > 0);
    } else {
      setNameSuggestions([]);
      setShowNameSuggestions(false);
    }
  };

  const handleSelectNameSuggestion = (name: string) => {
    setManualEntryData({ ...manualEntryData, name: name });
    setShowNameSuggestions(false);
    setNameSuggestions([]);
    Keyboard.dismiss();
  };

  const handleSelectSuggestion = (product: any) => {
    setShowSuggestions(false);
    setSuggestions([]);
    Keyboard.dismiss();
    addProductToList(product);
  };

  const addProductToList = async (product: any) => {

    if (scannedItems.length >= 50) {
      Alert.alert(
        "Upload Limit Reached",
        "You've reached the 50 item limit. Please upload the current list before adding more items.",
        [{ text: "OK" }]
      );
      return;
    }

const existing = scannedItems.find((item) => item.barcode === product.barcode);
if (existing) {
  // Add silently without any prompt
  const newItem = { ...product, quantity: 1, cost: product.cost ?? product.bmrp ?? 0, eCost: 0, currentStock: product.quantity ?? 0, batchSupplier: product.batch_supplier ?? "", scannedAt: new Date().getTime(), isManualEntry: 0 };
  await savePendingItem(newItem);
  await loadPendingItems();
  setManualBarcode("");
  Toast.show({ type: "success", text1: "Added", text2: product.name, visibilityTime: 1000 });
  return;
}
    
    const newItem = {
      ...product,
      quantity: 1,
      cost: product.cost ?? product.bmrp ?? 0,
      eCost: 0,
      currentStock: product.quantity ?? 0,
      batchSupplier: product.batch_supplier ?? "",
      scannedAt: new Date().getTime(),
      isManualEntry: 0,
    };

    await savePendingItem(newItem);
    await loadPendingItems();
    setManualBarcode("");

    // Show success feedback
    Toast.show({
      type: "success",
      text1: "Added",
      text2: product.name,
      visibilityTime: 1000,
    });
  };

  const searchBarcodeWithVariants = async (barcode: string) => {
    try {
      console.log("🔍 Searching for barcode:", barcode);

      // Search for exact match first
      const exactRows = await db.getAllAsync(
        "SELECT * FROM product_data WHERE barcode = ?",
        [barcode]
      );

      // Search for variants
      const variantRows1 = await db.getAllAsync(
        "SELECT * FROM product_data WHERE barcode LIKE ?",
        [`${barcode} :%`]
      );

      const variantRows2 = await db.getAllAsync(
        "SELECT * FROM product_data WHERE barcode LIKE ?",
        [`${barcode}:%`]
      );

      const allMatches = [...exactRows, ...variantRows1, ...variantRows2];
      console.log(`📋 Found ${allMatches.length} matches for ${barcode}`);

      return allMatches;
    } catch (err) {
      console.error("Error searching barcode:", err);
      throw err;
    }
  };

  const openManualEntryModal = (barcode: string) => {
    setManualEntryData({
      barcode: barcode,
      name: '',
      mrp: '',
      cost: '',
      quantity: '',
    });
    setShowManualEntryModal(true);
    setNameSuggestions([]);
    setShowNameSuggestions(false);
  };

  const closeManualEntryModal = () => {
    setShowManualEntryModal(false);
    setManualEntryData({
      barcode: '',
      name: '',
      mrp: '',
      cost: '',
      quantity: '',
    });
    setNameSuggestions([]);
    setShowNameSuggestions(false);
  };

  const handleSaveManualEntry = async () => {
    if (scannedItems.length >= 50) {
      Alert.alert(
        "Upload Limit Reached",
        "You've reached the 50 item limit. Please upload the current list before adding more items.",
        [{ text: "OK" }]
      );
      return;
    }
    if (!manualEntryData.name.trim()) {
      Alert.alert("Validation Error", "Please enter an item name");
      return;
    }

    const mrp = parseFloat(manualEntryData.mrp);
    const cost = parseFloat(manualEntryData.cost);
    const quantity = parseInt(manualEntryData.quantity);

    if (isNaN(mrp) || mrp < 0) {
      Alert.alert("Validation Error", "Please enter a valid MRP");
      return;
    }

    if (isNaN(cost) || cost < 0) {
      Alert.alert("Validation Error", "Please enter a valid cost");
      return;
    }

    if (isNaN(quantity) || quantity < 0) {
      Alert.alert("Validation Error", "Please enter a valid quantity");
      return;
    }

    const existing = scannedItems.find((item) => item.barcode === manualEntryData.barcode);
    if (existing) {
      Alert.alert("Info", `Product with this barcode already exists: ${existing.name}`);
      return;
    }

    console.log("\n🎯 Creating manual entry for:", manualEntryData.barcode);

    const newItem = {
      barcode: manualEntryData.barcode,
      name: manualEntryData.name.trim(),
      bmrp: mrp,
      cost: cost,
      quantity: quantity,
      eCost: 0,
      currentStock: quantity,
      batchSupplier: "",
      scannedAt: new Date().getTime(),
      batch_supplier: "",
      product: '',
      brand: '',
      isManualEntry: 1,
    };

    await savePendingItem(newItem);
    await loadPendingItems();

    closeManualEntryModal();

    Toast.show({
      type: "success",
      text1: "Manual Entry Added",
      text2: manualEntryData.name.trim(),
      visibilityTime: 2000,
    });
  };
  const handleBarCodeScanned = async ({ data }: { data: string }, source: 'scanner' | 'manual' = 'scanner') => {
  console.log(`🔍 Scanning barcode: ${data}, source: ${source}`);
  setIsScanning(true); // ← START spinner

  if (scannedItems.length >= 50) {
    setIsScanning(false); // ← STOP spinner
    Alert.alert("Upload Limit Reached", "You've reached the 50 item limit. Please upload the current list before adding more items.", [{ text: "OK" }]);
    if (source === 'scanner') { setScanned(false); scanLockRef.current = false; processingAlertRef.current = false; }
    return;
  }
    if (source === 'scanner') {
      if (scanLockRef.current) {
        console.log("⏸️ Scan locked, skipping...");
        setIsScanning(false); 
        return;
      }
      scanLockRef.current = true;
      setScanned(true);

      if (showScanner) {
        setShowScanner(false);
      }
    }

    try {
      const allMatches = await searchBarcodeWithVariants(data);

     if (allMatches.length === 0) {
  setIsScanning(false);
  Alert.alert(
    "Product Not Found",
    `Barcode: ${data}\n\nThis product does not exist in the database.`,
    [
      {
        text: 'OK',
        onPress: () => {
          if (source === 'scanner') {
            setScanned(false);
            scanLockRef.current = false;
            processingAlertRef.current = false;
          }
        }
      }
    ]
  );
  return;
}
      if (allMatches.length === 1) {
        const product = allMatches[0];
        const existing = scannedItems.find((item) => item.barcode === product.barcode);

   if (existing) {
  // Add silently without any prompt
  const newItem = {
    ...product,
    quantity: 1,
    cost: product.cost ?? product.bmrp ?? 0,
    eCost: 0,
    currentStock: product.quantity ?? 0,
    batchSupplier: product.batch_supplier ?? "",
    scannedAt: new Date().getTime(),
    isManualEntry: 0,
  };
  await savePendingItem(newItem);
  await loadPendingItems();
  setIsScanning(false); // ← ADD
  Toast.show({ type: "success", text1: "Added", text2: product.name, visibilityTime: 1000 });
  if (source === 'scanner') { setScanned(false); scanLockRef.current = false; }
  return;
}
    const newItem = {
          ...product,
          quantity: 1,
          cost: product.cost ?? product.bmrp ?? 0,
          eCost: 0,
          currentStock: product.quantity ?? 0,
          batchSupplier: product.batch_supplier ?? "",
          scannedAt: new Date().getTime(),
          isManualEntry: 0,
        };
        await savePendingItem(newItem);
        await loadPendingItems();
        setIsScanning(false);
        Toast.show({
          type: "success",
          text1: "Scanned",
          text2: product.name,
          visibilityTime: 1000,
        });
        if (source === 'scanner') {
          setTimeout(() => {
            setScanned(false);
            scanLockRef.current = false;
          }, 500);
        }

      } else {
        setSuggestions(allMatches);
        setShowSuggestions(true);
        setIsScanning(false);

        if (source === 'scanner') {
          setTimeout(() => {
            setScanned(false);
            scanLockRef.current = false;
          }, 500);
        }
      }

 } catch (err) {
    console.error("❌ Error scanning barcode:", err);
    setIsScanning(false); // ← STOP spinner on error
    Alert.alert("Error", "Failed to scan product.", [
      {
        text: 'OK',
        onPress: () => {
          if (source === 'scanner') {
            setScanned(false);
            scanLockRef.current = false;
            processingAlertRef.current = false;
          }
        }
      }
    ]);
  }
};;

  const handleManualSearch = async () => {
    const trimmed = manualBarcode.trim();
    if (!trimmed) {
      Alert.alert("Error", "Please enter a search term");
      return;
    }

    if (scannedItems.length >= 50) {
      Alert.alert("Upload Limit Reached", "You've reached the 50 item limit. Please upload the current list before adding more items.", [{ text: "OK" }]);
      return;
    }

    if (searchMode === 'barcode') {
      try {
        const allMatches = await searchBarcodeWithVariants(trimmed);

        if (allMatches.length === 0) {
  setIsScanning(false);
  Alert.alert(
    "Product Not Found",
    `Barcode: ${trimmed}\n\nThis product does not exist in the database.`,
    [{ text: 'OK' }]
  );
  return;
}

        if (allMatches.length === 1) {
          const product = allMatches[0] as { [key: string]: any; quantity?: number };
          const existing = scannedItems.find((item) => item.barcode === product.barcode);

      if (existing) {
  // Add silently without any prompt
  const newItem = { ...product, quantity: 1, cost: product.cost ?? product.bmrp ?? 0, eCost: 0, currentStock: product.quantity ?? 0, batchSupplier: product.batch_supplier ?? "", scannedAt: new Date().getTime(), isManualEntry: 0 };
  await savePendingItem(newItem);
  await loadPendingItems();
  setManualBarcode("");
  Toast.show({ type: "success", text1: "Added", text2: product.name, visibilityTime: 1000 });
  return;
}

          const newItem = {
            ...product,
            quantity: 1,
            cost: product.cost ?? product.bmrp ?? 0,
            eCost: 0,
            currentStock: product.quantity ?? 0,
            batchSupplier: product.batch_supplier ?? "",
            scannedAt: new Date().getTime(),
            isManualEntry: 0,
          };
          await savePendingItem(newItem);
          await loadPendingItems();
          setManualBarcode("");
        } else {
          setSuggestions(allMatches);
          setShowSuggestions(true);
        }
      } catch (err) {
        console.error("Error fetching product:", err);
        Alert.alert("Error", "Failed to fetch product.");
      }
    } else {

      const searchLower = trimmed.toLowerCase();
      const matches = allProducts.filter((product: any) =>
        product.name?.toLowerCase().includes(searchLower) ||
        product.brand?.toLowerCase().includes(searchLower) ||
        product.product?.toLowerCase().includes(searchLower)
      );

      if (matches.length === 1) {
        await addProductToList(matches[0]);
      } else if (matches.length > 1) {
        setSuggestions(matches);
        setShowSuggestions(true);
      } else {
        Alert.alert("Not Found", `No products found matching: "${trimmed}"`);
      }
    }
  };

  const handleEditItem = (item: any, index: number) => {
    router.push({
      pathname: "/edit-product",
      params: {
        itemData: JSON.stringify(item),
        itemIndex: index.toString(),
      },
    } as any);
  };

  const handleDeleteItem = async (index: number) => {
    Alert.alert(
      "Delete Item",
      "Are you sure you want to delete this item?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const item = scannedItems[index];
            if (item.id) {
              await deletePendingItem(item.id);
            }
            await loadPendingItems();
          }
        }
      ]
    );
  };

  const handleBack = () => {
    router.back();
  };

  const handleOpenScanner = async () => {
    console.log("📷 Opening scanner...");
    if (scannedItems.length >= 50) {
      Alert.alert("Upload Limit Reached", "You've reached the 50 item limit. Please upload the current list before adding more items.", [{ text: "OK" }]);
      return;
    }


    setScanned(false);
    scanLockRef.current = false;
    processingAlertRef.current = false;

    if (!permission?.granted) {
      const { granted } = await requestPermission();
      if (!granted) {
        Alert.alert(
          "Camera Permission",
          "Camera access is required to scan barcodes."
        );
        return;
      }
    }

    setShowScanner(true);
  };

  const handleCloseScanner = () => {
    setShowScanner(false);
    setTimeout(() => {
      setScanned(false);
      scanLockRef.current = false;
      processingAlertRef.current = false;
    }, 500);
  };

  const updateQuantities = async () => {
    const itemsWithMissingData = scannedItems.filter(item => {
      const hasInvalidMrp = !item.bmrp || item.bmrp === 0 || isNaN(item.bmrp);
      const hasInvalidCost = !item.cost || item.cost === 0 || isNaN(item.cost);
      const hasInvalidQty = item.quantity === undefined || item.quantity === null || isNaN(item.quantity) || item.quantity <= 0;
      return hasInvalidMrp || hasInvalidCost || hasInvalidQty;
    });

    if (itemsWithMissingData.length > 0) {
      const itemNames = itemsWithMissingData.map(item => `• ${item.name}`).join('\n');

      Alert.alert(
        "⚠️ Incomplete Data Warning",
        `The following ${itemsWithMissingData.length} item(s) have missing or zero values:\n\n${itemNames}\n\nDo you want to proceed?`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Proceed Anyway", style: "destructive", onPress: () => showFinalConfirmation() }
        ]
      );
    } else {
      showFinalConfirmation();
    }
  };

  const showFinalConfirmation = () => {
    Alert.alert(
      "Confirm Update",
      `Are you sure you want to update quantities for ${scannedItems.length} item(s)?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Update",
          style: "default",
          onPress: async () => {
            try {
              const userId = await SecureStore.getItemAsync("user_id");
              const today = new Date().toISOString().split("T")[0];

              let successCount = 0;
              let errorCount = 0;

              console.log(`\n📄 === STARTING UPDATE QUANTITIES ===`);
              console.log(`Processing ${scannedItems.length} items...`);

              for (const item of scannedItems) {
                try {
                  const finalCost = item.eCost !== 0 ? item.eCost : item.cost;
                  let itemCode = item.barcode;

                  const isManualEntry = item.isManualEntry === 1;

                  if (!isManualEntry) {
                    const productData = await db.getFirstAsync(
                      "SELECT code FROM product_data WHERE barcode = ?",
                      [item.barcode]
                    ) as { code?: string } | null;
                    itemCode = productData?.code || item.barcode;
                  }

                  console.log(`📋 Processing item:`, {
                    barcode: item.barcode,
                    name: item.name,
                    isManualEntry: isManualEntry,
                    itemCode: itemCode,
                    product_name: item.name
                  });

                  await saveOrderToSync({

                    userid: userId ?? "unknown",
                    itemcode: itemCode,
                    barcode: item.barcode,
                    quantity: item.quantity,
                    rate: finalCost ?? 0,
                    mrp: item.bmrp ?? 0,
                    order_date: today,
                    product_name: item.name,
                    is_manual_entry: isManualEntry ? 1 : 0,
                  });

                  if (!isManualEntry) {
                    const productExists = await db.getFirstAsync(
                      "SELECT 1 FROM product_data WHERE barcode = ?",
                      [item.barcode]
                    );

                    if (productExists) {
                      await db.runAsync(
                        "UPDATE product_data SET quantity = ?, cost = ? WHERE barcode = ?",
                        [item.quantity, finalCost, item.barcode]
                      );
                      console.log(`✅ Updated product_data for: ${item.barcode}`);
                    }
                  } else {
                    console.log(`⭐ Skipping product_data update for manual entry: ${item.barcode}`);
                  }

                  successCount++;

                } catch (itemError) {
                  console.error(`❌ Error processing item ${item.barcode}:`, itemError);
                  errorCount++;
                }
              }

              console.log(`\n📊 Results: ${successCount} success, ${errorCount} errors`);
              console.log(`📄 === END UPDATE QUANTITIES ===\n`);

              if (successCount > 0) {
                try {
                  await db.runAsync("DELETE FROM pending_items");
                  console.log(`🧹 Cleared ${successCount} pending items`);
                } catch (deleteError) {
                  console.error("❌ Could not delete pending items:", deleteError);
                }
              }

             if (errorCount === 0) {
  setScannedItems([]);
  Alert.alert(
    "✅ Data Saved Locally",
    `All ${successCount} entries saved successfully!\n\nDo you want to upload to the server now?`,
    [
      {
        text: "No",
        style: "cancel",
        onPress: () => router.push("/(main)/"),
      },
      {
        text: "Yes, Upload Now",
        onPress: () => router.push("/(main)/upload"),
      },
    ]
  );
}
               else if (successCount > 0) {
                Alert.alert("⚠️ Partial Success",
                  `${successCount} entries saved, ${errorCount} failed.`);
                await loadPendingItems();
              } else {
                Alert.alert("❌ Error", "Failed to save any entries.");
              }
            } catch (err) {
              console.error("💥 Save failed:", err);
              Alert.alert("Error", "Failed to save entries.");
            }
          }
        }
      ]
    );
  };

  const renderSuggestionItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() => handleSelectSuggestion(item)}
    >
      <View style={styles.suggestionContent}>
        <Text style={styles.suggestionName} numberOfLines={1}>
          {item.name}
        </Text>
        <View style={styles.suggestionDetailsContainer}>
          <View style={styles.detailChip}>
            <Text style={styles.detailChipLabel}>Stock:</Text>
            <Text style={styles.detailChipValue}>{Math.abs(item.quantity || 0)}</Text>
          </View>
          <View style={styles.detailChip}>
            <Text style={styles.detailChipLabel}>MRP:</Text>
            <Text style={styles.detailChipValue}>₹{item.bmrp || 0}</Text>
          </View>
          {!!item.barcode && (
            <View style={styles.detailChip}>
              <Text style={styles.detailChipValue} numberOfLines={1}>{item.barcode}</Text>
            </View>
          )}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#999999" />
    </TouchableOpacity>
  );

  const getCardStyle = (item: any, index: number) => {
    if (item.isManualEntry === 1) {
      return styles.manualEntryCard;
    }
    return index === 0 ? styles.latestProductCard : styles.regularProductCard;
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      {isScanning && (
      <View style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center', alignItems: 'center',
        zIndex: 999,
      }}>
        <View style={{
          backgroundColor: '#ffffff',
          borderRadius: 16, padding: 28,
          alignItems: 'center', gap: 12,
          shadowColor: '#000', shadowOpacity: 0.2,
          shadowRadius: 10, elevation: 10,
        }}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#374151' }}>
            Processing...
          </Text>
        </View>
      </View>
    )}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={[styles.topBarTitle, { flex: 1 }]}>Mobile Stock Taking</Text>
        <TouchableOpacity
          style={{ backgroundColor: '#7c3aed', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14 }}
          onPress={() => setShowLibPicker(true)}
        >
          <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>Test</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showManualEntryModal}
        animationType="slide"
        transparent={false}
        onRequestClose={closeManualEntryModal}
        statusBarTranslucent
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.modalOverlay}
          keyboardVerticalOffset={0}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Product Manually</Text>
              <TouchableOpacity
                onPress={closeManualEntryModal}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={styles.modalContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              bounces={true}
            >
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Barcode *</Text>
                <TextInput
                  style={[styles.formInput, styles.formInputDisabled]}
                  value={manualEntryData.barcode}
                  editable={false}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Item Name *</Text>
                <View style={styles.autocompleteContainer}>
                  <TextInput
                    style={styles.formInput}
                    value={manualEntryData.name}
                    onChangeText={handleNameInputChange}
                    placeholder="Enter or select product name"
                    placeholderTextColor="#9ca3af"
                    autoCapitalize="words"
                    returnKeyType="next"
                    autoFocus={true}
                    onFocus={() => setIsEditing(true)}
                    onBlur={() => {
                      setIsEditing(false);
                      setTimeout(() => setShowNameSuggestions(false), 200);
                    }}
                  />
                  {showNameSuggestions && nameSuggestions.length > 0 && (
                    <ScrollView
                      style={styles.autocompleteSuggestionsWrapper}
                      keyboardShouldPersistTaps="handled"
                      nestedScrollEnabled={true}
                    >
                      {nameSuggestions.map((name, index) => (
                        <TouchableOpacity
                          key={`${name}-${index}`}
                          style={styles.autocompleteSuggestionItem}
                          onPress={() => handleSelectNameSuggestion(name)}
                        >
                          <Text style={styles.autocompleteSuggestionText} numberOfLines={1}>
                            {name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  )}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>MRP (₹) *</Text>
                <TextInput
                  style={styles.formInput}
                  value={manualEntryData.mrp}
                  onChangeText={(text) => setManualEntryData({ ...manualEntryData, mrp: text })}
                  placeholder="0.00"
                  placeholderTextColor="#9ca3af"
                  keyboardType="decimal-pad"
                  returnKeyType="next"
                  onFocus={() => setIsEditing(true)}
                  onBlur={() => setIsEditing(false)}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Cost (₹) *</Text>
                <TextInput
                  style={styles.formInput}
                  value={manualEntryData.cost}
                  onChangeText={(text) => setManualEntryData({ ...manualEntryData, cost: text })}
                  placeholder="0.00"
                  placeholderTextColor="#9ca3af"
                  keyboardType="decimal-pad"
                  returnKeyType="next"
                  onFocus={() => setIsEditing(true)}
                  onBlur={() => setIsEditing(false)}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Quantity *</Text>
                <TextInput
                  style={styles.formInput}
                  value={manualEntryData.quantity}
                  onChangeText={(text) => setManualEntryData({ ...manualEntryData, quantity: text })}
                  placeholder="0"
                  placeholderTextColor="#9ca3af"
                  keyboardType="number-pad"
                  returnKeyType="done"
                  onFocus={() => setIsEditing(true)}
                  onBlur={() => setIsEditing(false)}
                />
              </View>
            </ScrollView>

            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={closeManualEntryModal}
              >
                <Text style={[styles.modalButtonText, styles.modalButtonTextCancel]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSave]}
                onPress={handleSaveManualEntry}
              >
                <Text style={[styles.modalButtonText, styles.modalButtonTextSave]}>
                  Save
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* PICKER: choose which lib to test */}
<Modal visible={showLibPicker} transparent animationType="fade" onRequestClose={() => setShowLibPicker(false)}>
  <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
    <View style={{ backgroundColor: 'white', borderRadius: 12, padding: 20, width: '80%' }}>
      <Text style={{ fontSize: 16, fontWeight: '700', marginBottom: 16, textAlign: 'center' }}>
        Select Scanner to Test
      </Text>
           {[
        { key: 'lib1', label: 'Lib 1 — expo-camera' },
        { key: 'lib2', label: 'Lib 2 — vision-camera' },
        { key: 'lib3', label: 'Lib 3 — camera-kit' },
      ].map(({ key, label }) => (
        <TouchableOpacity
          key={key}
          style={{ backgroundColor: '#3b82f6', padding: 12, borderRadius: 8, marginBottom: 10 }}
                  onPress={async () => {
                      if ((key === 'lib2' || key === 'lib3') && isExpoGo) {
              setShowLibPicker(false);
              setTimeout(() => setActiveTestLib(key), 300);
              return;
            }
            if (key === 'lib2') {
              const status = await Camera.requestCameraPermission();
              if (status !== 'granted') {
                Alert.alert("Camera Permission", "Camera access is required to test scanners.");
                setShowLibPicker(false);
                return;
              }
            } else if (!permission?.granted) {
              // lib1 and lib3 both rely on the same OS camera permission
              const { granted } = await requestPermission();
              if (!granted) {
                Alert.alert("Camera Permission", "Camera access is required to test scanners.");
                setShowLibPicker(false);
                return;
              }
            }
            setShowLibPicker(false);
            // Let the picker modal fully unmount before mounting the scanner modal,
            // otherwise the new Modal can fail to appear (Android modal-stacking bug)
            setTimeout(() => setActiveTestLib(key), 300);
          }}
                  >
          <Text style={{ color: 'white', textAlign: 'center', fontWeight: '600' }}>{label}</Text>
        </TouchableOpacity>
      ))}
      <TouchableOpacity onPress={() => setShowLibPicker(false)}>
        <Text style={{ textAlign: 'center', color: '#6b7280', marginTop: 4 }}>Cancel</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>

  {/* LIB 1: expo-camera */}
  {activeTestLib === 'lib1' && (
    <TestScannerLib1
      onResult={(res) => { setActiveTestLib(null); setTestResult(res); }}
      onClose={() => setActiveTestLib(null)}
    />
  )}

  {/* LIB 2: vision-camera */}
  {activeTestLib === 'lib2' && (
    <TestScannerLib2
      onResult={(res) => { setActiveTestLib(null); setTestResult(res); }}
      onClose={() => setActiveTestLib(null)}
    />
  )}

  {/* LIB 3: camera-kit */}
  {activeTestLib === 'lib3' && (
    <TestScannerLib3
      onResult={(res) => { setActiveTestLib(null); setTestResult(res); }}
      onClose={() => setActiveTestLib(null)}
    />
  )}

    {/* RESULT: just barcode + speed */}
    <Modal visible={!!testResult} transparent animationType="fade" onRequestClose={() => setTestResult(null)}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ backgroundColor: 'white', borderRadius: 12, padding: 24, width: '85%' }}>
          <Text style={{ fontSize: 14, color: '#6b7280', marginBottom: 4 }}>{testResult?.lib}</Text>
          <Text style={{ fontSize: 20, fontWeight: '700', marginBottom: 8 }}>{testResult?.barcode}</Text>
          <Text style={{ fontSize: 16, color: '#16a34a', fontWeight: '600', marginBottom: 16 }}>
            ⏱ {testResult?.ms} ms
          </Text>
          <TouchableOpacity
            style={{ backgroundColor: '#3b82f6', padding: 12, borderRadius: 8 }}
            onPress={() => setTestResult(null)}
          >
            <Text style={{ color: 'white', textAlign: 'center', fontWeight: '600' }}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>

      <Modal
        visible={showScanner}
        animationType="slide"
        onRequestClose={handleCloseScanner}
      >
        <View style={styles.scannerContainer}>
          <CameraView
            style={styles.camera}
            facing="back"
            onBarcodeScanned={scanned ? undefined : (data) => {
              console.log("📸 Camera captured barcode");
              handleBarCodeScanned(data, 'scanner');
            }}

            barcodeScannerSettings={{
              barcodeTypes: [
                "qr",
                "ean13",
                "ean8",
                "code128",
                "code39",
                "upc_a",
                "upc_e",
                "code93",
                "itf14",
              ],
            }}
          >
            <View style={styles.scannerOverlay}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleCloseScanner}
              >
                <Ionicons name="close" size={32} color="white" />
              </TouchableOpacity>

              <View style={styles.scanFrame}>
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
              </View>

              <View style={styles.instructionsContainer}>
                <Text style={styles.instructionsText}>
                  {scanned ? 'Processing...' : 'Align barcode within the frame'}
                </Text>
              </View>
            </View>
          </CameraView>
        </View>
      </Modal>


      {searchMode === 'barcode' && !showManualEntryModal && !showScanner && (
        <TextInput
  ref={inputRef}
  autoFocus
  value={hardwareScanValue}
  onChangeText={(text) => setHardwareScanValue(text)}
  style={styles.hiddenInput}
  showSoftInputOnFocus={false}
  blurOnSubmit={false}
onBlur={() => {
  setTimeout(() => {
    if (!isEditingRef.current && !showManualEntryModal && !showScanner && !manualBarcode.length) {
      inputRef.current?.focus(); // ← reads LIVE ref value, not stale closure
    }
  }, 300);
}}
/>
      )}

      <View style={styles.header}>

        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              styles.toggleButtonLeft,
              searchMode === 'barcode' && styles.toggleButtonActive
            ]}
            onPress={() => searchMode !== 'barcode' && toggleSearchMode()}
          >
            <Ionicons
              name="barcode-outline"
              size={18}
              color={searchMode === 'barcode' ? '#FFFFFF' : '#666666'}
              style={styles.toggleIcon}
            />
            <Text style={[
              styles.toggleText,
              searchMode === 'barcode' && styles.toggleTextActive
            ]}>
              Barcode Search
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.toggleButton,
              searchMode === 'name' && styles.toggleButtonActive
            ]}
            onPress={() => searchMode !== 'name' && toggleSearchMode()}
          >
            <Ionicons
              name="search"
              size={18}
              color={searchMode === 'name' ? '#FFFFFF' : '#666666'}
              style={styles.toggleIcon}
            />
            <Text style={[
              styles.toggleText,
              searchMode === 'name' && styles.toggleTextActive
            ]}>
              Item Search
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputRow}>
          <TextInput
            placeholder={searchMode === 'barcode' ? 'Enter barcode manually' : 'Search by name...'}
            value={manualBarcode}
            onChangeText={handleSearchTextChange}
            style={styles.textInput}
            keyboardType="default"
            onSubmitEditing={handleManualSearch}
            returnKeyType="search"
            onFocus={() => {
  setIsEditing(true);
  isEditingRef.current = true;  // ← sync ref
  inputRef.current?.blur();
  setHardwareScanValue('');
}}
onBlur={() => {
  setIsEditing(false);
  isEditingRef.current = false; // ← sync ref
}}
          />
          <TouchableOpacity
            onPress={handleManualSearch}
            style={styles.getButton}
          >
            <Text style={styles.getButtonText}>Get</Text>
          </TouchableOpacity>
        </View>
      </View>

      {showSuggestions && suggestions.length > 0 ? (
        <View style={styles.suggestionsContainer}>
          {searchMode === 'barcode' && suggestions.length > 1 && (
            <Text style={styles.variantsHeader}>
              Found {suggestions.length} variants - Select one:
            </Text>
          )}
          <FlatList
            data={suggestions}
            keyExtractor={(item, index) => `${item.barcode}-${index}`}
            renderItem={renderSuggestionItem}
            keyboardShouldPersistTaps="handled"
          />
        </View>
      ) : (
        <>

          <ScrollView style={styles.scrollView}>
            <View style={styles.content}>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 12,
              }}>
                <Text style={styles.sectionTitle}>Scanned Products</Text>
                <View style={{
                  backgroundColor: scannedItems.length >= 50 ? '#ef4444' : scannedItems.length >= 40 ? '#f97316' : '#3b82f6',
                  paddingHorizontal: 14,
                  paddingVertical: 5,
                  borderRadius: 20,
                }}>
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>
                    {scannedItems.length}/50
                  </Text>
                </View>
              </View>
              {scannedItems.length >= 50 && (
                <Text style={{ color: '#ef4444', fontSize: 13, marginBottom: 8, fontWeight: '600' }}>
                  ⚠️ Limit reached. Upload items before adding more.
                </Text>
              )}

              {scannedItems.length === 0 && (
                <Text style={styles.emptyText}>
                  No products scanned yet. Start scanning or enter a {searchMode === 'barcode' ? 'barcode' : 'product name'} manually.
                </Text>
              )}

              {scannedItems.filter(item => item !== undefined && item !== null).map((item, index) => (<View
                key={`${item.barcode}-${index}-${item.scannedAt}`}
                style={[
                  styles.productCard,
                  getCardStyle(item, index)
                ]}
              >
                <View style={styles.productHeader}>
                  <View style={styles.productInfo}>
                    {item.isManualEntry === 1 && (
                      <View style={styles.manualEntryBadge}>
                        <Text style={styles.manualEntryBadgeText}>MANUAL ENTRY</Text>
                      </View>
                    )}
                    <Text style={styles.productName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.productBarcode}>{item.barcode}</Text>
                  </View>
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      onPress={() => handleDeleteItem(index)}
                      style={styles.deleteButton}
                    >
                      <Ionicons name="trash-outline" size={14} color="white" />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailText}>
                    MRP: <Text style={styles.mrpText}>₹{item.bmrp || 0}</Text>
                  </Text>
                  <Text style={styles.detailText}>
                    Stock: <Text style={styles.stockText}>{item.currentStock}</Text>
                  </Text>
                </View>

                <View style={styles.qtyRow}>
                  <Text style={[styles.detailText, { fontSize: 16, fontWeight: '600' }]}>E.Qty:</Text>
                  <TouchableOpacity
                    onPress={() => {
                      const newQty = Math.max(1, (item.quantity || 1) - 1);
                      const updated = [...scannedItems];
                      updated[index] = { ...updated[index], quantity: newQty };
                      setScannedItems(updated);
                      if (item.id) updatePendingItem(item.id, { ...item, quantity: newQty });

                    }}
                    style={styles.qtyButton}
                  >
                    <Text style={styles.qtyButtonText}>−</Text>
                  </TouchableOpacity>
                  <QtyInput
                    value={item.quantity || 1}
                     onEditingChange={(v) => {
                      setIsEditing(v);
                      isEditingRef.current = v;  // ← sync the ref the hidden input checks
                    }}
                    onRefocusHidden={() => {
                      setTimeout(() => inputRef.current?.focus(), 50);
                    }}
                    
                    onChange={(num) => {
                      const updated = [...scannedItems];
                      updated[index] = { ...updated[index], quantity: num };
                      setScannedItems(updated);
                      if (item.id) updatePendingItem(item.id, { ...item, quantity: num });

                    }}
                  />
                  <TouchableOpacity
                    onPress={() => {
                      const newQty = (item.quantity || 1) + 1;
                      const updated = [...scannedItems];
                      updated[index] = { ...updated[index], quantity: newQty };
                      setScannedItems(updated);
                      if (item.id) updatePendingItem(item.id, { ...item, quantity: newQty });

                    }}
                    style={styles.qtyButton}
                  >
                    <Text style={styles.qtyButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
              ))}

              <View style={styles.footer}>
                <Text style={styles.footerText}>
                  Powered by IMC Business Solutions
                </Text>
              </View>
            </View>
          </ScrollView>
          <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 12, paddingBottom: insets.bottom + 12, backgroundColor: '#f3f4f6', borderTopWidth: 1, borderTopColor: '#e5e7eb' }}>
            <TouchableOpacity
            style={[
              styles.saveButton,
              { flex: 1, marginTop: 0 },
              scannedItems.length > 0 ? styles.saveButtonActive : styles.saveButtonInactive
            ]}
            disabled={scannedItems.length === 0}
            onPress={updateQuantities}
          >
            <Text style={styles.saveButtonText}>
              ⬆ Save({scannedItems ? scannedItems.length : 0})
            </Text>
          </TouchableOpacity>
            <TouchableOpacity
                style={[styles.saveButton, { flex: 1, marginTop: 0, backgroundColor: '#2563eb' }]}
                onPress={handleOpenScanner}
              >
                <Text style={styles.saveButtonText}>Scanner</Text>
              </TouchableOpacity>
          </View>
        </>
      )}

    </KeyboardAvoidingView>
  );
}
function TestScannerLib1({ onResult, onClose }) {
  const startRef = useRef(Date.now());
  const doneRef = useRef(false);
  return (
    <Modal
      visible
      animationType="slide"
      presentationStyle="fullScreen"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: 'black' }}>
        <CameraView
          style={{ flex: 1, width: '100%', height: '100%' }}
          facing="back"
          onBarcodeScanned={doneRef.current ? undefined : (data) => {
            doneRef.current = true;
            onResult({ barcode: data.data, ms: Date.now() - startRef.current, lib: 'Lib 1 — expo-camera' });
          }}
          barcodeScannerSettings={{ barcodeTypes: ["qr","ean13","ean8","code128","code39","upc_a","upc_e","code93","itf14"] }}
        />
        <TouchableOpacity style={{ position: 'absolute', top: 50, right: 20 }} onPress={onClose}>
          <Ionicons name="close" size={32} color="white" />
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

// LIB 2 — react-native-vision-camera
function TestScannerLib2({ onResult, onClose }) {
  if (isExpoGo) {
    return (
      <Modal visible animationType="slide" onRequestClose={onClose}>
        <View style={{ flex: 1, backgroundColor: 'black', justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: 'white', fontSize: 16, textAlign: 'center', paddingHorizontal: 20 }}>
            vision-camera isn't available in Expo Go.{'\n'}Run a dev client build to test this scanner.
          </Text>
          <TouchableOpacity style={{ position: 'absolute', top: 50, right: 20 }} onPress={onClose}>
            <Ionicons name="close" size={32} color="white" />
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  const startRef = useRef(Date.now());
  const doneRef = useRef(false);
  const device = useCameraDevice('back');

  const codeScanner = useCodeScanner({
    codeTypes: ['qr', 'ean-13', 'ean-8', 'code-128', 'code-39', 'upc-e', 'upc-a'],
    onCodeScanned: (codes) => {
      if (doneRef.current || codes.length === 0) return;
      doneRef.current = true;
      onResult({ barcode: codes[0].value, ms: Date.now() - startRef.current, lib: 'Lib 2 — vision-camera' });
    },
  });

  return (
    <Modal
      visible
      animationType="slide"
      presentationStyle="fullScreen"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: 'black' }}>
        {device ? (
          <Camera
            style={{ flex: 1, width: '100%', height: '100%' }}
            device={device}
            isActive
            codeScanner={codeScanner}
          />
        ) : (
          <Text style={{ color: 'white', textAlign: 'center', marginTop: 100 }}>
            No camera device found
          </Text>
        )}
        <TouchableOpacity style={{ position: 'absolute', top: 50, right: 20 }} onPress={onClose}>
          <Ionicons name="close" size={32} color="white" />
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

// LIB 3 — react-native-camera-kit
function TestScannerLib3({ onResult, onClose }) {
  if (isExpoGo) {
    return (
      <Modal visible animationType="slide" onRequestClose={onClose}>
        <View style={{ flex: 1, backgroundColor: 'black', justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: 'white', fontSize: 16, textAlign: 'center', paddingHorizontal: 20 }}>
            camera-kit isn't available in Expo Go.{'\n'}Run a dev client build to test this scanner.
          </Text>
          <TouchableOpacity style={{ position: 'absolute', top: 50, right: 20 }} onPress={onClose}>
            <Ionicons name="close" size={32} color="white" />
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  const startRef = useRef(Date.now());
  const doneRef = useRef(false);

  return (
    <Modal
      visible
      animationType="slide"
      presentationStyle="fullScreen"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: 'black' }}>
        <CameraKitCamera
          style={{ flex: 1, width: '100%', height: '100%' }}
          cameraType="back"
          scanBarcode
          onReadCode={(event) => {
            if (doneRef.current) return;
            const value = event?.nativeEvent?.codeStringValue;
            if (!value) return;
            doneRef.current = true;
            onResult({ barcode: value, ms: Date.now() - startRef.current, lib: 'Lib 3 — camera-kit' });
          }}
        />
        <TouchableOpacity style={{ position: 'absolute', top: 50, right: 20 }} onPress={onClose}>
          <Ionicons name="close" size={32} color="white" />
        </TouchableOpacity>
      </View>
    </Modal>
  );
}