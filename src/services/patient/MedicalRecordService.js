import { supabase } from "../../api/supabase";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Alert, Linking } from "react-native";

export class MedicalRecordService {
  static async hasUnpaidInvoice(patientId) {
    try {
      const { data: pendingInvoices, error } = await supabase
        .from("invoices")
        .select("appointment_id")
        .eq("status", "pending")
        .not("appointment_id", "is", null);

      if (error || !pendingInvoices || pendingInvoices.length === 0) {
        return false;
      }

      const validIds = pendingInvoices
        .map((inv) => inv.appointment_id)
        .filter((id) => typeof id === "string" && id.length === 36);

      if (validIds.length === 0) return false;

      const { data: appointments, error: aptError } = await supabase
        .from("appointments")
        .select("id")
        .in("id", validIds)
        .eq("patient_id", patientId)
        .in("status", ["completed", "waiting_results"]);

      if (aptError) {
        console.error(
          "Lỗi query appointments trong hasUnpaidInvoice:",
          aptError
        );
        return false;
      }

      return appointments && appointments.length > 0;
    } catch (err) {
      console.error("Lỗi kiểm tra hóa đơn chưa thanh toán:", err);
      return false;
    }
  }
  static async fetchMedicalRecords(patientId) {
    const { data, error } = await supabase
      .from("medical_records")
      .select(
        `
      id, created_at, diagnosis, treatment, notes, appointment_id,
      doctor_id,  
      doctor:doctors!doctor_id (
        id,               
        name,
        user_profiles!id (full_name)
      ),
      prescriptions (*),
      appointments!appointment_id (
        date, invoices!appointment_id (status)
      )
    `
      )
      .eq("patient_id", patientId)
      .in("appointments.invoices.status", ["paid", "refunded"])
      .order("created_at", { ascending: false });

    if (error) throw error;

    const recordsWithRatingCheck = await Promise.all(
      (data || []).map(async (r) => {
        const { data: existingRating } = await supabase
          .from("doctor_ratings")
          .select("id")
          .eq("appointment_id", r.appointment_id)
          .maybeSingle();

        const doctorId = r.doctor?.id || r.doctor_id;

        if (!doctorId) {
          console.warn("Không tìm thấy doctor_id cho medical_record id:", r.id);
        }

        return {
          ...r,
          doctor_name:
            r.doctor?.user_profiles?.full_name || r.doctor?.name || "Bác sĩ",
          doctor_id: doctorId,
          prescriptions: r.prescriptions || [],
          hasRating: !!existingRating,
          appointmentId: r.appointment_id,
        };
      })
    );

    return recordsWithRatingCheck;
    if (!doctorId) {
      console.warn(
        "MedicalRecord thiếu doctor_id → không cho đánh giá",
        r.id,
        r.appointment_id
      );
    }
  }
  static async fetchTestResults(patientId) {
    const { data, error } = await supabase
      .from("test_results")
      .select(
        `
      id, test_name, result_value, unit, reference_range, note,
      status, performed_at, file_url, appointment_id,
      appointments!appointment_id (
        invoices!appointment_id (status)
      )
    `
      )
      .eq("patient_id", patientId)
      .not("performed_at", "is", null)
      .in("appointments.invoices.status", ["paid", "refunded"])
      .order("performed_at", { ascending: false });

    if (error) throw error;

    const filtered = data.filter((t) => {
      const status = t.appointments?.invoices?.[0]?.status;
      return status === "paid" || status === "refunded";
    });

    const grouped = filtered.reduce((acc, item) => {
      const key = item.performed_at
        ? new Date(item.performed_at).toLocaleDateString("vi-VN")
        : item.id;

      if (!acc[key]) {
        acc[key] = {
          date: item.performed_at
            ? new Date(item.performed_at).toLocaleDateString("vi-VN", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })
            : "Chưa xác định",
          rawDate: item.performed_at || new Date(),
          tests: [],
          hasFile: !!item.file_url,
          fileUrl: item.file_url,
        };
      }

      acc[key].tests.push({
        name: item.test_name,
        result: item.result_value,
        unit: item.unit,
        range: item.reference_range,
        note: item.note,
        status: item.status,
      });

      if (item.file_url) {
        acc[key].hasFile = true;
        acc[key].fileUrl = item.file_url;
      }

      return acc;
    }, {});

    return Object.values(grouped).sort(
      (a, b) => new Date(b.rawDate) - new Date(a.rawDate)
    );
  }

  static async openFile(url) {
    if (!url) {
      Alert.alert("Thông báo", "Chưa có file kết quả");
      return;
    }

    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
        return;
      }

      const filename = url.split("/").pop() || `ketqua_${Date.now()}.pdf`;
      const localUri = `${FileSystem.documentDirectory}${filename}`;
      const { uri } = await FileSystem.downloadAsync(url, localUri);

      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert("Lỗi", "Thiết bị không hỗ trợ chia sẻ");
        return;
      }

      await Sharing.shareAsync(uri, {
        mimeType: "application/pdf",
        dialogTitle: "Kết quả xét nghiệm",
        UTI: "com.adobe.pdf",
      });
    } catch (error) {
      console.error("Lỗi mở file:", error);
      Alert.alert("Lỗi", "Không thể mở file");
    }
  }
}
