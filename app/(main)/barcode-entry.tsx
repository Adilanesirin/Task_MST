import { Ionicons } from "@expo/vector-icons";
import { Audio } from 'expo-av'; // CORRECTED IMPORT - Changed from expo-audio to expo-av
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useLocalSearchParams, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import * as SQLite from "expo-sqlite";
import React, { useEffect, useRef, useState } from "react";
import {
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

const db = SQLite.openDatabaseSync("magicpedia.db");
const MAX_ITEMS_LIMIT = 50;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 40,
    left: 16,
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
    paddingTop: Platform.OS === 'ios' ? 100 : 80,
    paddingHorizontal: 16,
    backgroundColor: '#f3f4f6',
  },
  hiddenInput: {
    height: 1,
    width: 1,
    opacity: 0,
    position: 'absolute',
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#801b90ff',
    marginBottom: 16,
    textAlign: 'center',
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
    backgroundColor: '#801b90ff',
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
    backgroundColor: '#801b90ff',
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
    backgroundColor: '#fae6f7ff',
    borderWidth: 1,
    borderColor: '#fa09deff',
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
    backgroundColor: '#801b90ff',
    padding: 8,
    borderRadius: 4,
  },
  deleteButton: {
    backgroundColor: '#ef4444',
    padding: 8,
    borderRadius: 4,
  },
  productDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flexWrap: 'wrap',
  },
  detailText: {
    fontSize: 14,
    color: '#4b5563',
  },
  currentStockText: {
    fontWeight: '600',
    color: '#6b7280',
  },
  countedQtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  countedQtyLabel: {
    fontSize: 14,
    color: '#4b5563',
    fontWeight: '500',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quantityButton: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonDisabled: {
    opacity: 0.3,
  },
  countedQtyText: {
    fontWeight: '700',
    fontSize: 18,
    color: '#2563eb',
    minWidth: 35,
    textAlign: 'center',
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
    backgroundColor: '#801b90ff',
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
    borderColor: '#801b90ff',
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
  limitIndicator: {
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
  },
  limitIndicatorText: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
  },
});

let dbInitialized = false;
const dbQueue: (() => Promise<any>)[] = [];
let isProcessingQueue = false;

const runInQueue = async <T,>(fn: () => Promise<T>): Promise<T> => {
  return new Promise<T>((resolve, reject) => {
    dbQueue.push(async () => {
      try {
        const result = await fn();
        resolve(result);
        return result;
      } catch (error) {
        reject(error);
        throw error;
      }
    });
    processQueue();
  });
};

const processQueue = async () => {
  if (isProcessingQueue || dbQueue.length === 0) return;
  
  isProcessingQueue = true;
  while (dbQueue.length > 0) {
    const task = dbQueue.shift();
    if (task) {
      try {
        await task();
      } catch (error) {
        console.error("Queue task error:", error);
      }
    }
  }
  isProcessingQueue = false;
};

const initStockCountTable = async () => {
  if (dbInitialized) return;
  
  return runInQueue(async () => {
    try {
      console.log("[DB] Initializing stock_count table...");
      
      const tables = await db.getAllAsync(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='stock_count'"
      );
      
      if (tables.length === 0) {
        console.log("[DB] Creating new stock_count table...");
        await db.execAsync(`
          CREATE TABLE stock_count (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userid TEXT NOT NULL,
            itemcode TEXT NOT NULL,
            barcode TEXT NOT NULL,
            quantity INTEGER NOT NULL,
            count_date TEXT NOT NULL,
            sync_status TEXT DEFAULT 'pending',
            created_at TEXT NOT NULL,
            product_name TEXT
          );
        `);
        console.log("[DB] stock_count table created successfully");
      } else {
        console.log("[DB] stock_count table exists");
      }
      
      console.log("[DB] stock_count table ready");
      
    } catch (error) {
      console.error("[ERROR] Error initializing stock count table:", error);
      throw error;
    }
  });
};

const initPendingItemsTable = async () => {
  if (dbInitialized) return;
  
  return runInQueue(async () => {
    try {
      console.log("[DB] Initializing pending_items table...");
      
      const tables = await db.getAllAsync(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='pending_items'"
      );
      
      if (tables.length === 0) {
        console.log("[DB] Creating new pending_items table...");
        await db.execAsync(`
          CREATE TABLE pending_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            barcode TEXT NOT NULL,
            name TEXT,
            currentStock INTEGER,
            countedQuantity INTEGER DEFAULT 0,
            scannedAt INTEGER,
            product TEXT,
            brand TEXT
          );
        `);
        console.log("[DB] Pending items table created successfully");
      } else {
        console.log("[DB] Table exists");
      }
      
      dbInitialized = true;
    } catch (error) {
      console.error("[ERROR] Error initializing pending_items table:", error);
      throw error;
    }
  });
};

