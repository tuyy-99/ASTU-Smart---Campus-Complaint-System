const isProfessionalMode = () => {
  const mode = String(import.meta.env.VITE_APP_MODE || '').toLowerCase();
  const style = String(import.meta.env.VITE_APP_STYLE || '').toLowerCase();
  const flag = String(import.meta.env.VITE_PROFESSIONAL_LANDING || '').toLowerCase();

  return mode === 'professional' || style === 'professional' || flag === 'true';
};

export const getPostLogoutRoute = () => {
  return isProfessionalMode() ? '/' : '/';
};
