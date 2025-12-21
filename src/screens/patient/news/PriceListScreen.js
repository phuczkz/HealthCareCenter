import React from "react";
import {
  View,
  Text,
  SectionList,
  TouchableOpacity,
  TextInput,
  Linking,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { usePriceList } from "../../../controllers/priceController";
import { formatPrice } from "../../../services/priceService";
import {
  styles,
  DEPARTMENT_COLORS,
} from "../../../styles/PriceListScreenstyles";

export default function PriceListScreen({ navigation }) {
  const { search, sections, loading, onSearch, clearSearch } = usePriceList();

  const sectionsWithColor = sections.map((section) => ({
    ...section,
    color: DEPARTMENT_COLORS[section.title] || "#F3F4F6",
  }));

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#2563EB", "#3B82F6"]} style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={28} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Bảng giá dịch vụ</Text>
        <View style={{ width: 48 }} />
      </LinearGradient>

      <View style={styles.searchBox}>
        <Ionicons name="search" size={22} color="#64748B" />
        <TextInput
          placeholder="Tìm tên, mã dịch vụ..."
          value={search}
          onChangeText={onSearch}
          style={styles.searchInput}
          placeholderTextColor="#94A3B8"
        />
        {search ? (
          <TouchableOpacity onPress={clearSearch}>
            <Ionicons name="close-circle" size={22} color="#94A3B8" />
          </TouchableOpacity>
        ) : null}
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      ) : (
        <SectionList
          sections={sectionsWithColor}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          renderSectionHeader={({ section }) => (
            <View
              style={[styles.sectionHeader, { backgroundColor: section.color }]}
            >
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text style={styles.sectionCount}>
                {section.data.length} dịch vụ
              </Text>
            </View>
          )}
          renderItem={({ item }) => (
            <View style={styles.item}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                {item.code && (
                  <Text style={styles.itemCode}>Mã: {item.code}</Text>
                )}
              </View>
              <Text style={styles.price}>{formatPrice(item.price)}</Text>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="search-off" size={80} color="#E2E8F0" />
              <Text style={styles.emptyText}>
                {search ? "Không tìm thấy" : "Chưa có dữ liệu"}
              </Text>
            </View>
          }
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => Linking.openURL("tel:0854776885")}
      >
        <LinearGradient
          colors={["#10B981", "#059669"]}
          style={styles.fabGradient}
        >
          <Ionicons name="call" size={28} color="#FFF" />
          <View style={styles.badge}>
            <Text style={styles.badgeText}>24/7</Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}
