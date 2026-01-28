import { reactive } from 'vue';

export function useAccount() {
  const currentAccount = reactive({
    login: null,
    server: null,
    isReady: false,
    error: null
  });

  const allAccounts = reactive([]);

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

    // 2. Fetch All Accounts to find Server
    try {
      chrome.runtime.sendMessage({
        action: "sendRequest",
        url: "https://my.exness.com/v4/wta-api/async/personal_area/account?legal_entity=vc&platform_type=",
        method: "GET",
        token: token
      }, (response) => {
        if (response && response.success && Array.isArray(response.data)) {
          allAccounts.length = 0;
          allAccounts.push(...response.data);

          // 1. Get Active Account ID from LocalStorage
          let activeLogin = localStorage.getItem('texActiveAccountNumber');

          // If no active account or not found in list, use first account
          let selectedAccount = response.data.filter(a => a.is_active)[0];
          if (activeLogin) {
            selectedAccount = response.data.find(a => String(a.account_login) === String(activeLogin));
          }

          if (selectedAccount && selectedAccount.server) {
            currentAccount.login = activeLogin;
            currentAccount.server = parseServerName(selectedAccount.server.server_name || selectedAccount.server.server_code);
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

  function switchAccount(accountLogin) {
    const account = allAccounts.find(a => String(a.account_login) === String(accountLogin));
    if (account && account.server) {
      currentAccount.login = String(account.account_login);
      currentAccount.server = parseServerName(account.server.server_name || account.server.server_code);
      currentAccount.isReady = true;
      currentAccount.error = null;
      localStorage.setItem('texActiveAccountNumber', currentAccount.login);
      console.log(`[Exness Vue] Switched to: Login=${currentAccount.login}, Server=${currentAccount.server}`);
    } else {
      currentAccount.error = "Account Switch Failed. accountLogin=" + accountLogin;
      console.warn("[Exness Vue] Account not found in list or no server info", accountLogin);
    }
  }

  return {
    currentAccount,
    allAccounts,
    getToken,
    initAccountInfo,
    switchAccount
  };
}
