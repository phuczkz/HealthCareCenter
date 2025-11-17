import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Platform,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import * as ImagePicker from "expo-image-picker";
import { useUserStore } from "../../store/useUserStore";
import {
  getProfile,
  updateProfile,
} from "../../controllers/patient/profileController";
import { editProfileStyles as styles } from "../../styles/patient/editProfileStyles";
import { supabase } from "../../api/supabase";

const EditProfileScreen = ({ navigation }) => {
  const { user, setUser } = useUserStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Date picker
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Avatar
  const [avatarUrl, setAvatarUrl] = useState(null);

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
  });

  useEffect(() => {
    fetchUserProfile();
  }, []);

  // === LẤY HỒ SƠ ===
  const fetchUserProfile = async () => {
    try {
      console.log("Fetching profile...");
      const profile = await getProfile();

      setFormData({
        fullName: profile.fullName || "",
        phone: profile.phone || "",
        dateOfBirth: profile.dateOfBirth || "",
        gender: profile.gender || "",
      });

      if (profile.avatar_url) {
        setAvatarUrl(profile.avatar_url);
        console.log("Avatar loaded:", profile.avatar_url);
      }

      if (profile.dateOfBirth) {
        setSelectedDate(new Date(profile.dateOfBirth));
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      Alert.alert("Lỗi", error.message || "Không thể tải thông tin hồ sơ");
    } finally {
      setLoading(false);
    }
  };

  // === DATE PICKER ===
  const showDatePicker = () => setDatePickerVisible(true);
  const hideDatePicker = () => setDatePickerVisible(false);

  const handleDateConfirm = (date) => {
    const formattedDate = date.toISOString().split("T")[0];
    setFormData({ ...formData, dateOfBirth: formattedDate });
    setSelectedDate(date);
    hideDatePicker();
  };

  const formatDisplayDate = (dateString) => {
    if (!dateString) return "Chọn ngày sinh";
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, "0")}/${(
      date.getMonth() + 1
    )
      .toString()
      .padStart(2, "0")}/${date.getFullYear()}`;
  };

  // === CHỌN ẢNH ===
  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Quyền bị từ chối", "Cần cấp quyền truy cập thư viện ảnh.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled) {
        await uploadAvatar(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Image picker error:", error);
      Alert.alert("Lỗi", "Không thể chọn ảnh");
    }
  };

  // === UPLOAD ẢNH (DÙNG FormData - HOẠT ĐỘNG 100% TRÊN RN) ===
  const uploadAvatar = async (uri) => {
    try {
      setUploading(true);
      console.log("Uploading avatar...");

      // LẤY USER TỪ SUPABASE
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      if (authError || !authUser?.id) {
        throw new Error("Không thể xác thực người dùng. Vui lòng đăng nhập lại.");
      }

      // TẠO FILE NAME
      const fileExt = uri.split(".").pop()?.toLowerCase() || "jpg";
      const fileName = `${authUser.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // TẠO FormData
      const formData = new FormData();
formData.append("file", {
  uri,
  name: fileName,
  type: `image/${fileExt}`,
});
      // UPLOAD
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, formData, {
          upsert: true,
          cacheControl: "3600",
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        throw new Error(`Upload thất bại: ${uploadError.message}`);
      }

      console.log("Uploaded to:", filePath);

      // LẤY PUBLIC URL
      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;
      console.log("Public URL:", publicUrl);

      // CẬP NHẬT DB
      const { error: dbError } = await supabase
        .from("user_profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", authUser.id);

      if (dbError) throw dbError;

      // CẬP NHẬT UI
      setAvatarUrl(publicUrl + `?t=${Date.now()}`);
      Alert.alert("Thành công", "Cập nhật ảnh đại diện thành công!");
    } catch (error) {
      console.error("Upload avatar error:", error);
      Alert.alert("Lỗi", error.message || "Không thể tải ảnh lên");
    } finally {
      setUploading(false);
    }
  };

  // === CẬP NHẬT HỒ SƠ ===
  const handleUpdate = async () => {
    setSaving(true);
    try {
      await updateProfile(formData);
      setUser({ ...user, name: formData.fullName.trim() });
      Alert.alert("Thành công", "Cập nhật thông tin thành công", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert("Lỗi", error.message || "Không thể cập nhật thông tin");
    } finally {
      setSaving(false);
    }
  };

  // === LOADING ===
  if (loading) {
    return (
      <LinearGradient
        colors={["#1D4ED8CC", "#38BDF8B3"]}
        style={styles.container}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#38BDF8" />
            <Text style={styles.loadingText}>Đang tải...</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // === RENDER ===
  return (
    <LinearGradient
      colors={["#1D4ED8CC", "#38BDF8B3"]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chỉnh sửa hồ sơ</Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarContainer}>
              <TouchableOpacity onPress={pickImage} disabled={uploading}>
                <LinearGradient
                  colors={["#E0F2FE", "#BFDBFE"]}
                  style={styles.avatarGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  {avatarUrl ? (
                    <Image
                      source={{ uri: avatarUrl }}
                      style={styles.avatarImage}
                      resizeMode="cover"
                      onError={(e) =>
                        console.error("Image load error:", e.nativeEvent.error)
                      }
                    />
                  ) : (
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>
                        {formData.fullName
                          ? formData.fullName.charAt(0).toUpperCase()
                          : "U"}
                      </Text>
                    </View>
                  )}
                </LinearGradient>
                <View style={styles.editAvatarButton}>
                  {uploading ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Ionicons name="camera" size={20} color="#FFF" />
                  )}
                </View>
              </TouchableOpacity>
            </View>
            <Text style={styles.userName}>
              {formData.fullName || "Người dùng"}
            </Text>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            {/* Họ và tên */}
            <View style={styles.inputGroup}>
              <View style={styles.inputIconContainer}>
                <Ionicons name="person" size={24} color="#1D4ED8" />
              </View>
              <View style={styles.inputContent}>
                <Text style={styles.inputLabel}>Họ và tên</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nhập họ và tên"
                  placeholderTextColor="#4B5563"
                  value={formData.fullName}
                  onChangeText={(text) =>
                    setFormData({ ...formData, fullName: text })
                  }
                  editable={!saving}
                />
              </View>
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
              <View style={styles.inputIconContainer}>
                <Ionicons name="mail" size={24} color="#1D4ED8" />
              </View>
              <View style={styles.inputContent}>
                <Text style={styles.inputLabel}>Email</Text>
                <Text style={styles.inputReadonly}>{user?.email || "N/A"}</Text>
              </View>
            </View>

            {/* Số điện thoại */}
            <View style={styles.inputGroup}>
              <View style={styles.inputIconContainer}>
                <Ionicons name="call" size={24} color="#1D4ED8" />
              </View>
              <View style={styles.inputContent}>
                <Text style={styles.inputLabel}>Số điện thoại</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nhập số điện thoại"
                  placeholderTextColor="#4B5563"
                  value={formData.phone}
                  onChangeText={(text) =>
                    setFormData({ ...formData, phone: text })
                  }
                  keyboardType="phone-pad"
                  editable={!saving}
                />
              </View>
            </View>

            {/* Ngày sinh */}
            <View style={styles.inputGroup}>
              <View style={styles.inputIconContainer}>
                <Ionicons name="calendar" size={24} color="#1D4ED8" />
              </View>
              <View style={styles.inputContent}>
                <Text style={styles.inputLabel}>Ngày sinh</Text>
                <TouchableOpacity
                  style={styles.datePickerButton}
                  onPress={showDatePicker}
                  disabled={saving}
                >
                  <Text
                    style={[
                      styles.input,
                      !formData.dateOfBirth && styles.placeholderText,
                    ]}
                  >
                    {formatDisplayDate(formData.dateOfBirth)}
                  </Text>
                  <Ionicons
                    name="chevron-down"
                    size={20}
                    color="#1D4ED8"
                    style={styles.dropdownIcon}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Giới tính */}
            <View style={styles.inputGroup}>
              <View style={styles.inputIconContainer}>
                <Ionicons name="male-female" size={24} color="#1D4ED8" />
              </View>
              <View style={styles.inputContent}>
                <Text style={styles.inputLabel}>Giới tính</Text>
                <View style={styles.genderContainer}>
                  {[
                    { value: "male", label: "Nam", icon: "male" },
                    { value: "female", label: "Nữ", icon: "female" },
                    { value: "other", label: "Khác", icon: "help-circle" },
                  ].map((gender) => (
                    <TouchableOpacity
                      key={gender.value}
                      style={[
                        styles.genderButton,
                        formData.gender === gender.value &&
                          styles.genderButtonActive,
                      ]}
                      onPress={() =>
                        setFormData({ ...formData, gender: gender.value })
                      }
                      disabled={saving}
                    >
                      <Ionicons
                        name={gender.icon}
                        size={20}
                        color={
                          formData.gender === gender.value ? "#FFF" : "#1E293B"
                        }
                      />
                      <Text
                        style={[
                          styles.genderText,
                          formData.gender === gender.value &&
                            styles.genderTextActive,
                        ]}
                      >
                        {gender.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* Vai trò */}
            <View style={styles.inputGroup}>
              <View style={styles.inputIconContainer}>
                <Ionicons name="shield-checkmark" size={24} color="#1D4ED8" />
              </View>
              <View style={styles.inputContent}>
                <Text style={styles.inputLabel}>Vai trò</Text>
                <Text style={styles.inputReadonly}>Bệnh nhân</Text>
              </View>
            </View>

            {/* Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                onPress={handleUpdate}
                disabled={saving}
              >
                <LinearGradient
                  colors={
                    saving ? ["#9CA3AF", "#9CA3AF"] : ["#1D4ED8", "#38BDF8"]
                  }
                  style={styles.saveButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {saving ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle" size={24} color="#FFF" />
                      <Text style={styles.saveButtonText}>Lưu thay đổi</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => navigation.goBack()}
                disabled={saving}
              >
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Date Picker */}
        <DateTimePickerModal
          isVisible={isDatePickerVisible}
          mode="date"
          onConfirm={handleDateConfirm}
          onCancel={hideDatePicker}
          maximumDate={new Date()}
          date={selectedDate}
          display={Platform.OS === "ios" ? "inline" : "default"}
          accentColor="#1D4ED8"
          textColor="#1E293B"
        />
      </SafeAreaView>
    </LinearGradient>
  );
};

export default EditProfileScreen;