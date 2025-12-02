"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { CheckCircle2, Loader2, Copy } from "lucide-react"

interface FormData {
  name: string
  project: string
}

interface SubmissionData extends FormData {
  ipAddress: string
  timestamp: string
}

type SubmissionState = "idle" | "loading" | "success" | "error"

export default function SubmissionPage() {
  const [formData, setFormData] = useState<FormData>({ name: "", project: "" })
  const [submissionState, setSubmissionState] = useState<SubmissionState>("idle")
  const [submittedData, setSubmittedData] = useState<SubmissionData | null>(null)
  const [errorMessage, setErrorMessage] = useState<string>("")
  const { toast } = useToast()

  const isFormValid = formData.name.trim() !== "" && formData.project.trim() !== ""

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isFormValid) {
      setErrorMessage("Please fill in both your name and project name.")
      return
    }

    setSubmissionState("loading")
    setErrorMessage("")

    try {
      // Step 1: Fetch user's IP address
      const ipResponse = await fetch("https://api.ipify.org?format=json")
      if (!ipResponse.ok) {
        throw new Error("IP_FETCH_FAILED")
      }
      const ipData = await ipResponse.json()
      const ipAddress = ipData.ip

      // Step 2: Generate timestamp
      const timestamp = new Date().toLocaleString()

      // Step 3: Create payload
      const payload = {
        name: formData.name.trim(),
        project: formData.project.trim(),
        ipAddress,
        timestamp,
      }

      // Step 4: Send to Power Automate webhook
      const webhookUrl =
        "https://defaultb71ff3f628164ca8a9b938f820f91a.d1.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/a8e6b54ac7784673918ad119ba193214/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=fvHkWvDqzklXFjaJDLhvGVJmdg1t0hgJRYoc7HszP00"

      const webhookResponse = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!webhookResponse.ok) {
        throw new Error("WEBHOOK_FAILED")
      }

      // Step 5: Show success state
      setSubmittedData(payload)
      setSubmissionState("success")
    } catch (error) {
      console.error("[v0] Submission error:", error)
      setSubmissionState("error")

      if (error instanceof Error) {
        if (error.message === "IP_FETCH_FAILED") {
          setErrorMessage("Couldn't detect your IP address. Please check your connection and try again.")
        } else if (error.message === "WEBHOOK_FAILED") {
          setErrorMessage("Failed to send to Teams. Please try again or contact support.")
        } else {
          setErrorMessage("Something went wrong. Please try again.")
        }
      } else {
        setErrorMessage("Something went wrong. Please try again.")
      }
    }
  }

  const handleCopyInfo = async () => {
    if (!submittedData) return

    const formattedText = `Name: ${submittedData.name}
Project: ${submittedData.project}
IP Address: ${submittedData.ipAddress}
Timestamp: ${submittedData.timestamp}`

    try {
      await navigator.clipboard.writeText(formattedText)
      toast({
        title: "Copied!",
        description: "Submission details copied to clipboard.",
      })
    } catch (error) {
      console.error("[v0] Copy failed:", error)
      toast({
        title: "Copy failed",
        description: "Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleSubmitAnother = () => {
    setFormData({ name: "", project: "" })
    setSubmittedData(null)
    setSubmissionState("idle")
    setErrorMessage("")
  }

  return (
    <>
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#0f1822] dark:bg-[#0f1822]">
        <div className="w-full max-w-md">
          {submissionState === "success" && submittedData ? (
            // Success View
            <Card className="shadow-xl border-0 animate-in fade-in slide-in-from-bottom-4 duration-500 bg-white dark:bg-[#1a2332]">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 w-16 h-16 bg-[#45b000]/10 dark:bg-[#45b000]/20 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 text-[#45b000]" />
                </div>
                <CardTitle className="text-2xl font-bold text-[#45b000]">IP Address Submitted!</CardTitle>
                <CardDescription className="text-[#0f1822]/70 dark:text-[#dcdde1]/70">
                  Your IP address has been recorded and will be excluded from analytics for this project.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3 p-4 bg-[#dcdde1]/20 dark:bg-[#0f1822]/50 rounded-lg">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-[#0f1822]/60 dark:text-[#dcdde1]/60">Name</p>
                    <p className="text-base font-medium text-[#0f1822] dark:text-white">{submittedData.name}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-[#0f1822]/60 dark:text-[#dcdde1]/60">Project</p>
                    <p className="text-base font-medium text-[#0f1822] dark:text-white">{submittedData.project}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-[#0f1822]/60 dark:text-[#dcdde1]/60">IP Address</p>
                    <p className="text-base font-mono text-sm text-[#0f1822] dark:text-white">
                      {submittedData.ipAddress}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-[#0f1822]/60 dark:text-[#dcdde1]/60">Timestamp</p>
                    <p className="text-base font-mono text-sm text-[#0f1822] dark:text-white">
                      {submittedData.timestamp}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <Button
                    onClick={handleCopyInfo}
                    className="w-full bg-[#b4d500] hover:bg-[#a3c400] text-[#0f1822] font-medium"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy All Info
                  </Button>
                  <Button
                    onClick={handleSubmitAnother}
                    className="w-full bg-[#dcdde1] hover:bg-[#c5c6ca] text-[#0f1822] font-medium"
                  >
                    Submit Another IP
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            // Form View
            <Card className="shadow-xl border-0 bg-white dark:bg-[#1a2332]">
              <CardHeader className="text-center">
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-[#c90d7e] to-[#850064] bg-clip-text text-transparent">
                  IP Address Collection
                </CardTitle>
                <CardDescription className="text-base text-[#0f1822]/70 dark:text-[#dcdde1]/70">
                  Help us maintain accurate client analytics by submitting your IP address for exclusion
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-medium text-[#0f1822] dark:text-white">
                        Your Name
                      </Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="Enter your full name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="h-11 border-[#dcdde1] focus:border-[#c90d7e] focus:ring-[#c90d7e] dark:border-[#dcdde1]/30 dark:bg-[#0f1822] dark:text-white placeholder:text-[#dcdde1]/60"
                        disabled={submissionState === "loading"}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="project" className="text-sm font-medium text-[#0f1822] dark:text-white">
                        Client Project
                      </Label>
                      <Input
                        id="project"
                        type="text"
                        placeholder="Enter client/project name"
                        value={formData.project}
                        onChange={(e) => setFormData({ ...formData, project: e.target.value })}
                        className="h-11 border-[#dcdde1] focus:border-[#c90d7e] focus:ring-[#c90d7e] dark:border-[#dcdde1]/30 dark:bg-[#0f1822] dark:text-white placeholder:text-[#dcdde1]/60"
                        disabled={submissionState === "loading"}
                      />
                    </div>
                  </div>

                  {errorMessage && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full h-11 bg-gradient-to-r from-[#c90d7e] to-[#850064] hover:from-[#e01590] hover:to-[#9a0076] text-white font-medium transition-all duration-200"
                    disabled={!isFormValid || submissionState === "loading"}
                  >
                    {submissionState === "loading" ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      <Toaster />
    </>
  )
}
