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
  supplierTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3b82f6',
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
  manualEntryCard: {
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#38bdf8',
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
  detailText: {
    fontSize: 14,
    color: '#4b5563',
  },
  supplierText: {
    fontWeight: '600',
    color: '#9333ea',
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
  manualEntryBadge: {
    backgroundColor: '#0ea5e9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  manualEntryBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

// Initialize pending items table with ALTER TABLE to add column if not exists
const initPendingItemsTable = async () => {
  try {
    // Create table if not exists
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS pending_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        supplier_code TEXT NOT NULL,
        barcode TEXT NOT NULL,
        name TEXT,
        bmrp REAL,
        cost REAL,
        quantity INTEGER,
        eCost REAL,
        currentStock INTEGER,
        batchSupplier TEXT,
        scannedAt INTEGER,
        batch_supplier TEXT,
        product TEXT,
        brand TEXT
      );
    `);
    
    // Try to add the isManualEntry column if it doesn't exist
    try {
      await db.execAsync(`
        ALTER TABLE pending_items ADD COLUMN isManualEntry INTEGER DEFAULT 0;
      `);
      console.log("✅ Added isManualEntry column to pending_items table");
    } catch (alterError: any) {
      // Column might already exist, which is fine
      if (alterError.message && alterError.message.includes('duplicate column name')) {
        console.log("ℹ️ isManualEntry column already exists");
      } else {
        console.log("ℹ️ Column may already exist or other non-critical error:", alterError.message);
      }
    }
  } catch (error) {
    console.error("Error initializing pending_items table:", error);
  }
};

export default function BarcodeEntry() {
  const { supplier, supplier_code, updatedItem, itemIndex } = useLocalSearchParams<{
    supplier: string;
    supplier_code: string;
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

  const [showManualEntryModal, setShowManualEntryModal] = useState(false);
  const [manualEntryData, setManualEntryData] = useState({
    barcode: '',
    name: '',
    mrp: '',
    cost: '',
    quantity: '',
  });

  const [showScanner, setShowScanner] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [scanMode, setScanMode] = useState<"hardware" | "camera">("hardware");
  const [scanned, setScanned] = useState(false);
  const scanLockRef = useRef(false);
  const processingAlertRef = useRef(false);

  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    const initialize = async () => {
      await initPendingItemsTable();
      await loadPendingItems();
    };
    initialize();
  }, [supplier_code]);

  const loadPendingItems = async () => {
    try {
      const rows = await db.getAllAsync(
        "SELECT * FROM pending_items WHERE supplier_code = ? ORDER BY scannedAt DESC",
        [supplier_code || ""]
      );
      setScannedItems(rows);
    } catch (error) {
      console.error("Error loading pending items:", error);
    }
  };

  const savePendingItem = async (item: any) => {
    try {
      await db.runAsync(
        `INSERT INTO pending_items 
        (supplier_code, barcode, name, bmrp, cost, quantity, eCost, currentStock, batchSupplier, scannedAt, batch_supplier, product, brand, isManualEntry)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          supplier_code || "",
          item.barcode,
          item.name,
          item.bmrp || 0,
          item.cost || 0,
          item.quantity || 0,
          item.eCost || 0,
          item.currentStock || 0,
          item.batchSupplier || supplier,
          item.scannedAt,
          item.batch_supplier || "",
          item.product || "",
          item.brand || "",
          item.isManualEntry || 0
        ]
      );
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
    } catch (error) {
      console.error("Error deleting pending item:", error);
    }
  };

  const updatePendingItem = async (itemId: number, item: any) => {
    try {
      await db.runAsync(
        `UPDATE pending_items 
        SET quantity = ?, eCost = ?, cost = ?, batchSupplier = ?
        WHERE id = ?`,
        [item.quantity, item.eCost, item.cost, item.batchSupplier, itemId]
      );
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
    if (showManualEntryModal) {
      return;
    }
    
    const interval = setInterval(() => {
      if (!isEditing && searchMode === 'barcode' && scanMode === 'hardware') {
        inputRef.current?.focus();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isEditing, searchMode, scanMode, showManualEntryModal]);

  useEffect(() => {
    if (showManualEntryModal) {
      return;
    }
    
    if (searchMode === 'barcode' && scanMode === 'hardware' && hardwareScanValue.length > 0 && hardwareScanValue.trim() !== "") {
      handleBarCodeScanned({ data: hardwareScanValue.trim() });
      setHardwareScanValue("");
    }
  }, [hardwareScanValue, searchMode, scanMode, showManualEntryModal]);

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
      batchSupplier: product.batch_supplier ?? supplier,
      scannedAt: new Date().getTime(),
      isManualEntry: 0,
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

  const openManualEntryModal = (barcode: string) => {
    setManualEntryData({
      barcode: barcode,
      name: '',
      mrp: '',
      cost: '',
      quantity: '',
    });
    setShowManualEntryModal(true);
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
  };

  const handleSaveManualEntry = async () => {
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

    const newItem = {
      barcode: manualEntryData.barcode,
      name: manualEntryData.name.trim(),
      bmrp: mrp,
      cost: cost,
      quantity: quantity,
      eCost: 0,
      currentStock: quantity,
      batchSupplier: supplier,
      scannedAt: new Date().getTime(),
      batch_supplier: supplier,
      product: '',
      brand: '',
      isManualEntry: 1,
    };

    await savePendingItem(newItem);
    await loadPendingItems();
    closeManualEntryModal();
    Alert.alert("Success", "Product added successfully!");
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
          `Barcode: ${data}\n\nWould you like to add this product manually?`,
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => {
                if (showScanner) {
                  setScanned(false);
                  scanLockRef.current = false;
                  processingAlertRef.current = false;
                }
              }
            },
            {
              text: 'Add Manually',
              onPress: () => {
                openManualEntryModal(data);
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
          batchSupplier: product.batch_supplier ?? supplier,
          scannedAt: new Date().getTime(),
          isManualEntry: 0,
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
            `Barcode: ${trimmed}\n\nWould you like to add this product manually?`,
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Add Manually',
                onPress: () => openManualEntryModal(trimmed)
              }
            ]
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
            batchSupplier: product.batch_supplier ?? supplier,
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
        supplier: supplier || "",
        supplier_code: supplier_code || "",
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

              await db.withTransactionAsync(async () => {
                for (const item of scannedItems) {
                  const finalCost = item.eCost !== 0 ? item.eCost : item.cost;
                  
                  // For manual entries, use barcode as item code
                  // For existing products, fetch the actual item code from database
                  let itemCode = item.barcode;
                  if (item.isManualEntry !== 1) {
                    const productData = await db.getFirstAsync(
                      "SELECT code FROM product_data WHERE barcode = ?",
                      [item.barcode]
                    ) as { code?: string } | null;
                    itemCode = productData?.code || item.barcode;
                  }
                  
                  await saveOrderToSync({
                    supplier_code: supplier_code || "",
                    userid: userId ?? "unknown",
                    itemcode: itemCode,
                    barcode: item.barcode,
                    quantity: item.quantity,
                    rate: finalCost ?? 0,
                    mrp: item.bmrp ?? 0,
                    order_date: today,
                  });

                  await db.runAsync(
                    "UPDATE product_data SET quantity = ?, cost = ? WHERE barcode = ?",
                    [item.quantity, finalCost, item.barcode]
                  );
                }
                
                await db.runAsync(
                  "DELETE FROM pending_items WHERE supplier_code = ?",
                  [supplier_code || ""]
                );
              });

              Alert.alert("✓ Success", "Entries saved for sync!");
              setScannedItems([]);
              router.push("/(main)/");
            } catch (err) {
              console.error("Save failed:", err);
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
    if (item.isManualEntry === 1) {
      return styles.manualEntryCard;
    }
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
          <Ionicons name="barcode-outline" size={24} color="#007AFF" />
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
                <TextInput
                  style={styles.formInput}
                  value={manualEntryData.name}
                  onChangeText={(text) => setManualEntryData({...manualEntryData, name: text})}
                  placeholder="Enter product name"
                  placeholderTextColor="#9ca3af"
                  autoCapitalize="words"
                  returnKeyType="next"
                  autoFocus={true}
                  onFocus={() => setIsEditing(true)}
                  onBlur={() => setIsEditing(false)}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>MRP (₹) *</Text>
                <TextInput
                  style={styles.formInput}
                  value={manualEntryData.mrp}
                  onChangeText={(text) => setManualEntryData({...manualEntryData, mrp: text})}
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
                  onChangeText={(text) => setManualEntryData({...manualEntryData, cost: text})}
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
                  onChangeText={(text) => setManualEntryData({...manualEntryData, quantity: text})}
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

      {searchMode === 'barcode' && scanMode === 'hardware' && !showManualEntryModal && (
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
        <Text style={styles.supplierTitle}>
          Supplier: {supplier} ({supplier_code})
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
                  <View>
                    <Text style={styles.detailText}>
                      Supplier: <Text style={styles.supplierText}>{item.batchSupplier || 'N/A'}</Text>
                    </Text>
                  </View>

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