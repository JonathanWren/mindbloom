"'use client'"

import React, { useState, useRef, useCallback, useEffect } from "'react'"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Mic, AlertCircle, Loader2, Volume2, StopCircle } from "'lucide-react'"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Scenario } from "'../types/scenario'"
import { socket } from "'../utils/socket'"

interface AudioRecorderProps {
  selectedScenario: Scenario | null;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({ selectedScenario }) => {
  const [isRecording, setIsRecording] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [conversation, setConversation] = useState<{ role: "'user'" | "'assistant'", content: string }[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [micPermission, setMicPermission] = useState<PermissionState | null>(null)
  const [currentTranscription, setCurrentTranscription] = useState("''")

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const transcriptionTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    checkMicrophonePermission()
    initSocket()
    return () => {
      if (transcriptionTimeoutRef.current) {
        clearTimeout(transcriptionTimeoutRef.current)
      }
    }
  }, [])

  const initSocket = useCallback(() => {
    socket.on("'connect'", () => {
      console.log("'Connected to WebSocket server'")
    })

    socket.on("'transcription'", (transcription: string) => {
      setCurrentTranscription(prev => prev + "'" + transcription.trim())
      if (transcriptionTimeoutRef.current) {
        clearTimeout(transcriptionTimeoutRef.current)
      }
      transcriptionTimeoutRef.current = setTimeout(finalizeTranscription, 1000)
    })

    socket.on("'disconnect'", () => {
      console.log("'Disconnected from WebSocket server'")
    })
  }, [])

  const checkMicrophonePermission = useCallback(async () => {
    try {
      const permission = await navigator.permissions.query({ name: "'microphone'" as PermissionName })
      setMicPermission(permission.state)
      permission.onchange = () => {
        setMicPermission(permission.state)
      }
    } catch (err) {
      console.error("'Error checking microphone permission:'", err)
      setMicPermission("'denied'")
    }
  }, [])

