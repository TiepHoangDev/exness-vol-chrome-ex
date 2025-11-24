import { reactive } from 'vue';

export function useAccount() {
  const currentAccount = reactive({
    login: null,
    server: null,
    isReady: false,
    error: null
  });

  function getToken() {
    const matches = document.cookie.match(/(?:^|;\s*)JWT=([^;]+)/);
    return matches ? matches[1] : null;
  }

  function parseServerName(rawName) {
    if (!rawName) return "real20"; // Fallback
    const lower = rawName.toLowerCase();
    // Regex: tìm cụm từ (real|trial) theo sau là số
    const match = lower.match(/(real|trial)\d+/);
    if (match) return match[0];
    return "real20"; // Default fallback
  }

  async function initAccountInfo() {
    const token = getToken();
    if (!token) {
      currentAccount.error = "No Token";
      console.warn("[Exness Vue] No token found");
      return;
    }

    // 1. Get Active Account ID from LocalStorage
    const activeLogin = localStorage.getItem('ACTIVE_ACCOUNT_NUMBER');
    if (!activeLogin) {
      currentAccount.error = "No Active Account";
      console.warn("[Exness Vue] No ACTIVE_ACCOUNT_NUMBER in localStorage");
      return;
    }
    currentAccount.login = activeLogin;

    // 2. Fetch All Accounts to find Server
    try {
      chrome.runtime.sendMessage({
        action: "sendRequest",
        url: "https://my.exness.com/v4/wta-api/async/personal_area/account?legal_entity=vc&platform_type=",
        method: "GET",
        token: token
      }, (response) => {
        if (response && response.success && Array.isArray(response.data)) {
          const acc = response.data.find(a => String(a.account_login) === String(activeLogin));
          if (acc && acc.server) {
            currentAccount.server = parseServerName(acc.server.server_name || acc.server.server_code);
            currentAccount.isReady = true;
            currentAccount.error = null;
            console.log(`[Exness Vue] Configured: Login=${currentAccount.login}, Server=${currentAccount.server}`);
          } else {
            currentAccount.error = "Server Not Found";
            console.warn("[Exness Vue] Account not found in list or no server info");
          }
        } else {
          currentAccount.error = "API Error";
          console.error("[Exness Vue] Failed to fetch accounts list", response);
        }
      });
    } catch (e) {
      currentAccount.error = "Init Failed";
      console.error(e);
    }
  }

  return {
    currentAccount,
    getToken,
    initAccountInfo
  };
}
