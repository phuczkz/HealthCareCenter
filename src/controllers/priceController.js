import { useState, useEffect, useCallback } from "react";
import { getPriceList } from "../services/priceService";

export const usePriceList = () => {
  const [search, setSearch] = useState("");
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    const result = await getPriceList(search);
    setSections(result.success ? result.data : []);
    setLoading(false);
  }, [search]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onSearch = (text) => setSearch(text);
  const clearSearch = () => setSearch("");

  return {
    search,
    sections,
    loading,
    onSearch,
    clearSearch,
  };
};
