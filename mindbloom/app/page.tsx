"'use client'"

import React, { useState } from "'react'"
import AudioRecorder from "'@/components/AudioRecorder'"
import Sidebar from "'@/components/Sidebar'"
import { Scenario } from "'@/types/scenario'"

const scenarios: Scenario[] = [
  {
    id: "'1'",
    heading: "'Disability Accommodation'",
    personName: "'Clara Hanson'",
    age: 28,
    ethnicity: "'Caucasian'",
    goal: "'Request workplace accommodations for a newly diagnosed condition'",
    backstory: "'Clara has recently been diagnosed with multiple sclerosis and needs to discuss potential accommodations her HR manager.'",
    voice: "'Joanna'"
  },
  {
    id: "'2'",
    heading: "'Cultural Misunderstanding'",
    personName: "'Raj Patel'",
    age: 35,
    ethnicity: "'Indian'",
    goal: "'Address a cultural misunderstanding with coworker'",
    backstory: "'Raj, a recent immigrant, has unintentionally offended coworker due to cultural differences and wants clear the air.'",
    voice: "'Raveena'"
  },
  {
    id: "'3'",
    heading: "'Age Discrimination'",
    personName: "'George Thompson'",
    age: 58,
    ethnicity: "'African American'",
    goal: "'Discuss concerns about potential age discrimination'",
    backstory: "'George feels he\'s being passed over for promotions in favor of younger colleagues and wants to address this with his manager.'",
    voice: "'Matthew'"
  }
]

export default function Home() {
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null)

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar scenarios={scenarios} onSelectScenario={setSelectedScenario} selectedScenario={selectedScenario} />
      <main className="flex-1 p-8">
        <h1 className="text-4xl font-bold mb-4 text-green-700 text-center">AI Conversation Simulator</h1>
        <p className="text-lg text-gray-600 mb-8 text-center max-w-2xl mx-auto">
          Select a scenario from the sidebar, then hold the button to speak. Release to get a response.
        </p>
        <div className="flex justify-center">
          <AudioRecorder selectedScenario={selectedScenario} />
        </div>
      </main>
    </div>
  )
}

