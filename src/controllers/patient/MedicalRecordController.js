import { Alert } from "react-native";
import { MedicalRecordService } from "../../services/patient/MedicalRecordService";
import { supabase } from "../../api/supabase";

export class MedicalRecordController {
  static async loadData(
    patientId,
    activeTab,
    setRecords,
    setTestGroups,
    setHasUnpaidInvoice,
    setPendingRating,
    setLoading,
    setRefreshing
  ) {
    const setLoadingSafe = (val) =>
      typeof setLoading === "function" && setLoading(val);
    const setRefreshingSafe = (val) =>
      typeof setRefreshing === "function" && setRefreshing(val);

    setLoadingSafe(true);

    try {
      const hasUnpaid = await MedicalRecordService.hasUnpaidInvoice(patientId);
      setHasUnpaidInvoice(hasUnpaid);

      if (hasUnpaid) {
        setRecords([]);
        setTestGroups([]);
        setPendingRating(null);
        return;
      }
      if (activeTab === "records") {
        const records = await MedicalRecordService.fetchMedicalRecords(
          patientId
        );
        setRecords(records);
      } else {
        const groups = await MedicalRecordService.fetchTestResults(patientId);
        setTestGroups(groups);
      }
      const { data: latestAppointment, error: aptError } = await supabase
        .from("appointments")
        .select(
          `
    id,
    date,
    status,
    doctors!inner (
      id,
      name,
      user_profiles!inner (full_name)
    ),
    invoices!appointment_id (status)
  `
        )
        .eq("user_id", patientId)
        .in("invoices.status", ["paid", "refunded"])
        .order("date", { ascending: false })
        .limit(1);

      console.log("Latest appointment query result:", latestAppointment);
      console.log("Latest appointment error:", aptError);

      if (aptError) {
        console.error("Lỗi query appointment cho đánh giá:", aptError);
        setPendingRating(null);
        return;
      }

      if (!latestAppointment || latestAppointment.length === 0) {
        console.log("Không tìm thấy lượt khám đã thanh toán nào để đánh giá");
        setPendingRating(null);
        return;
      }

      const appointment = latestAppointment[0];

      const { data: existingRating, error: ratingError } = await supabase
        .from("doctor_ratings")
        .select("id")
        .eq("appointment_id", appointment.id)
        .maybeSingle();

      if (ratingError) {
        console.error("Lỗi kiểm tra đánh giá hiện có:", ratingError);
      }

      console.log("Existing rating for appointment:", existingRating);

      if (existingRating) {
        setPendingRating(null);
        return;
      }

      setPendingRating({
        appointmentId: appointment.id,
        doctorId: appointment.doctors.id,
        doctorName:
          appointment.doctors.user_profiles?.full_name ||
          appointment.doctors.name ||
          "Bác sĩ",
      });

      console.log("Đã set pendingRating → modal đánh giá sẽ hiện!", {
        appointmentId: appointment.id,
        doctorName:
          appointment.doctors?.user_profiles?.full_name ||
          appointment.doctors?.name,
      });
    } catch (err) {
      console.error("Lỗi không mong muốn trong loadData:", err);
      Alert.alert("Lỗi", "Không thể tải dữ liệu. Vui lòng thử lại sau.");
      setPendingRating(null);
      setRecords([]);
      setTestGroups([]);
    } finally {
      setLoadingSafe(false);
      setRefreshingSafe(false);
    }
  }
}
