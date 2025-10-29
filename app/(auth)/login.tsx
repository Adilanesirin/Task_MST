import { createDebugAPI, createEnhancedAPI } from "@/utils/api";
import { saveToken, saveUserid } from "@/utils/auth";
import { analyzeServerError, debugLoginPayloads } from "@/utils/debug";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
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

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [usernameError, setUsernameError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [debugMode, setDebugMode] = useState(false);

  const router = useRouter();

  // Double-tap logo to enable debug mode
  const handleLogoPress = () => {
    setDebugMode(prev => !prev);
    Toast.show({
      type: 'info',
      text1: debugMode ? 'Debug mode disabled' : 'Debug mode enabled',
      text2: debugMode ? 'Normal login' : 'Testing all payload formats',
    });
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

    if (debugMode) {
      await runDebugLogin();
    } else {
      await runNormalLogin();
    }
  };

  const runNormalLogin = async () => {
    try {
      console.log("📄 Creating API instance for login...");
      const api = await createEnhancedAPI();
      
      // Try the most common patterns first
      const commonPayloads = [
        { userid: username, password }, // Most likely
        { username, password }, // Original
        { email: username, password }, // Email based
        { login: username, password }, // Generic login
      ];

      let success = false;
      
      for (const [index, payload] of commonPayloads.entries()) {
        try {
          console.log(`🧪 Attempt ${index + 1}:`, JSON.stringify(payload));
          const res = await api.post("/login", payload);
          
          console.log("✅ Success with payload:", JSON.stringify(payload));
          console.log("🔥 Response:", res.data);

          if (res.data.status === "success") {
            await handleLoginSuccess(res.data);
            success = true;
            break;
          }
        } catch (err: any) {
          console.log(`❌ Failed with payload ${index + 1}:`, {
            status: err.response?.status,
            data: err.response?.data
          });
          continue;
        }
      }
      
      if (!success) {
        Toast.show({
          type: "error",
          text1: "Login failed",
          text2: "Please check username/password format OR check Database connection",
          
        });
      }
      
    } catch (err: any) {
      console.error("💥 Login error:", err);
      analyzeServerError(err);
      
      Toast.show({
        type: "error",
        text1: "Connection Error",
        text2: "Cannot connect to server. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const runDebugLogin = async () => {
    try {
      const api = await createDebugAPI();
      const payloads = debugLoginPayloads(username, password);
      
      console.log("🔍 DEBUG MODE: Testing all payload formats");
      
      const results = [];
      
      for (const [index, payload] of payloads.entries()) {
        try {
          console.log(`\n--- Testing Payload ${index + 1} ---`);
          console.log("Payload:", JSON.stringify(payload, null, 2));
          
          const res = await api.post("/login", payload);
          results.push({
            payloadIndex: index + 1,
            payload,
            success: true,
            response: res.data,
            status: res.status
          });
          
          console.log("✅ SUCCESS:", res.status, res.data);
          
          if (res.data.status === "success") {
            await handleLoginSuccess(res.data);
            break;
          }
          
        } catch (err: any) {
          results.push({
            payloadIndex: index + 1,
            payload,
            success: false,
            error: err.response?.data,
            status: err.response?.status
          });
          
          console.log("❌ FAILED:", err.response?.status, err.response?.data);
        }
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Log all results
      console.log("\n📊 DEBUG RESULTS SUMMARY:");
      results.forEach(result => {
        console.log(`Payload ${result.payloadIndex}: ${result.success ? '✅' : '❌'} ${result.status}`);
        if (!result.success) {
          console.log('  Error:', JSON.stringify(result.error, null, 2));
        }
      });
      
      if (!results.some(r => r.success && r.response?.status === "success")) {
        Toast.show({
          type: "error",
          text1: "Debug Complete",
          text2: "Check console for results. No successful login format found.",
        });
      }
      
    } catch (err: any) {
      console.error("💥 Debug mode error:", err);
      analyzeServerError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = async (data: any) => {
    await saveToken(data.token);
    await saveUserid(data.user_id);
    
    Toast.show({
      type: "success",
      text1: "Success",
      text2: "Welcome, Login successful",
    });
    
    setTimeout(() => {
      router.replace("/(main)");
    }, 300);
  };

  // Social media link handlers
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
    Linking.openURL('https://www.facebook.com/people/IMC-Business-Solution/100069040622427/'); // Add your Facebook URL here
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
          {/* Purple Header Wave Design with Gradient */}
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
            {/* Login Card with Modern Shadow */}
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
                disabled={loading}
                style={{
                  backgroundColor: loading ? '#9575CD' : '#7E57C2',
                  borderRadius: 16,
                  paddingVertical: 16,
                  shadowColor: '#7E57C2',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 4,
                }}
              >
                <View className="flex-row justify-center items-center">
                  {loading && (
                    <View className="mr-2">
                      <Ionicons name="sync" size={20} color="white" />
                    </View>
                  )}
                  <Text className="text-white font-bold text-lg">
                    {loading ? "Logging in..." : "Login"}
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

            {/* Additional Info Card */}
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
                  Secure Login • privacy protected
                </Text>
              </View>
            </View>

            {/* Social Media Footer */}
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
              {/* Social Media Icons */}
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

              {/* Copyright Text */}
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