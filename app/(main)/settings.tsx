import { createEnhancedAPI } from "@/utils/api";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Application from "expo-application";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, PermissionsAndroid, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Toast from "react-native-toast-message";

export default function Settings() {
  const [mode, setMode] = useState<"hardware" | "camera">("hardware");
  const [duplicatePrompt, setDuplicatePrompt] = useState(true);

  const [pinging, setPinging] = useState(false);
  const [pingStatus, setPingStatus] = useState<"success" | "failed" | null>(null);
  const [removingLicense, setRemovingLicense] = useState(false);
  const [licenseInfo, setLicenseInfo] = useState<{
    customerName: string;
    licenseKey: string;
    deviceId: string;
    expiryDate?: string;
    remainingDays?: number;
    isExpired?: boolean;
  } | null>(null);
  const [loadingExpiry, setLoadingExpiry] = useState(false);

  const requestAndroidPermissions = async () => {
    if (Platform.OS !== 'android') {
      return true;
    }

    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
        {
          title: "Device ID Permission",
          message: "This app needs access to your device ID for license management.",
          buttonNeutral: "Ask Me Later",
          buttonNegative: "Cancel",
          buttonPositive: "OK"
        }
      );

      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log("✅ Phone state permission granted");
        return true;
      } else {
        console.log("❌ Phone state permission denied");
        return false;
      }
    } catch (err) {
      console.warn("Permission request error:", err);
      return false;
    }
  };

  const getDeviceId = async () => {
    try {
      let id = null;
      
      if (Platform.OS === "android") {
        const hasPermission = await requestAndroidPermissions();
        
        if (!hasPermission) {
          throw new Error("Permission denied. Please grant phone state permission.");
        }

        // Method 1: Application.androidId
        id = Application.androidId;
        console.log("Method 1 - Application.androidId:", id);
        
        if (id && id !== "null" && id !== "" && id !== "unknown") {
          console.log("✅ Using Application.androidId:", id);
          await AsyncStorage.setItem("device_hardware_id", id);
          return id;
        }

        // Method 2: Try getting from native module directly
        if (Application.getAndroidId) {
          try {
            id = await Application.getAndroidId();
            console.log("Method 2 - Application.getAndroidId():", id);
            
            if (id && id !== "null" && id !== "" && id !== "unknown") {
              console.log("✅ Using Application.getAndroidId():", id);
              await AsyncStorage.setItem("device_hardware_id", id);
              return id;
            }
          } catch (e) {
            console.log("Method 2 failed:", e);
          }
        }

        // Method 3: Check stored device ID
        const storedId = await AsyncStorage.getItem("device_hardware_id");
        if (storedId) {
          console.log("✅ Using stored device ID:", storedId);
          return storedId;
        }

        // Generate persistent UUID
        console.log("⚠️ Android ID not available, generating persistent UUID");
        const uuid = 'xxxxxxxxxxxxxxxx'.replace(/[x]/g, function(c) {
          const r = Math.random() * 16 | 0;
          return r.toString(16);
        });
        
        await AsyncStorage.setItem("device_hardware_id", uuid);
        console.log("✅ Generated and stored UUID:", uuid);
        return uuid;
        
      } else if (Platform.OS === "ios") {
        id = await Application.getIosIdForVendorAsync();
        
        console.log("iOS IDFV from Application:", id);
        
        if (id && id !== "null" && id !== "") {
          console.log("✅ Using iOS IDFV:", id);
          await AsyncStorage.setItem("device_hardware_id", id);
          return id;
        }

        const storedId = await AsyncStorage.getItem("device_hardware_id");
        if (storedId) {
          console.log("✅ Using stored iOS device ID:", storedId);
          return storedId;
        }

        const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
        
        await AsyncStorage.setItem("device_hardware_id", uuid);
        console.log("✅ Generated and stored iOS UUID:", uuid);
        return uuid;
        
      } else {
        throw new Error("Unsupported platform: " + Platform.OS);
      }
      
    } catch (error) {
      console.error("❌ CRITICAL ERROR getting device ID:", error);
      
      try {
        const storedId = await AsyncStorage.getItem("device_hardware_id");
        if (storedId) {
          console.log("Using emergency stored device ID");
          return storedId;
        }
      } catch (e) {
        console.error("Storage error:", e);
      }
      
      throw error;
    }
  };

  useEffect(() => {
    const loadSettings = async () => {
      // Load scan mode
      const saved = await SecureStore.getItemAsync("scanMode");
      if (saved === "camera" || saved === "hardware") {
        setMode(saved);
      }

      // Load duplicate prompt setting
      const savedDuplicatePrompt = await SecureStore.getItemAsync("duplicatePrompt");
      if (savedDuplicatePrompt !== null) {
        setDuplicatePrompt(savedDuplicatePrompt !== "false");
      }

      // Load license info using the robust device ID fetching
      const customerName = await AsyncStorage.getItem("customerName");
      const licenseKey = await AsyncStorage.getItem("licenseKey");
      const licenseType = await AsyncStorage.getItem("licenseType");
      const demoLicenseKey = await AsyncStorage.getItem("demoLicenseKey");
      const demoExpiresAt = await AsyncStorage.getItem("demoExpiresAt");
      const demoDaysRemaining = await AsyncStorage.getItem("demoDaysRemaining");

      // Get device ID using the robust method
      let deviceId: string | null = null;
      try {
        deviceId = await getDeviceId();
        console.log("Settings - Retrieved device ID:", deviceId);
      } catch (error) {
        console.error("Settings - Failed to get device ID:", error);
        // Fallback to stored deviceId if available
        deviceId = await AsyncStorage.getItem("deviceId");
      }

      const isDemo = licenseType === "DEMO" && demoLicenseKey;

      if (isDemo && customerName && deviceId) {
        // Demo license — use demoLicenseKey and locally stored expiry
        setLicenseInfo({
          customerName,
          licenseKey: demoLicenseKey!,
          deviceId,
          expiryDate: demoExpiresAt ?? undefined,
          remainingDays: demoDaysRemaining ? parseInt(demoDaysRemaining) : undefined,
          isExpired: demoDaysRemaining ? parseInt(demoDaysRemaining) <= 0 : false,
        });
      } else if (customerName && licenseKey && deviceId) {
        // Production license
        setLicenseInfo({ customerName, licenseKey, deviceId });
        // Fetch expiry date after setting basic info
        fetchLicenseExpiry(licenseKey);
      }
    };
    loadSettings();
  }, []);

  const fetchLicenseExpiry = async (licenseKey: string) => {
    setLoadingExpiry(true);
    try {
      const response = await fetch("https://activate.imcbs.com/mobileapp/api/project/taskmst/", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.customers) {
          // Find the customer with matching license key
          const customer = data.customers.find(
            (c: any) => c.license_key === licenseKey
          );

          if (customer && customer.license_validity) {
            setLicenseInfo(prev => prev ? {
              ...prev,
              expiryDate: customer.license_validity.expiry_date,
              remainingDays: customer.license_validity.remaining_days,
              isExpired: customer.license_validity.is_expired,
            } : null);
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch license expiry:", error);
    } finally {
      setLoadingExpiry(false);
    }
  };

  const formatExpiryDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getExpiryStatus = () => {
    if (!licenseInfo?.remainingDays) return null;
    
    if (licenseInfo.isExpired) {
      return { color: '#DC2626', text: 'Expired', icon: 'close-circle' };
    } else if (licenseInfo.remainingDays <= 30) {
      return { color: '#F59E0B', text: `Expires in ${licenseInfo.remainingDays} days`, icon: 'warning' };
    } else {
      return { color: '#10B981', text: `${licenseInfo.remainingDays} days remaining`, icon: 'checkmark-circle' };
    }
  };

  const saveSetting = async (selected: "hardware" | "camera") => {
    await SecureStore.setItemAsync("scanMode", selected);
    setMode(selected);
  };

  const handlePingServer = async () => {
    setPinging(true);
    setPingStatus(null);
    try {
      const api = await createEnhancedAPI();
      const startTime = Date.now();
      
      let response;
      
      try {
        console.log("🔍 Testing server connectivity...");
        response = await api.get("/", {
          timeout: 10000,
          validateStatus: function (status) {
            return status < 500;
          }
        });
        
        console.log(`📡 Server responded with status: ${response.status}`);
        
      } catch (error: any) {
        try {
          console.log("🔍 Testing with login endpoint...");
          response = await api.post("/login", {}, {
            timeout: 10000,
            validateStatus: function (status) {
              return status === 400 || status === 401 || (status >= 200 && status < 300);
            }
          });
          
          console.log(`📡 Login endpoint responded with status: ${response.status}`);
          
        } catch (loginError: any) {
          throw loginError;
        }
      }
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      if (response && response.status < 500) {
        setPingStatus("success");
        console.log("🎉 Server is reachable!");
        Toast.show({
          type: "success",
          text1: "Server Online",
          text2: `Server is reachable (${responseTime}ms)`,
          visibilityTime: 3000,
        });
      } else {
        throw new Error(`Server error: ${response?.status || 'unknown'}`);
      }
      
    } catch (error: any) {
      setPingStatus("failed");
      console.log("💥 Server ping failed:", error?.message || error);
      let errorMessage = "Server unreachable";
      
      if (error.code === 'ECONNABORTED') {
        errorMessage = "Connection timeout";
      } else if (error.code === 'ENOTFOUND') {
        errorMessage = "Server not found";
      } else if (error.code === 'ECONNREFUSED') {
        errorMessage = "Connection refused";
      } else if (error.code === 'NETWORK_ERROR') {
        errorMessage = "Network error";
      } else if (error.response) {
        if (error.response.status >= 500) {
          errorMessage = `Server error: ${error.response.status}`;
        } else {
          errorMessage = "Server authentication required";
        }
      } else if (error.request) {
        errorMessage = "No response from server";
      }
      
      Toast.show({
        type: "error",
        text1: "Ping Failed",
        text2: errorMessage,
        visibilityTime: 3000,
      });
    } finally {
      setPinging(false);
    }
  };

  const handleRemoveLicense = () => {
    if (!licenseInfo) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "No license information found",
      });
      return;
    }

    Alert.alert(
      "Remove License",
      `Are you sure you want to deactivate this device from license?\n\nCustomer: ${licenseInfo.customerName}\n\nThis will log you out and you'll need to activate again.`,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Remove",
          style: "destructive",
          onPress: confirmRemoveLicense
        }
      ]
    );
  };

  const confirmRemoveLicense = async () => {
    if (!licenseInfo) return;

    setRemovingLicense(true);

    const isDemo = licenseInfo.licenseKey.startsWith("DEMO-");

    try {
      console.log("🗑️ Removing license...");
      console.log("License Key:", licenseInfo.licenseKey);
      console.log("Device ID:", licenseInfo.deviceId);
      console.log("Is Demo:", isDemo);

      if (isDemo) {
        // Demo license — clear locally without server call
        await AsyncStorage.multiRemove([
          "licenseActivated",
          "licenseKey",
          "licenseType",
          "license_type",
          "demoLicenseKey",
          "demoCompany",
          "demoExpiresAt",
          "demoDaysRemaining",
          "demoStatus",
          "deviceId",
          "device_hardware_id",
          "customerName",
          "projectName",
          "clientId",
        ]);

        await SecureStore.deleteItemAsync("authToken");
        await SecureStore.deleteItemAsync("userId");

        Toast.show({
          type: "success",
          text1: "Demo License Removed",
          text2: "Device has been deactivated successfully",
        });

        setTimeout(() => {
          router.replace("/(auth)/license");
        }, 1500);
        return;
      }

      // Production license — call server
      const LOGOUT_API = `https://activate.imcbs.com/mobileapp/api/project/taskmst/logout/`;

      const response = await fetch(LOGOUT_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          license_key: licenseInfo.licenseKey,
          device_id: licenseInfo.deviceId,
        }),
      });

      const responseText = await response.text();
      console.log("Raw response:", responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error("JSON parse error:", parseError);
        Toast.show({
          type: "error",
          text1: "Server Error",
          text2: "Invalid response from server",
        });
        setRemovingLicense(false);
        return;
      }

      console.log("Logout response:", data);

      if (response.ok && data.success) {
        console.log("✅ License removed successfully");

        // Clear all stored data including device_hardware_id
        await AsyncStorage.multiRemove([
          "licenseActivated",
          "licenseKey",
          "deviceId",
          "device_hardware_id",
          "customerName",
          "projectName",
          "clientId",
        ]);

        // Also clear auth tokens
        await SecureStore.deleteItemAsync("authToken");
        await SecureStore.deleteItemAsync("userId");

        Toast.show({
          type: "success",
          text1: "License Removed",
          text2: "Device has been deactivated successfully",
        });

        // Redirect to license activation screen after a short delay
        setTimeout(() => {
          router.replace("/(auth)/license");
        }, 1500);
      } else {
        const errorMessage =
          data.message ||
          data.error ||
          data.detail ||
          "Failed to remove license";

        console.error("License removal failed:", errorMessage);

        Toast.show({
          type: "error",
          text1: "Removal Failed",
          text2: errorMessage,
        });
      }
    } catch (error: any) {
      console.error("💥 License removal error:", error);

      let errorMessage = "Network error. Please check your connection.";

      if (error.message) {
        errorMessage = `Error: ${error.message}`;
      }

      if (
        error.name === "TypeError" &&
        error.message.includes("Network request failed")
      ) {
        errorMessage = "Cannot connect to server. Check your internet connection.";
      }

      Toast.show({
        type: "error",
        text1: "Connection Error",
        text2: errorMessage,
      });
    } finally {
      setRemovingLicense(false);
    }
  };

  const getDeviceType = () => {
    if (Platform.OS === 'android') {
      return 'Android ID';
    } else if (Platform.OS === 'ios') {
      return 'iOS IDFV (UUID)';
    }
    return 'Device ID';
  };

  const formatDeviceId = (deviceId: string) => {
    if (Platform.OS === 'android') {
      return deviceId.length > 8 ? `${deviceId.substring(0, 8)}...` : deviceId;
    } else if (Platform.OS === 'ios') {
      const parts = deviceId.split('-');
      return parts.length > 0 ? `${parts[0]}-...` : deviceId;
    }
    return deviceId.substring(0, 20) + '...';
  };

  return (
    <View style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={24} color="#801b90ff" />
      </TouchableOpacity>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Scan Mode Settings */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Scan Mode</Text>
          <Text style={styles.cardSubtitle}>
            Choose your preferred method for scanning barcodes
          </Text>

          <TouchableOpacity
            style={[
              styles.option,
              mode === "hardware" ? styles.optionSelected : styles.optionUnselected
            ]}
            onPress={() => saveSetting("hardware")}
          >
            <View style={styles.optionContent}>
              <Ionicons 
                name="barcode-outline" 
                size={24} 
                color={mode === "hardware" ? "#801b90ff" : "#6B7280"} 
              />
              <View style={styles.optionText}>
                <Text style={[
                  styles.optionTitle,
                  mode === "hardware" ? styles.optionTitleSelected : styles.optionTitleUnselected
                ]}>
                  Hardware Scanner
                </Text>
                <Text style={styles.optionDescription}>
                  Use external barcode scanner device
                </Text>
              </View>
              {mode === "hardware" && (
                <Ionicons name="checkmark-circle" size={24} color="#801b90ff" />
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.option,
              mode === "camera" ? styles.optionSelected : styles.optionUnselected
            ]}
            onPress={() => saveSetting("camera")}
          >
            <View style={styles.optionContent}>
              <Ionicons 
                name="camera-outline" 
                size={24} 
                color={mode === "camera" ? "#801b90ff" : "#6B7280"} 
              />
              <View style={styles.optionText}>
                <Text style={[
                  styles.optionTitle,
                  mode === "camera" ? styles.optionTitleSelected : styles.optionTitleUnselected
                ]}>
                  Camera Scanner
                </Text>
                <Text style={styles.optionDescription}>
                  Use phone's camera to scan
                </Text>
              </View>
              {mode === "camera" && (
                <Ionicons name="checkmark-circle" size={24} color="#801b90ff" />
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* Scan Behaviour */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Scan Behaviour</Text>
          <Text style={styles.cardSubtitle}>
            Choose what happens when the same item is scanned more than once.
          </Text>
          <TouchableOpacity
            style={[styles.option, duplicatePrompt ? styles.optionSelected : styles.optionUnselected]}
            onPress={async () => {
              const next = !duplicatePrompt;
              setDuplicatePrompt(next);
              await SecureStore.setItemAsync("duplicatePrompt", String(next));
            }}
          >
            <View style={styles.optionContent}>
              <Ionicons
                name={duplicatePrompt ? "alert-circle" : "flash"}
                size={24}
                color={duplicatePrompt ? "#801b90ff" : "#6B7280"}
              />
              <View style={styles.optionText}>
                <Text style={[styles.optionTitle, duplicatePrompt ? styles.optionTitleSelected : styles.optionTitleUnselected]}>
                  {duplicatePrompt ? "Ask before adding duplicate" : "Add duplicate silently"}
                </Text>
                <Text style={styles.optionDescription}>
                  {duplicatePrompt
                    ? "Shows a confirmation message when the same item is scanned again."
                    : "Adds the item again immediately without any prompt."}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Server Status */}
        <View style={styles.card}>
          {(pingStatus || pinging) && (
            <View style={[
              styles.statusIndicator,
              pinging && styles.statusIndicatorLoading,
              pingStatus === "success" && styles.statusIndicatorSuccess,
              pingStatus === "failed" && styles.statusIndicatorFailed
            ]}>
              {pinging ? (
                <ActivityIndicator size="small" color="#801b90ff" />
              ) : (
                <Ionicons 
                  name={pingStatus === "success" ? "checkmark-circle" : "close-circle"} 
                  size={20} 
                  color={pingStatus === "success" ? "#10B981" : "#EF4444"} 
                />
              )}
            </View>
          )}
          
          <Text style={[styles.cardTitle, { paddingRight: 32 }]}>
            Server Status
          </Text>
          <Text style={styles.cardSubtitle}>
            Check your connection to the server
          </Text>

          <TouchableOpacity
            style={[
              styles.pingButton,
              pinging ? styles.pingButtonDisabled : styles.pingButtonEnabled
            ]}
            onPress={handlePingServer}
            disabled={pinging}
          >
            {pinging ? (
              <>
                <ActivityIndicator size="small" color="#801b90ff" />
                <Text style={styles.pingButtonText}>Pinging Server...</Text>
              </>
            ) : (
              <>
                <Ionicons name="wifi-outline" size={20} color="#801b90ff" />
                <Text style={styles.pingButtonText}>Ping Server</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* License Info */}
        {licenseInfo && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>License Information</Text>

            <View style={styles.licenseInfoBox}>
              <View style={styles.licenseInfoRow}>
                <Ionicons name="person-outline" size={16} color="#6B7280" />
                <Text style={styles.licenseInfoLabel}>Customer</Text>
                <Text style={styles.licenseInfoValue}>{licenseInfo.customerName}</Text>
              </View>

              <View style={styles.licenseInfoRow}>
                <Ionicons name="key-outline" size={16} color="#6B7280" />
                <Text style={styles.licenseInfoLabel}>License</Text>
                <Text style={styles.licenseInfoValue} numberOfLines={1}>
                  {licenseInfo.licenseKey}
                </Text>
              </View>

              <View style={styles.licenseInfoRow}>
                <Ionicons name="phone-portrait-outline" size={16} color="#6B7280" />
                <Text style={styles.licenseInfoLabel}>{getDeviceType()}</Text>
                <Text style={styles.licenseInfoValue}>
                  {formatDeviceId(licenseInfo.deviceId)}
                </Text>
              </View>

              {loadingExpiry ? (
                <View style={{ alignItems: 'center', paddingVertical: 8 }}>
                  <ActivityIndicator size="small" color="#801b90ff" />
                </View>
              ) : licenseInfo.expiryDate ? (
                <>
                  <View style={styles.licenseInfoRow}>
                    <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                    <Text style={styles.licenseInfoLabel}>Expires</Text>
                    <Text style={styles.licenseInfoValue}>
                      {formatExpiryDate(licenseInfo.expiryDate)}
                    </Text>
                  </View>
                  {getExpiryStatus() && (
                    <View style={[styles.expiryStatusBadge, { backgroundColor: getExpiryStatus()!.color + '15' }]}>
                      <Ionicons 
                        name={getExpiryStatus()!.icon as any} 
                        size={16} 
                        color={getExpiryStatus()!.color} 
                      />
                      <Text style={[styles.expiryStatusText, { color: getExpiryStatus()!.color }]}>
                        {getExpiryStatus()!.text}
                      </Text>
                    </View>
                  )}
                </>
              ) : null}
            </View>

            {/* Remove License Button */}
            <TouchableOpacity
              style={[
                styles.removeButton,
                removingLicense && styles.removeButtonDisabled
              ]}
              onPress={handleRemoveLicense}
              disabled={removingLicense}
            >
              {removingLicense ? (
                <>
                  <ActivityIndicator size="small" color="#DC2626" />
                  <Text style={styles.removeButtonText}>Removing...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="trash-outline" size={20} color="#DC2626" />
                  <Text style={styles.removeButtonText}>Remove License</Text>
                </>
              )}
            </TouchableOpacity>

            <Text style={styles.warningText}>
              ⚠️ Removing license will deactivate this device and log you out
            </Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Powered by IMCB Solution LLP
          </Text>
          <Text style={[styles.footerText, { fontSize: 11, marginTop: 4 }]}>
            Device ID persists across app updates
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  backButton: {
    position: "absolute",
    top: 48,
    left: 24,
    zIndex: 10,
    backgroundColor: "white",
    padding: 8,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 100,
    paddingBottom: 40,
    gap: 30,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 24,
    shadowColor: "#c018cdff",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.30,
    shadowRadius: 3,
    elevation: 2,
    position: "relative",
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 16,
    color: "#111827",
  },
  cardSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 24,
  },
  option: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 12,
  },
  optionSelected: {
    backgroundColor: "#fdeaf6ff",
    borderColor: "#801b90ff",
  },
  optionUnselected: {
    backgroundColor: "#F9FAFB",
    borderColor: "#E5E7EB",
  },
  optionContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  optionText: {
    marginLeft: 12,
    flex: 1,
  },
  optionTitle: {
    fontWeight: "600",
    fontSize: 16,
  },
  optionTitleSelected: {
    color: "#801b90ff",
  },
  optionTitleUnselected: {
    color: "#111827",
  },
  optionDescription: {
    fontSize: 14,
    color: "#6B7280",
  },
  statusIndicator: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 999,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusIndicatorLoading: {
    backgroundColor: "#EBF8FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  statusIndicatorSuccess: {
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  statusIndicatorFailed: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  pingButton: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  pingButtonEnabled: {
    backgroundColor: "#ffebf1ff",
    borderColor: "#c257d4ff",
  },
  pingButtonDisabled: {
    backgroundColor: "#F9FAFB",
    borderColor: "#D1D5DB",
  },
  pingButtonText: {
    marginLeft: 8,
    fontWeight: "600",
    color: "#801b90ff",
  },
  licenseInfoBox: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  licenseInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  licenseInfoLabel: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
    minWidth: 80,
  },
  licenseInfoValue: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "600",
    flex: 1,
  },
  expiryStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    borderRadius: 8,
    marginTop: 4,
    gap: 6,
  },
  expiryStatusText: {
    fontSize: 13,
    fontWeight: "600",
  },
  removeButton: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#FECACA",
    backgroundColor: "#FEF2F2",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  removeButtonDisabled: {
    backgroundColor: "#F9FAFB",
    borderColor: "#E5E7EB",
  },
  removeButtonText: {
    marginLeft: 8,
    fontWeight: "600",
    color: "#DC2626",
    fontSize: 16,
  },
  warningText: {
    fontSize: 12,
    color: "#F59E0B",
    textAlign: "center",
    fontStyle: "italic",
  },
  footer: {
    alignItems: "center",
    marginTop: 20,
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 13,
    color: "#9CA3AF",
    textAlign: "center",
  },
});