  const requestMicrophonePermission = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach(track => track.stop())
      setMicPermission("'granted'")
      setError(null)
    } catch (err) {
      console.error("'Error requesting microphone access:'", err)
      setMicPermission("'denied'")
      setError("'Microphone access was denied. Please enable your microphone and try again.'")
    }
  }, [])

  const startRecording = useCallback(async () => {
    if (micPermission !== "'granted'") {
      await requestMicrophonePermission()
      return
    }

    if (isSpeaking) {
      stopSpeaking()
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "'audio/webm'" })
    
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          socket.emit("'binaryData'", event.data)
        }
      }

      mediaRecorder.start(100) // Capture audio in 100ms chunks
      setIsRecording(true)
      setError(null)
      mediaRecorderRef.current = mediaRecorder

      socket.emit("'startStream'")
    } catch (err) {
      console.error("'Error starting recording:'", err)
      setError("'Error starting recording. Please try again.'")
    }
  }, [micPermission, requestMicrophonePermission, isSpeaking])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "'recording'") {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
    }
    setIsRecording(false)
    socket.emit("'endStream'")
    finalizeTranscription()
  }, [])

  const finalizeTranscription = useCallback(() => {
    if (currentTranscription.trim()) {
      setConversation(prev => [...prev, { role: "'user'", content: currentTranscription.trim() }])
      getAIResponse(currentTranscription.trim())
      setCurrentTranscription("''")
    }
  }, [currentTranscription])

  const speakAIResponse = useCallback(async (text: string) => {
    setIsSpeaking(true)
    try {
      const response = await fetch("'/api/tts'", {
        method: "'POST'",
        headers: {
          "'Content-Type'": "'application/json'",
        },
        body: JSON.stringify({ 
          text,
          voice: selectedScenario?.voice || "'Joanna'" 
        }),
      })

      if (!response.ok) {
        throw new Error("'Failed to generate speech'")
      }

      const audioBlob = await response.blob()
      const url = URL.createObjectURL(audioBlob)
      audioRef.current = new Audio(url)
      audioRef.current.onended = () => {
        setIsSpeaking(false)
      }
      audioRef.current.play()
    } catch (error) {
      console.error("'Error playing AI response:'", error)
      setError("'Error playing AI response. Please try again.'")
      setIsSpeaking(false)
    }
  }, [selectedScenario])

  const stopSpeaking = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    setIsSpeaking(false)
  }, [])

  const getAIResponse = useCallback(async (userMessage: string) => {
    setIsProcessing(true)
    try {
      const rolePlayingPrompt = `You are role-playing as ${selectedScenario?.personName}, the character described in the following scenario. You must stay in character at all times, responding as ${selectedScenario?.personName} would, based on their background and the current situation. You are having a conversation with an HR representative about the situation described below.

Scenario details:
Name: ${selectedScenario?.personName}
Age: ${selectedScenario?.age}
Ethnicity: ${selectedScenario?.ethnicity}
Goal: ${selectedScenario?.goal}
Backstory: ${selectedScenario?.backstory}

Remember, you are ${selectedScenario?.personName}. You are visibly upset about the situation and use strong (but professional) language in your responses. You are keen to present your side of the story.

Here's the conversation so far:
${conversation.map(msg => `${msg.role === "'user'" ? "'HR'" : selectedScenario?.personName}: ${msg.content}`).join("'\n'")}

HR: ${userMessage}

Respond to the HR representative's last message as ${selectedScenario?.personName}, staying true to the character and their situation:`

      const response = await fetch("'/api/chat'", {
        method: "'POST'",
        headers: {
          "'Content-Type'": "'application/json'",
        },
        body: JSON.stringify({ message: rolePlayingPrompt }),
      })

      if (!response.ok) {
        throw new Error("'Failed to get AI response'")
      }

      const data = await response.json()
      const aiResponse = data.response
      setConversation(prev => [...prev, { role: "'assistant'", content: aiResponse }])
      await speakAIResponse(aiResponse)
    } catch (error) {
      console.error("'Error getting AI response:'", error)
      setError("'Error getting AI response. Please try again.'")
    } finally {
      setIsProcessing(false)
    }
  }, [selectedScenario, conversation, speakAIResponse])

  if (!selectedScenario) {
    return (
      <Card className="w-full max-w-2xl bg-white shadow-lg">
        <CardContent className="flex flex-col items-center justify-center space-y-4 p-6 h-[400px]">
          <h2 className="text-2xl font-bold text-gray-700">Select a Scenario</h2>
          <p className="text-gray-500 text-center">
            Please choose a scenario from the sidebar to start the conversation.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-2xl bg-white shadow-lg">
      <CardContent className="flex flex-col items-center space-y-4 p-6">
        <div className="w-full text-left mb-4">
          <h2 className="text-2xl font-bold text-green-700">{selectedScenario.heading}</h2>
          <p className="text-lg"><strong>Speaking with:</strong> {selectedScenario.personName}</p>
          <p><strong>Age:</strong> {selectedScenario.age}</p>
          <p><strong>Ethnicity:</strong> {selectedScenario.ethnicity}</p>
          <p><strong>Goal:</strong> {selectedScenario.goal}</p>
          <p><strong>Backstory:</strong> {selectedScenario.backstory}</p>
        </div>
        <div className="w-24 h-24 rounded-full bg-green-500 shadow-md flex items-center justify-center mb-4">
          <Mic className="w-12 h-12 text-white" />
        </div>
        {micPermission === "'prompt'" && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Microphone Access Required</AlertTitle>
            <AlertDescription>
              Please allow microphone access to use this feature.
              <Button onClick={requestMicrophonePermission} variant="outline" size="sm" className="ml-2">
                Enable Microphone
              </Button>
            </AlertDescription>
          </Alert>
        )}
        <div className="flex space-x-4">
          <Button 
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onTouchStart={startRecording}
            onTouchEnd={stopRecording}
            className={`flex items-center justify-center space-x-2 px-4 py-2 rounded-full ${
              isRecording 
                ? "'bg-red-600 hover:bg-red-700 text-white'" 
                : "'bg-green-500 hover:bg-green-600 text-white'"
            }`}
            disabled={isProcessing || micPermission === "'denied'"}
          >
            <Mic className="w-5 h-5" />
            <span>{isRecording ? "'Recording...'" : "'Hold to Speak'"}</span>
          </Button>
          {isSpeaking && (
            <Button
              onClick={stopSpeaking}
              className="flex items-center justify-center space-x-2 px-4 py-2 rounded-full bg-yellow-500 hover:bg-yellow-600 text-white"
            >
              <StopCircle className="w-5 h-5" />
              <span>Stop AI</span>
            </Button>
          )}
        </div>
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div className="w-full p-4 bg-gray-50 rounded-md mt-6 border border-neutral-200 border-gray-200 max-h-96 overflow-y-auto dark:border-neutral-800">
          <h3 className="text-lg font-semibold mb-2 text-green-700">Conversation:</h3>
          {conversation.map((message, index) => (
            <div key={index} className={`mb-2 ${message.role === "'user'" ? "'text-blue-600'" : "'text-green-600'"}`}>
              <strong>{message.role === "'user'" ? "'You: '" : `${selectedScenario?.personName}: `}</strong>
              {message.content}
              {message.role === "'assistant'" && isSpeaking && index === conversation.length - 1 && (
                <Volume2 className="inline-block ml-2 animate-pulse" />
              )}
            </div>
          ))}
          {currentTranscription && (
            <div className="text-gray-500 italic">
              Current transcription: {currentTranscription}
            </div>
          )}
          {(isProcessing) && (
            <div className="flex items-center text-gray-600">
              <Loader2 className="animate-spin h-4 w-4 mr-2" />
              AI is thinking...
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default AudioRecorder

