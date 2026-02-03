// src/background.js

// Error tracking
async function logError(message) {
  try {
    const result = await chrome.storage.local.get(['exness_errors']);
    const errors = result.exness_errors || [];
    errors.unshift({
      timestamp: Date.now(),
      message: message
    });
    // Keep only last 50 errors
    if (errors.length > 50) {
      errors.length = 50;
    }
    await chrome.storage.local.set({ exness_errors: errors });
  } catch (e) {
    console.error("Failed to log error:", e);
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "fetchData") {
    // Legacy support for polling
    doRequest(request.url, "GET", request.token)
      .then(data => sendResponse({ success: true, data: data }))
      .catch(error => {
        logError(`Fetch error: ${error.toString()}`);
        sendResponse({ success: false, error: error.toString() });
      });
    return true;
  }
  
  if (request.action === "sendRequest") {
    // Generic request support
    doRequest(request.url, request.method, request.token, request.body, request.extraHeaders)
      .then(data => sendResponse({ success: true, data: data }))
      .catch(error => {
        logError(`Request error (${request.method}): ${error.toString()}`);
        sendResponse({ success: false, error: error.toString() });
      });
    return true;
  }
  
  if (request.action === "logError") {
    logError(request.message);
    sendResponse({ success: true });
    return true;
  }
  
  if (request.action === "getErrors") {
    chrome.storage.local.get(['exness_errors']).then(result => {
      sendResponse({ success: true, errors: result.exness_errors || [] });
    });
    return true;
  }
  
  if (request.action === "clearErrors") {
    chrome.storage.local.set({ exness_errors: [] }).then(() => {
      sendResponse({ success: true });
    });
    return true;
  }
});

async function doRequest(url, method = "GET", token, body = null, extraHeaders = {}) {
  try {
    const headers = {
      "Accept": "application/json, text/plain, */*",
      "Authorization": "Bearer " + token,
      "Content-Type": "application/json",
      ...extraHeaders
    };

    const options = {
      method,
      headers
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      // Try to parse error body if possible
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
    }

    // Some APIs might return empty body (204 No Content)
    if (response.status === 204) return {};

    return await response.json();
  } catch (error) {
    console.error("Background request error:", error);
    throw error;
  }
}
