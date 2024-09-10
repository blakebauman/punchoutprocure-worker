export const acquireLock = async (key: string, timeout = 5000): Promise<boolean> => {
	const lock = await caches.default.match(key);
	if (lock) {
		return false; // Lock is already held
	}

	// Set lock with timeout
	const lockResponse = new Response('locked', { status: 200 });
	await caches.default.put(key, lockResponse.clone());
	return true;
};

export const releaseLock = async (key: string): Promise<void> => {
	await caches.default.delete(key);
};
