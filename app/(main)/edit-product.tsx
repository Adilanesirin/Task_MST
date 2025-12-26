import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { getProductByBarcode } from "../../utils/database";

export default function EditProduct() {
  const router = useRouter();
  const { itemData, itemIndex, supplier, supplier_code } = useLocalSearchParams<{
    itemData: string;
    itemIndex: string;
    supplier: string;
    supplier_code: string;
  }>();

  const [product, setProduct] = useState<any>({});
  const [editedName, setEditedName] = useState("");
  const [editedBarcode, setEditedBarcode] = useState("");
  const [editedMrp, setEditedMrp] = useState("");
  const [editedQuantity, setEditedQuantity] = useState("0");
  const [currentStock, setCurrentStock] = useState("0");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProductData = async () => {
      if (itemData) {
        try {
          setLoading(true);
          const parsedItem = JSON.parse(itemData);
          console.log("📦 Parsed Item from params:", parsedItem);
          
          // Fetch full product details from database using barcode
          if (parsedItem.barcode) {
            const fullProduct = await getProductByBarcode(parsedItem.barcode);
            console.log("🔍 Full product from database:", fullProduct);
            
            if (fullProduct) {
              // Merge database data with scanned data
              const productData = {
                ...parsedItem,
                ...fullProduct
              };
              
              setProduct(productData);
              setEditedName(productData.name || "");
              setEditedBarcode(productData.barcode || "");
              
              // Get MRP from database (bmrp field)
              const mrpValue = productData.bmrp || productData.mrp || productData.salesprice || "";
              console.log("💰 MRP Value found:", mrpValue);
              setEditedMrp(mrpValue ? mrpValue.toString() : "");
              
              // Get stock from scanned data (currentStock) or database (quantity)
              const stockValue = parsedItem.currentStock ?? productData.quantity ?? 0;
              setCurrentStock(stockValue.toString());
              
              // FIXED: Use countedQuantity from parsed item to preserve edited value
              const quantityValue = parsedItem.countedQuantity ?? 0;
              setEditedQuantity(quantityValue.toString());
              
              console.log("📊 Stock:", stockValue, "| Counted Quantity:", quantityValue, "| MRP:", mrpValue);
            } else {
              console.warn("⚠️ Product not found in database, using scanned data only");
              // Product not in database, use only scanned data
              setProduct(parsedItem);
              setEditedName(parsedItem.name || "");
              setEditedBarcode(parsedItem.barcode || "");
              setEditedMrp("");
              setCurrentStock(parsedItem.currentStock?.toString() || "0");
              setEditedQuantity(parsedItem.countedQuantity?.toString() || "0");
            }
          } else {
            // No barcode, use parsed item directly
            setProduct(parsedItem);
            setEditedName(parsedItem.name || "");
            setEditedBarcode(parsedItem.barcode || "");
            setEditedMrp("");
            setCurrentStock(parsedItem.currentStock?.toString() || "0");
            setEditedQuantity(parsedItem.countedQuantity?.toString() || "0");
          }
        } catch (error) {
          console.error("❌ Error loading product:", error);
          Alert.alert("Error", "Failed to load product details");
        } finally {
          setLoading(false);
        }
      }
    };
    
    loadProductData();
  }, [itemData]);

  const handleSave = () => {
    const updatedItem = {
      ...product,
      // Keep original values (read-only fields)
      name: product.name,
      barcode: product.barcode,
      bmrp: product.bmrp,
      mrp: product.mrp,
      // Update only the counted quantity
      countedQuantity: parseInt(editedQuantity) || 0,
      // Keep original stock unchanged
      currentStock: parseInt(currentStock) || 0,
    };

    router.back();
    setTimeout(() => {
      router.setParams({
        updatedItem: JSON.stringify(updatedItem),
        itemIndex,
      });
    }, 100);
  };

  const handleBack = () => {
    router.back();
  };

  const incrementQuantity = () => {
    const current = parseInt(editedQuantity) || 0;
    setEditedQuantity((current + 1).toString());
  };

  const decrementQuantity = () => {
    const current = parseInt(editedQuantity) || 0;
    if (current > 0) {
      setEditedQuantity((current - 1).toString());
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
      className="bg-gradient-to-b from-blue-50 to-white"
    >
      {/* Modern Header */}
      <View className="bg-gradient-to-r from-blue-600 to-blue-700 pt-12 pb-6 px-4 shadow-lg">
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center flex-1">
            <TouchableOpacity 
              onPress={handleBack} 
              className="mr-3 bg-white/20 p-2 rounded-full"
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text className="text-2xl font-bold text-white">Edit Product</Text>
          </View>
          <TouchableOpacity 
            onPress={handleSave}
            disabled={loading}
            className="bg-white px-4 py-2 rounded-full"
          >
            <Text className="text-blue-600 font-semibold">
              {loading ? "..." : "Save"}
            </Text>
          </TouchableOpacity>
        </View>
        <Text className="text-blue-100 text-sm ml-14">Update counted quantity only</Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="text-gray-600 mt-4">Loading product details...</Text>
        </View>
      ) : (
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="p-4">
            {/* Product Name - READ ONLY */}
            <View className="bg-gray-50 rounded-2xl p-4 mb-4 border border-gray-200">
              <View className="flex-row items-center mb-2">
                <Ionicons name="pricetag" size={20} color="#6B7280" />
                <Text className="text-gray-600 font-semibold ml-2">Product Name</Text>
                <View className="ml-auto bg-gray-200 px-2 py-1 rounded">
                  <Text className="text-xs text-gray-600">Read-only</Text>
                </View>
              </View>
              <Text className="text-base text-gray-800 font-medium py-2">
                {editedName || "N/A"}
              </Text>
            </View>

            {/* Barcode - READ ONLY */}
            <View className="bg-gray-50 rounded-2xl p-4 mb-4 border border-gray-200">
              <View className="flex-row items-center mb-2">
                <Ionicons name="barcode" size={20} color="#6B7280" />
                <Text className="text-gray-600 font-semibold ml-2">Barcode</Text>
                <View className="ml-auto bg-gray-200 px-2 py-1 rounded">
                  <Text className="text-xs text-gray-600">Read-only</Text>
                </View>
              </View>
              <Text className="text-base text-gray-800 font-medium py-2">
                {editedBarcode || "N/A"}
              </Text>
            </View>

            {/* MRP & Current Stock Row - READ ONLY */}
            <View className="flex-row gap-3 mb-4">
              {/* MRP - READ ONLY */}
              <View className="flex-1 bg-gray-50 rounded-2xl p-4 border border-gray-200">
                <View className="flex-row items-center mb-2">
                  <Ionicons name="cash" size={20} color="#6B7280" />
                  <Text className="text-gray-600 font-semibold ml-2 text-sm">MRP (₹)</Text>
                </View>
                <Text className="text-lg font-bold text-gray-700 py-2">
                  {editedMrp || "N/A"}
                </Text>
                {!editedMrp && (
                  <Text className="text-xs text-amber-600 mt-1">⚠️ MRP not set</Text>
                )}
              </View>

              {/* Current Stock - READ ONLY */}
              <View className="flex-1 bg-gray-50 rounded-2xl p-4 border border-gray-200">
                <View className="flex-row items-center mb-2">
                  <Ionicons name="cube" size={20} color="#6B7280" />
                  <Text className="text-gray-600 font-semibold ml-2 text-sm">Current Stock</Text>
                </View>
                <Text className="text-lg font-bold text-gray-700 py-2">
                  {currentStock}
                </Text>
              </View>
            </View>

            {/* Counted Quantity - EDITABLE */}
            <View className="bg-white rounded-2xl p-4 mb-4 shadow-md border-2 border-blue-300">
              <View className="flex-row items-center mb-3">
                <Ionicons name="create" size={20} color="#3B82F6" />
                <Text className="text-gray-700 font-semibold ml-2">Counted Quantity</Text>
                <View className="ml-auto bg-blue-100 px-2 py-1 rounded">
                  <Text className="text-xs text-blue-600 font-semibold">Editable</Text>
                </View>
              </View>
              <View className="flex-row items-center justify-center bg-blue-50 rounded-xl py-3">
                <TouchableOpacity
                  onPress={decrementQuantity}
                  className="bg-white w-12 h-12 rounded-xl items-center justify-center shadow-sm"
                >
                  <Ionicons name="remove" size={24} color="#3B82F6" />
                </TouchableOpacity>
                <TextInput
                  value={editedQuantity}
                  onChangeText={setEditedQuantity}
                  keyboardType="numeric"
                  className="flex-1 mx-4 text-center text-3xl font-bold text-blue-600"
                />
                <TouchableOpacity
                  onPress={incrementQuantity}
                  className="bg-white w-12 h-12 rounded-xl items-center justify-center shadow-sm"
                >
                  <Ionicons name="add" size={24} color="#3B82F6" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Info Box */}
            <View className="bg-blue-50 rounded-2xl p-4 mb-6 border border-blue-200">
              <View className="flex-row items-start">
                <Ionicons name="information-circle" size={20} color="#3B82F6" />
                <Text className="text-sm text-blue-700 ml-2 flex-1">
                  Only the counted quantity can be edited. All other fields are read-only to maintain data integrity.
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View className="flex-row gap-3 mb-8">
              <TouchableOpacity
                onPress={handleBack}
                className="flex-1 bg-gray-200 rounded-2xl py-4 shadow-sm"
              >
                <View className="flex-row items-center justify-center">
                  <Ionicons name="close-circle" size={20} color="#6B7280" />
                  <Text className="text-gray-700 font-semibold ml-2">Cancel</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSave}
                className="flex-1 bg-blue-600 rounded-2xl py-4 shadow-lg"
              >
                <View className="flex-row items-center justify-center">
                  <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                  <Text className="text-white font-semibold ml-2">Save Changes</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
}