// app/(auth)/license.tsx
// TaskMST License Activation - Flow mirrors TaskPMS exactly

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

// ─── API endpoints for TaskMST ───────────────────────────────────────────────
const CHECK_LICENSE_API =
  "https://activate.imcbs.com/mobileapp/api/project/taskmst/";
const REGISTER_DEVICE_API =
  "https://activate.imcbs.com/mobileapp/api/project/taskmst/license/register/";

export default function License() {
  const [licenseKey, setLicenseKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [deviceId, setDeviceId] = useState("");
  const [deviceName, setDeviceName] = useState("");
  const [licenseError, setLicenseError] = useState(false);
  const [permissionError, setPermissionError] = useState(false);

  const router = useRouter();

  // ─── 1. Permission ──────────────────────────────────────────────────────────
  const requestAndroidPermissions = async (): Promise<boolean> => {
    if (Platform.OS !== "android") return true;
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
        {
          title: "Device ID Permission",
          message:
            "This app needs access to your device ID for license activation.",
          buttonNeutral: "Ask Me Later",
          buttonNegative: "Cancel",
          buttonPositive: "OK",
        }
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log("✅ Phone state permission granted");
        setPermissionError(false);
        return true;
      } else {
        console.log("❌ Phone state permission denied");
        setPermissionError(true);
        return false;
      }
    } catch (err) {
      console.warn("Permission request error:", err);
      setPermissionError(true);
      return false;
    }
  };

  // ─── 2. UUID helpers ─────────────────────────────────────────────────────────
  const generateUUID = () =>
    "xxxxxxxxxxxxxxxx".replace(/[x]/g, () =>
      (Math.random() * 16 | 0).toString(16)
    );

  const generateUUIDv4 = () =>
    "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      return (c === "x" ? r : (r & 0x3 | 0x8)).toString(16);
    });

  // ─── 3. Device ID ───────────────────────────────────────────────────────────
  // Priority: androidId (sync) → getAndroidId() (async) → stored → generated UUID
  const getDeviceId = async (): Promise<string> => {
    try {
      if (Platform.OS === "android") {
        const hasPermission = await requestAndroidPermissions();

        if (!hasPermission) {
          const stored = await AsyncStorage.getItem("device_hardware_id");
          if (stored) {
            console.log("✅ Using stored device ID (no permission):", stored);
            return stored;
          }
          const uuid = generateUUID();
          await AsyncStorage.setItem("device_hardware_id", uuid);
          console.log("✅ Generated UUID (no permission):", uuid);
          return uuid;
        }

        // Method 1: sync androidId
        let id: string | null = Application.androidId ?? null;
        console.log("Method 1 - Application.androidId:", id);
        if (id && id !== "null" && id !== "" && id !== "unknown") {
          console.log("✅ Using Application.androidId:", id);
          await AsyncStorage.setItem("device_hardware_id", id);
          return id;
        }

        // Method 2: async getAndroidId
        if (typeof (Application as any).getAndroidId === "function") {
          try {
            id = await (Application as any).getAndroidId();
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

        // Method 3: stored
        const stored = await AsyncStorage.getItem("device_hardware_id");
        if (stored) {
          console.log("✅ Using stored device ID:", stored);
          return stored;
        }

        // Method 4: generate persistent UUID
        const uuid = generateUUID();
        await AsyncStorage.setItem("device_hardware_id", uuid);
        console.log("✅ Generated and stored UUID:", uuid);
        return uuid;
      } else if (Platform.OS === "ios") {
        let id: string | null = null;
        try {
          id = await Application.getIosIdForVendorAsync();
        } catch (_) {}
        if (id && id !== "null" && id !== "") {
          await AsyncStorage.setItem("device_hardware_id", id);
          return id;
        }
        const stored = await AsyncStorage.getItem("device_hardware_id");
        if (stored) return stored;
        const uuid = generateUUIDv4();
        await AsyncStorage.setItem("device_hardware_id", uuid);
        return uuid;
      } else {
        throw new Error("Unsupported platform: " + Platform.OS);
      }
    } catch (error) {
      console.error("❌ ERROR getting device ID:", error);
      try {
        const stored = await AsyncStorage.getItem("device_hardware_id");
        if (stored) return stored;
      } catch (_) {}
      const fallback = generateUUID();
      try {
        await AsyncStorage.setItem("device_hardware_id", fallback);
      } catch (_) {}
      return fallback;
    }
  };

  // ─── 4. Device name ──────────────────────────────────────────────────────────
  const getDeviceName = async (): Promise<string> => {
    try {
      if (Platform.OS === "android") {
        return (
          `${Device.brand || ""} ${Device.modelName || ""}`.trim() ||
          "Android Device"
        );
      } else if (Platform.OS === "ios") {
        return Device.modelName || "iOS Device";
      }
      return "Unknown Device";
    } catch {
      return "Unknown Device";
    }
  };

  // ─── 5. Demo license validator ──────────────────────────────────────────────
  const validateDemoLicense = async (demoKey: string) => {
    try {
      console.log("🎭 Validating demo license:", demoKey);

     const response = await fetch(`${CHECK_LICENSE_API}?_=${Date.now()}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
      },
      cache: "no-store",
    });
      const data = await response.json();

      if (!response.ok || !data.success)
        return { valid: false, message: "Failed to validate demo license" };

      if (!data.demo_licenses || data.demo_licenses.length === 0)
        return { valid: false, message: "No demo licenses available" };

      const demoLicense = data.demo_licenses.find(
        (d: any) => d.demo_license === demoKey.trim()
      );

      if (!demoLicense)
        return { valid: false, message: "Invalid demo license key" };

      if (demoLicense.status.toLowerCase() !== "active")
        return {
          valid: false,
          message: `Demo license is ${demoLicense.status}`,
        };

      const expiryDate = new Date(demoLicense.expires_at);
      const today = new Date();
      if (expiryDate < today)
        return { valid: false, message: "Demo license has expired" };

      const daysRemaining = Math.ceil(
        (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      console.log("✅ Demo license valid:", demoLicense.company);
      return {
        valid: true,
        company: demoLicense.company,
        clientId: demoLicense.client_id,
        demoLicense: demoLicense.demo_license,
        expiresAt: demoLicense.expires_at,
        daysRemaining,
      };
    } catch (error) {
      console.error("Demo validation error:", error);
      return { valid: false, message: "Network error during demo validation" };
    }
  };

  // ─── 6. Check if this device is registered on the server ───────────────────
  const checkDeviceRegistration = async (deviceIdToCheck: string) => {
    try {
      console.log("🔍 Checking device registration for:", deviceIdToCheck);

      const response = await fetch(CHECK_LICENSE_API, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();

      if (!response.ok || !data.success) return { found: false };
      if (!data.customers || data.customers.length === 0)
        return { found: false };

      for (const customer of data.customers) {
        if (customer.registered_devices?.length > 0) {
          const deviceFound = customer.registered_devices.some(
            (device: any) => device.device_id === deviceIdToCheck
          );
          if (deviceFound) {
            console.log("✅ Device found for customer:", customer.customer_name);
            return { found: true, customer, projectName: data.project_name };
          }
        }
      }
      console.log("❌ Device not found on server");
      return { found: false };
    } catch (error) {
      console.error("Error checking device registration:", error);
      return { found: false };
    }
  };

  // ─── 7. Save license data to AsyncStorage ───────────────────────────────────
  const storeLicenseData = async (data: {
    licenseKey: string;
    deviceId: string;
    customerName: string;
    projectName: string;
    clientId: string;
  }): Promise<boolean> => {
    try {
      console.log("💾 Storing license data for device:", data.deviceId);
      await AsyncStorage.multiSet([
        ["licenseActivated", "true"],
        ["licenseType", "PRODUCTION"],
        ["licenseKey", data.licenseKey],
        ["deviceId", data.deviceId],
        ["device_hardware_id", data.deviceId],
        ["customerName", data.customerName],
        ["projectName", data.projectName],
        ["clientId", data.clientId],
      ]);
      const check = await AsyncStorage.multiGet([
        "licenseActivated",
        "licenseKey",
        "deviceId",
        "clientId",
      ]);
      const allOk = check.every(([, v]) => v !== null);
      console.log(allOk ? "✅ License data stored" : "❌ Some keys missing");
      return allOk;
    } catch (error) {
      console.error("❌ Error storing license data:", error);
      return false;
    }
  };

  // ─── 8. App initialization  ─────────────────────────────────────────────────
  // This is the FIXED flow matching PMS exactly:
  //  A) Get device ID + name
  //  B) Read stored license state
  //  C) DEMO check → validate → redirect or clear
  //  D) PRODUCTION check → verify on server → redirect or clear
  //  E) No valid license → show activation form
  const initializeApp = async () => {
    try {
      setChecking(true);

      // A: Device info
      const id = await getDeviceId();
      setDeviceId(id);
      const name = await getDeviceName();
      setDeviceName(name);

      console.log("=== DEVICE INFO ===");
      console.log("Device ID:", id);
      console.log("Device Name:", name);
      console.log("Platform:", Platform.OS);
      console.log("Is Physical Device:", Device.isDevice);

      // B: Read stored state
      const licenseActivated = await AsyncStorage.getItem("licenseActivated");
      const licenseType = await AsyncStorage.getItem("licenseType");
      const storedLicenseKey = await AsyncStorage.getItem("licenseKey");
      const storedClientId = await AsyncStorage.getItem("clientId");
      const demoLicenseKey = await AsyncStorage.getItem("demoLicenseKey");

      console.log("📱 Local License Status:");
      console.log("  - License Activated:", licenseActivated);
      console.log("  - License Type:", licenseType);
      console.log("  - License Key:", storedLicenseKey ? "exists" : "none");
      console.log(
        "  - Demo License Key:",
        demoLicenseKey ? "exists" : "none"
      );
      console.log("  - Client ID:", storedClientId ? "exists" : "none");

      // C: DEMO license check
      if (
        licenseActivated === "true" &&
        licenseType === "DEMO" &&
        demoLicenseKey &&
        storedClientId
      ) {
        console.log("🎭 Demo license found locally, validating...");
        const demoValidation = await validateDemoLicense(demoLicenseKey);

        if (demoValidation.valid) {
          console.log("✅ Demo license still valid");
          console.log("   Company:", demoValidation.company);
          console.log("   Days remaining:", demoValidation.daysRemaining);

          await AsyncStorage.setItem(
            "demoDaysRemaining",
            String(demoValidation.daysRemaining)
          );

          Toast.show({
            type: "success",
            text1: "Welcome Back! 🎭",
            text2: `${demoValidation.company} - Demo Mode`,
            visibilityTime: 2000,
          });
          setTimeout(() => router.replace("/(auth)/pairing"), 500);
          return;
        } else {
          console.log(
            "❌ Demo license expired or invalid:",
            demoValidation.message
          );
          await AsyncStorage.multiRemove([
            "licenseActivated",
            "licenseType",
            "demoLicenseKey",
            "demoCompany",
            "clientId",
            "customerName",
            "demoExpiresAt",
            "demoDaysRemaining",
            "demoStatus",
          ]);
          Toast.show({
            type: "error",
            text1: "Demo License Expired",
            text2: demoValidation.message || "Please activate a new license",
          });
        }
      }

      // D: PRODUCTION license check
      if (licenseActivated === "true" && storedLicenseKey && storedClientId) {
        console.log("✅ Production license found, verifying with server...");
        const registrationCheck = await checkDeviceRegistration(id);

        if (registrationCheck.found) {
          console.log("✅ Server confirms device is registered");
          console.log(
            "   Customer:",
            registrationCheck.customer.customer_name
          );

          const storeSuccess = await storeLicenseData({
            licenseKey:
              registrationCheck.customer.license_key || storedLicenseKey,
            deviceId: id,
            customerName: registrationCheck.customer.customer_name,
            projectName: registrationCheck.projectName || "",
            clientId:
              registrationCheck.customer.client_id || storedClientId,
          });

          if (!storeSuccess) {
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
            text2: registrationCheck.customer.customer_name,
            visibilityTime: 2000,
          });
          setTimeout(() => router.replace("/(auth)/pairing"), 500);
          return;
        } else {
          console.log(
            "⚠️ Device not found on server — clearing stale license"
          );
          Toast.show({
            type: "info",
            text1: "License Reset",
            text2: "Please activate your license again",
          });
          await AsyncStorage.multiRemove([
            "licenseActivated",
            "licenseKey",
            "deviceId",
            "clientId",
            "customerName",
            "projectName",
            "licenseType",
          ]);
        }
      }

      // E: No valid license
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

  // ─── 9. Retry permission ─────────────────────────────────────────────────────
  const handleRetryPermission = async () => {
    setPermissionError(false);
    const hasPermission = await requestAndroidPermissions();
    const id = await getDeviceId();
    setDeviceId(id);
    if (hasPermission) {
      Toast.show({
        type: "success",
        text1: "Permission Granted",
        text2: "You can now activate your license",
      });
    } else {
      Toast.show({
        type: "info",
        text1: "Permission Denied",
        text2: "A unique device ID will be generated instead",
      });
    }
  };

  // ─── 10. Activate button handler ────────────────────────────────────────────
  const handleActivate = async () => {
    if (!licenseKey.trim()) {
      setLicenseError(true);
      return;
    }

    setLoading(true);
    setLicenseError(false);

    try {
      const isDemoLicense = licenseKey.trim().toUpperCase().startsWith("DEMO-");

      // ── DEMO flow ────────────────────────────────────────────────────────────
      if (isDemoLicense) {
        console.log("🎭 Demo license detected");

        const demoValidation = await validateDemoLicense(licenseKey.trim());

        if (!demoValidation.valid) {
          Toast.show({
            type: "error",
            text1: "Demo License Invalid",
            text2: demoValidation.message,
          });
          return;
        }

        await AsyncStorage.multiSet([
          ["licenseActivated", "true"],
          ["licenseType", "DEMO"],
          ["license_type", "DEMO"],
          ["demoLicenseKey", licenseKey.trim()],
          ["demoCompany", demoValidation.company],
          ["clientId", demoValidation.clientId],
          ["customerName", demoValidation.company],
          ["demoExpiresAt", demoValidation.expiresAt],
          ["demoDaysRemaining", String(demoValidation.daysRemaining)],
          ["demoStatus", "Active"],
        ]);

        console.log("✅ Demo license stored");
        Toast.show({
          type: "success",
          text1: "Demo Activated! 🎉",
          text2: `Welcome ${demoValidation.company}! ${demoValidation.daysRemaining} days remaining`,
          visibilityTime: 3000,
        });
        setTimeout(() => router.replace("/(auth)/pairing"), 500);
        return;
      }

      // ── PRODUCTION flow ──────────────────────────────────────────────────────
      if (!deviceId) {
        Alert.alert(
          "Device ID Error",
          "Device ID not available. Please restart the app.",
          [
            {
              text: "Retry",
              onPress: async () => {
                const id = await getDeviceId();
                setDeviceId(id);
              },
            },
            { text: "OK" },
          ]
        );
        return;
      }

      console.log("=== LICENSE ACTIVATION START ===");
      console.log("License Key:", licenseKey.trim());
      console.log("Device ID:", deviceId);
      console.log("Device Name:", deviceName);

      const checkResponse = await fetch(CHECK_LICENSE_API, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      const checkData = await checkResponse.json();

      if (!checkResponse.ok || !checkData.success) {
        Toast.show({
          type: "error",
          text1: "Validation Failed",
          text2: checkData.message || "Failed to validate license.",
        });
        return;
      }

      if (!checkData.customers || checkData.customers.length === 0) {
        Toast.show({
          type: "error",
          text1: "Invalid License",
          text2: "No customer found for this license",
        });
        return;
      }

      const customer = checkData.customers.find(
          (c: any) =>
            c.license_key?.trim().toUpperCase() === licenseKey.trim().toUpperCase()
        );


      if (!customer) {
        Toast.show({
          type: "error",
          text1: "Invalid License",
          text2: "The license key you entered is not valid",
        });
        return;
      }

      console.log("✅ License valid for:", customer.customer_name);

      // Already registered on this device?
      const isAlreadyRegistered = customer.registered_devices?.some(
        (device: any) => device.device_id === deviceId
      );

      if (isAlreadyRegistered) {
        console.log("✅ Device already registered");
        const storeSuccess = await storeLicenseData({
          licenseKey: licenseKey.trim(),
          deviceId,
          customerName: customer.customer_name,
          projectName: checkData.project_name || "",
          clientId: customer.client_id,
        });

        if (!storeSuccess) {
          Toast.show({
            type: "error",
            text1: "Storage Error",
            text2: "Failed to save license data. Please try again.",
          });
          return;
        }

        Toast.show({
          type: "success",
          text1: "Already Registered",
          text2: `Welcome back ${customer.customer_name}!`,
        });
        setTimeout(() => router.replace("/(auth)/pairing"), 500);
        return;
      }

      // Check device limit
      if (
        customer.license_summary?.registered_count >=
        customer.license_summary?.max_devices
      ) {
        Toast.show({
          type: "error",
          text1: "License Limit Reached",
          text2: `Maximum devices (${customer.license_summary.max_devices}) already registered`,
        });
        return;
      }

      // Register new device
      console.log("📝 Registering new device...");
      const deviceResponse = await fetch(REGISTER_DEVICE_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          license_key: licenseKey.trim(),
          device_id: deviceId,
          device_name: deviceName,
          client_id: customer.client_id,
        }),
      });
      const deviceData = await deviceResponse.json();
      console.log("Registration response:", deviceData);

      if (deviceResponse.ok && deviceData.success) {
        console.log("✅ Device registered successfully");

        const storeSuccess = await storeLicenseData({
          licenseKey: licenseKey.trim(),
          deviceId,
          customerName: customer.customer_name,
          projectName: checkData.project_name || "",
          clientId: customer.client_id,
        });

        if (!storeSuccess) {
          Toast.show({
            type: "error",
            text1: "Storage Error",
            text2:
              "Registration succeeded but failed to save. Please activate again.",
          });
          return;
        }

        Toast.show({
          type: "success",
          text1: "Success! 🎉",
          text2: `Welcome ${customer.customer_name}!`,
        });
        setTimeout(() => router.replace("/(auth)/pairing"), 500);
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

  // ─── Social / email helpers ──────────────────────────────────────────────────
  const handleSocialLink = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert("Error", "Failed to open link");
    }
  };

  const handleEmail = async () => {
    try {
      await Linking.openURL("mailto:info@imcbs.com");
    } catch {
      Alert.alert("Error", "Failed to open email");
    }
  };

  // ─── Render: checking ────────────────────────────────────────────────────────
  if (checking) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#7E57C2",
        }}
      >
        <ActivityIndicator size="large" color="white" />
        <Text style={{ color: "white", marginTop: 16, fontSize: 16 }}>
          Checking registration...
        </Text>
      </View>
    );
  }

  // ─── Render: permission error ────────────────────────────────────────────────
  if (permissionError && Platform.OS === "android") {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "white",
          paddingHorizontal: 24,
        }}
      >
        <View
          style={{
            backgroundColor: "#FEF2F2",
            padding: 24,
            borderRadius: 16,
            alignItems: "center",
          }}
        >
          <Ionicons name="warning" size={64} color="#EF4444" />
          <Text
            style={{
              fontSize: 20,
              fontWeight: "bold",
              color: "#1F2937",
              marginTop: 16,
              textAlign: "center",
            }}
          >
            Device ID Permission Required
          </Text>
          <Text
            style={{
              color: "#6B7280",
              marginTop: 12,
              textAlign: "center",
              lineHeight: 22,
            }}
          >
            This permission is needed to generate a stable device ID for your
            license.
          </Text>
          <Pressable
            onPress={handleRetryPermission}
            style={{
              backgroundColor: "#7E57C2",
              borderRadius: 10,
              paddingVertical: 12,
              paddingHorizontal: 32,
              marginTop: 24,
            }}
          >
            <Text style={{ color: "white", fontWeight: "bold", fontSize: 16 }}>
              Retry
            </Text>
          </Pressable>
          <TouchableOpacity
            onPress={() => {
              setPermissionError(false);
              initializeApp();
            }}
            style={{ marginTop: 16 }}
          >
            <Text style={{ color: "#6B7280", textDecorationLine: "underline" }}>
              Continue without permission
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ─── Render: main license screen ─────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
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
            {/* Purple header */}
            <View
              style={{
                backgroundColor: "#7E57C2",
                paddingTop: Platform.OS === "ios" ? 60 : 40,
                paddingBottom: 60,
                alignItems: "center",
              }}
            >
              <Image
                source={require("../../assets/images/icon.png")}
                style={{ width: 60, height: 60, marginBottom: 8 }}
              />
              <Text
                style={{ color: "white", fontSize: 34, fontWeight: "bold" }}
              >
                TaskMST
              </Text>
            </View>

            <View style={{ flex: 1, marginTop: 10, paddingHorizontal: 20 }}>
              {/* Card */}
              <View
                style={{
                  backgroundColor: "#dbc9fbff",
                  borderRadius: 20,
                  padding: 24,
                  shadowColor: "#7E57C2",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 8,
                  elevation: 4,
                }}
              >
                <Text
                  style={{
                    fontSize: 22,
                    fontWeight: "bold",
                    color: "#3B82F6",
                    textAlign: "center",
                    marginBottom: 20,
                  }}
                >
                  License Activation
                </Text>

                <View style={{ alignItems: "center", marginBottom: 24 }}>
                  <Ionicons name="key" size={40} color="#7E57C2" />
                  <Text
                    style={{
                      color: "#6B7280",
                      fontSize: 14,
                      marginTop: 8,
                      textAlign: "center",
                    }}
                  >
                    Enter your license key to activate
                  </Text>
                </View>

                {/* License key input */}
                <View style={{ marginBottom: 20 }}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: "#374151",
                      marginBottom: 8,
                    }}
                  >
                    License Key
                  </Text>
                  <View
                    style={{
                      borderWidth: 2,
                      borderColor: licenseError ? "#EF4444" : "#E5E7EB",
                      borderRadius: 12,
                      backgroundColor: "#F9FAFB",
                    }}
                  >
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
                        color: "#1F2937",
                      }}
                    />
                  </View>
                  {licenseError && (
                    <Text
                      style={{ color: "#EF4444", fontSize: 12, marginTop: 4 }}
                    >
                      Please enter a valid license key
                    </Text>
                  )}
                </View>

                {/* Activate button */}
                <Pressable
                  onPress={handleActivate}
                  disabled={loading}
                  style={{
                    backgroundColor: loading ? "#9575CD" : "#7E57C2",
                    borderRadius: 12,
                    paddingVertical: 14,
                    shadowColor: "#7E57C2",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.2,
                    shadowRadius: 4,
                    elevation: 3,
                  }}
                >
                  {loading ? (
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <ActivityIndicator color="white" size="small" />
                      <Text
                        style={{
                          color: "white",
                          fontWeight: "600",
                          fontSize: 16,
                          marginLeft: 8,
                        }}
                      >
                        Validating...
                      </Text>
                    </View>
                  ) : (
                    <Text
                      style={{
                        textAlign: "center",
                        color: "white",
                        fontWeight: "600",
                        fontSize: 16,
                      }}
                    >
                      🔐 Activate License
                    </Text>
                  )}
                </Pressable>

                {/* Info box */}
                <View
                  style={{
                    marginTop: 16,
                    padding: 12,
                    backgroundColor: "#F5F3FF",
                    borderRadius: 10,
                    borderLeftWidth: 3,
                    borderLeftColor: "#7E57C2",
                  }}
                >
                  <Text
                    style={{ fontSize: 11, color: "#6B7280", lineHeight: 16 }}
                  >
                    • One-time activation per device{"\n"}• License stored
                    securely on device{"\n"}• Auto-login on future app
                    launches{"\n"}• Device ID persists across app updates
                  </Text>
                </View>
              </View>

              {/* Social links */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "center",
                  alignItems: "center",
                  marginTop: 56,
                  marginBottom: 20,
                }}
              >
                <TouchableOpacity
                  onPress={handleEmail}
                  style={{
                    backgroundColor: "#7E57C2",
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    justifyContent: "center",
                    alignItems: "center",
                    marginHorizontal: 6,
                  }}
                >
                  <Ionicons name="mail" size={18} color="white" />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleSocialLink("https://imcbs.com/")}
                  style={{
                    backgroundColor: "#10B981",
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    justifyContent: "center",
                    alignItems: "center",
                    marginHorizontal: 6,
                  }}
                >
                  <Ionicons name="globe" size={18} color="white" />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() =>
                    handleSocialLink(
                      "https://www.instagram.com/imcbusinesssolution/"
                    )
                  }
                  style={{
                    backgroundColor: "#E4405F",
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    justifyContent: "center",
                    alignItems: "center",
                    marginHorizontal: 6,
                  }}
                >
                  <Ionicons name="logo-instagram" size={18} color="white" />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() =>
                    handleSocialLink(
                      "https://www.facebook.com/people/IMC-Business-Solution/100069040622427/"
                    )
                  }
                  style={{
                    backgroundColor: "#1877F2",
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    justifyContent: "center",
                    alignItems: "center",
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