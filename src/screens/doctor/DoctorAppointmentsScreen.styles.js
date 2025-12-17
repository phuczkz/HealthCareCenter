import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: { paddingTop: 50, paddingHorizontal: 20, paddingBottom: 20 },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: { fontSize: 26, fontWeight: "800", color: "#FFF" },
  tabBarContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderColor: "#E2E8F0",
  },
  tabItem: (active) => ({
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: 30,
    backgroundColor: active ? "#3B82F6" : "#F1F5F9",
    marginRight: 12,
    minWidth: 100,
    alignItems: "center",
  }),
  tabText: (active) => ({
    color: active ? "#FFF" : "#64748B",
    fontWeight: "700",
    fontSize: 15,
  }),
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: {
    marginTop: 20,
    fontSize: 17,
    color: "#64748B",
    fontWeight: "600",
  },
  emptyText: {
    marginTop: 24,
    fontSize: 19,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 28,
  },
  listContent: { padding: 16, paddingTop: 12, paddingBottom: 120 },
});

export default styles;
