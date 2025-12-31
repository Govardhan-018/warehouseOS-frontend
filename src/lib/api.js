const BASE = import.meta.env.VITE_BACKEND_URL;

export async function fetchUtility(mail, token) {
  if (!mail) throw new Error("mail is required");
  if (!token) throw new Error("token is required");

  const res = await fetch(`${BASE}/utility`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ mail }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData?.error || `Server error: ${res.status}`);
  }

  return res.json();
}

export default { fetchUtility };

export async function fetchUtilitySummary(mail, token) {
  const data = await fetchUtility(mail, token);
  const totalCapacity = typeof data.totalCapacity === "number" ? data.totalCapacity : Number(data.totalCapacity) || 0;
  const totalOccupied = typeof data.totalOccupied === "number" ? data.totalOccupied : Number(data.totalOccupied) || 0;
  const utilizationPercent = totalCapacity > 0 ? (totalOccupied / totalCapacity) * 100 : 0;
  const usedText = `${totalOccupied}/${totalCapacity} used`;
  return { totalCapacity, totalOccupied, utilizationPercent, usedText, raw: data };
}
