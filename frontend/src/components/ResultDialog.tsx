import React from "react";

type Props = {
    /** JSON payload returned from /api/verify-kyc */
    payload: any | null;
    /** Show / hide the dialog */
    open: boolean;
    /** Close button handler */
    onClose: () => void;
    /** Optional callback when the user clicks “Export”. */
    onExport?: (payload: any) => void;
};

export const ResultDialog: React.FC<Props> = ({
    payload,
    open,
    onClose,
    onExport,
}) => {
    if (!open) return null;

    const pretty = JSON.stringify(payload, null, 2);

    const statusLine = () => {
        if (!payload) return "";
        const { is_mock, stage1, stage2, nudges } = payload;
        const mockInfo =
            is_mock === false ? "Live Gemini (is_mock: false)" : "Mock mode";
        const stageInfo = stage1
            ? `Stage 1: ${JSON.stringify(stage1)}`
            : "Stage 1: –";
        const latencyInfo = stage2?.latency_ms
            ? `Latency: ${stage2.latency_ms} ms`
            : "";
        const nudgeInfo = nudges?.length ? `Nudges: ${nudges.join(", ")}` : "";
        return `${mockInfo} • ${stageInfo} • ${latencyInfo} ${nudgeInfo}`;
    };

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
            role="dialog"
            aria-modal="true"
        >
            <div className="bg-white rounded-lg shadow-xl w-11/12 max-w-xl p-6 overflow-auto max-h-[80vh]">
                <h2 className="text-xl font-semibold mb-4">Verification Result</h2>

                {payload ? (
                    <>
                        <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                            {pretty}
                        </pre>
                        <p className="mt-2 text-sm text-gray-700">{statusLine()}</p>
                        <div className="mt-4 flex justify-end space-x-2">
                            {onExport && (
                                <button
                                    onClick={() => onExport(payload)}
                                    className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                                >
                                    Export JSON
                                </button>
                            )}
                            <button
                                onClick={onClose}
                                className="px-3 py-1 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
                            >
                                Close
                            </button>
                        </div>
                    </>
                ) : (
                    <p className="text-gray-600">No result data available.</p>
                )}
            </div>
        </div>
    );
};