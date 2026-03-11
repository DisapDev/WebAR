// Helper to get URL params (e.g. ?id=test6)
export function getModelID() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id'); // Returns 'test6' or null
}

// Helper to construct paths dynamically
export function getPaths(modelID) {
    const basePath = `../models/${modelID}`;
    return {
        base: basePath,
        manifest: `${basePath}/phase_manifest_${modelID}.json`,
        dataMap: `${basePath}/data_map.json`,
        // Helper to get glb path from a phase name
        getGLBPath: (phaseName) => `${basePath}/${phaseName}.glb`
    };
}

// Helper to load the JSON Manifest
export async function loadProjectManifest(modelID, onProgress) {
    const paths = getPaths(modelID);
    try {
        const response = await fetch(paths.manifest);
        if (!response.ok) throw new Error(`Manifest not found for ${modelID}`);
        // if caller doesn't care about progress or response body not streamable, act as before
        if (!onProgress || !response.body) {
            return await response.json();
        }
        // stream with progress reporting
        const contentLength = +response.headers.get('Content-Length') || 0;
        const reader = response.body.getReader();
        let received = 0;
        const chunks = [];
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
            received += value.length;
            try {
                onProgress(received, contentLength);
            } catch (e) {
                // callback errors shouldn't break loading
                console.warn('onProgress callback error', e);
            }
        }
        const decoder = new TextDecoder('utf-8');
        // combine chunks into single Uint8Array
        let combined = new Uint8Array(received);
        let offset = 0;
        for (const chunk of chunks) {
            combined.set(chunk, offset);
            offset += chunk.length;
        }
        const text = decoder.decode(combined);
        return JSON.parse(text);
    } catch (e) {
        console.error(e);
        alert(`Error loading project: ${modelID}. Check console.`);
        return null;
    }
}