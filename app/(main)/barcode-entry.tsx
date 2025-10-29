import { Ionicons } from "@expo/vector-icons";
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
    gap: 6,
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
  mrpText: {
    fontWeight: '600',
    color: '#16a34a',
  },
  costText: {
    fontWeight: '600',
    color: '#ea580c',
  },
  stockText: {
    fontWeight: '600',
    color: '#374151',
  },
  eQtyText: {
    fontWeight: '600',
    color: '#2563eb',
  },
  eCostText: {
    fontWeight: '600',
    color: '#dc2626',
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
});

// Initialize orders_to_sync table with robust migration
const initOrdersTable = async () => {
  try {
    console.log("📄 Initializing orders_to_sync table...");
    
    // Drop and recreate the table to ensure all columns exist
    await db.execAsync(`DROP TABLE IF EXISTS orders_to_sync`);
    
    // Create table with all required columns
    await db.execAsync(`
      CREATE TABLE orders_to_sync (
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
        product_name TEXT
      );
    `);
    
    console.log("✅ orders_to_sync table created successfully with all columns");
    
  } catch (error) {
    console.error("❌ Error initializing orders table:", error);
  }
};

// Initialize pending items table
const initPendingItemsTable = async () => {
  try {
    console.log("📄 Initializing pending_items table...");
    
    // Use withTransactionAsync to ensure operations are sequential
    await db.withTransactionAsync(async () => {
      // Check current table structure
      const columns = await db.getAllAsync(`PRAGMA table_info(pending_items)`);
      
      if (columns.length === 0) {
        // Table doesn't exist, create it
        console.log("📝 Creating new pending_items table...");
        await db.execAsync(`
          CREATE TABLE pending_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            barcode TEXT NOT NULL,
            name TEXT,
            bmrp REAL,
            cost REAL,
            quantity INTEGER,
            eCost REAL,
            currentStock INTEGER,
            scannedAt INTEGER,
            product TEXT,
            brand TEXT
          );
        `);
        console.log("✅ Pending items table created successfully");
      } else {
        const hasSupplierCode = columns.some((col: any) => col.name === 'supplier_code');
        
        if (hasSupplierCode) {
          console.log("🔄 Old table structure detected, recreating...");
          // Rename old table
          await db.execAsync(`ALTER TABLE pending_items RENAME TO pending_items_old;`);
          
          // Create new table with correct structure
          await db.execAsync(`
            CREATE TABLE pending_items (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              barcode TEXT NOT NULL,
              name TEXT,
              bmrp REAL,
              cost REAL,
              quantity INTEGER,
              eCost REAL,
              currentStock INTEGER,
              scannedAt INTEGER,
              product TEXT,
              brand TEXT
            );
          `);
          
          // Copy data from old table (excluding supplier_code)
          await db.execAsync(`
            INSERT INTO pending_items (id, barcode, name, bmrp, cost, quantity, eCost, currentStock, scannedAt, product, brand)
            SELECT id, barcode, name, bmrp, cost, quantity, eCost, currentStock, scannedAt, product, brand
            FROM pending_items_old;
          `);
          
          // Drop old table
          await db.execAsync(`DROP TABLE pending_items_old;`);
          console.log("✅ Table migrated successfully");
        } else {
          console.log("✅ Pending items table already exists with correct structure");
        }
      }
    });
  } catch (error) {
    console.error("❌ Error initializing pending_items table:", error);
  }
};

