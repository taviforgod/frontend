import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";

export function useJobService() {
  const { fetchWithAuth } = useContext(AuthContext);

  return {
    async getJobs(params) {
      const query = new URLSearchParams(params).toString();
      const res = await fetchWithAuth(`/api/notification-jobs?${query}`);
      if (!res.ok) throw new Error("Failed to fetch jobs");
      return await res.json();
    },
    async createJob(data) {
      const res = await fetchWithAuth(`/api/notification-jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error("Failed to create job");
      return await res.json();
    },
    async updateJob(id, data) {
      const res = await fetchWithAuth(`/api/notification-jobs/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error("Failed to update job");
      return await res.json();
    },
    async deleteJob(id) {
      const res = await fetchWithAuth(`/api/notification-jobs/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete job");
      return await res.json();
    }
  };
}