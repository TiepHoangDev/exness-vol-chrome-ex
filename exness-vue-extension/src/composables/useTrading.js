import { ref, reactive, watch } from 'vue';

const API_BASE = "https://rtapi-sg.eccweb.mobi/rtapi/mt5";
const POLL_INTERVAL = 5000;

export function useTrading(currentAccount, getToken) {
  const isPolling = ref(false);
  const stats = reactive({
    buyVol: 0, avgBuy: 0,
    sellVol: 0, avgSell: 0,
    avgBreakEven: 0
  });

  let pollTimer = null;

  // --- Helpers ---
  function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  function processData(data) {
    if (!data || !Array.isArray(data.positions)) {
      // Có thể reset stats về 0 nếu muốn, hoặc giữ nguyên giá trị cũ
      return; 
    }

    const positions = data.positions.map(p => ({
      ...p,
      volume: Number(p.volume) || 0,
      open_price: Number(p.open_price) || 0
    }));

    const buys = positions.filter(p => p.type === 0);
    const sells = positions.filter(p => p.type === 1);

    const buyVol = buys.reduce((s, p) => s + p.volume, 0);
    const sellVol = sells.reduce((s, p) => s + p.volume, 0);

    const buyValue = buys.reduce((s, p) => s + p.volume * p.open_price, 0);
    const sellValue = sells.reduce((s, p) => s + p.volume * p.open_price, 0);

    stats.buyVol = buyVol;
    stats.sellVol = sellVol;
    stats.avgBuy = buyVol ? buyValue / buyVol : 0;
    stats.avgSell = sellVol ? sellValue / sellVol : 0;

    if (buyVol && sellVol) {
      const totalVol = buyVol + sellVol;
      stats.avgBreakEven = (stats.avgBuy * buyVol + stats.avgSell * sellVol) / totalVol;
    } else {
      stats.avgBreakEven = buyVol ? stats.avgBuy : stats.avgSell;
    }
  }

  // --- Actions ---
  function stopPolling() {
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = null;
    isPolling.value = false;
  }

  function fetchData() {
    if (!currentAccount.isReady) return;
    const token = getToken();
    if (!token) return;

    const url = `${API_BASE}/${currentAccount.server}/v1/accounts/${currentAccount.login}/positions`;

    try {
      chrome.runtime.sendMessage(
        { action: "fetchData", url: url, token },
        (response) => {
          if (chrome.runtime.lastError) {
            console.warn("[Exness Vue] Runtime error:", chrome.runtime.lastError.message);
            if (chrome.runtime.lastError.message.includes("Extension context invalidated")) {
              stopPolling();
            }
            return;
          }
          
          if (response && response.success) {
            processData(response.data);
          }
        }
      );
    } catch (e) {
      console.warn("[Exness Vue] SendMessage failed:", e);
      stopPolling();
    }
  }

  function startPolling() {
    stopPolling(); // Ensure clean start
    if (!currentAccount.isReady) return;
    
    fetchData(); // Call immediately
    pollTimer = setInterval(fetchData, POLL_INTERVAL);
    isPolling.value = true;
  }

  function closeAllProfit() {
    if (!currentAccount.isReady) {
      console.warn("Account info not ready");
      return;
    }
    const token = getToken();
    if (!token) return;

    const body = {
      "ga": "GA1.1.1407596536.1762928507", // Could be generated dynamically if needed
      "fp": "088cd089c479e941d6df789d806550c2",
      "track_uid": "",
      "cid": "exterm_web_" + generateUUID(),
      "agent_timestamp": "",
      "agent": "",
      "agent_full_path": ""
    };

    const url = `${API_BASE}/${currentAccount.server}/v1/accounts/${currentAccount.login}/positions/all/close?close_mode=CLOSE_PROFIT`;

    chrome.runtime.sendMessage({
      action: "sendRequest",
      url: url,
      method: "PUT",
      token: token,
      body: body,
      extraHeaders: {
        "x-cid": body.cid,
        "x-request-id": generateUUID()
      }
    }, (response) => {
      if (response && response.success) {
        console.log("[Exness Vue] Close Profit Success");
        // Refresh fast
        setTimeout(fetchData, 500);
        setTimeout(fetchData, 2000);
      } else {
        console.error("[Exness Vue] Close Profit Failed", response);
      }
    });
  }

  // Watch for account readiness to start polling automatically
  watch(() => currentAccount.isReady, (ready) => {
    if (ready) {
      startPolling();
    }
  });

  return {
    stats,
    isPolling,
    startPolling,
    stopPolling,
    fetchData,
    closeAllProfit
  };
}
