import { useState, useCallback } from "react";
import {
  getAvailableDates,
  getSpecializationsByDate,
  getAvailableSlots,
  createAppointment,
} from "../../services/patient/bookingService";

export const useBookingFlow = () => {
  const [selectedDate, setSelectedDate] = useState("");

  const [availableDates, setAvailableDates] = useState([]);
  const [loadingDates, setLoadingDates] = useState(false);

  const [specializations, setSpecializations] = useState([]);
  const [loadingSpecs, setLoadingSpecs] = useState(false);

  const [doctorsWithSlots, setDoctorsWithSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [bookingLoading, setBookingLoading] = useState(false);

  const loadAvailableDates = useCallback(async () => {
    if (availableDates.length > 0) return;
    setLoadingDates(true);
    const res = await getAvailableDates();
    if (res.success) setAvailableDates(res.data);
    setLoadingDates(false);
  }, [availableDates.length]);

  const loadSpecializations = useCallback(async (date) => {
    setLoadingSpecs(true);
    const res = await getSpecializationsByDate(date);
    if (res.success) setSpecializations(res.data);
    else setSpecializations([]);
    setLoadingSpecs(false);
  }, []);

  const loadSlots = useCallback(async (date, specialization) => {
    setLoadingSlots(true);
    const res = await getAvailableSlots(date, specialization);
    if (res.success) setDoctorsWithSlots(res.data);
    else setDoctorsWithSlots([]);
    setLoadingSlots(false);
  }, []);

  const bookAppointment = useCallback(
    async (params) => {
      setBookingLoading(true);
      const res = await createAppointment(params);
      setBookingLoading(false);

      if (res.success && selectedDate) {
        loadSlots(selectedDate, params.specialization);
      }
      return res;
    },
    [selectedDate, loadSlots]
  );

  const resetFlow = useCallback(() => {
    setSelectedDate("");
    setSpecializations([]);
    setDoctorsWithSlots([]);
  }, []);

  return {
    selectedDate,
    setSelectedDate,
    availableDates,
    specializations,
    doctorsWithSlots,

    loadingDates,
    loadingSpecs,
    loadingSlots,
    bookingLoading,

    loadAvailableDates,
    loadSpecializations,
    loadSlots,
    bookAppointment,
    resetFlow,
  };
};
