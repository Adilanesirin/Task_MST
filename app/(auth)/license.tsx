import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Application from "expo-application";
import * as Device from "expo-device";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
  View,
} from "react-native";
import Toast from "react-native-toast-message";

export default function License() {
  const [licenseKey, setLicenseKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [deviceId, setDeviceId] = useState("");
  const [deviceName, setDeviceName] = useState("");
  const [licenseError, setLicenseError] = useState(false);

  const router = useRouter();

  const requestAndroidPermissions = async () => {
    if (Platform.OS !== 'android') {
      return true;
    }

    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
        {
          title: "Device ID Permission",
          message: "This app needs access to your device ID for license activation.",
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
        // Request permission first
        const hasPermission = await requestAndroidPermissions();
        
        if (!hasPermission) {
          throw new Error("Permission denied. Please grant phone state permission to use this app.");
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

        // Method 3: Check if we have a previously stored device ID
        const storedId = await AsyncStorage.getItem("device_hardware_id");
        if (storedId) {
          console.log("✅ Using stored device ID:", storedId);
          return storedId;
        }

        // If all methods fail, generate a UUID-based persistent ID
        console.log("⚠️ Android ID not available, generating persistent UUID");
        const uuid = 'xxxxxxxxxxxxxxxx'.replace(/[x]/g, function(c) {
          const r = Math.random() * 16 | 0;
          return r.toString(16);
        });
        
        // Store it permanently
        await AsyncStorage.setItem("device_hardware_id", uuid);
        console.log("✅ Generated and stored UUID:", uuid);
        return uuid;
        
      } else if (Platform.OS === "ios") {
        // Get iOS IDFV
        id = await Application.getIosIdForVendorAsync();
        
        console.log("iOS IDFV from Application:", id);
        
        if (id && id !== "null" && id !== "") {
          console.log("✅ Using iOS IDFV:", id);
          await AsyncStorage.setItem("device_hardware_id", id);
          return id;
        }

        // Fallback for iOS - check stored ID
        const storedId = await AsyncStorage.getItem("device_hardware_id");
        if (storedId) {
          console.log("✅ Using stored iOS device ID:", storedId);
          return storedId;
        }

        // Generate UUID for iOS fallback
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
      
      // Last resort - try to get stored ID
      try {
        const storedId = await AsyncStorage.getItem("device_hardware_id");
        if (storedId) {
          console.log("Using emergency stored device ID");
          return storedId;
        }
      } catch (e) {
        console.error("Storage error:", e);
      }
      
      Alert.alert(
        "Device ID Error",
        error.message || "Unable to get device identifier",
        [
          {
            text: "Retry",
            onPress: () => {
              initializeApp();
            }
          }
        ]
      );
      
      throw error;
    }
  };

  const getDeviceName = async () => {
    try {
      let name = "";
      
      if (Platform.OS === "android") {
        const brand = Device.brand || "";
        const modelName = Device.modelName || "";
        name = `${brand} ${modelName}`.trim() || "Android Device";
      } else if (Platform.OS === "ios") {
        const modelName = Device.modelName || "";
        name = modelName || "iOS Device";
      } else {
        name = "Unknown Device";
      }
      
      console.log("📱 Device Name:", name);
      return name;
    } catch (error) {
      console.error("Error getting device name:", error);
      return "Unknown Device";
    }
  };

  const checkDeviceRegistration = async (deviceIdToCheck: string) => {
    try {
      const CHECK_LICENSE_API = `https://activate.imcbs.com/mobileapp/api/project/taskmst/`;

      console.log("🔍 Checking device registration for:", deviceIdToCheck);

      const response = await fetch(CHECK_LICENSE_API, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      console.log("API Response:", data);

      if (!response.ok || !data.success) {
        console.log("API check failed");
        return { found: false };
      }

      if (!data.customers || data.customers.length === 0) {
        console.log("No customers found");
        return { found: false };
      }

      for (const customer of data.customers) {
        if (customer.registered_devices && customer.registered_devices.length > 0) {
          const deviceFound = customer.registered_devices.some(
            (device: any) => device.device_id === deviceIdToCheck
          );

          if (deviceFound) {
            console.log("✅ Device found in customer:", customer.customer_name);
            return {
              found: true,
              customer: customer,
              projectName: data.project_name
            };
          }
        }
      }

      console.log("❌ Device not found in any customer");
      return { found: false };
    } catch (error) {
      console.error("Error checking device registration:", error);
      return { found: false };
    }
  };

  const storeLicenseDataSafely = async (data: {
    licenseKey: string;
    deviceId: string;
    customerName: string;
    projectName: string;
    clientId: string;
  }): Promise<boolean> => {
    try {
      console.log("💾 Storing license data...");
      console.log("  - License Key:", data.licenseKey);
      console.log("  - Device ID:", data.deviceId);
      console.log("  - Client ID:", data.clientId);
      console.log("  - Customer:", data.customerName);

      await AsyncStorage.multiSet([
        ["licenseActivated", "true"],
        ["licenseKey", data.licenseKey],
        ["deviceId", data.deviceId],
        ["customerName", data.customerName],
        ["projectName", data.projectName],
        ["clientId", data.clientId],
      ]);

      const verification = await AsyncStorage.multiGet([
        "licenseActivated",
        "licenseKey",
        "deviceId",
        "customerName",
        "projectName",
        "clientId",
      ]);

      console.log("✅ Storage verification:");
      verification.forEach(([key, value]) => {
        console.log(`   - ${key}: ${value || "NULL"}`);
      });

      const allStored = verification.every(([_, value]) => value !== null);

      if (allStored) {
        console.log("✅ All license data stored successfully");
        return true;
      } else {
        console.error("❌ Some license data failed to store");
        return false;
      }
    } catch (error) {
      console.error("❌ Error storing license data:", error);
      return false;
    }
  };

  const initializeApp = async () => {
    try {
      setChecking(true);

      // Get device information
      const id = await getDeviceId();
      setDeviceId(id);

      const name = await getDeviceName();
      setDeviceName(name);

      console.log("=== DEVICE INFO ===");
      console.log("Device ID:", id);
      console.log("Device Name:", name);
      console.log("Platform:", Platform.OS);
      console.log("Is Physical Device:", Device.isDevice);

      // Check AsyncStorage for license activation status
      const licenseActivated = await AsyncStorage.getItem("licenseActivated");
      const storedDeviceId = await AsyncStorage.getItem("deviceId");
      const storedLicenseKey = await AsyncStorage.getItem("licenseKey");
      const storedClientId = await AsyncStorage.getItem("clientId");
      
      console.log("📱 Local License Status:");
      console.log("  - License Activated:", licenseActivated);
      console.log("  - Stored Device ID:", storedDeviceId);
      console.log("  - Current Device ID:", id);
      console.log("  - License Key:", storedLicenseKey ? "exists" : "none");
      console.log("  - Client ID:", storedClientId ? "exists" : "none");
      console.log("  - Device IDs Match:", storedDeviceId === id);

      // Device ID Mismatch Detection
      if (storedDeviceId && storedDeviceId !== id) {
        console.log("❌ DEVICE ID MISMATCH DETECTED!");
        console.log("   Stored Device ID:", storedDeviceId);
        console.log("   Current Device ID:", id);
        console.log("   This appears to be a different device");
        console.log("   Clearing old license data...");
        
        await AsyncStorage.multiRemove([
          "licenseActivated",
          "licenseKey",
          "customerName",
          "projectName",
          "clientId",
        ]);
        
        await AsyncStorage.setItem("deviceId", id);
        
        Toast.show({
          type: "info",
          text1: "New Device Detected",
          text2: "Please activate your license on this device",
          visibilityTime: 3000,
        });
        
        setChecking(false);
        return;
      }

      if (licenseActivated === "true" && storedLicenseKey && storedClientId && storedDeviceId === id) {
        console.log("✅ Complete local license found and device ID matches");
        console.log("   Verifying with server...");
        
        const registrationCheck = await checkDeviceRegistration(id);
        
        if (registrationCheck.found) {
          console.log("✅ Server confirms device is registered");
          console.log("   Customer:", registrationCheck.customer.customer_name);
          console.log("   License Status:", registrationCheck.customer.status);
          
          const storeSuccess = await storeLicenseDataSafely({
            licenseKey: registrationCheck.customer.license_key,
            deviceId: id,
            customerName: registrationCheck.customer.customer_name,
            projectName: registrationCheck.projectName,
            clientId: registrationCheck.customer.client_id,
          });

          if (!storeSuccess) {
            console.error("❌ Failed to verify storage");
            Toast.show({
              type: "error",
              text1: "Storage Error",
              text2: "Please try activating again",
            });
            setChecking(false);
            return;
          }
          
          Toast.show({
            type: "success",
            text1: "Welcome Back! 🎉",
            text2: `${registrationCheck.customer.customer_name}`,
            visibilityTime: 2000,
          });

          setTimeout(() => {
            router.replace("/(auth)/pairing");
          }, 500);
          return;
        } else {
          console.log("⚠️ Device not found on server");
          console.log("   License may have been revoked or expired");
          
          await AsyncStorage.multiRemove([
            "licenseActivated",
            "licenseKey",
            "customerName",
            "projectName",
            "clientId",
          ]);
          
          Toast.show({
            type: "info",
            text1: "License Reset",
            text2: "Please activate your license again",
          });
        }
      }

      console.log("Showing license activation screen");
      setChecking(false);
      
    } catch (error) {
      console.error("Initialization error:", error);
      setChecking(false);
    }
  };

  useEffect(() => {
    initializeApp();
  }, []);

  const handleActivate = async () => {
    if (!licenseKey.trim()) {
      setLicenseError(true);
      return;
    }

    if (!deviceId) {
      Alert.alert("Error", "Device ID not available. Please try again.");
      return;
    }

    setLoading(true);
    setLicenseError(false);

    try {
      const CHECK_LICENSE_API = `https://activate.imcbs.com/mobileapp/api/project/taskmst/`;

      console.log("=== LICENSE ACTIVATION START ===");
      console.log("License Key:", licenseKey.trim());
      console.log("Device ID:", deviceId);
      console.log("Device Name:", deviceName);
      console.log("Platform:", Platform.OS);
      console.log("Is Physical Device:", Device.isDevice);

      const checkResponse = await fetch(CHECK_LICENSE_API, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const checkData = await checkResponse.json();

      if (!checkResponse.ok || !checkData.success) {
        Toast.show({
          type: "error",
          text1: "Validation Failed",
          text2: checkData.message || "Failed to validate license.",
        });
        setLoading(false);
        return;
      }

      if (!checkData.customers || checkData.customers.length === 0) {
        Toast.show({
          type: "error",
          text1: "Invalid License",
          text2: "No customer found for this license",
        });
        setLoading(false);
        return;
      }

      const customer = checkData.customers.find(
        (c: any) => c.license_key === licenseKey.trim()
      );

      if (!customer) {
        Toast.show({
          type: "error",
          text1: "Invalid License",
          text2: "The license key you entered is not valid",
        });
        setLoading(false);
        return;
      }

      console.log("✅ License key valid for customer:", customer.customer_name);
      console.log("Client ID:", customer.client_id);

      const isAlreadyRegistered = customer.registered_devices?.some(
        (device: any) => device.device_id === deviceId
      );

      if (isAlreadyRegistered) {
        console.log("✅ Device already registered");
        
        const storeSuccess = await storeLicenseDataSafely({
          licenseKey: licenseKey.trim(),
          deviceId: deviceId,
          customerName: customer.customer_name,
          projectName: checkData.project_name,
          clientId: customer.client_id,
        });

        if (!storeSuccess) {
          Toast.show({
            type: "error",
            text1: "Storage Error",
            text2: "Failed to save license data. Please try again.",
          });
          setLoading(false);
          return;
        }

        Toast.show({
          type: "success",
          text1: "Already Registered",
          text2: `Welcome back ${customer.customer_name}!`,
        });

        setTimeout(() => {
          router.replace("/(auth)/pairing");
        }, 500);
        setLoading(false);
        return;
      }

      if (
        customer.license_summary.registered_count >=
        customer.license_summary.max_devices
      ) {
        Toast.show({
          type: "error",
          text1: "License Limit Reached",
          text2: `Maximum devices (${customer.license_summary.max_devices}) already registered`,
        });
        setLoading(false);
        return;
      }

      console.log("📝 Registering new device...");
      const registrationPayload = {
        license_key: licenseKey.trim(),
        device_id: deviceId,
        device_name: deviceName,
        client_id: customer.client_id
      };
      console.log(JSON.stringify(registrationPayload, null, 2));

      const POST_DEVICE_API = `https://activate.imcbs.com/mobileapp/api/project/taskmst/license/register/`;

      const deviceResponse = await fetch(POST_DEVICE_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(registrationPayload),
      });

      const deviceData = await deviceResponse.json();
      console.log("Registration response:", deviceData);

      if (deviceResponse.ok && deviceData.success) {
        console.log("✅ Device registered successfully");
        
        const storeSuccess = await storeLicenseDataSafely({
          licenseKey: licenseKey.trim(),
          deviceId: deviceId,
          customerName: customer.customer_name,
          projectName: checkData.project_name,
          clientId: customer.client_id,
        });

        if (!storeSuccess) {
          Toast.show({
            type: "error",
            text1: "Storage Error",
            text2: "Registration succeeded but failed to save. Please activate again.",
          });
          setLoading(false);
          return;
        }

        Toast.show({
          type: "success",
          text1: "Success! 🎉",
          text2: `Welcome ${customer.customer_name}!`,
        });

        setTimeout(() => {
          router.replace("/(auth)/pairing");
        }, 500);
      } else {
        Toast.show({
          type: "error",
          text1: "Registration Failed",
          text2: deviceData.message || "Failed to register device.",
        });
      }
    } catch (error: any) {
      console.error("Activation error:", error);
      Toast.show({
        type: "error",
        text1: "Connection Error",
        text2: "Network error. Please check your connection.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLink = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch (error) {
      Alert.alert("Error", "Failed to open link");
    }
  };

  const handleEmail = async () => {
    try {
      await Linking.openURL("mailto:info@imcbs.com");
    } catch (error) {
      Alert.alert("Error", "Failed to open email");
    }
  };

  if (checking) {
    return (
      <View style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: '#7E57C2'
      }}>
        <ActivityIndicator size="large" color="white" />
        <Text style={{ color: "white", marginTop: 16, fontSize: 16 }}>
          Checking registration...
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <StatusBar backgroundColor="#7E57C2" barStyle="light-content" />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={{ 
              backgroundColor: '#7E57C2',
              paddingTop: Platform.OS === 'ios' ? 60 : 40,
              paddingBottom: 60,
              alignItems: 'center',
            }}>
              <Image
                source={require("../../assets/images/icon.png")}
                style={{ width: 60, height: 60, marginBottom: 8 }}
              />
              <Text style={{ color: 'white', fontSize: 34, fontWeight: 'bold' }}>
                TaskMST
              </Text>
            </View>

            <View style={{ 
              flex: 1, 
              marginTop: 10,
              paddingHorizontal: 20,
            }}>
              <View style={{
                backgroundColor: '#dbc9fbff',
                borderRadius: 20,
                padding: 24,
                shadowColor: '#db40c1ff',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 4,
              }}>
                <Text style={{
                  fontSize: 22,
                  fontWeight: 'bold',
                  color: '#3B82F6',
                  textAlign: 'center',
                  marginBottom: 20,
                }}>
                  License Activation
                </Text>

                <View style={{ alignItems: 'center', marginBottom: 24 }}>
                  <Ionicons name="key" size={40} color="#7E57C2" />
                  <Text style={{ 
                    color: '#6B7280', 
                    fontSize: 14,
                    marginTop: 8,
                    textAlign: 'center'
                  }}>
                    Enter your license key to activate
                  </Text>
                </View>

                <View style={{ marginBottom: 20 }}>
                  <Text style={{ 
                    fontSize: 14, 
                    fontWeight: '600', 
                    color: '#374151', 
                    marginBottom: 8,
                  }}>
                    License Key
                  </Text>
                  <View style={{
                    borderWidth: 2,
                    borderColor: licenseError ? '#EF4444' : '#E5E7EB',
                    borderRadius: 12,
                    backgroundColor: '#F9FAFB',
                  }}>
                    <TextInput
                      value={licenseKey}
                      onChangeText={(text) => {
                        setLicenseKey(text);
                        setLicenseError(false);
                      }}
                      placeholder="Enter license key"
                      placeholderTextColor="#9CA3AF"
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!loading}
                      style={{
                        paddingHorizontal: 14,
                        paddingVertical: 12,
                        fontSize: 15,
                        color: '#1F2937',
                      }}
                    />
                  </View>
                  {licenseError && (
                    <Text style={{ color: '#EF4444', fontSize: 12, marginTop: 4 }}>
                      Please enter a valid license key
                    </Text>
                  )}
                </View>

                <Pressable
                  onPress={handleActivate}
                  disabled={loading}
                  style={{
                    backgroundColor: loading ? '#9575CD' : '#7E57C2',
                    borderRadius: 12,
                    paddingVertical: 14,
                    shadowColor: '#7E57C2',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.2,
                    shadowRadius: 4,
                    elevation: 3,
                  }}
                >
                  {loading ? (
                    <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
                      <ActivityIndicator color="white" size="small" />
                      <Text style={{ color: 'white', fontWeight: '600', fontSize: 16, marginLeft: 8 }}>
                        Validating...
                      </Text>
                    </View>
                  ) : (
                    <Text style={{ textAlign: 'center', color: 'white', fontWeight: '600', fontSize: 16 }}>
                      🔐 Activate License
                    </Text>
                  )}
                </Pressable>

                <View style={{
                  marginTop: 16,
                  padding: 12,
                  backgroundColor: '#F5F3FF',
                  borderRadius: 10,
                  borderLeftWidth: 3,
                  borderLeftColor: '#7E57C2',
                }}>
                  <Text style={{ fontSize: 11, color: '#6B7280', lineHeight: 16 }}>
                    • One-time activation per device{"\n"}
                    • License stored securely on device{"\n"}
                    • Auto-login on future app launches{"\n"}
                    • Device ID persists across app updates
                  </Text>
                </View>
              </View>

              <View style={{
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                marginTop: 56,
                marginBottom: 20,
              }}>
                <TouchableOpacity
                  onPress={handleEmail}
                  style={{
                    backgroundColor: '#7E57C2',
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginHorizontal: 6,
                  }}
                >
                  <Ionicons name="mail" size={18} color="white" />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleSocialLink("https://imcbs.com/")}
                  style={{
                    backgroundColor: '#10B981',
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginHorizontal: 6,
                  }}
                >
                  <Ionicons name="globe" size={18} color="white" />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleSocialLink("https://www.instagram.com/imcbusinesssolution/")}
                  style={{
                    backgroundColor: '#E4405F',
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginHorizontal: 6,
                  }}
                >
                  <Ionicons name="logo-instagram" size={18} color="white" />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleSocialLink("https://www.facebook.com/people/IMC-Business-Solution/100069040622427/")}
                  style={{
                    backgroundColor: '#1877F2',
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginHorizontal: 6,
                  }}
                >
                  <Ionicons name="logo-facebook" size={18} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </View>
  );
}