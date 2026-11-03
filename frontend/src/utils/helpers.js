export const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
};

export const formatRole = (role) => {
  if (role === "student") return "🎓 Student";
  if (role === "driver") return "🚗 Driver";
  if (role === "admin") return "👑 Admin";
  return role;
};