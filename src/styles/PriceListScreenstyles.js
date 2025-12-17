import { StyleSheet } from "react-native";
import theme from "../theme/theme";

const { SPACING } = theme;

export const DEPARTMENT_COLORS = {
  "Nội khoa": "#DBEAFE",
  "Ngoại khoa": "#FEE2E2",
  "Sản phụ khoa": "#FDE8F5",
  "Nhi khoa": "#D1FAE5",
  "Xét nghiệm": "#E0E7FF",
  "Chẩn đoán hình ảnh": "#FEF3C7",
  "Khám chuyên khoa": "#E0F2FE",
  "Tim mạch": "#FCE7F3",
  "Tai mũi họng": "#E0E7FF",
  "Da liễu": "#F3E8FF",
  "Răng hàm mặt": "#ECFDF5",
  "Cơ xương khớp": "#EFF6FF",
  Khác: "#F3F4F6",
};

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },

  header: {
    paddingTop: 60,
    paddingBottom: 36,
    paddingHorizontal: SPACING.xl,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  backBtn: {
    padding: 10,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 20,
  },
  title: { fontSize: 27, fontWeight: "900", color: "#FFF" },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    marginHorizontal: SPACING.xl,
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 32,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
  },
  searchInput: { flex: 1, marginLeft: 12, fontSize: 16.5, color: "#1e293b" },

  sectionHeader: {
    marginHorizontal: SPACING.xl,
    marginTop: 28,
    marginBottom: 12,
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: { fontSize: 20, fontWeight: "800", color: "#1e293b" },
  sectionCount: { fontSize: 14.5, color: "#64748b" },

  item: {
    backgroundColor: "#FFF",
    marginHorizontal: SPACING.xl,
    marginBottom: 12,
    padding: 22,
    borderRadius: 28,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1.2,
    borderColor: "#E2E8F0",
  },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 16.5, fontWeight: "700", color: "#1e293b" },
  itemCode: { fontSize: 13.5, color: "#64748b", marginTop: 4 },
  price: { fontSize: 18, fontWeight: "900", color: "#dc2626" },

  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  emptyText: { marginTop: 20, fontSize: 18, color: "#94a3b8" },

  fab: {
    position: "absolute",
    right: 20,
    bottom: 30,
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 4,
    borderColor: "#FFF",
    overflow: "hidden",
  },
  fabGradient: { flex: 1, justifyContent: "center", alignItems: "center" },
  badge: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "#EF4444",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#FFF",
  },
  badgeText: { color: "#FFF", fontSize: 10, fontWeight: "800" },
});
