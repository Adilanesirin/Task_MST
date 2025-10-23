import { deleteUserid, getUserid, logout } from "@/utils/auth";
import { clearPairing } from "@/utils/pairing";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Platform, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Toast from "react-native-toast-message";

export default function HomeScreen() {
  const router = useRouter();
  const [username, setUsername] = useState(null);

  useEffect(() => {
    const fetchUsername = async () => {
      const user = await getUserid();
      setUsername(user);
    };

    fetchUsername();
  }, []);

  const handleLogout = async () => {
    Alert.alert(
      "Confirm Logout",
      "Do you want to Logout?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            await logout();
            await clearPairing();
            await deleteUserid();
            router.replace("/(auth)/pairing");
            Toast.show({
              type: "success",
              text1: "Logged out successfully",
              visibilityTime: 3000,
            });
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#7E57C2" barStyle="light-content" />
      
      {/* Elegant Curved Header */}
      <View style={styles.header}>
        {/* Sophisticated Background Design */}
        <View style={styles.headerDesign}>
          <View style={styles.floatingOrb1}></View>
          <View style={styles.floatingOrb2}></View>
          <View style={styles.elegantWave}></View>
        </View>
        
        <View style={styles.headerCurve}></View>
        
        {/* Header Content */}
        <View style={styles.headerContent}>
          <View style={styles.brandSection}>
            <View style={styles.logoContainer}>
              <LinearGradient
                colors={['#FFFFFF', '#E8E6FF']}
                style={styles.logoGradient}
              >
                <Ionicons name="cube" size={20} color="#7E57C2" />
              </LinearGradient>
            </View>
            <View style={styles.brandText}>
              <Text style={styles.appName}>task_mst</Text>
              <Text style={styles.appTagline}>Mobile Stock Management</Text>
            </View>
          </View>
          
          <TouchableOpacity
            onPress={handleLogout}
            style={styles.logoutButton}
          >
            <Ionicons name="exit-outline" size={20} color="white" />
          </TouchableOpacity>
        </View>

        {/* Curved User Welcome Card */}
        <View style={styles.curvedUserCard}>
          <View style={styles.userInfo}>
            <View style={styles.avatarContainer}>
              <LinearGradient
                colors={['#9C77D9', '#7E57C2']}
                style={styles.avatarGradient}
              >
                <Ionicons name="person" size={20} color="white" />
              </LinearGradient>
            </View>
            <View style={styles.welcomeText}>
              <Text style={styles.greetingText}>Welcome back</Text>
              <Text style={styles.usernameText}>{username || "User"}</Text>
            </View>
          </View>
          <View style={styles.statusIndicator}>
            <View style={styles.activeDot}></View>
            <Text style={styles.statusText}>Online</Text>
          </View>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* White Container with Curved Top */}
        <View style={styles.whiteContainer}>
          {/* Horizontal Flat Cards with Violet Theme */}
          <View style={styles.horizontalCardsContainer}>
            <TouchableOpacity
              style={styles.flatCard}
              onPress={() => router.push("/(main)/orders")}
            >
              <LinearGradient
                colors={['#9C77D9', '#7E57C2']}
                style={styles.flatCardGradient}
              >
                <View style={styles.flatCardContent}>
                  <View style={styles.flatCardIcon}>
                    <Ionicons name="document-text-outline" size={24} color="white" />
                  </View>
                  <View style={styles.flatCardText}>
                    <Text style={styles.flatCardTitle}>Orders</Text>
                    <Text style={styles.flatCardDescription}>Manage & process orders</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.8)" />
                </View>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.flatCard}
              onPress={() => router.push("/(main)/download")}
            >
              <LinearGradient
                colors={['#9C77D9', '#7E57C2']}
                style={styles.flatCardGradient}
              >
                <View style={styles.flatCardContent}>
                  <View style={styles.flatCardIcon}>
                    <Ionicons name="cloud-download-outline" size={24} color="white" />
                  </View>
                  <View style={styles.flatCardText}>
                    <Text style={styles.flatCardTitle}>Download</Text>
                    <Text style={styles.flatCardDescription}>Sync inventory data</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.8)" />
                </View>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.flatCard}
              onPress={() => router.push("/(main)/tracker")}
            >
              <LinearGradient
                colors={['#9C77D9', '#7E57C2']}
                style={styles.flatCardGradient}
              >
                <View style={styles.flatCardContent}>
                  <View style={styles.flatCardIcon}>
                    <Ionicons name="analytics-outline" size={24} color="white" />
                  </View>
                  <View style={styles.flatCardText}>
                    <Text style={styles.flatCardTitle}>Tracker</Text>
                    <Text style={styles.flatCardDescription}>Monitor progress</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.8)" />
                </View>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.flatCard}
              onPress={() => router.push("/(main)/settings")}
            >
              <LinearGradient
                colors={['#9C77D9', '#7E57C2']}
                style={styles.flatCardGradient}
              >
                <View style={styles.flatCardContent}>
                  <View style={styles.flatCardIcon}>
                    <Ionicons name="settings-outline" size={24} color="white" />
                  </View>
                  <View style={styles.flatCardText}>
                    <Text style={styles.flatCardTitle}>Settings</Text>
                    <Text style={styles.flatCardDescription}>App configuration</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.8)" />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Powered by IMC Business Solutions</Text>
          <Text style={styles.footerVersion}>v2.1.0</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAF9FF",
  },
  
  header: {
    backgroundColor: "#7E57C2",
    paddingTop: Platform.OS === 'android' ? 60 : 50,
    paddingBottom: 30,
    position: 'relative',
    overflow: 'hidden',
  },
  
  headerDesign: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  
  floatingOrb1: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.08)',
    top: 20,
    right: -20,
  },
  
  floatingOrb2: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.12)',
    top: 80,
    left: -15,
  },
  
  elegantWave: {
    position: 'absolute',
    width: 180,
    height: 80,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderTopLeftRadius: 90,
    borderTopRightRadius: 90,
    bottom: 10,
    right: -40,
    transform: [{ rotate: '12deg' }],
  },
  
  headerCurve: {
    position: 'absolute',
    bottom: -25,
    left: 0,
    right: 0,
    height: 50,
    backgroundColor: "#7E57C2",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
  },
  
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 25,
    zIndex: 1,
    marginBottom: 20,
  },
  
  brandSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  
  logoContainer: {
    marginRight: 12,
  },
  
  logoGradient: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  
  brandText: {
    flex: 1,
  },
  
  appName: {
    fontSize: 24,
    fontWeight: "700",
    color: "white",
    letterSpacing: -0.5,
  },
  
  appTagline: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "400",
    marginTop: 2,
  },
  
  logoutButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  
  curvedUserCard: {
    // backgroundColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(246, 59, 12, 0.1)",
    marginHorizontal: 25,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: 10,

  },
  
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  
  avatarContainer: {
    marginRight: 12,
  },
  
  avatarGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  
  welcomeText: {
    flex: 1,
  },
  
  greetingText: {
    fontSize: 13,
    fontWeight: "500",
    color: "rgba(255,255,255,0.9)",
    marginBottom: 2,
  },
  
  usernameText: {
    fontSize: 18,
    fontWeight: "600",
    color: "white",
  },
  
  statusIndicator: {
    flexDirection: "row",
    alignItems: "center",
  },
  
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4ADE80",
    marginRight: 6,
  },
  
  statusText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "500",
  },
  
  scrollView: {
    flex: 1,
    marginTop: -25,
  },
  
  scrollContent: {
    paddingBottom: 30,
  },
  
  whiteContainer: {
    backgroundColor: "white",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: 0,
    marginHorizontal: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 8,
    minHeight: 400,
  },
  
  horizontalCardsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 25,
    marginTop: 70,
  },
  
  flatCard: {
    borderRadius: 16,
    marginBottom: 15,
    shadowColor: "#7E57C2",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
    paddingTop: 0,
  },
  
  flatCardGradient: {
    borderRadius: 16,
  },
  
  flatCardContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
  },
  
  flatCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginRight: 16,
  },
  
  flatCardText: {
    flex: 1,
  },
  
  flatCardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
    marginBottom: 4,
  },
  
  flatCardDescription: {
    fontSize: 13,
    color: "rgba(255,255,255,0.9)",
  },
  
  footer: {
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 30,
    marginBottom: 20,
  },
  
  footerText: {
    fontSize: 12,
    color: "#9CA3AF",
    fontWeight: "400",
    marginBottom: 4,
  },
  
  footerVersion: {
    fontSize: 10,
    color: "#D1D5DB",
    fontWeight: "400",
  },
});