// src/screens/patient/ProfileScreen.styles.js
import { StyleSheet, Platform } from "react-native";

export const Colors = {
  primary: "#1D4ED8",
  secondary: "#38BDF8",
  cardBg: "#FFFFFF",
  iconBgStart: "#E0F2FE",
  iconBgEnd: "#BFDBFE",
  textPrimary: "#1E293B",
  textSecondary: "#4B5563",
  border: "#F1F5F9",
  shadow: "#000",
  danger: "#f55d5dff",
};

export default StyleSheet.create({
  background: { flex: 1 },
  overlay: { flex: 1, paddingTop: Platform.OS === "ios" ? 60 : 40 },

  // Header
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFF",
  },

  scrollContainer: { flex: 1 },
  scrollContent: { paddingBottom: 30 },

  loadingBg: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#DC2626",
    marginBottom: 16,
    textAlign: "center",
  },

  // Avatar
  header: { alignItems: "center", marginBottom: 32, marginTop: 20 },
  avatarContainer: { marginBottom: 20 },
  avatarGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    padding: 4,
  },
  avatarInner: {
    width: "100%",
    height: "100%",
    borderRadius: 56,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { fontSize: 40, fontWeight: "900", color: Colors.primary },
  avatarRing: {
    position: "absolute",
    top: -8,
    left: -8,
    right: -8,
    bottom: -8,
    borderRadius: 68,
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  name: { fontSize: 28, fontWeight: "800", color: "#FFF" },
  role: { fontSize: 17, color: "#E5E7EB", marginTop: 4, fontWeight: "600" },

  // Card
  card: {
    marginHorizontal: 24,
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardInner: { backgroundColor: Colors.cardBg, padding: 24 },

  infoContainer: { marginBottom: 24 },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.iconBgStart,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  infoText: { flex: 1 },
  label: { fontSize: 14, color: Colors.textSecondary, fontWeight: "600" },
  value: { fontSize: 17, color: Colors.textPrimary, fontWeight: "700" },

  // Buttons
  editButton: { borderRadius: 18, overflow: "hidden" },
  editButtonGradient: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 18,
  },
  editButtonText: {
    marginLeft: 10,
    fontSize: 17,
    fontWeight: "700",
    color: "#FFF",
  },
avatarImage: {
  width: 100,
  height: 100,
  borderRadius: 50,
},
  logoutContainer: { marginHorizontal: 24, marginTop: 20, alignItems: "center" },
  logoutButtonMain: {
    width: "80%",
    borderRadius: 18,
    overflow: "hidden",
  },
  logoutButtonGradient: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 18,
  },
  logoutButtonText: {
    marginLeft: 10,
    fontSize: 17,
    fontWeight: "700",
    color: "#FFF",
  },

  retryButton: { borderRadius: 16, overflow: "hidden" },
  retryGradient: { paddingHorizontal: 32, paddingVertical: 14 },
  retryButtonText: { fontSize: 16, fontWeight: "700", color: "#FFF" },
});
