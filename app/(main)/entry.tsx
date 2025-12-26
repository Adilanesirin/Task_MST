import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { getAllSuppliers } from "../../utils/database";

// Move type definition outside component to avoid Hermes issues
type Supplier = { code: string; name: string };

export default function Entry() {
  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState("0");
  const router = useRouter();

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        setLoading(true);
        const supplierData = await getAllSuppliers();
        setSuppliers(supplierData || []);
        
        console.log(`✅ Loaded ${supplierData?.length || 0} suppliers`);
      } catch (err) {
        console.error("❌ Error fetching suppliers:", err);
        setSuppliers([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSuppliers();
  }, []);

  const filteredSuppliers = suppliers.filter((s) =>
    s?.name?.toLowerCase()?.includes(searchText.toLowerCase()) || false
  );

  const incrementQuantity = () => {
    const current = parseInt(quantity) || 0;
    setQuantity((current + 1).toString());
  };

  const decrementQuantity = () => {
    const current = parseInt(quantity) || 0;
    if (current > 0) {
      setQuantity((current - 1).toString());
    }
  };

  const handleProceed = () => {
    if (selectedSupplier) {
      router.push({
        pathname: "/barcode-entry",
        params: {
          supplier: selectedSupplier.name,
          supplier_code: selectedSupplier.code,
          initialQuantity: quantity, // Pass the quantity
        },
      });
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleSupplierSelect = (item) => {
    setSelectedSupplier(item);
    setModalVisible(false);
    setSearchText("");
  };

  const renderSupplierItem = ({ item }) => (
    <TouchableOpacity
      className="p-4 border-b border-gray-200"
      onPress={() => handleSupplierSelect(item)}
    >
      <Text className="text-base text-gray-700">{item?.name || "Unknown"}</Text>
      <Text className="text-sm text-gray-500">Code: {item?.code || "N/A"}</Text>
    </TouchableOpacity>
  );

  const renderEmptyList = () => (
    <View className="p-4">
      <Text className="text-gray-500 text-center">
        {searchText ? "No suppliers match your search" : "No suppliers available"}
      </Text>
    </View>
  );

  return (
    <View className="flex-1 bg-gray-100">
      {/* Back Button */}
      <View className="absolute top-12 left-4 z-50">
        <TouchableOpacity onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 50, paddingTop: 60 }}
        className="px-5"
      >
        <View className="items-center mb-6">
          <Text className="text-2xl font-bold text-blue-500">
            Select Supplier
          </Text>
        </View>

        <View className="bg-white p-6 rounded-2xl shadow-lg max-w-[360px] self-center w-full">
          <Text className="text-base font-semibold mb-2 text-gray-700">
            Supplier
          </Text>
          
          {loading ? (
            <View className="border border-yellow-300 p-4 rounded-xl mb-6 bg-gray-50">
              <Text className="text-base text-gray-400">Loading suppliers...</Text>
            </View>
          ) : suppliers.length === 0 ? (
            <View className="border border-red-300 p-4 rounded-xl mb-6 bg-red-50">
              <Text className="text-base text-red-600">No suppliers found. Please sync data first.</Text>
            </View>
          ) : (
            <TouchableOpacity
              className="border border-yellow-300 p-4 rounded-xl mb-6 bg-white shadow-sm"
              onPress={() => setModalVisible(true)}
            >
              <Text className="text-base text-gray-600">
                {selectedSupplier?.name || "Choose a supplier..."}
              </Text>
            </TouchableOpacity>
          )}

          {/* Counted Quantity Section */}
          <View className="mb-6">
            <View className="flex-row items-center mb-2">
              <Ionicons name="add-circle" size={20} color="#F59E0B" />
              <Text className="text-base font-semibold ml-2 text-gray-700">
                Counted Quantity
              </Text>
            </View>
            
            <View className="border border-gray-300 rounded-xl p-4 bg-gray-50">
              <View className="flex-row items-center justify-center">
                <TouchableOpacity
                  onPress={decrementQuantity}
                  className="bg-white w-12 h-12 rounded-lg items-center justify-center shadow-sm border border-gray-200"
                >
                  <Ionicons name="remove" size={24} color="#374151" />
                </TouchableOpacity>
                
                <View className="mx-4 flex-1 max-w-[100px]">
                  <TextInput
                    value={quantity}
                    onChangeText={setQuantity}
                    keyboardType="numeric"
                    className="text-center text-2xl font-bold text-orange-600 bg-white rounded-lg p-3 border border-gray-200"
                    placeholder="0"
                  />
                </View>
                
                <TouchableOpacity
                  onPress={incrementQuantity}
                  className="bg-white w-12 h-12 rounded-lg items-center justify-center shadow-sm border border-gray-200"
                >
                  <Ionicons name="add" size={24} color="#374151" />
                </TouchableOpacity>
              </View>
              
              <Text className="text-xs text-gray-500 text-center mt-2">
                Adjust the quantity using + / - buttons
              </Text>
            </View>
          </View>

          <TouchableOpacity
            disabled={!selectedSupplier || loading}
            onPress={handleProceed}
            className={`p-4 rounded-xl shadow-lg ${
              selectedSupplier && !loading ? "bg-orange-500" : "bg-gray-300"
            }`}
          >
            <Text className="text-white text-center font-bold text-base">
              {loading ? "Loading..." : "Proceed to Entry"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Modal Dropdown */}
        <Modal visible={modalVisible} animationType="slide">
          <View className="flex-1 bg-white px-4 pt-10">
            <Text className="text-xl font-bold mb-4 text-blue-500">
              Search Supplier
            </Text>

            <TextInput
              placeholder="Type to search..."
              className="border border-yellow-300 p-4 rounded-xl mb-4 shadow-sm bg-white"
              value={searchText}
              onChangeText={setSearchText}
            />

            <FlatList
              data={filteredSuppliers}
              keyExtractor={(item, index) => `supplier-${item?.code || index}`}
              renderItem={renderSupplierItem}
              ListEmptyComponent={renderEmptyList}
            />

            <TouchableOpacity
              className="mb-3 bg-orange-400 p-4 rounded-xl"
              onPress={() => setModalVisible(false)}
            >
              <Text className="text-white text-center font-semibold text-base">
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </Modal>
      </ScrollView>
    </View>
  );
}