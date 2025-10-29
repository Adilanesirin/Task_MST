import { getPendingOrders } from "@/utils/sync";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get('window');

const orderRoutes = [
  {
    name: "Entry",
    icon: "create",
    path: "/(main)/barcode-entry",
    subtitle: "Add new products to inventory",
    description: "Create and manage product entries",
    gradient: ["#9C27B0", "#7E57C2", "#673AB7"],
    accentColor: "#E1BEE7",
  },
  {
    name: "Upload",
    icon: "cloud-done",
    path: "/(main)/upload",
    subtitle: "Synchronize with cloud server",
    description: "Sync all pending data",
    gradient: ["#7E57C2", "#673AB7", "#5E35B1"],
    accentColor: "#D1C4E9",
    showPending: true,
  },
];

export default function OrdersScreen() {
  const router = useRouter();
  const [pendingCount, setPendingCount] = useState(0);
  const [pendingItems, setPendingItems] = useState(0);

  const loadPendingCount = async () => {
    try {
      const orders = await getPendingOrders();
      const ordersArray = Array.isArray(orders) ? orders : [];
      
      console.log("📊 Pending orders:", ordersArray.length);
      console.log("📦 Sample order:", ordersArray[0]);
      
      setPendingCount(ordersArray.length);
      
      const totalItems = ordersArray.reduce((acc, order) => {
        const qty = parseInt(order.quantity) || 0;
        console.log(`Order ${order.id}: quantity = ${qty}`);
        return acc + qty;
      }, 0);
      
      console.log("📊 Total pending items:", totalItems);
      setPendingItems(totalItems);
    } catch (error) {
      console.error("Error loading pending count:", error);
      setPendingCount(0);
      setPendingItems(0);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadPendingCount();
    }, [])
  );

  const handleBack = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="transparent" barStyle="light-content" translucent />

      {/* Premium Header with Gradient */}
      <LinearGradient
        colors={["#7E57C2", "#9C27B0", "#7E57C2"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.headerPattern} />
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Order Management</Text>
            <Text style={styles.headerSubtitle}>Workflow Dashboard</Text>
          </View>
          <View style={styles.headerIconWrapper}>
            <Ionicons name="file-tray-full" size={24} color="#FFFFFF" />
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Information Panel - Now First */}
        <View style={styles.infoPanel}>
          <LinearGradient
            colors={["#f0d1f4ff", "#ddcbf9ff"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.infoPanelGradient}
          >
            <View style={styles.infoPanelHeader}>
              <View style={styles.infoPanelIcon}>
                <Ionicons name="bulb" size={18} color="#7E57C2" />
              </View>
              <Text style={styles.infoPanelTitle}>How It Works</Text>
            </View>
            <View style={styles.infoPanelContent}>
              <View style={styles.infoStep}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>1</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Create Entry</Text>
                  <Text style={styles.stepDescription}>Add products with details and quantities</Text>
                </View>
              </View>
              <View style={styles.stepConnector} />
              <View style={styles.infoStep}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>2</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Sync Data</Text>
                  <Text style={styles.stepDescription}>Upload to cloud and synchronize across devices</Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Premium Action Cards */}
        <View style={styles.cardsContainer}>
          {orderRoutes.map((route, index) => (
            <Pressable
              key={route.name}
              onPress={() => router.push(route.path)}
              style={({ pressed }) => [
                styles.card,
                pressed && styles.cardPressed,
              ]}
            >
              <LinearGradient
                colors={route.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1.5, y: 1.5 }}
                style={styles.cardGradient}
              >
                {/* Decorative Elements */}
                <View style={[styles.cardDecor, styles.cardDecor1]} />
                <View style={[styles.cardDecor, styles.cardDecor2]} />
                
                <View style={styles.cardContent}>
                  <View style={styles.cardTop}>
                    <View style={styles.cardIconContainer}>
                      <View style={styles.cardIconBg}>
                        <Ionicons name={route.icon} size={24} color="#FFFFFF" />
                      </View>
                      <View style={styles.cardIconGlow} />
                    </View>
                    <View style={styles.cardBadge}>
                      <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
                    </View>
                  </View>

                  <View style={styles.cardBody}>
                    <Text style={styles.cardTitle}>{route.name}</Text>
                    <Text style={styles.cardSubtitle}>{route.subtitle}</Text>
                    <View style={styles.cardFeatures}>
                      <View style={styles.featureTag}>
                        <Ionicons name="flash" size={10} color="#FFFFFF" />
                        <Text style={styles.featureText}>{route.description}</Text>
                      </View>
                    </View>
                  </View>

                  {route.showPending && (pendingCount > 0 || pendingItems > 0) && (
                    <View style={styles.alertBanner}>
                      <View style={styles.alertIcon}>
                        <Ionicons name="alert-circle" size={14} color="#FF6F00" />
                      </View>
                      <Text style={styles.alertText}>
                        {pendingCount > 0 
                          ? `${pendingCount} ${pendingCount === 1 ? 'order' : 'orders'} awaiting upload`
                          : `${pendingItems} ${pendingItems === 1 ? 'item' : 'items'} awaiting upload`
                        }
                      </Text>
                      <View style={styles.alertPulse} />
                    </View>
                  )}
                </View>
              </LinearGradient>
            </Pressable>
          ))}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerDivider} />
          <View style={styles.footerContent}>
            <Ionicons name="shield-checkmark" size={16} color="#9E9E9E" />
            <Text style={styles.footerText}>IMC Business Solutions</Text>
          </View>
          <Text style={styles.footerSubtext}>Secure · Reliable · Enterprise-Grade</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#F8F9FA" 
  },

  headerGradient: {
    paddingTop: Platform.OS === "android" ? 60 : 65,
    paddingBottom: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: "hidden",
  },
  headerPattern: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.1,
    backgroundColor: "transparent",
  },
  header: {
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 24,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  headerTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  headerTitle: { 
    fontSize: 22, 
    fontWeight: "800", 
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.85)",
    marginTop: 2,
    fontWeight: "500",
  },
  headerIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },

  scrollView: { flex: 1 },
  scrollContent: { 
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },

  infoPanel: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#7E57C2",
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  infoPanelGradient: {
    padding: 16,
  },
  infoPanelHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  infoPanelIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  infoPanelTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#7E57C2",
  },
  infoPanelContent: {
    gap: 0,
  },
  infoStep: {
    flexDirection: "row",
    gap: 12,
  },
  stepNumber: {
    width: 28,
    height: 27,
    borderRadius: 8,
    backgroundColor: "#7E57C2",
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumberText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  stepContent: {
    flex: 1,
    paddingBottom: 12,
  },
  stepTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 3,
  },
  stepDescription: {
    fontSize: 11,
    color: "#616161",
    lineHeight: 16,
    fontWeight: "500",
  },
  stepConnector: {
    width: 2,
    height: 12,
    backgroundColor: "#D1C4E9",
    marginLeft: 13,
  },

  cardsContainer: {
    gap: 14,
    marginBottom: 24,
  },

  card: {
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#7E57C2",
    shadowOpacity: 0.2,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  cardPressed: {
    transform: [{ scale: 0.97 }],
    shadowOpacity: 0.3,
  },
  cardGradient: {
    borderRadius: 20,
    overflow: "hidden",
    position: "relative",
  },
  cardDecor: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  cardDecor1: {
    top: -40,
    right: -40,
  },
  cardDecor2: {
    bottom: -50,
    left: -25,
    width: 100,
    height: 100,
    borderRadius: 50,
  },

  cardContent: {
    padding: 16,
    position: "relative",
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  cardIconContainer: {
    position: "relative",
  },
  cardIconBg: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.4)",
  },
  cardIconGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.3)",
    opacity: 0.5,
  },
  cardBadge: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },

  cardBody: {
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 3,
    letterSpacing: -0.3,
  },
  cardSubtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.9)",
    lineHeight: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
  cardFeatures: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  featureTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  featureText: {
    fontSize: 10,
    color: "#FFFFFF",
    fontWeight: "600",
  },

  alertBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    gap: 8,
    position: "relative",
  },
  alertIcon: {
    width: 24,
    height: 24,
    borderRadius: 7,
    backgroundColor: "#FFF3E0",
    alignItems: "center",
    justifyContent: "center",
  },
  alertText: {
    flex: 1,
    fontSize: 11,
    fontWeight: "700",
    color: "#E65100",
  },
  alertPulse: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#FF6F00",
  },

  footer: {
    alignItems: "center",
    paddingTop: 32,
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