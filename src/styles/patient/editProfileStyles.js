import { StyleSheet } from "react-native";

export const editProfileStyles = StyleSheet.create({
  // === CONTAINER & SAFE AREA ===
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },

  // === HEADER ===
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "600",
    color: "#FFF",
    textAlign: "center",
    marginRight: 56, // Căn giữa khi có back button
  },

  // === SCROLL VIEW ===
  scrollView: {
    flex: 1,
  },

  // === LOADING ===
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#FFF",
    fontWeight: "500",
  },

  // === AVATAR SECTION ===
  avatarSection: {
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  avatarContainer: {
    position: "relative",
  },
  avatarGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    padding: 4, // Tạo viền gradient
    justifyContent: "center",
    alignItems: "center",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 46, // 50 - 4 (padding)
    borderWidth: 3,
    borderColor: "#FFF",
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#E0F2FE",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#FFF",
  },
  avatarText: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#1D4ED8",
  },
  editAvatarButton: {
    position: "absolute",
    right: 0,
    bottom: 0,
    backgroundColor: "#1D4ED8",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#FFF",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  userName: {
    marginTop: 12,
    fontSize: 22,
    fontWeight: "700",
    color: "#FFF",
  },
  userRole: {
    fontSize: 15,
    color: "#BBDEFB",
    marginTop: 4,
    fontWeight: "500",
  },

  // === FORM CARD ===
  formCard: {
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 20,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },

  // === INPUT GROUP ===
  inputGroup: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 18,
  },
  inputIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  inputContent: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    color: "#1E293B",
    marginBottom: 6,
    fontWeight: "600",
  },
  input: {
    fontSize: 16,
    color: "#1E293B",
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  inputReadonly: {
    fontSize: 16,
    color: "#6B7280",
    paddingVertical: 8,
  },
  placeholderText: {
    color: "#9CA3AF",
  },

  // === DATE PICKER ===
  datePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  dropdownIcon: {
    marginLeft: 8,
  },

  // === GENDER ===
  genderContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  genderButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: "#F3F4F6",
    marginHorizontal: 4,
    elevation: 1,
  },
  genderButtonActive: {
    backgroundColor: "#1D4ED8",
    elevation: 3,
  },
  genderText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
  },
  genderTextActive: {
    color: "#FFF",
  },

  // === BUTTONS ===
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 28,
  },
  saveButton: {
    flex: 1,
    marginRight: 10,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    borderRadius: 14,
    elevation: 3,
  },
  saveButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "700",
    color: "#FFF",
  },
  cancelButton: {
    flex: 1,
    marginLeft: 10,
    backgroundColor: "#F3F4F6",
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#6B7280",
  },
});