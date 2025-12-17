import { supabase } from "../api/supabase";

export const getPriceList = async (searchQuery = "") => {
  try {
    let query = supabase
      .from("services")
      .select("id, department, name, price, code")
      .eq("is_active", true)
      .order("department", { ascending: true })
      .order("name", { ascending: true });

    if (searchQuery?.trim()) {
      query = query.ilike(
        "search_text",
        `%${searchQuery.trim().toLowerCase()}%`
      );
    }

    const { data, error } = await query;
    if (error) throw error;

    const grouped = {};
    data.forEach((item) => {
      const key = item.department || "Khác";
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(item);
    });

    const sections = Object.keys(grouped)
      .sort()
      .map((dept) => ({
        title: dept,
        data: grouped[dept],
      }));

    return { success: true, data: sections };
  } catch (error) {
    console.error("[PriceService] Lỗi tải bảng giá:", error.message || error);
    return { success: false, data: [] };
  }
};

export const formatPrice = (price) => {
  if (!price || price === 0) return "Liên hệ";
  return new Intl.NumberFormat("vi-VN").format(price) + "đ";
};
