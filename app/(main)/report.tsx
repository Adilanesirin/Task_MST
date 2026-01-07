// app/(main)/report.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as SQLite from "expo-sqlite";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

const db = SQLite.openDatabaseSync("magicpedia.db");

type FilterType = 'synced' | 'unsynced';

interface ReportItem {
  id: number;
  barcode: string;
  name: string;
  quantity: number;
  created_at: string;
  scannedAt?: number;
  countedQuantity?: number;
  currentStock?: number;
  status: 'synced' | 'unsynced';
}

export default function ReportScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterType>('unsynced');
  const [items, setItems] = useState<ReportItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({
    synced: 0,
    unsynced: 0,
    total: 0
  });

  useEffect(() => {
    loadReportData();
    cleanupOldRecords();
  }, [filter]);

  useEffect(() => {
    filterItems();
  }, [searchQuery, items]);

  const filterItems = () => {
    if (!searchQuery.trim()) {
      setFilteredItems(items);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = items.filter(item => 
      item.barcode.toLowerCase().includes(query) ||
      item.name.toLowerCase().includes(query)
    );
    setFilteredItems(filtered);
  };

  const cleanupOldRecords = async () => {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const cutoffTimestamp = sevenDaysAgo.getTime();

      await db.runAsync(
        "DELETE FROM pending_items WHERE scannedAt < ?",
        [cutoffTimestamp]
      );

      const cutoffDate = sevenDaysAgo.toISOString();
      await db.runAsync(
        "DELETE FROM stock_count WHERE created_at < ?",
        [cutoffDate]
      );

      console.log("[CLEANUP] Deleted records older than 7 days");
    } catch (error) {
      console.error("[ERROR] Failed to cleanup old records:", error);
    }
  };

  const loadReportData = async () => {
    try {
      setLoading(true);

      const unsyncedCount = await db.getFirstAsync(
        "SELECT COUNT(*) as count FROM pending_items"
      ) as { count: number } | null;

      const syncedCount = await db.getFirstAsync(
        "SELECT COUNT(*) as count FROM stock_count"
      ) as { count: number } | null;

      setStats({
        unsynced: unsyncedCount?.count || 0,
        synced: syncedCount?.count || 0,
        total: (unsyncedCount?.count || 0) + (syncedCount?.count || 0)
      });

      let rows: any[] = [];

      if (filter === 'unsynced') {
        rows = await db.getAllAsync(
          `SELECT 
            id, 
            barcode, 
            name, 
            countedQuantity as quantity,
            scannedAt,
            currentStock
           FROM pending_items 
           ORDER BY scannedAt DESC`
        ) as any[];

        rows = rows.map(item => ({
          ...item,
          status: 'unsynced' as const,
          created_at: new Date(item.scannedAt).toISOString()
        }));

      } else {
        rows = await db.getAllAsync(
          `SELECT 
            id,
            barcode,
            product_name as name,
            quantity,
            created_at,
            sync_status
           FROM stock_count 
           ORDER BY created_at DESC`
        ) as any[];

        rows = rows.map(item => ({
          ...item,
          status: 'synced' as const
        }));
      }

      setItems(rows || []);
    } catch (error) {
      console.error("[ERROR] Failed to load report data:", error);
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    cleanupOldRecords();
    loadReportData();
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return dateString;
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'synced' ? '#10B981' : '#F59E0B';
  };

  const getStatusText = (status: string) => {
    return status === 'synced' ? 'Synced' : 'Unsynced';
  };

  const renderItem = ({ item }: { item: ReportItem }) => (
    <View style={styles.itemCard}>
      <View style={styles.itemHeader}>
        <View style={styles.itemNameContainer}>
          <Text style={styles.itemName} numberOfLines={1}>
            {item.name || 'Unknown Product'}
          </Text>
          <Text style={styles.itemBarcode}>{item.barcode}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>

      <View style={styles.itemDetails}>
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Ionicons name="cube-outline" size={14} color="#6b7280" />
            <Text style={styles.detailLabel}>Counted:</Text>
            <Text style={styles.detailValue}>{item.quantity || 0}</Text>
          </View>

          {item.status === 'unsynced' && item.currentStock !== undefined && (
            <View style={styles.detailItem}>
              <Ionicons name="layers-outline" size={14} color="#6b7280" />
              <Text style={styles.detailLabel}>Stock:</Text>
              <Text style={styles.detailValue}>{item.currentStock}</Text>
            </View>
          )}
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={14} color="#6b7280" />
          <Text style={styles.detailLabel}>Date:</Text>
          <Text style={styles.detailValue}>{formatDate(item.created_at)}</Text>
        </View>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons 
        name={filter === 'synced' ? "checkmark-circle-outline" : "cart-outline"} 
        size={64} 
        color="#9ca3af" 
      />
      <Text style={styles.emptyTitle}>
        {searchQuery ? 'No Results Found' : filter === 'synced' ? 'No Synced Items' : 'No Items in Cart'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery 
          ? 'Try a different search term'
          : filter === 'synced' 
            ? 'Save stock count to see items here' 
            : 'Start scanning items in stock taking'}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#801b90ff" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Stock Reports</Text>
        
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={onRefresh}
        >
          <Ionicons name="refresh" size={24} color="#801b90ff" />
        </TouchableOpacity>
      </View>

      

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#6b7280" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by barcode or name..."
          placeholderTextColor="#9ca3af"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity 
            onPress={() => setSearchQuery('')}
            style={styles.clearButton}
          >
            <Ionicons name="close-circle" size={20} color="#9ca3af" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Toggle */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            styles.filterButtonLeft,
            filter === 'synced' && styles.filterButtonActive
          ]}
          onPress={() => setFilter('synced')}
        >
          <Ionicons 
            name="checkmark-circle" 
            size={20} 
            color={filter === 'synced' ? '#FFFFFF' : '#6b7280'} 
          />
          <Text style={[
            styles.filterText,
            filter === 'synced' && styles.filterTextActive
          ]}>
            Synced ({stats.synced})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === 'unsynced' && styles.filterButtonActive
          ]}
          onPress={() => setFilter('unsynced')}
        >
          <Ionicons 
            name="cart" 
            size={20} 
            color={filter === 'unsynced' ? '#FFFFFF' : '#6b7280'} 
          />
          <Text style={[
            styles.filterText,
            filter === 'unsynced' && styles.filterTextActive
          ]}>
            Unsynced ({stats.unsynced})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Items List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#801b90ff" />
          <Text style={styles.loadingText}>Loading reports...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => `${item.status}-${item.id}`}
          renderItem={renderItem}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#801b90ff']}
              tintColor="#801b90ff"
            />
          }
        />
      )}

      {/* Info Footer */}
      <View style={styles.infoFooter}>
        <Ionicons name="information-circle-outline" size={16} color="#9ca3af" />
        <Text style={styles.infoText}>
          Reports are kept for 7 days
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  refreshButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  statCardSuccess: {
    backgroundColor: '#ecfdf5',
    borderColor: '#10B981',
  },
  statCardWarning: {
    backgroundColor: '#fffbeb',
    borderColor: '#F59E0B',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  statValueSuccess: {
    color: '#10B981',
  },
  statValueWarning: {
    color: '#F59E0B',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1f2937',
    paddingVertical: 0,
  },
  clearButton: {
    padding: 4,
  },
  filterContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 12,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
    backgroundColor: '#ffffff',
  },
  filterButtonLeft: {
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
  },
  filterButtonActive: {
    backgroundColor: '#801b90ff',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  itemCard: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  itemNameContainer: {
    flex: 1,
    marginRight: 12,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 3,
  },
  itemBarcode: {
    fontSize: 12,
    color: '#6b7280',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ffffff',
  },
  itemDetails: {
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  detailLabel: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 13,
    color: '#1f2937',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  infoFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  infoText: {
    fontSize: 12,
    color: '#9ca3af',
  },
});