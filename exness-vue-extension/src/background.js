// src/background.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "fetchData") {
    // Legacy support for polling
    doRequest(request.url, "GET", request.token)
      .then(data => sendResponse({ success: true, data: data }))
      .catch(error => sendResponse({ success: false, error: error.toString() }));
    return true;
  }
  
  if (request.action === "sendRequest") {
    // Generic request support
    doRequest(request.url, request.method, request.token, request.body, request.extraHeaders)
      .then(data => sendResponse({ success: true, data: data }))
      .catch(error => sendResponse({ success: false, error: error.toString() }));
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
