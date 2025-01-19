/**
 * Creates a function that combines throttling and debouncing behavior.
 * 
 * The returned function will invoke the provided function at most once
 * per `throttleInterval`, and if it stops receiving calls, it will execute
 * the function one last time with the latest arguments after the `debounceInterval`.
 * 
 * @param {Function} fn - The function to be throttled and debounced.
 * @param {number} [throttleInterval=800] - The minimum time (in milliseconds) between consecutive calls.
 * @param {number} [debounceInterval=500] - The time (in milliseconds) to wait after the last call before invoking the function.
 * @returns {Function} A new function that combines throttling and debouncing.
 */
function throttleDebounce(fn, throttleInterval = 800, debounceInterval = 800) {
	let lastCallTime = 0;
	let timeoutId = null;
	let lastArgs = null;

	function invokeFn() {
		fn(...lastArgs);
		lastCallTime = Date.now();
	}

	return function throttledDebouncedFn(...args) {
		lastArgs = args;
		const now = Date.now();

		if (now - lastCallTime >= throttleInterval) {
			// If it's time to throttle, invoke the function and reset the timer
			invokeFn();
			clearTimeout(timeoutId);
		} else {
			// If not, set a debounce timeout
			if (timeoutId) {
				clearTimeout(timeoutId);
			}
			timeoutId = setTimeout(() => {
				invokeFn();
			}, debounceInterval);
		}
	};
}

async function apiRequestServiceWorker(method, endpoint, params = null, body = null) {
	return new Promise((resolve, reject) => {
		console.log(body);
		chrome.runtime.sendMessage(
			{
				type: 'API_REQUEST',
				method: method,
				endpoint: endpoint,
				queryParams: params,
				body: body
			},
			response => {
				if (response.success) {
					// Handle successful response
					resolve(response);
				} else {
					// Handle error
					console.error('Error:', response.error);
					reject(response.error);
				}
			}
		);
	});
}

// Utility function to convert hex string to ArrayBuffer
function hexToArrayBuffer(hexString) {
	const pairs = hexString.match(/[\dA-F]{2}/gi);
	if (!pairs) return null;

	const integers = pairs.map(s => parseInt(s, 16));
	return new Uint8Array(integers).buffer;
}

// Import key from hex string
async function importKeyFromHex(hexString, isPublic = true) {
	try {
		const keyData = hexToArrayBuffer(hexString);
		if (!keyData) return null;

		return await window.crypto.subtle.importKey(
			isPublic ? "raw" : "pkcs8",
			keyData,
			{
				name: "ECDSA",
				namedCurve: "P-256"
			},
			true,
			isPublic ? ["verify"] : ["sign"]
		);
	} catch (error) {
		console.error('Error importing key:', error);
		return null;
	}
}

/**
 * Gets the user's content warning preferences from storage.
 * Returns an object indicating which categories should be hidden.
 * If showX is true, that category will be hidden (no warning shown).
 * If showX is false, that category will be shown (warning displayed).
 *
 * @returns {Promise<Object>} An object containing boolean flags for each category
 */
async function getContentPreferences() {
	try {
		const result = await chrome.storage.sync.get([
			'hideMisinformation',
			'hideTrigger',
			'hideSlop',
			'hideEpilepsy'
		]);

		// Convert undefined values to false (show warnings by default)
		return {
			misinformation: result.hideMisinformation || false,
			trigger: result.hideTrigger || false,
			slop: result.hideSlop || false,
			epilepsy: result.hideEpilepsy || false
		};
	} catch (error) {
		console.error('Error getting content preferences:', error);
		// Return default values if there's an error
		return {
			misinformation: false,
			trigger: false,
			slop: false,
			epilepsy: false
		};
	}
}


async function getKeys() {
	let result = await chrome.storage.sync.get([
		'privateKey',
		'publicKey'
	]);

	console.log(result.privateKey);
	console.log(result.publicKey);

	const importedprivateKey = await importKeyFromHex(result.privateKey, false);
	const importedpublicKey = await importKeyFromHex(result.publicKey, true);

	if (importedprivateKey && importedpublicKey) {
		return {
			privateKey: importedprivateKey,
			publicKey: importedpublicKey
		};
	}
}

async function digestMessage(message) {
	console.log("Received to hash: ", message)
	const msgUint8 = new TextEncoder().encode(message); // encode as (utf-8) Uint8Array
	const hashBuffer = await window.crypto.subtle.digest("SHA-1", msgUint8); // hash the message
	const hashArray = Array.from(new Uint8Array(hashBuffer)); // convert buffer to byte array
	console.log("Reached1", message)
	const hashHex = hashArray
	  .map((b) => b.toString(16).padStart(2, "0"))
	  .join(""); // convert bytes to hex string
	return hashHex;
  }