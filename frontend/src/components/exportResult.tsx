/**
 * Triggers a download of the given object as a JSON file.
 *
 * @param data      The JSON‑serializable result object.
 * @param filename  Desired filename (defaults to "result.json").
 */
export const exportResult = (data: any, filename = "result.json"): void => {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();

    // Cleanup
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 0);
};