import React, { useRef, useEffect, useState } from "react";
import { CameraOff } from "lucide-react";

interface WebcamPreviewProps {
    onPermissionError: () => void;
    onVideoRef?: (video: HTMLVideoElement | null) => void;
    onPermissionRequestStart?: () => void;
    onPermissionRequestEnd?: () => void;
    className?: string;
}

export const WebcamPreview: React.FC<WebcamPreviewProps> = ({ 
    onPermissionError, 
    onVideoRef, 
    onPermissionRequestStart,
    onPermissionRequestEnd,
    className 
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (onVideoRef && videoRef.current) {
            onVideoRef(videoRef.current);
        }
    }, [videoRef.current, onVideoRef]);


    useEffect(() => {
        let mounted = true;

        async function setupCamera() {
            try {
                if (onPermissionRequestStart) onPermissionRequestStart();
                const mediaStream = await navigator.mediaDevices.getUserMedia({
                    video: { width: 320, height: 240 }
                });

                if (mounted) {
                    setStream(mediaStream);
                    if (videoRef.current) {
                        videoRef.current.srcObject = mediaStream;
                    }
                }
                if (onPermissionRequestEnd) onPermissionRequestEnd();
            } catch (err) {
                console.error("Camera access denied:", err);
                if (mounted) {
                    setError(true);
                    onPermissionError();
                }
                if (onPermissionRequestEnd) onPermissionRequestEnd();
            }
        }

        setupCamera();

        return () => {
            mounted = false;
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, []); // Run once on mount

    return (
        <div className={`relative overflow-hidden rounded-lg bg-black border border-slate-700 shadow-md ${className}`}>
            {!error ? (
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover transform scale-x-[-1]"
                />
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 bg-slate-900 p-4 text-center">
                    <CameraOff className="w-8 h-8 mb-2 text-red-500" />
                    <span className="text-xs">Camera Access Denied</span>
                </div>
            )}

            {!error && (
                <div className="absolute top-2 right-2 bg-red-600 w-3 h-3 rounded-full animate-pulse shadow-sm" title="Recording in progress" />
            )}

            <div className="absolute bottom-2 left-2 text-[10px] text-white/70 bg-black/50 px-2 py-0.5 rounded">
                Rec
            </div>
        </div>
    );
};
