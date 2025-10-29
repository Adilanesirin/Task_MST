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
      
      {/* Complete Header Section with Gradient */}
      <LinearGradient
        colors={["#7E57C2", "#9C27B0", "#7E57C2"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          {/* Sophisticated Background Design */}
          <View style={styles.headerDesign}>
            <View style={styles.floatingOrb1}></View>
            <View style={styles.floatingOrb2}></View>
            <View style={styles.elegantWave}></View>
          </View>
          
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
                <Text style={styles.appName}>TaskMST</Text>
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
                  colors={['#330977ff', '#b420b6ff']}
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
          </View>
        </View>
      </LinearGradient>

      {/* White Container with Curved Top */}
      <View style={styles.whiteContainer}>
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Horizontal Flat Cards with Light Purple Theme */}
          <View style={styles.horizontalCardsContainer}>
          
            <TouchableOpacity
              style={styles.flatCard}
              onPress={() => router.push("/(main)/orders")}
            >
              <LinearGradient
                colors={['#f0c5f7ff', '#d9c4f8ff']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.flatCardGradient}
              >
                <View style={styles.flatCardContent}>
                  <View style={styles.flatCardIcon}>
                    <Ionicons name="document-text-outline" size={24} color="#ffffffff" />
                  </View>
                  <View style={styles.flatCardText}>
                    <Text style={styles.flatCardTitle}>Orders</Text>
                    <Text style={styles.flatCardDescription}>Manage & process orders</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#7E57C2" />
                </View>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.flatCard}
              onPress={() => router.push("/(main)/download")}
            >
              <LinearGradient
                colors={['#f0c5f7ff', '#d9c4f8ff']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.flatCardGradient}
              >
                <View style={styles.flatCardContent}>
                  <View style={styles.flatCardIcon}>
                    <Ionicons name="cloud-download-outline" size={24} color="#faf9fbff" />
                  </View>
                  <View style={styles.flatCardText}>
                    <Text style={styles.flatCardTitle}>Download</Text>
                    <Text style={styles.flatCardDescription}>Sync inventory data</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#7E57C2" />
                </View>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.flatCard}
              onPress={() => router.push("/(main)/tracker")}
            >
              <LinearGradient
                colors={['#f0c5f7ff', '#d9c4f8ff']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.flatCardGradient}
              >
                <View style={styles.flatCardContent}>
                  <View style={styles.flatCardIcon}>
                    <Ionicons name="analytics-outline" size={24} color="#f7f6f9ff" />
                  </View>
                  <View style={styles.flatCardText}>
                    <Text style={styles.flatCardTitle}>Tracker</Text>
                    <Text style={styles.flatCardDescription}>Monitor progress</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#7E57C2" />
                </View>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.flatCard}
              onPress={() => router.push("/(main)/settings")}
            >
              <LinearGradient
                colors={['#f0c5f7ff', '#d9c4f8ff']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.flatCardGradient}
              >
                <View style={styles.flatCardContent}>
                  <View style={styles.flatCardIcon}>
                    <Ionicons name="settings-outline" size={24} color="#f9f9faff" />
                  </View>
                  <View style={styles.flatCardText}>
                    <Text style={styles.flatCardTitle}>Settings</Text>
                    <Text style={styles.flatCardDescription}>App configuration</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#7E57C2" />
                </View>
              </LinearGradient>
            </TouchableOpacity>

          </View>
          
          <View style={styles.footer}>
            <View style={styles.footerDivider} />
            <View style={styles.footerContent}>
              <Ionicons name="shield-checkmark" size={16} color="#9E9E9E" />
              <Text style={styles.footerText}>IMCB Solutions LLP</Text>
            </View>
            <Text style={styles.footerSubtext}>Secure · Reliable · Enterprise-Grade</Text>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#faf4fffa",
  },
  
  headerGradient: {
    paddingTop: Platform.OS === 'android' ? 60 : 50,
    paddingBottom: 70,
  },
  
  header: {
    position: 'relative',
    overflow: 'visible',
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
    top: -40,
    right: -20,
  },
  
  floatingOrb2: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.12)',
    top: 20,
    left: -15,
  },
  
  elegantWave: {
    position: 'absolute',
    width: 180,
    height: 80,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderTopLeftRadius: 90,
    borderTopRightRadius: 90,
    bottom: -30,
    right: -40,
    transform: [{ rotate: '12deg' }],
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
    fontSize: 25,
    fontWeight: "700",
    color: "white",
    letterSpacing: 2,
  },
  
  appTagline: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
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
    backgroundColor: "rgba(213, 206, 215, 0.51)",
    marginHorizontal: 25,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.59)',
    zIndex: 1,
    height: 80,
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
    fontSize: 18,
    fontWeight: "500",
    color: "rgba(255,255,255,0.9)",
    marginBottom: 2,
  },
  
  usernameText: {
    fontSize: 18,
    fontWeight: "600",
    color: "white",
  },
  
  whiteContainer: {
    flex: 1,
    backgroundColor: "#f9f2fff7",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -30,
    marginHorizontal: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 8,
  },
  
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  
  horizontalCardsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 25,
    marginTop: 20,
  },
  
  flatCard: {
    borderRadius: 16,
    marginBottom: 15,
    shadowColor: "#9889b3f1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
    overflow: 'hidden',
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
    backgroundColor: '#801b90ff',
    marginRight: 16,
  },
  
  flatCardText: {
    flex: 1,
  },
  
  flatCardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  
  flatCardDescription: {
    fontSize: 13,
    color: "#616161",
    fontWeight: "500",
  },
  
  footer: {
    alignItems: "center",
    paddingTop: 32,
    paddingBottom: 20,
    marginTop: 40,
  },
  
  footerDivider: {
    width: 80,
    height: 4,
    backgroundColor: "#E0E0E0",
    borderRadius: 2,
    marginBottom: 20,
  },
  
  footerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  
  footerText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#7E57C2",
  },
  
  footerSubtext: {
    fontSize: 11,
    color: "#9E9E9E",
    fontWeight: "500",
  },
});