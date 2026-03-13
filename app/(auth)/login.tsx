import { createDebugAPI, createEnhancedAPI } from "@/utils/api";
import { saveToken, saveUserid } from "@/utils/auth";
import { debugLoginPayloads } from "@/utils/debug";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Application from "expo-application";
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store"; // ADDED
import React, { useEffect, useState } from "react";
import {
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  PermissionsAndroid,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from "react-native";
import Toast from "react-native-toast-message";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [usernameError, setUsernameError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [currentIP, setCurrentIP] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(true);

  const router = useRouter();

  // Load saved IP on component mount
  useEffect(() => {
    const loadIP = async () => {
      try {
        console.log("🔍 Loading IP from storage...");
        
        // METHOD 1: First try SecureStore (where pairing.ts saves it)
        const secureStoreIP = await SecureStore.getItemAsync("paired_ip");
        console.log("SecureStore - paired_ip:", secureStoreIP);
        
        if (secureStoreIP) {
          console.log("✅ Found IP in SecureStore:", secureStoreIP);
          setCurrentIP(secureStoreIP);
          setIsConnected(true);
          return;
        }
        
        // METHOD 2: Try AsyncStorage as fallback (backward compatibility)
        const pairingIP = await AsyncStorage.getItem("pairing_ip");
        const serverIP = await AsyncStorage.getItem("server_ip");
        const baseURL = await AsyncStorage.getItem("base_url");
        
        console.log("AsyncStorage - pairing_ip:", pairingIP);
        console.log("AsyncStorage - server_ip:", serverIP);
        console.log("AsyncStorage - base_url:", baseURL);
        
        // Use the first one that exists
        let savedIP = pairingIP || serverIP;
        
        // If baseURL is found, extract IP from it
        if (baseURL) {
          const extractedIP = baseURL.replace('http://', '').replace(':8000', '').trim();
          console.log("Extracted IP from base_url:", extractedIP);
          savedIP = savedIP || extractedIP;
        }
        
        console.log("Using IP:", savedIP);
        
        if (savedIP) {
          setCurrentIP(savedIP);
          setIsConnected(true);
          
          // Also save to SecureStore for consistency
          await SecureStore.setItemAsync("paired_ip", savedIP);
          console.log("✅ Copied IP from AsyncStorage to SecureStore");
        } else {
          console.log("❌ No IP found anywhere");
          setIsConnected(false);
        }
      } catch (error) {
        console.error("Error loading IP:", error);
        setIsConnected(false);
      }
    };
    loadIP();
  }, []);

  const handleLogoPress = () => {
    setDebugMode(prev => !prev);
    Toast.show({
      type: 'info',
      text1: debugMode ? 'Debug mode disabled' : 'Debug mode enabled',
      text2: debugMode ? 'Normal login' : 'Testing all payload formats',
    });
  };

  const requestAndroidPermissions = async () => {
    if (Platform.OS !== 'android') {
      return true;
    }

    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
        {
          title: "Device ID Permission",
          message: "This app needs access to your device ID for license validation.",
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
          throw new Error("Permission denied. Please grant phone state permission to use this app.");
        }

        id = Application.androidId;
        console.log("Method 1 - Application.androidId:", id);
        
        if (id && id !== "null" && id !== "" && id !== "unknown") {
          console.log("✅ Using Application.androidId:", id);
          await AsyncStorage.setItem("device_hardware_id", id);
          return id;
        }

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

        const storedId = await AsyncStorage.getItem("device_hardware_id");
        if (storedId) {
          console.log("✅ Using stored device ID:", storedId);
          return storedId;
        }

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

  const validateLicenseWithAPI = async () => {
    try {
      console.log("=== LICENSE VALIDATION START ===");
      
      const storedLicenseKey = await AsyncStorage.getItem("licenseKey");
      const storedClientId = await AsyncStorage.getItem("clientId");
      const storedDeviceId = await AsyncStorage.getItem("deviceId");
      const licenseType = await AsyncStorage.getItem("licenseType");
      const demoLicenseKey = await AsyncStorage.getItem("demoLicenseKey");
      console.log("License Type:", licenseType);
      console.log("Stored License Key:", storedLicenseKey);
      console.log("Demo License Key:", demoLicenseKey);

      console.log("Stored Client ID:", storedClientId);
      console.log("Stored Device ID:", storedDeviceId);

      if (licenseType === "DEMO") {
      console.log("🎭 Demo license detected, validating...");
      
      const demoExpiresAt = await AsyncStorage.getItem("demoExpiresAt");
      const demoStatus = await AsyncStorage.getItem("demoStatus");
      const demoCompany = await AsyncStorage.getItem("demoCompany");
      
      if (!demoLicenseKey || !demoExpiresAt) {
        return {
          valid: false,
          message: "Demo license data missing. Please reactivate.",
          needsActivation: true
        };
      }
      
      // Check if demo expired
      const expiryDate = new Date(demoExpiresAt);
      const today = new Date();
      
      if (expiryDate < today) {
        return {
          valid: false,
          message: "Demo license has expired. Please contact support.",
          needsActivation: true
        };
      }
      
      // Check demo status
      if (demoStatus?.toLowerCase() !== "active") {
        return {
          valid: false,
          message: `Demo license is ${demoStatus}`,
          needsActivation: true
        };
      }
      
      // Calculate days remaining
      const daysRemaining = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      // Update days remaining in storage
      await AsyncStorage.setItem("demoDaysRemaining", String(daysRemaining));
      
      console.log("✅ Demo license valid, days remaining:", daysRemaining);
      
      return {
        valid: true,
        customerName: demoCompany,
        clientId: storedClientId,
        licenseKey: demoLicenseKey,
        isDemoMode: true,
        daysRemaining: daysRemaining
      };
    }
      
      if (!storedLicenseKey) {
        console.log("NO LICENSE KEY FOUND");
        return { 
          valid: false, 
          message: "No license found. Please activate your license first.",
          needsActivation: true
        };
      }

      if (!storedClientId) {
        console.log("NO CLIENT ID FOUND");
        return { 
          valid: false, 
          message: "Client ID missing. Please reactivate your license.",
          needsActivation: true
        };
      }

      const currentDeviceId = await getDeviceId();
      console.log("Current Device ID:", currentDeviceId);
      console.log("Stored Device ID:", storedDeviceId);
      console.log("Device IDs Match:", currentDeviceId === storedDeviceId);
      
      if (!currentDeviceId) {
        return { valid: false, message: "Device ID not available" };
      }

      if (storedDeviceId && currentDeviceId !== storedDeviceId) {
        console.warn("❌ DEVICE ID MISMATCH DETECTED!");
        console.warn("   Stored:", storedDeviceId);
        console.warn("   Current:", currentDeviceId);
        console.warn("   This appears to be a different device");
        
        return {
          valid: false,
          message: "Device ID mismatch. Please reactivate your license on this device.",
          needsActivation: true
        };
      }

      const CHECK_LICENSE_API = `https://activate.imcbs.com/mobileapp/api/project/taskmst/`;
      
      console.log("Calling API:", CHECK_LICENSE_API);
      const response = await fetch(CHECK_LICENSE_API, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        console.log("API FAILED");
        return { 
          valid: false, 
          message: "Failed to validate license. Please try again."
        };
      }

      if (!data.customers || data.customers.length === 0) {
        console.log("NO CUSTOMERS");
        return { 
          valid: false, 
          message: "No valid license found. Please contact support."
        };
      }

      const customer = data.customers.find(
        (c: any) => c.license_key === storedLicenseKey
      );

      if (!customer) {
        console.log("LICENSE KEY NOT FOUND IN API");
        return { 
          valid: false, 
          message: "Invalid license key. Please reactivate your license.",
          needsActivation: true
        };
      }

      console.log("Customer Found:", customer.customer_name);
      console.log("Registered Devices:", customer.registered_devices);

      const licenseStatus = String(customer.status || "").toLowerCase().trim();
      console.log("License Status:", licenseStatus);

      if (licenseStatus !== "active") {
        console.log("LICENSE NOT ACTIVE");
        return { 
          valid: false, 
          message: `License is ${customer.status}. Please contact support.`
        };
      }

      const isDeviceRegistered = customer.registered_devices?.some(
        (device: any) => {
          console.log("Checking device:", device.device_id, "against:", currentDeviceId);
          return device.device_id === currentDeviceId;
        }
      );
      
      console.log("Device Registered:", isDeviceRegistered);
      
      if (!isDeviceRegistered) {
        console.log("DEVICE NOT REGISTERED");
        console.log("Available registered devices:", customer.registered_devices?.map((d: any) => d.device_id));
        return { 
          valid: false, 
          message: "This device is not registered. Please activate your license again.",
          needsActivation: true
        };
      }

      console.log("=== LICENSE VALID ===");
      console.log("Returning clientId:", customer.client_id);
      
      return {
        valid: true,
        customerName: customer.customer_name,
        clientId: customer.client_id,
        licenseKey: customer.license_key
      };

    } catch (error) {
      console.error("VALIDATION ERROR:", error);
      return { 
        valid: false, 
        message: "Network error. Please check your connection and try again."
      };
    }
  };

  const handleLogin = async () => {
    let hasError = false;

    if (!username) {
      setUsernameError(true);
      hasError = true;
    } else {
      setUsernameError(false);
    }

    if (!password) {
      setPasswordError(true);
      hasError = true;
    } else {
      setPasswordError(false);
    }

    if (hasError) return;

    setLoading(true);

    try {
      console.log("=== LOGIN PROCESS START ===");
      console.log("Current stored IP:", currentIP);
      
      const licenseValidation = await validateLicenseWithAPI();
      
      console.log("License Validation Result:", JSON.stringify(licenseValidation, null, 2));
      
      if (!licenseValidation || !licenseValidation.valid) {
        setLoading(false);
        console.log("LICENSE VALIDATION FAILED");
        
        if (licenseValidation?.needsActivation) {
          Toast.show({
            type: "error",
            text1: "License Not Valid",
            text2: licenseValidation.message,
            visibilityTime: 4000,
          });
          
          setTimeout(() => {
            router.replace("/(auth)/license");
          }, 1500);
        } else {
          Toast.show({
            type: "error",
            text1: "License Validation Failed",
            text2: licenseValidation?.message || "Unknown error",
            visibilityTime: 4000,
          });
        }
        return;
      }

      console.log("LICENSE VALIDATED SUCCESSFULLY");
      console.log("Using Client ID:", licenseValidation.clientId);
      
      await AsyncStorage.setItem("clientId", licenseValidation.clientId);
      
      if (debugMode) {
        await runDebugLogin(licenseValidation.clientId);
      } else {
        await runNormalLogin(licenseValidation.clientId);
      }
      
    } catch (error) {
      console.error("LOGIN ERROR:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "An unexpected error occurred. Please try again.",
      });
      setLoading(false);
    }
  };

  const runNormalLogin = async (clientId: string) => {
    try {
      console.log("=== NORMAL LOGIN START ===");
      console.log("Client ID:", clientId);
      console.log("Username:", username);
      
      const currentDeviceId = await getDeviceId();
      console.log("Device ID for login:", currentDeviceId);
      
      // Get current IP to verify
      const storedIP = await SecureStore.getItemAsync("paired_ip");
      console.log("IP from SecureStore for API:", storedIP);
      
      if (!storedIP) {
        Toast.show({
          type: "error",
          text1: "Server Not Configured",
          text2: "Please connect to a server first",
        });
        setLoading(false);
        router.replace("/(auth)/pairing");
        return;
      }
      
      const api = await createEnhancedAPI();
      
      const commonPayloads = [
        { userid: username, password, client_id: clientId, device_id: currentDeviceId },
        { username, password, client_id: clientId, device_id: currentDeviceId },
        { email: username, password, client_id: clientId, device_id: currentDeviceId },
        { login: username, password, client_id: clientId, device_id: currentDeviceId },
      ];

      let success = false;
      
      for (const [index, payload] of commonPayloads.entries()) {
        try {
          console.log(`Attempt ${index + 1}:`, JSON.stringify(payload));
          const res = await api.post("/login", payload);
          
          console.log("Response:", res.data);

          if (res.data.status === "success") {
            await handleLoginSuccess(res.data);
            success = true;
            break;
          }
        } catch (err: any) {
          console.log(`Failed ${index + 1}:`, err.response?.status, err.response?.data);
          continue;
        }
      }
      
      if (!success) {
        Toast.show({
          type: "error",
          text1: "Login failed",
          text2: "Invalid username or password",
        });
        setLoading(false);
      }
      
    } catch (err: any) {
      console.error("LOGIN API ERROR:", err);
      
      let errorMessage = "Cannot connect to server. Please try again.";
      
      if (err.message?.includes("No paired IP found")) {
        errorMessage = "Server not configured. Please connect to server first.";
        setLoading(false);
        router.replace("/(auth)/pairing");
      } else if (err.code === "NETWORK_ERROR" || err.code === "ECONNREFUSED") {
        errorMessage = "Server is not reachable. Please check server connection.";
      }
      
      Toast.show({
        type: "error",
        text1: "Connection Error",
        text2: errorMessage,
      });
      setLoading(false);
    }
  };

  const runDebugLogin = async (clientId: string) => {
    try {
      const currentDeviceId = await getDeviceId();
      console.log("Device ID for debug login:", currentDeviceId);
      
      // Get current IP to verify
      const storedIP = await SecureStore.getItemAsync("paired_ip");
      console.log("IP from SecureStore for debug:", storedIP);
      
      if (!storedIP) {
        Toast.show({
          type: "error",
          text1: "Server Not Configured",
          text2: "Please connect to a server first",
        });
        setLoading(false);
        router.replace("/(auth)/pairing");
        return;
      }
      
      const api = await createDebugAPI();
      const basePayloads = debugLoginPayloads(username, password);
      
      const payloads = basePayloads.map(p => ({ 
        ...p, 
        client_id: clientId,
        device_id: currentDeviceId 
      }));
      
      console.log("DEBUG MODE: Testing all formats with clientId:", clientId, "and deviceId:", currentDeviceId);
      
      for (const [index, payload] of payloads.entries()) {
        try {
          console.log(`\n=== Payload ${index + 1} ===`);
          console.log(JSON.stringify(payload, null, 2));
          
          const res = await api.post("/login", payload);
          console.log("SUCCESS:", res.data);
          
          if (res.data.status === "success") {
            await handleLoginSuccess(res.data);
            break;
          }
        } catch (err: any) {
          console.log("FAILED:", err.response?.status, err.response?.data);
        }
        
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
    } catch (err: any) {
      console.error("DEBUG ERROR:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = async (data: any) => {
    console.log("=== LOGIN SUCCESS ===");
    await saveToken(data.token);
    await saveUserid(data.user_id);
    await SecureStore.setItemAsync("user_role", data.role || "");
    await SecureStore.setItemAsync("userLoggedIn", "true");
    
    Toast.show({
      type: "success",
      text1: "Success",
      text2: "Welcome, Login successful",
    });
    
    setTimeout(() => {
      router.replace("/(main)");
    }, 300);
  };

  const openEmail = () => {
    Linking.openURL('mailto:info@imcbs.com');
  };

  const openWebsite = () => {
    Linking.openURL('https://imcbs.com/');
  };

  const openInstagram = () => {
    Linking.openURL('https://www.instagram.com/imcbusinesssolution/');
  };

  const openFacebook = () => {
    Linking.openURL('https://www.facebook.com/people/IMC-Business-Solution/100069040622427/');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: '#F3F4F6' }}
    >
      <StatusBar backgroundColor="#7E57C2" barStyle="light-content" />

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <LinearGradient
            colors={["#7E57C2", "#9C27B0", "#7E57C2"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ 
              height: 200, 
              borderBottomLeftRadius: 40,
              borderBottomRightRadius: 40,
              paddingTop: 40,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#7E57C2',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8,
            }}
          >
            <TouchableOpacity onPress={handleLogoPress}>
              <View style={{
                backgroundColor: 'white',
                borderRadius: 35,
                padding: 12,
                marginBottom: 12,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
                elevation: 5,
              }}>
                <Image
                  source={require("../../assets/images/icon.png")}
                  style={{ width: 50, height: 50 }}
                />
              </View>
            </TouchableOpacity>
            <Text style={{ 
              color: 'white', 
              fontSize: 28, 
              fontWeight: 'bold',
              letterSpacing: 1,
            }}>
              TaskMST
            </Text>
            <Text style={{ 
              color: 'rgba(255,255,255,0.9)', 
              fontSize: 14,
              marginTop: 6,
            }}>
              Welcome Back
            </Text>
            {debugMode && (
              <View style={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                paddingHorizontal: 12,
                paddingVertical: 4,
                borderRadius: 12,
                marginTop: 8,
              }}>
                <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>
                  🔧 DEBUG MODE
                </Text>
              </View>
            )}
          </LinearGradient>

          <View className="flex-1 px-6 justify-center" style={{ marginTop: -40 }}>
            
            {/* SERVER CONNECTION CARD */}
            <View style={{
              backgroundColor: 'white',
              borderRadius: 16,
              padding: 16,
              marginBottom: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 3,
              borderWidth: 2,
              borderColor: '#E9D5FF',
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 }}>
                  <View style={{
                    backgroundColor: isConnected ? '#D1FAE5' : '#F3F4F6',
                    padding: 10,
                    borderRadius: 50,
                  }}>
                    <Ionicons name="server" size={20} color={isConnected ? "#059669" : "#9CA3AF"} />
                  </View>
                  
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginRight: 6 }}>
                        Server Connection
                      </Text>
                      <View style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: isConnected ? '#10B981' : '#9CA3AF',
                      }} />
                    </View>
                    
                    <Text style={{ fontSize: 12, color: '#6B7280' }}>
                      {currentIP ? `Connected to: ${currentIP}` : 'Not connected'}
                    </Text>
                  </View>
                </View>
                
                <TouchableOpacity
                  onPress={() => router.push("/(auth)/pairing")}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: '#F3E8FF',
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 12,
                    gap: 4,
                  }}
                >
                  <Ionicons name="settings-outline" size={16} color="#7E57C2" />
                  <Text style={{ color: '#7E57C2', fontWeight: '600', fontSize: 13 }}>
                    Change
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* LOGIN FORM CARD */}
            <View style={{
              backgroundColor: 'white',
              borderRadius: 24,
              padding: 24,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 12,
              elevation: 6,
            }}>
              <View className="mb-6">
                <View className="flex-row items-center mb-2">
                  <Ionicons name="person-circle-outline" size={20} color="#7E57C2" />
                  <Text className="text-gray-700 font-semibold ml-2">
                    {debugMode ? "Username/UserID/Email" : "Username"}
                  </Text>
                </View>
                <View style={{
                  borderWidth: 2,
                  borderColor: usernameError ? '#EF4444' : '#E9D5FF',
                  borderRadius: 16,
                  backgroundColor: '#FAFAFA',
                }}>
                  <TextInput
                    value={username}
                    onChangeText={(text) => {
                      setUsername(text);
                      setUsernameError(false);
                    }}
                    placeholder={debugMode ? "Enter username, userid, or email" : "Enter your username"}
                    placeholderTextColor="#9CA3AF"
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 14,
                      fontSize: 15,
                      color: '#1F2937',
                    }}
                  />
                </View>
                {usernameError && (
                  <View className="flex-row items-center mt-2">
                    <Ionicons name="alert-circle" size={14} color="#EF4444" />
                    <Text className="text-red-500 text-sm ml-1">
                      This field is required
                    </Text>
                  </View>
                )}
              </View>

              <View className="mb-6">
                <View className="flex-row items-center mb-2">
                  <Ionicons name="lock-closed-outline" size={20} color="#7E57C2" />
                  <Text className="text-gray-700 font-semibold ml-2">Password</Text>
                </View>
                <View style={{
                  borderWidth: 2,
                  borderColor: passwordError ? '#EF4444' : '#E9D5FF',
                  borderRadius: 16,
                  backgroundColor: '#FAFAFA',
                  flexDirection: 'row',
                  alignItems: 'center',
                }}>
                  <TextInput
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      setPasswordError(false);
                    }}
                    placeholder="Enter your password"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={!showPassword}
                    style={{
                      flex: 1,
                      paddingHorizontal: 16,
                      paddingVertical: 14,
                      fontSize: 15,
                      color: '#1F2937',
                    }}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword((prev) => !prev)}
                    style={{ paddingRight: 16 }}
                  >
                    <Ionicons
                      name={showPassword ? "eye-off" : "eye"}
                      size={22}
                      color="#7E57C2"
                    />
                  </TouchableOpacity>
                </View>
                {passwordError && (
                  <View className="flex-row items-center mt-2">
                    <Ionicons name="alert-circle" size={14} color="#EF4444" />
                    <Text className="text-red-500 text-sm ml-1">
                      Password is required
                    </Text>
                  </View>
                )}
              </View>

              <Pressable
                onPress={handleLogin}
                disabled={loading || !isConnected}
                style={{
                  backgroundColor: loading ? '#9575CD' : (!isConnected ? '#D1D5DB' : '#7E57C2'),
                  borderRadius: 16,
                  paddingVertical: 16,
                  shadowColor: '#7E57C2',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 4,
                  opacity: (!isConnected) ? 0.5 : 1,
                }}
              >
                <View className="flex-row justify-center items-center">
                  {loading && (
                    <View className="mr-2">
                      <Ionicons name="sync" size={20} color="white" />
                    </View>
                  )}
                  <Text className="text-white font-bold text-lg">
                    {!isConnected ? "Server Not Connected" : loading ? "Validating & Logging in..." : "Login"}
                  </Text>
                </View>
              </Pressable>

              {debugMode && (
                <View style={{
                  backgroundColor: '#FEF3C7',
                  borderRadius: 12,
                  padding: 12,
                  marginTop: 16,
                  borderLeftWidth: 4,
                  borderLeftColor: '#F59E0B',
                }}>
                  <Text className="text-xs text-gray-700 text-center">
                    🔧 Debug mode: Testing all field name combinations
                  </Text>
                </View>
              )}
            </View>

            <View style={{
              backgroundColor: 'white',
              borderRadius: 20,
              padding: 16,
              marginTop: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
              elevation: 3,
            }}>
              <View className="flex-row items-center justify-center">
                <Ionicons name="shield-checkmark" size={16} color="#7E57C2" />
                <Text className="text-gray-600 text-sm ml-2">
                  Secure Login • Privacy Protected
                </Text>
              </View>
            </View>

            <View style={{
              backgroundColor: 'white',
              borderRadius: 20,
              padding: 20,
              marginTop: 16,
              marginBottom: 24,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
              elevation: 3,
            }}>
              <View style={{
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 12,
              }}>
                <TouchableOpacity
                  onPress={openEmail}
                  style={{
                    backgroundColor: '#7E57C2',
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginHorizontal: 8,
                    shadowColor: '#7E57C2',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.3,
                    shadowRadius: 4,
                    elevation: 3,
                  }}
                >
                  <Ionicons name="mail" size={22} color="white" />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={openWebsite}
                  style={{
                    backgroundColor: '#288749ff',
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginHorizontal: 8,
                    shadowColor: '#EA4335',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.3,
                    shadowRadius: 4,
                    elevation: 3,
                  }}
                >
                  <Ionicons name="globe" size={22} color="white" />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={openInstagram}
                  style={{
                    backgroundColor: '#E4405F',
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginHorizontal: 8,
                    shadowColor: '#E4405F',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.3,
                    shadowRadius: 4,
                    elevation: 3,
                  }}
                >
                  <Ionicons name="logo-instagram" size={22} color="white" />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={openFacebook}
                  style={{
                    backgroundColor: '#1877F2',
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginHorizontal: 8,
                    shadowColor: '#1877F2',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.3,
                    shadowRadius: 4,
                    elevation: 3,
                  }}
                >
                  <Ionicons name="logo-facebook" size={22} color="white" />
                </TouchableOpacity>
              </View>

              <Text style={{
                textAlign: 'center',
                color: '#6B7280',
                fontSize: 12,
                marginTop: 4,
              }}>
                © 2025 All rights reserved. IMCB Solutions LLP
              </Text>
            </View>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}