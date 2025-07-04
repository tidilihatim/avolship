"use client"

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Phone, PhoneCall, Square, Mic, MicOff, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { getAccessToken } from '@/app/actions/cookie'

interface CallRecordingData {
  recordingId: string
  s3Bucket: string
  s3Key: string
  s3Url: string
  duration: number
  fileSize: number
  mimeType: string
  recordedAt: Date
  uploadedAt: Date
}

interface MakeCallButtonProps {
  orderId: string
  customerName: string
  phoneNumbers: string[]
  onCallComplete?: (callData: {
    phoneNumber: string
    status: 'answered' | 'unreached' | 'busy' | 'invalid'
    notes?: string
    recording?: CallRecordingData
  }) => void
  className?: string
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  disabled?: boolean
}

export function MakeCallButton({
  orderId,
  customerName,
  phoneNumbers,
  onCallComplete,
  className,
  variant = 'default',
  size = 'default',
  disabled = false,
}: MakeCallButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedPhoneNumber, setSelectedPhoneNumber] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [isCallInProgress, setIsCallInProgress] = useState(false)
  const [callStatus, setCallStatus] = useState<'answered' | 'unreached' | 'busy' | 'invalid' | ''>('')
  const [callNotes, setCallNotes] = useState('')
  const [recordingTime, setRecordingTime] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number | null>(null)

  useEffect(() => {
    if (phoneNumbers.length === 1) {
      setSelectedPhoneNumber(phoneNumbers[0])
    }
  }, [phoneNumbers])

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      }
    }
  }, [])

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })

      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' })
        setRecordingBlob(blob)
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start(1000)
      setIsRecording(true)
      startTimeRef.current = Date.now()
      
      intervalRef.current = setInterval(() => {
        if (startTimeRef.current) {
          setRecordingTime(Math.floor((Date.now() - startTimeRef.current) / 1000))
        }
      }, 1000)

      toast.success("Call recording has begun automatically")
    } catch (error) {
      console.error('Error starting recording:', error)
      toast.error("Could not start call recording. Please check microphone permissions.")
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    setIsRecording(false)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
  }

  const handleMakeCall = async () => {
    if (!selectedPhoneNumber) {
      toast.error("Please select a phone number to call")
      return
    }

    const phoneLink = `tel:${selectedPhoneNumber}`
    window.open(phoneLink, '_self')
    
    setIsCallInProgress(true)
    await startRecording()
  }

  const handleEndCall = async () => {
    if (!callStatus) {
      toast.error("Please select the call status before ending the call")
      return
    }

    setIsProcessing(true)
    stopRecording()

    try {
      let recordingData: CallRecordingData | undefined

      if (recordingBlob) {
        // Get JWT token
        const jwtToken = await getAccessToken()
        if (!jwtToken) {
          throw new Error("Authentication failed")
        }

        const REALTIME_SERVER_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000'

        // Upload recording to S3
        const formData = new FormData()
        formData.append('recording', recordingBlob, `call-${orderId}-${Date.now()}.webm`)
        formData.append('orderId', orderId)
        formData.append('phoneNumber', selectedPhoneNumber)
        formData.append('duration', recordingTime.toString())

        const uploadResponse = await fetch(`${REALTIME_SERVER_URL}/api/orders/upload-recording`, {
          method: 'POST',
          headers: {
            "authorization": `Bearer ${jwtToken}`,
          },
          body: formData,
        })

        if (uploadResponse.ok) {
          const uploadResult = await uploadResponse.json()
          recordingData = uploadResult.data
        } else {
          const errorText = await uploadResponse.text()
          throw new Error(`Failed to upload recording: ${errorText}`)
        }
      }

      // Save call attempt
      const callData = {
        orderId,
        phoneNumber: selectedPhoneNumber,
        status: callStatus,
        notes: callNotes.trim() || undefined,
        recording: recordingData,
      }

      const jwtToken = await getAccessToken()
      if (!jwtToken) {
        throw new Error("Authentication failed")
      }

      const REALTIME_SERVER_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000'

      const response = await fetch(`${REALTIME_SERVER_URL}/api/orders/save-call-attempt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          "authorization": `Bearer ${jwtToken}`,
        },
        body: JSON.stringify(callData),
      })

      if (response.ok) {
        toast.success("Call attempt has been recorded successfully")
        onCallComplete?.({
          phoneNumber: selectedPhoneNumber,
          status: callStatus,
          notes: callNotes.trim() || undefined,
          recording: recordingData,
        })
        handleDialogClose()
      } else {
        const errorText = await response.text()
        throw new Error(`Failed to save call attempt: ${errorText}`)
      }
    } catch (error) {
      console.error('Error saving call:', error)
      toast.error(`Failed to save call attempt: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDialogClose = () => {
    setIsDialogOpen(false)
    setSelectedPhoneNumber(phoneNumbers.length === 1 ? phoneNumbers[0] : '')
    setIsRecording(false)
    setIsCallInProgress(false)
    setCallStatus('')
    setCallNotes('')
    setRecordingTime(0)
    setRecordingBlob(null)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button 
          variant={variant} 
          size={size} 
          disabled={disabled}
          className={cn(className)}
        >
          <Phone className="h-4 w-4 mr-2" />
          Make Call
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Make Call - {customerName}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Phone Number Selection */}
          <div className="space-y-2">
            <Label htmlFor="phone-select">Select Phone Number</Label>
            <Select value={selectedPhoneNumber} onValueChange={setSelectedPhoneNumber}>
              <SelectTrigger id="phone-select">
                <SelectValue placeholder="Choose a phone number" />
              </SelectTrigger>
              <SelectContent>
                {phoneNumbers.map((phone, index) => (
                  <SelectItem key={index} value={phone}>
                    {phone}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Call Control */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PhoneCall className="h-5 w-5" />
                Call Control
              </CardTitle>
              <CardDescription>
                Click "Make Call" to open your phone app and start recording
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isCallInProgress ? (
                <Button
                  onClick={handleMakeCall}
                  disabled={!selectedPhoneNumber}
                  className="w-full"
                  size="lg"
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Make Call
                </Button>
              ) : (
                <div className="space-y-4">
                  {/* Recording Status */}
                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div className="flex items-center gap-2">
                      {isRecording ? (
                        <Mic className="h-5 w-5 text-red-500 animate-pulse" />
                      ) : (
                        <MicOff className="h-5 w-5 text-muted-foreground" />
                      )}
                      <span className="font-medium">
                        {isRecording ? 'Recording' : 'Not Recording'}
                      </span>
                    </div>
                    <Badge variant={isRecording ? "destructive" : "secondary"}>
                      {formatTime(recordingTime)}
                    </Badge>
                  </div>

                  {/* Call Status Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="call-status">Call Status</Label>
                    <Select value={callStatus} onValueChange={(value) => setCallStatus(value as 'answered' | 'unreached' | 'busy' | 'invalid')}>
                      <SelectTrigger id="call-status">
                        <SelectValue placeholder="Select call outcome" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="answered">Answered</SelectItem>
                        <SelectItem value="unreached">Unreached</SelectItem>
                        <SelectItem value="busy">Busy</SelectItem>
                        <SelectItem value="invalid">Invalid Number</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Call Notes */}
                  <div className="space-y-2">
                    <Label htmlFor="call-notes">Call Notes (Optional)</Label>
                    <Textarea
                      id="call-notes"
                      placeholder="Add any notes about the call..."
                      value={callNotes}
                      onChange={(e) => setCallNotes(e.target.value)}
                      rows={3}
                    />
                  </div>

                  {/* End Call Button */}
                  <Button
                    onClick={handleEndCall}
                    disabled={!callStatus || isProcessing}
                    className="w-full"
                    size="lg"
                    variant="destructive"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Square className="h-4 w-4 mr-2" />
                        End Call & Save
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}