import { useEffect, useRef, useState } from 'react';

export function useSpeechToText({
    lang = 'es-ES',
    interim = true,
    continuous = true,
    } = {}) {
    const recognitionRef = useRef(null);
    const [transcript, setTranscript] = useState('');
    const [listening, setListening] = useState(false);
    const [isSupported, setIsSupported] = useState(true);

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
        setIsSupported(false);
        return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = lang;
        recognition.continuous = continuous;
        recognition.interimResults = interim;

        recognition.onresult = (event) => {
        let result = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            result += event.results[i][0].transcript;
        }
        setTranscript(result);
        };

        recognition.onerror = (e) => {
        console.error('Error de reconocimiento:', e);
        };

        recognition.onend = () => {
        setListening(false);
        };

        recognitionRef.current = recognition;
    }, [lang, interim, continuous]);

    const start = () => {
        if (recognitionRef.current) {
        setTranscript('');
        recognitionRef.current.start();
        setListening(true);
        }
    };

    const stop = () => {
        if (recognitionRef.current) {
        recognitionRef.current.stop();
        setListening(false);
        }
    };

    return {
        transcript,
        listening,
        start,
        stop,
        isSupported,
    };
}
