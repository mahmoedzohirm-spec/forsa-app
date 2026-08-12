export const api = {
  getTickets: (limit = 5000) =>
    fetch(`/api/tickets?limit=${limit}`).then((r) => r.json()),

  bookTicket: (data: any) =>
    fetch("/api/tickets/book", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((r) => r.json()),

  getPaymentMethods: () =>
    fetch("/api/payment-methods").then((r) => r.json()),

  getSettings: () =>
    fetch("/api/admin/settings").then((r) => r.json()),

  saveSettings: (settings: any) =>
    fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ settings }),
    }).then((r) => r.json()),

  getPrizes: () =>
    fetch("/api/admin/prizes").then((r) => r.json()),

  addPrize: (prize: any) =>
    fetch("/api/admin/prizes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(prize),
    }).then((r) => r.json()),

  updatePrize: (prize: any) =>
    fetch("/api/admin/prizes", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(prize),
    }).then((r) => r.json()),

  deletePrize: (id: number) =>
    fetch("/api/admin/prizes", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    }).then((r) => r.json()),

  approveTicket: (ticketNumber: number) =>
    fetch("/api/admin/tickets/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticketNumber }),
    }).then((r) => r.json()),

  rejectTicket: (ticketNumber: number, reason: string) =>
    fetch("/api/admin/tickets/reject", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticketNumber, reason }),
    }).then((r) => r.json()),

  getDrawData: () =>
    fetch("/api/admin/draw").then((r) => r.json()),

  saveDrawResult: (data: any) =>
    fetch("/api/admin/draw", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((r) => r.json()),

  getUsers: () =>
    fetch("/api/admin/users").then((r) => r.json()),

  banUser: (userId: number, ban: boolean) =>
    fetch("/api/admin/users/ban", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, ban }),
    }).then((r) => r.json()),

  resetTickets: (count: number) =>
    fetch("/api/admin/tickets/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ count }),
    }).then((r) => r.json()),

  initApp: () =>
    fetch("/api/init").then((r) => r.json()),
};
