import { ref, reactive, watch } from 'vue';

const API_BASE = "https://rtapi-sg.eccweb.mobi/rtapi/mt5";
const POLL_INTERVAL = 5000;

export function useTrading(currentAccount, getToken) {
  const isPolling = ref(false);
  const stats = ref([]);
  const totalProfit = ref(0);
  const totalLoss = ref(0);
  const timeLeft = ref(POLL_INTERVAL / 1000);

  let pollTimer = null;
  let countdownTimer = null;

  // --- Helpers ---
  function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  function processData(data) {
    if (!data || !Array.isArray(data.positions)) {
      stats.value = [];
      totalProfit.value = 0;
      totalLoss.value = 0;
      return; 
    }

    const positions = data.positions.map(p => ({
      ...p,
      volume: Number(p.volume) || 0,
      open_price: Number(p.open_price) || 0,
      profit: Number(p.profit) || 0
    }));

    // Group by instrument
    const instrumentMap = {};
    
    positions.forEach(p => {
      if (!instrumentMap[p.instrument]) {
        instrumentMap[p.instrument] = { buys: [], sells: [], positions: [] };
      }
      instrumentMap[p.instrument].positions.push(p);
      if (p.type === 0) {
        instrumentMap[p.instrument].buys.push(p);
      } else if (p.type === 1) {
        instrumentMap[p.instrument].sells.push(p);
      }
    });

    // Calculate total profit and loss
    let accProfit = 0;
    let accLoss = 0;
    positions.forEach(p => {
      if (p.profit > 0) {
        accProfit += p.profit;
      } else {
        accLoss += p.profit;
      }
    });
    totalProfit.value = accProfit;
    totalLoss.value = accLoss;

    // Calculate stats for each instrument
    stats.value = Object.keys(instrumentMap).map(instrument => {
      const { buys, sells, positions: instPositions } = instrumentMap[instrument];
      
      const buyVol = buys.reduce((s, p) => s + p.volume, 0);
      const sellVol = sells.reduce((s, p) => s + p.volume, 0);
      
      const buyValue = buys.reduce((s, p) => s + p.volume * p.open_price, 0);
      const sellValue = sells.reduce((s, p) => s + p.volume * p.open_price, 0);
      
      const avgBuy = buyVol ? buyValue / buyVol : 0;
      const avgSell = sellVol ? sellValue / sellVol : 0;
      
      // Calculate profit/loss for this instrument
      const totalProfit = instPositions.filter(p => p.profit > 0).reduce((sum, p) => sum + p.profit, 0);
      const totalLoss = instPositions.filter(p => p.profit < 0).reduce((sum, p) => sum + p.profit, 0);
      const profitPositions = instPositions.filter(p => p.profit > 0);
      const lossPositions = instPositions.filter(p => p.profit < 0);
      
      return {
        instrument,
        buyVol,
        avgBuy,
        sellVol,
        avgSell,
        totalProfit,
        totalLoss,
        profitPositions,
        lossPositions,
        buyPositions: buys,
        sellPositions: sells,
        allPositions: instPositions
      };
    });
  }

  // --- Actions ---
  function stopPolling() {
    if (pollTimer) clearInterval(pollTimer);
    if (countdownTimer) clearInterval(countdownTimer);
    pollTimer = null;
    countdownTimer = null;
    isPolling.value = false;
  }

  function startCountdown() {
    if (countdownTimer) clearInterval(countdownTimer);
    timeLeft.value = POLL_INTERVAL / 1000;
    countdownTimer = setInterval(() => {
      timeLeft.value = Math.max(0, timeLeft.value - 1);
    }, 1000);
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
            // For other runtime errors, we just log and let the next poll try again
            return;
          }
          
          if (response && response.success) {
            processData(response.data);
          }
        }
      );
    } catch (e) {
      console.warn("[Exness Vue] SendMessage failed (will retry):", e);
      // Don't stop polling on temporary errors, let setInterval continue
    }
  }

  function startPolling() {
    stopPolling(); // Ensure clean start
    if (!currentAccount.isReady) return;
    
    fetchData(); // Call immediately
    startCountdown(); // Start countdown
    pollTimer = setInterval(() => {
      fetchData();
      startCountdown(); // Restart countdown after each fetch
    }, POLL_INTERVAL);
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
      "ga": "GA1.1.1407596536.1762928507",
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
        setTimeout(fetchData, 500);
        setTimeout(fetchData, 2000);
      } else {
        console.error("[Exness Vue] Close Profit Failed", response);
      }
    });
  }

  function closeAllStopLoss() {
    if (!currentAccount.isReady) {
      console.warn("Account info not ready");
      return;
    }
    const token = getToken();
    if (!token) return;

    const body = {
      "ga": "GA1.1.1407596536.1762928507",
      "fp": "088cd089c479e941d6df789d806550c2",
      "track_uid": "",
      "cid": "exterm_web_" + generateUUID(),
      "agent_timestamp": "",
      "agent": "",
      "agent_full_path": ""
    };

    const url = `${API_BASE}/${currentAccount.server}/v1/accounts/${currentAccount.login}/positions/all/close?close_mode=CLOSE_LOSS`;

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
        console.log("[Exness Vue] Close Stop Loss Success");
        setTimeout(fetchData, 500);
        setTimeout(fetchData, 2000);
      } else {
        console.error("[Exness Vue] Close Stop Loss Failed", response);
      }
    });
  }

  function closePosition(positionId, volume, price) {
    if (!currentAccount.isReady) {
      console.warn("Account info not ready");
      return Promise.reject("Account not ready");
    }
    const token = getToken();
    if (!token) return Promise.reject("No token");

    const cid = "exterm_web_" + generateUUID();
    const body = {
      "position": {
        "price": price,
        "volume": volume,
        "close_by_id": 0
      },
      "ga": "GA1.1.1407596536.1762928507",
      "fp": "088cd089c479e941d6df789d806550c2",
      "track_uid": "",
      "cid": cid,
      "agent_timestamp": "",
      "agent": "",
      "agent_full_path": ""
    };

    const url = `${API_BASE}/${currentAccount.server}/v2/accounts/${currentAccount.login}/positions/${positionId}/close`;

    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        action: "sendRequest",
        url: url,
        method: "PUT",
        token: token,
        body: body,
        extraHeaders: {
          "x-cid": cid,
          "x-request-id": generateUUID()
        }
      }, (response) => {
        if (response && response.success) {
          console.log(`[Exness Vue] Close Position ${positionId} Success`);
          resolve(response);
        } else {
          console.error(`[Exness Vue] Close Position ${positionId} Failed`, response);
          reject(response);
        }
      });
    });
  }

  function closePositions(positions) {
    const promises = positions.map(p => 
      closePosition(p.position_id, p.volume, p.price)
    );
    
    return Promise.allSettled(promises).then(() => {
      setTimeout(fetchData, 500);
      setTimeout(fetchData, 2000);
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
    timeLeft,
    totalProfit,
    totalLoss,
    startPolling,
    stopPolling,
    fetchData,
    closeAllProfit,
    closeAllStopLoss,
    closePositions
  };
}