// Save order to sync queue
const saveOrderToSync = async (orderData: {
  userid: string;
  itemcode: string;
  barcode: string;
  quantity: number;
  rate: number;
  mrp: number;
  order_date: string;
  product_name?: string;
}) => {
  try {
    console.log("💾 Saving order to sync:", orderData.barcode);
    
    await db.runAsync(
      `INSERT INTO orders_to_sync 
      (userid, itemcode, barcode, quantity, rate, mrp, order_date, sync_status, created_at, product_name)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', datetime('now'), ?)`,
      [
        orderData.userid,
        orderData.itemcode,
        orderData.barcode,
        orderData.quantity,
        orderData.rate,
        orderData.mrp,
        orderData.order_date,
        orderData.product_name || '',
      ]
    );
    
    console.log(`✅ Successfully saved order to sync: ${orderData.barcode}`);
    return true;
  } catch (error: any) {
    console.error("❌ Error saving order to sync:", error);
    
    // If there's still a column error, try the fallback approach
    if (error.message && error.message.includes('no column named product_name')) {
      console.log("📄 Trying fallback without product_name...");
      try {
        await db.runAsync(
          `INSERT INTO orders_to_sync 
          (userid, itemcode, barcode, quantity, rate, mrp, order_date, sync_status, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', datetime('now'))`,
          [
            orderData.userid,
            orderData.itemcode,
            orderData.barcode,
            orderData.quantity,
            orderData.rate,
            orderData.mrp,
            orderData.order_date,
          ]
        );
        console.log(`✅ Fallback save successful for: ${orderData.barcode}`);
        return true;
      } catch (fallbackError) {
        console.error("❌ Fallback save also failed:", fallbackError);
        throw fallbackError;
      }
    }
    
    throw error;
  }
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

  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    const initialize = async () => {
      console.log("🚀 Initializing BarcodeEntry component...");
      await initOrdersTable();
      await initPendingItemsTable();
      await loadPendingItems();
    };
    initialize();
  }, []);

  const loadPendingItems = async () => {
    try {
      const rows = await db.getAllAsync(
        "SELECT * FROM pending_items ORDER BY scannedAt DESC"
      );
      setScannedItems(rows);
      console.log(`📦 Loaded ${rows.length} pending items`);
    } catch (error) {
      console.error("Error loading pending items:", error);
    }
  };

  const savePendingItem = async (item: any) => {
    try {
      await db.runAsync(
        `INSERT INTO pending_items 
        (barcode, name, bmrp, cost, quantity, eCost, currentStock, scannedAt, product, brand)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          item.barcode,
          item.name,
          item.bmrp || 0,
          item.cost || 0,
          item.quantity || 0,
          item.eCost || 0,
          item.currentStock || 0,
          item.scannedAt,
          item.product || "",
          item.brand || ""
        ]
      );
      console.log(`✅ Saved pending item: ${item.barcode}`);
    } catch (error) {
      console.error("Error saving pending item:", error);
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
        SET quantity = ?, eCost = ?, cost = ?
        WHERE id = ?`,
        [item.quantity, item.eCost, item.cost, itemId]
      );
      console.log(`✏️ Updated pending item: ${itemId}`);
    } catch (error) {
      console.error("Error updating pending item:", error);
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

  useEffect(() => {
    loadAllProducts();
  }, []);

  const loadAllProducts = async () => {
    try {
      const rows = await db.getAllAsync("SELECT * FROM product_data");
      setAllProducts(rows);
    } catch (error) {
      console.error("Error loading products:", error);
    }
  };

  useEffect(() => {
    if (updatedItem && itemIndex !== undefined) {
      try {
        const parsedItem = JSON.parse(updatedItem);
        const index = parseInt(itemIndex);
        
        setScannedItems(prevItems => {
          const newItems = [...prevItems];
          if (index >= 0 && index < newItems.length) {
            newItems[index] = { ...newItems[index], ...parsedItem };
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
        console.error("Error parsing updated item:", error);
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

  const handleSelectSuggestion = (product: any) => {
    setManualBarcode(product.name);
    setShowSuggestions(false);
    Keyboard.dismiss();
    addProductToList(product);
  };

  const addProductToList = async (product: any) => {
    const existing = scannedItems.find((item) => item.barcode === product.barcode);
    if (existing) {
      Alert.alert("Info", `Product already scanned: ${existing.name}`);
      return;
    }

    const newItem = {
      ...product,
      quantity: 0,
      cost: product.cost ?? product.bmrp ?? 0,
      eCost: 0,
      currentStock: product.quantity ?? 0,
      scannedAt: new Date().getTime(),
    };
    
    await savePendingItem(newItem);
    await loadPendingItems();
    setManualBarcode("");
  };

  const searchBarcodeWithVariants = async (barcode: string) => {
    try {
      const exactRows = await db.getAllAsync(
        "SELECT * FROM product_data WHERE barcode = ?",
        [barcode]
      );

      const variantRows1 = await db.getAllAsync(
        "SELECT * FROM product_data WHERE barcode LIKE ?",
        [`${barcode} :%`]
      );

      const variantRows2 = await db.getAllAsync(
        "SELECT * FROM product_data WHERE barcode LIKE ?",
        [`${barcode}:%`]
      );

      console.log('Barcode search:', barcode);
      console.log('Exact matches:', exactRows.length);
      console.log('Variants (with space):', variantRows1.length);
      console.log('Variants (no space):', variantRows2.length);

      const allMatches = [...exactRows, ...variantRows1, ...variantRows2];
      return allMatches;
    } catch (err) {
      console.error("Error searching barcode:", err);
      throw err;
    }
  };

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
      const allMatches = await searchBarcodeWithVariants(data);

      if (allMatches.length === 0) {
        Alert.alert(
          "Product not found", 
          `Barcode: ${data}\n\nThis product is not found in the database.`,
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
          quantity: 0,
          cost: product.cost ?? product.bmrp ?? 0,
          eCost: 0,
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
      console.error("Error fetching product:", err);
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

  const handleManualSearch = async () => {
    const trimmed = manualBarcode.trim();
    if (!trimmed) {
      Alert.alert("Error", "Please enter a search term");
      return;
    }

    if (searchMode === 'barcode') {
      try {
        const allMatches = await searchBarcodeWithVariants(trimmed);

        if (allMatches.length === 0) {
          Alert.alert(
            "Product not found",
            `Barcode: ${trimmed}\n\nThis product is not found in the database.`
          );
          return;
        }

        if (allMatches.length === 1) {
          const product = allMatches[0] as { [key: string]: any; quantity?: number };
          const existing = scannedItems.find((item) => item.barcode === product.barcode);
          
          if (existing) {
            Alert.alert("Info", `Product already scanned: ${existing.name}`);
            return;
          }

          const newItem = {
            ...product,
            quantity: 0,
            cost: product.cost ?? product.bmrp ?? 0,
            eCost: 0,
            currentStock: product.quantity ?? 0,
            scannedAt: new Date().getTime(),
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

  const updateQuantities = async () => {
    // First validation: Check for items with missing or zero values
    const itemsWithMissingData = scannedItems.filter(item => {
      const hasInvalidMrp = !item.bmrp || item.bmrp === 0 || isNaN(item.bmrp);
      const hasInvalidCost = !item.cost || item.cost === 0 || isNaN(item.cost);
      const hasInvalidQty = !item.quantity || item.quantity === 0 || isNaN(item.quantity);
      return hasInvalidMrp || hasInvalidCost || hasInvalidQty;
    });

    if (itemsWithMissingData.length > 0) {
      const itemNames = itemsWithMissingData.map(item => `• ${item.name}`).join('\n');
      
      Alert.alert(
        "⚠️ Incomplete Data Warning",
        `The following ${itemsWithMissingData.length} item(s) have missing or zero values for MRP, Cost, or Quantity:\n\n${itemNames}\n\nDo you want to proceed with the update?`,
        [
          {
            text: "Cancel",
            style: "cancel"
          },
          {
            text: "Proceed Anyway",
            style: "destructive",
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
      "Confirm Update",
      `Are you sure you want to update quantities for ${scannedItems.length} item(s)? This action cannot be undone.`,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Update",
          style: "default",
          onPress: async () => {
            try {
              const userId = await SecureStore.getItemAsync("user_id");
              const today = new Date().toISOString().split("T")[0];

              let successCount = 0;
              let errorCount = 0;

              console.log(`📄 Starting sync for ${scannedItems.length} items...`);

              // Process each item individually
              for (const item of scannedItems) {
                try {
                  const finalCost = item.eCost !== 0 ? item.eCost : item.cost;
                  
                  // Fetch the actual item code from database
                  let itemCode = item.barcode;
                  const productData = await db.getFirstAsync(
                    "SELECT code FROM product_data WHERE barcode = ?",
                    [item.barcode]
                  ) as { code?: string } | null;
                  itemCode = productData?.code || item.barcode;
                  
                  console.log(`📤 Syncing item: ${item.barcode} (${item.name})`);
                  
                  // Save to sync table
                  await saveOrderToSync({
                    userid: userId ?? "unknown",
                    itemcode: itemCode,
                    barcode: item.barcode,
                    quantity: item.quantity,
                    rate: finalCost ?? 0,
                    mrp: item.bmrp ?? 0,
                    order_date: today,
                    product_name: item.name,
                  });

                  // Update product_data if exists
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
                  
                  successCount++;
                  console.log(`✅ Successfully processed: ${item.barcode}`);
                  
                } catch (itemError) {
                  console.error(`❌ Error processing item ${item.barcode}:`, itemError);
                  errorCount++;
                }
              }
              
              // Clear pending items after successful processing
              if (successCount > 0) {
                await db.runAsync("DELETE FROM pending_items");
                console.log(`🧹 Cleared ${successCount} pending items`);
              }

              if (errorCount === 0) {
                Alert.alert("✅ Success", `All ${successCount} entries saved for sync!`);
                setScannedItems([]);
                router.push("/(main)/");
              } else if (successCount > 0) {
                Alert.alert("⚠️ Partial Success", 
                  `${successCount} entries saved for sync, but ${errorCount} failed. The successful entries have been cleared.`);
                await loadPendingItems(); // Reload to show only failed items
              } else {
                Alert.alert("❌ Error", "Failed to save any entries. Please try again.");
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
          Barcode Entry
        </Text>

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
              Scanned Products ({scannedItems.length})
            </Text>

            {scannedItems.length === 0 && (
              <Text style={styles.emptyText}>
                No products scanned yet. Start scanning or enter a {searchMode === 'barcode' ? 'barcode' : 'product name'} manually.
              </Text>
            )}

            {scannedItems.map((item, index) => (
              <View
                key={`${item.barcode}-${index}-${item.scannedAt}`}
                style={[
                  styles.productCard,
                  getCardStyle(item, index)
                ]}
              >
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
                      MRP: <Text style={styles.mrpText}>₹{item.bmrp || 0}</Text>
                    </Text>
                    <Text style={styles.detailText}>
                      Cost: <Text style={styles.costText}>₹{item.cost || 0}</Text>
                    </Text>
                    <Text style={styles.detailText}>
                      Stock: <Text style={styles.stockText}>{item.currentStock}</Text>
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailText}>
                      E.Qty: <Text style={styles.eQtyText}>{item.quantity}</Text>
                    </Text>
                    <Text style={styles.detailText}>
                      E.Cost: <Text style={styles.eCostText}>₹{item.eCost || 0}</Text>
                    </Text>
                  </View>
                </View>
              </View>
            ))}

            <TouchableOpacity
              style={[
                styles.saveButton,
                scannedItems.length > 0 ? styles.saveButtonActive : styles.saveButtonInactive
              ]}
              disabled={scannedItems.length === 0}
              onPress={updateQuantities}
            >
              <Text style={styles.saveButtonText}>
                Update Quantities ({scannedItems.length} items)
              </Text>
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Powered by IMC Business Solutions
              </Text>
            </View>
          </View>
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
}