const saveStockCountToSync = async (stockData: {
  userid: string;
  itemcode: string;
  barcode: string;
  quantity: number;
  count_date: string;
  product_name?: string;
}) => {
  return runInQueue(async () => {
    try {
      console.log("[SAVE] Saving stock count to sync:", stockData.barcode);
      
      await db.runAsync(
        `INSERT INTO stock_count 
        (userid, itemcode, barcode, quantity, count_date, sync_status, created_at, product_name)
        VALUES (?, ?, ?, ?, ?, 'pending', datetime('now'), ?)`,
        [
          stockData.userid,
          stockData.itemcode,
          stockData.barcode,
          stockData.quantity,
          stockData.count_date,
          stockData.product_name || '',
        ]
      );
      
      console.log("[SUCCESS] Successfully saved stock count:", stockData.barcode);
      return true;
    } catch (error: any) {
      console.error("[ERROR] Error saving stock count:", error);
      throw error;
    }
  });
};

export default function BarcodeEntry() {
  const { updatedItem, itemIndex } = useLocalSearchParams<{
    updatedItem?: string;
    itemIndex?: string;
  }>();
  const router = useRouter();

  const [scannedItems, setScannedItems] = useState<any[]>([]);
  const [hardwareScanValue, setHardwareScanValue] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [manualBarcode, setManualBarcode] = useState("");
  const [searchMode, setSearchMode] = useState<'barcode' | 'name'>('barcode');
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [showScanner, setShowScanner] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [scanMode, setScanMode] = useState<"hardware" | "camera">("hardware");
  const [scanned, setScanned] = useState(false);
  const scanLockRef = useRef(false);
  const processingAlertRef = useRef(false);

  // Sound state for expo-av
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [soundLoaded, setSoundLoaded] = useState(false);

  const inputRef = useRef<TextInput>(null);

  // Load sound effect with expo-av
  useEffect(() => {
    loadSound();
    
    return () => {
      // Clean up audio resources
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  const loadSound = async () => {
    try {
      console.log('[AUDIO] Loading beep sound...');
      
      // Initialize audio
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
      
      // Create and load the sound
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: 'https://www.soundjay.com/buttons/beep-01a.mp3' },
        { shouldPlay: false, isLooping: false }
      );
      
      setSound(newSound);
      setSoundLoaded(true);
      console.log('[AUDIO] Beep sound loaded successfully');
    } catch (error) {
      console.error('[ERROR] Failed to load beep sound:', error);
      setSoundLoaded(false);
    }
  };

  const playBeep = async () => {
    try {
      if (!soundLoaded || !sound) {
        console.log('[AUDIO] Sound not loaded, skipping beep');
        return;
      }
      
      await sound.replayAsync();
      
      console.log('[AUDIO] Beep played successfully');
    } catch (error) {
      console.error('[ERROR] Failed to play beep:', error);
    if (sound) {
      try{
        await sound.stopAsync();
        await sound.setPositionAsync(0);
        await sound.playAsync();
      } catch (fallbackError) {
        console.error('[ERROR] Fallback failed to play beep:', fallbackError);
      }
    }
   } 
  };

  // NEW FUNCTION: Check if any items have zero quantity
  const hasZeroQuantityItems = (items: any[] = scannedItems): boolean => {
    return items.some(item => {
      const quantity = item.countedQuantity || 0;
      return quantity === 0 || isNaN(quantity);
    });
  };

  // NEW FUNCTION: Get zero quantity items count and names
  const getZeroQuantityItemsInfo = () => {
    const zeroItems = scannedItems.filter(item => {
      const quantity = item.countedQuantity || 0;
      return quantity === 0 || isNaN(quantity);
    });
    
    return {
      count: zeroItems.length,
      names: zeroItems.map(item => item.name || 'Unknown Product'),
      items: zeroItems
    };
  };

  // MODIFIED: Show alert for zero quantity items
  const showZeroQuantityAlert = (action: string = "add new items") => {
    const zeroItemsInfo = getZeroQuantityItemsInfo();
    
    if (zeroItemsInfo.count === 0) return false;
    
    const itemNames = zeroItemsInfo.names
      .slice(0, 3) // Show only first 3 items to avoid too long alert
      .map(name => `• ${name}`)
      .join('\n');
    
    const moreCount = Math.max(0, zeroItemsInfo.count - 3);
    const moreText = moreCount > 0 ? `\n... and ${moreCount} more item(s)` : '';
    
    Alert.alert(
      "Quantity Required",
      `You have ${zeroItemsInfo.count} item(s) with quantity 0:\n\n${itemNames}${moreText}\n\nPlease set quantities for these items before ${action}.`,
      [
        {
          text: "Go to Items",
          onPress: () => {
            // Scroll to the first zero quantity item
            // We could implement scroll to functionality if needed
          },
          style: "default"
        },
        {
          text: "OK",
          style: "cancel"
        }
      ]
    );
    
    return true;
  };

  const checkItemLimit = (currentCount: number): boolean => {
    if (currentCount >= MAX_ITEMS_LIMIT) {
      Alert.alert(
        "Item Limit Reached",
        `You have reached the maximum limit of ${MAX_ITEMS_LIMIT} items.\n\nPlease upload the current items before adding more products.`,
        [
          {
            text: "Upload Now",
            onPress: () => router.push("/(main)/upload"),
            style: "default"
          },
          {
            text: "Cancel",
            style: "cancel"
          }
        ]
      );
      return true;
    }
    return false;
  };

  // NEW: Combined validation check
  const validateCanAddNewItem = (): boolean => {
    // First check item limit
    if (checkItemLimit(scannedItems.length)) {
      return false;
    }
    
    // Then check for zero quantity items
    if (hasZeroQuantityItems()) {
      showZeroQuantityAlert();
      return false;
    }
    
    return true;
  };

  useEffect(() => {
    const initialize = async () => {
      console.log("[INIT] Initializing BarcodeEntry component...");
      try {
        await initStockCountTable();
        await initPendingItemsTable();
        await loadPendingItems();
        await loadAllProducts();
      } catch (error) {
        console.error("[ERROR] Initialization error:", error);
        Alert.alert("Error", "Failed to initialize database. Please restart the app.");
      }
    };
    initialize();
  }, []);

  const loadPendingItems = async () => {
    return runInQueue(async () => {
      try {
        const rows = await db.getAllAsync(
          "SELECT * FROM pending_items ORDER BY scannedAt DESC"
        );
        setScannedItems(rows || []);
        console.log(`[LOAD] Loaded ${rows?.length || 0} pending items`);
      } catch (error) {
        console.error("[ERROR] Error loading pending items:", error);
        setScannedItems([]);
      }
    });
  };

  const savePendingItem = async (item: any) => {
    return runInQueue(async () => {
      try {
        await db.runAsync(
          `INSERT INTO pending_items 
          (barcode, name, currentStock, countedQuantity, scannedAt, product, brand)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            item.barcode,
            item.name,
            item.currentStock || 0,
            item.countedQuantity || 0,
            item.scannedAt,
            item.product || "",
            item.brand || ""
          ]
        );
        console.log("[SUCCESS] Saved pending item:", item.barcode);
      } catch (error) {
        console.error("[ERROR] Error saving pending item:", error);
        throw error;
      }
    });
  };

  const deletePendingItem = async (itemId: number) => {
    return runInQueue(async () => {
      try {
        await db.runAsync(
          "DELETE FROM pending_items WHERE id = ?",
          [itemId]
        );
        console.log("[DELETE] Deleted pending item:", itemId);
      } catch (error) {
        console.error("[ERROR] Error deleting pending item:", error);
        throw error;
      }
    });
  };

  const updatePendingItem = async (itemId: number, item: any) => {
    return runInQueue(async () => {
      try {
        await db.runAsync(
          `UPDATE pending_items 
          SET countedQuantity = ?
          WHERE id = ?`,
          [item.countedQuantity, itemId]
        );
        console.log("[UPDATE] Updated pending item:", itemId);
      } catch (error) {
        console.error("[ERROR] Error updating pending item:", error);
        throw error;
      }
    });
  };

  const handleQuantityChange = async (index: number, delta: number) => {
    const item = scannedItems[index];
    const newQuantity = Math.max(0, (item.countedQuantity || 0) + delta);
    
    const updatedItem = { ...item, countedQuantity: newQuantity };
    
    setScannedItems(prevItems => {
      const newItems = [...prevItems];
      newItems[index] = updatedItem;
      return newItems;
    });
    
    if (item.id) {
      await updatePendingItem(item.id, updatedItem);
    }
  };

  useEffect(() => {
    const loadScanMode = async () => {
      const saved = await SecureStore.getItemAsync("scanMode");
      if (saved === "camera" || saved === "hardware") {
        setScanMode(saved);
      }
    };
    loadScanMode();
  }, []);

  const loadAllProducts = async () => {
    return runInQueue(async () => {
      try {
        const rows = await db.getAllAsync("SELECT * FROM product_data");
        setAllProducts(rows || []);
        console.log(`[LOAD] Loaded ${rows?.length || 0} products from database`);
        
        if (rows && rows.length > 0) {
          console.log("[INFO] Sample product:", JSON.stringify(rows[0], null, 2));
        } else {
          console.warn("[WARNING] product_data table is EMPTY! You need to sync data first.");
        }
      } catch (error) {
        console.error("[ERROR] Error loading products:", error);
        setAllProducts([]);
      }
    });
  };

  // ✅ CORRECTLY PLACED: searchBarcodeWithVariants function inside component
  const searchBarcodeWithVariants = async (barcode: string): Promise<any[]> => {
    return runInQueue(async () => {
      try {
        console.log("\n[SEARCH] === BARCODE SEARCH START ===");
        console.log(`[SEARCH] Searching for: "${barcode}"`);
        
        const totalCount = await db.getFirstAsync(
          'SELECT COUNT(*) as count FROM product_data'
        ) as {count: number} | null;
        
        console.log(`[INFO] Total products in database: ${totalCount?.count || 0}`);
        
        if (!totalCount || totalCount.count === 0) {
          console.error("[ERROR] CRITICAL: product_data table is EMPTY!");
          Alert.alert(
            "Database Empty",
            "No products found in database.\n\nPlease sync/download data from server first.",
            [{ text: "OK" }]
          );
          return [];
        }

        const trimmedBarcode = barcode.trim();
        console.log(`[SEARCH] Trimmed barcode: "${trimmedBarcode}"`);

        const exactRows = await db.getAllAsync(
          "SELECT * FROM product_data WHERE TRIM(barcode) = ?",
          [trimmedBarcode]
        );
        console.log(`[RESULT] Exact matches: ${exactRows?.length || 0}`);

        const noSpaceBarcode = trimmedBarcode.replace(/\s+/g, '');
        const noSpaceRows = await db.getAllAsync(
          "SELECT * FROM product_data WHERE REPLACE(TRIM(barcode), ' ', '') = ?",
          [noSpaceBarcode]
        );
        console.log(`[RESULT] No-space matches: ${noSpaceRows?.length || 0}`);

        const variantRows1 = await db.getAllAsync(
          "SELECT * FROM product_data WHERE barcode LIKE ?",
          [`${trimmedBarcode} :%`]
        );
        console.log(`[RESULT] Variants (space colon): ${variantRows1?.length || 0}`);

        const variantRows2 = await db.getAllAsync(
          "SELECT * FROM product_data WHERE barcode LIKE ?",
          [`${trimmedBarcode}:%`]
        );
        console.log(`[RESULT] Variants (no space): ${variantRows2?.length || 0}`);

        const variantRows3 = await db.getAllAsync(
          "SELECT * FROM product_data WHERE barcode LIKE ?",
          [`${trimmedBarcode} %`]
        );
        console.log(`[RESULT] Variants (space): ${variantRows3?.length || 0}`);

        const containsRows = await db.getAllAsync(
          "SELECT * FROM product_data WHERE barcode LIKE ?",
          [`%${trimmedBarcode}%`]
        );
        console.log(`[RESULT] Contains matches: ${containsRows?.length || 0}`);

        const allMatches = [...exactRows, ...noSpaceRows, ...variantRows1, ...variantRows2, ...variantRows3, ...containsRows];
        
        const uniqueMatches = allMatches.filter((item, index, self) =>
          index === self.findIndex((t) => t.barcode === item.barcode)
        );
        
        console.log(`[RESULT] Total unique matches: ${uniqueMatches.length}`);
        
        if (uniqueMatches.length > 0) {
          console.log("[SUCCESS] First match found:", JSON.stringify(uniqueMatches[0], null, 2));
          console.log("[INFO] All matching barcodes:", uniqueMatches.map(m => m.barcode).join(', '));
        } else {
          console.warn(`[WARNING] No matches found for barcode: ${trimmedBarcode}`);
          
          const similarRows = await db.getAllAsync(
            "SELECT barcode FROM product_data WHERE barcode LIKE ? LIMIT 5",
            [`%${trimmedBarcode.substring(0, 8)}%`]
          );
          console.log("[INFO] Similar barcodes in DB:", similarRows.map((r: any) => r.barcode).join(', '));
        }
        
        console.log("[SEARCH] === BARCODE SEARCH END ===\n");
        return uniqueMatches;
      } catch (err) {
        console.error("[ERROR] Database search error:", err);
        Alert.alert("Search Error", `Failed to search database: ${err}`);
        return [];
      }
    });
  };

  useEffect(() => {
    if (updatedItem && itemIndex !== undefined) {
      try {
        const parsedItem = JSON.parse(updatedItem);
        const index = parseInt(itemIndex);
        
        setScannedItems(prevItems => {
          const newItems = [...prevItems];
          if (index >= 0 && index < newItems.length) {
            newItems[index] = { 
              ...newItems[index], 
              countedQuantity: parsedItem.countedQuantity
            };
            if (newItems[index].id) {
              updatePendingItem(newItems[index].id, newItems[index]);
            }
          } else {
            newItems.unshift(parsedItem);
          }
          return newItems;
        });

        router.setParams({ 
          updatedItem: undefined, 
          itemIndex: undefined 
        } as any);
      } catch (error) {
        console.error("[ERROR] Error parsing updated item:", error);
      }
    }
  }, [updatedItem, itemIndex]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isEditing && searchMode === 'barcode' && scanMode === 'hardware') {
        inputRef.current?.focus();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isEditing, searchMode, scanMode]);

  useEffect(() => {
    if (searchMode === 'barcode' && scanMode === 'hardware' && hardwareScanValue.length > 0 && hardwareScanValue.trim() !== "") {
      handleBarCodeScanned({ data: hardwareScanValue.trim() });
      setHardwareScanValue("");
    }
  }, [hardwareScanValue, searchMode, scanMode]);

  useEffect(() => {
    if (!showScanner) {
      setTimeout(() => {
        setScanned(false);
        scanLockRef.current = false;
        processingAlertRef.current = false;
      }, 300);
    }
  }, [showScanner]);

  const toggleSearchMode = () => {
    const newMode = searchMode === 'barcode' ? 'name' : 'barcode';
    setSearchMode(newMode);
    setManualBarcode('');
    setSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleSearchTextChange = (text: string) => {
    setManualBarcode(text);
    
    if (searchMode === 'name' && text.trim().length >= 2) {
      const searchLower = text.toLowerCase().trim();
      const products = allProducts || [];
      
      const filtered = products.filter((product: any) => 
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

  // MODIFIED: Removed playBeep from manual search
  const handleSelectSuggestion = (product: any) => {
    if (!validateCanAddNewItem()) {
      return;
    }
    
    setManualBarcode(product.name);
    setShowSuggestions(false);
    Keyboard.dismiss();
    addProductToList(product);
  };

  // MODIFIED: Removed playBeep from manual add
  const addProductToList = async (product: any) => {
    if (!validateCanAddNewItem()) {
      return;
    }
    
    const existing = scannedItems.find((item) => item.barcode === product.barcode);
    if (existing) {
      Alert.alert("Info", `Product already scanned: ${existing.name}`);
      return;
    }

    const newItem = {
      ...product,
      countedQuantity: 0,
      currentStock: product.quantity ?? 0,
      scannedAt: new Date().getTime(),
    };
    
    await savePendingItem(newItem);
    await loadPendingItems();
    setManualBarcode("");
  };

  // MODIFIED: Added playBeep only for camera/hardware scanner
  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (showScanner) {
      if (scanLockRef.current || scanned || processingAlertRef.current) {
        return;
      }
      scanLockRef.current = true;
      setScanned(true);
      setShowScanner(false);
    }

    try {
      // Check if we can add new items (item limit + zero quantity)
      if (!validateCanAddNewItem()) {
        if (showScanner) {
          setScanned(false);
          scanLockRef.current = false;
          processingAlertRef.current = false;
        }
        return;
      }

      console.log(`[SCAN] Barcode scanned: "${data}"`);
      
      // Play beep sound on successful scan detection (only for scanners)
      await playBeep();
      
      const allMatches = await searchBarcodeWithVariants(data);

      console.log(`[SCAN] Matches received: ${allMatches?.length || 0}`);
      
      if (!allMatches || !Array.isArray(allMatches) || allMatches.length === 0) {
        console.error("[ERROR] No matches found - showing error alert");
        Alert.alert(
          "Product not found", 
          `Barcode: ${data}\n\nThis product is not in the database.`,
          [
            {
              text: 'OK',
              onPress: () => {
                if (showScanner) {
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
      
      console.log(`[SUCCESS] Proceeding with ${allMatches.length} match(es)`);

      if (allMatches.length === 1) {
        const product = allMatches[0] as { [key: string]: any; quantity?: number };
        const existing = scannedItems.find((item) => item.barcode === product.barcode);
        
        if (existing) {
          Alert.alert("Info", `Product already scanned: ${existing.name}`, [
            {
              text: 'OK',
              onPress: () => {
                if (showScanner) {
                  setScanned(false);
                  scanLockRef.current = false;
                  processingAlertRef.current = false;
                }
              }
            }
          ]);
          return;
        }

        const newItem = {
          ...product,
          countedQuantity: 0,
          currentStock: product.quantity ?? 0,
          scannedAt: new Date().getTime(),
        };
        
        await savePendingItem(newItem);
        await loadPendingItems();
        
        if (showScanner) {
          setTimeout(() => {
            setScanned(false);
            scanLockRef.current = false;
          }, 500);
        }
      } else {
        setSuggestions(allMatches);
        setShowSuggestions(true);
        
        if (showScanner) {
          setTimeout(() => {
            setScanned(false);
            scanLockRef.current = false;
          }, 500);
        }
      }
    } catch (err) {
      console.error("[ERROR] Error fetching product:", err);
      Alert.alert("Error", "Failed to scan product.", [
        {
          text: 'OK',
          onPress: () => {
            if (showScanner) {
              setScanned(false);
              scanLockRef.current = false;
              processingAlertRef.current = false;
            }
          }
        }
      ]);
    }
  };

  // MODIFIED: Removed playBeep from manual search
  const handleManualSearch = async () => {
    const trimmed = manualBarcode.trim();
    if (!trimmed) {
      Alert.alert("Error", "Please enter a search term");
      return;
    }

    // Check if we can add new items (item limit + zero quantity)
    if (!validateCanAddNewItem()) {
      return;
    }

    console.log("\n[SEARCH] === MANUAL SEARCH START ===");
    console.log(`[SEARCH] Search mode: ${searchMode}`);
    console.log(`[SEARCH] Search term: "${trimmed}"`);

    if (searchMode === 'barcode') {
      try {
        console.log("[SEARCH] Calling searchBarcodeWithVariants...");
        const allMatches = await searchBarcodeWithVariants(trimmed);

        console.log(`[RESULT] Manual search - Matches received: ${allMatches?.length || 0}`);
        
        if (!allMatches || !Array.isArray(allMatches) || allMatches.length === 0) {
          console.error("[ERROR] No matches found for manual search");
          Alert.alert(
            "Product not found",
            `Barcode: ${trimmed}\n\nThis product is not in the database.`
          );
          return;
        }

        console.log(`[SUCCESS] Found ${allMatches.length} match(es)`);

        // REMOVED: playBeep() call for manual search

        if (allMatches.length === 1) {
          console.log("[SUCCESS] Single match - adding to list");
          const product = allMatches[0] as { [key: string]: any; quantity?: number };
          const existing = scannedItems.find((item) => item.barcode === product.barcode);
          
          if (existing) {
            console.log("[INFO] Product already in list");
            Alert.alert("Info", `Product already scanned: ${existing.name}`);
            return;
          }

          const newItem = {
            ...product,
            countedQuantity: 0,
            currentStock: product.quantity ?? 0,
            scannedAt: new Date().getTime(),
          };

          console.log("[SAVE] Saving item:", newItem.name);
          await savePendingItem(newItem);
          await loadPendingItems();
          
          setManualBarcode("");
          console.log("[SUCCESS] Item added successfully");
        } else {
          console.log(`[INFO] Multiple matches (${allMatches.length}) - showing suggestions`);
          setSuggestions(allMatches);
          setShowSuggestions(true);
        }
        
        console.log("[SEARCH] === MANUAL SEARCH END ===\n");
      } catch (err) {
        console.error("[ERROR] Manual search error:", err);
        Alert.alert("Error", `Failed to fetch product: ${err}`);
      }
    } else {
      console.log("[SEARCH] Name search mode");
      const searchLower = trimmed.toLowerCase();
      const products = allProducts || [];
      
      console.log(`[SEARCH] Searching in ${products.length} products`);
      
      const matches = products.filter((product: any) => 
        product.name?.toLowerCase().includes(searchLower) ||
        product.brand?.toLowerCase().includes(searchLower) ||
        product.product?.toLowerCase().includes(searchLower)
      );

      console.log(`[RESULT] Name search found ${matches.length} matches`);

      if (matches.length === 1) {
        console.log("[SUCCESS] Single name match - adding to list");
        // REMOVED: playBeep() call for name search
        await addProductToList(matches[0]);
      } else if (matches.length > 1) {
        console.log("[INFO] Multiple name matches - showing suggestions");
        setSuggestions(matches);
        setShowSuggestions(true);
      } else {
        console.log("[ERROR] No name matches found");
        Alert.alert("Not Found", `No products found matching: "${trimmed}"`);
      }
      
      console.log("[SEARCH] === MANUAL SEARCH END ===\n");
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
    if (scanMode === "camera") {
      if (!permission) {
        return;
      }

      if (!permission.granted) {
        const { granted } = await requestPermission();
        if (!granted) {
          Alert.alert(
            "Camera Permission",
            "Camera permission is required to scan barcodes. Please enable it in settings."
          );
          return;
        }
      }

      setScanned(false);
      scanLockRef.current = false;
      processingAlertRef.current = false;
      setShowScanner(true);
    } else {
      Alert.alert('Scanner Mode', 'Hardware scanner is active. The device will automatically scan barcodes.');
    }
  };

  const handleCloseScanner = () => {
    setShowScanner(false);
    setTimeout(() => {
      setScanned(false);
      scanLockRef.current = false;
      processingAlertRef.current = false;
    }, 300);
  };

  const updateStockCounts = async () => {
    const itemsWithZeroCount = scannedItems.filter(item => {
      return !item.countedQuantity || item.countedQuantity === 0 || isNaN(item.countedQuantity);
    });

    if (itemsWithZeroCount.length > 0) {
      const itemNames = itemsWithZeroCount.map(item => `- ${item.name}`).join('\n');
      
      Alert.alert(
        "Zero Quantity Items",
        `The following ${itemsWithZeroCount.length} item(s) have counted quantity of 0:\n\n${itemNames}\n\nThese items will be saved with a count of 0. Do you want to proceed?`,
        [
          {
            text: "Cancel",
            style: "cancel"
          },
          {
            text: "Save All Items",
            style: "default",
            onPress: () => showFinalConfirmation()
          }
        ]
      );
    } else {
      showFinalConfirmation();
    }
  };

  const showFinalConfirmation = () => {
    Alert.alert(
      "Confirm Stock Count",
      `Are you sure you want to save stock count for ${scannedItems.length} item(s)? This action cannot be undone.`,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Save Count",
          style: "default",
          onPress: async () => {
            try {
              const userId = await SecureStore.getItemAsync("user_id");
              const today = new Date().toISOString().split("T")[0];

              let successCount = 0;
              let errorCount = 0;

              console.log(`[SAVE] Starting stock count save for ${scannedItems.length} items...`);

              for (const item of scannedItems) {
                try {
                  let itemCode = item.barcode;
                  
                  const productData = await runInQueue(async () => {
                    return await db.getFirstAsync(
                      "SELECT code FROM product_data WHERE barcode = ?",
                      [item.barcode]
                    ) as { code?: string } | null;
                  });
                  
                  itemCode = productData?.code || item.barcode;
                  
                  const quantityToSave = item.countedQuantity || 0;
                  
                  console.log(`[SAVE] Saving stock count: ${item.barcode} (${item.name}) - Qty: ${quantityToSave}`);
                  
                  await saveStockCountToSync({
                    userid: userId ?? "unknown",
                    itemcode: itemCode,
                    barcode: item.barcode,
                    quantity: quantityToSave,
                    count_date: today,
                    product_name: item.name,
                  });

                  await runInQueue(async () => {
                    const productExists = await db.getFirstAsync(
                      "SELECT 1 FROM product_data WHERE barcode = ?",
                      [item.barcode]
                    );
                    
                    if (productExists) {
                      await db.runAsync(
                        "UPDATE product_data SET quantity = ? WHERE barcode = ?",
                        [quantityToSave, item.barcode]
                      );
                      console.log(`[UPDATE] Updated product_data for: ${item.barcode}`);
                    }
                  });
                  
                  successCount++;
                  console.log(`[SUCCESS] Successfully processed: ${item.barcode}`);
                  
                } catch (itemError) {
                  console.error(`[ERROR] Error processing item ${item.barcode}:`, itemError);
                  errorCount++;
                }
              }
              
              if (successCount > 0) {
                await runInQueue(async () => {
                  await db.runAsync("DELETE FROM pending_items");
                  console.log(`[CLEAN] Cleared ${successCount} pending items`);
                });
              }

              if (errorCount === 0) {
                Alert.alert("Success", `All ${successCount} stock counts saved for sync!`);
                setScannedItems([]);
                router.push("/(main)/");
              } else if (successCount > 0) {
                Alert.alert("Partial Success", 
                  `${successCount} counts saved for sync, but ${errorCount} failed. The successful entries have been cleared.`);
                await loadPendingItems();
              } else {
                Alert.alert("Error", "Failed to save any stock counts. Please try again.");
              }
            } catch (err) {
              console.error("[ERROR] Save failed:", err);
              Alert.alert("Error", "Failed to save stock counts.");
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
          {item.barcode && (
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
    return index === 0 ? styles.latestProductCard : styles.regularProductCard;
  };

  const getLimitIndicatorStyle = () => {
    if (scannedItems.length >= MAX_ITEMS_LIMIT) {
      return {
        backgroundColor: '#FEE2E2',
        borderColor: '#EF4444',
      };
    } else if (scannedItems.length >= MAX_ITEMS_LIMIT * 0.8) {
      return {
        backgroundColor: '#FEF3C7',
        borderColor: '#F59E0B',
      };
    }
    return {
      backgroundColor: '#E0E7FF',
      borderColor: '#801b90ff',
    };
  };

  const getLimitIndicatorTextStyle = () => {
    if (scannedItems.length >= MAX_ITEMS_LIMIT) {
      return { color: '#DC2626' };
    } else if (scannedItems.length >= MAX_ITEMS_LIMIT * 0.8) {
      return { color: '#D97706' };
    }
    return { color: '#801b90ff' };
  };

  const getLimitIndicatorText = () => {
    if (scannedItems.length >= MAX_ITEMS_LIMIT) {
      return `Limit Reached: ${scannedItems.length}/${MAX_ITEMS_LIMIT} items`;
    } else if (scannedItems.length >= MAX_ITEMS_LIMIT * 0.8) {
      return `${scannedItems.length}/${MAX_ITEMS_LIMIT} items (${MAX_ITEMS_LIMIT - scannedItems.length} remaining)`;
    }
    return `${scannedItems.length}/${MAX_ITEMS_LIMIT} items`;
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.backButton}>
        <TouchableOpacity onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
      </View>

      <View style={styles.scanButton}>
        <TouchableOpacity onPress={handleOpenScanner}>
          <Ionicons name="barcode-outline" size={24} color="#680677ff" />
        </TouchableOpacity>
      </View>

      <Modal
        visible={showScanner}
        animationType="slide"
        onRequestClose={handleCloseScanner}
      >
        <View style={styles.scannerContainer}>
          <CameraView
            style={styles.camera}
            facing="back"
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
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

      {searchMode === 'barcode' && scanMode === 'hardware' && (
        <TextInput
          ref={inputRef}
          autoFocus
          value={hardwareScanValue}
          onChangeText={(text) => setHardwareScanValue(text)}
          style={styles.hiddenInput}
          showSoftInputOnFocus={false}
          blurOnSubmit={false}
        />
      )}

      <View style={styles.header}>
        <Text style={styles.pageTitle}>
          Stock Taking
        </Text>
        
        <View style={[styles.limitIndicator, getLimitIndicatorStyle()]}>
          <Text style={[styles.limitIndicatorText, getLimitIndicatorTextStyle()]}>
            {getLimitIndicatorText()}
          </Text>
        </View>

        {/* NEW: Zero quantity warning indicator */}
        {hasZeroQuantityItems() && (
          <View style={[styles.limitIndicator, {
            backgroundColor: '#FEF3C7',
            borderColor: '#F59E0B',
            marginBottom: 12,
          }]}>
            <Text style={[styles.limitIndicatorText, { color: '#D97706' }]}>
              ⚠️ {getZeroQuantityItemsInfo().count} item(s) need quantity set
            </Text>
          </View>
        )}

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
            onFocus={() => setIsEditing(true)}
            onBlur={() => setIsEditing(false)}
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
        <ScrollView style={styles.scrollView}>
          <View style={styles.content}>
            <Text style={styles.sectionTitle}>
              Counted Products ({scannedItems.length})
              {hasZeroQuantityItems() && (
                <Text style={{ color: '#F59E0B', fontSize: 14 }}>
                  {' '}({getZeroQuantityItemsInfo().count} need quantity)
                </Text>
              )}
            </Text>

            {scannedItems.length === 0 && (
              <Text style={styles.emptyText}>
                No products scanned yet. Start scanning or enter a {searchMode === 'barcode' ? 'barcode' : 'product name'} manually.
              </Text>
            )}

            {scannedItems.map((item, index) => {
              const hasZeroQuantity = (item.countedQuantity || 0) === 0 || isNaN(item.countedQuantity);
              
              return (
                <View
                  key={`${item.barcode}-${index}-${item.scannedAt}`}
                  style={[
                    styles.productCard,
                    getCardStyle(item, index),
                    hasZeroQuantity && {
                      borderColor: '#F59E0B',
                      borderWidth: 2,
                      backgroundColor: '#FFFBEB',
                    }
                  ]}
                >
                  {hasZeroQuantity && (
                    <View style={{
                      position: 'absolute',
                      top: -8,
                      right: 8,
                      backgroundColor: '#F59E0B',
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      borderRadius: 12,
                    }}>
                      <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>
                        NEEDS QTY
                      </Text>
                    </View>
                  )}
                  
                  <View style={styles.productHeader}>
                    <View style={styles.productInfo}>
                      <Text style={styles.productName} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={styles.productBarcode}>{item.barcode}</Text>
                    </View>
                    <View style={styles.actionButtons}>
                      <TouchableOpacity
                        onPress={() => handleEditItem(item, index)}
                        style={styles.editButton}
                      >
                        <Ionicons name="create-outline" size={14} color="white" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDeleteItem(index)}
                        style={styles.deleteButton}
                      >
                        <Ionicons name="trash-outline" size={14} color="white" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.productDetails}>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailText}>
                        Current Stock: <Text style={styles.currentStockText}>{item.currentStock || 0}</Text>
                      </Text>
                    </View>

                    <View style={styles.countedQtyRow}>
                      <Text style={styles.countedQtyLabel}>Counted Qty:</Text>
                      <View style={styles.quantityControls}>
                        <TouchableOpacity
                          style={[
                            styles.quantityButton,
                            (item.countedQuantity || 0) <= 0 && styles.quantityButtonDisabled
                          ]}
                          onPress={() => handleQuantityChange(index, -1)}
                          disabled={(item.countedQuantity || 0) <= 0}
                        >
                          <Ionicons name="remove" size={20} color="#801b90ff" />
                        </TouchableOpacity>
                        
                        <Text style={[
                          styles.countedQtyText,
                          hasZeroQuantity && { color: '#F59E0B' }
                        ]}>{item.countedQuantity || 0}</Text>
                        
                        <TouchableOpacity
                          style={styles.quantityButton}
                          onPress={() => handleQuantityChange(index, 1)}
                        >
                          <Ionicons name="add" size={20} color="#801b90ff" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })}

            <View style={{ flexDirection: 'row', gap: 12, marginTop: 24 }}>
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  { flex: 1, marginTop: 0 },
                  scannedItems.length > 0 ? styles.saveButtonActive : styles.saveButtonInactive
                ]}
                disabled={scannedItems.length === 0}
                onPress={updateStockCounts}
              >
                <Text style={styles.saveButtonText}>
                  Save Stock Count ({scannedItems.length} items)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.saveButton,
                  { flex: 0, paddingHorizontal: 24, marginTop: 0 },
                  styles.saveButtonActive
                ]}
                onPress={handleOpenScanner}
              >
                <Ionicons name="barcode-outline" size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Powered by IMCB Solutions LLP
              </Text>
            </View>
          </View>
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
}