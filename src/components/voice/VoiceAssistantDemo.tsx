import React from 'react';
import { VoiceAssistantWithOrb } from '@/components/voice/VoiceAssistantWithOrb';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mic, Radio, Sparkles, Volume2, Zap } from 'lucide-react';

/**
 * Demo page to showcase the Voice Assistant with Audio Orb
 * Navigate to this page to see the voice assistant in action
 */
export const VoiceAssistantDemo: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="w-8 h-8 text-purple-400" />
            <h1 className="text-4xl font-bold text-white">
              AI Voice Assistant Demo
            </h1>
            <Sparkles className="w-8 h-8 text-purple-400" />
          </div>
          <p className="text-slate-400 text-lg">
            Experience next-generation voice interaction with stunning 3D audio visualization
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <Mic className="w-10 h-10 text-blue-400 mb-2" />
              <CardTitle className="text-white">Voice Recognition</CardTitle>
              <CardDescription>
                Real-time speech-to-text powered by Web Speech API
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <Radio className="w-10 h-10 text-purple-400 mb-2" />
              <CardTitle className="text-white">Audio Visualization</CardTitle>
              <CardDescription>
                3D audio-reactive orb with WebGL shaders
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <Volume2 className="w-10 h-10 text-emerald-400 mb-2" />
              <CardTitle className="text-white">Natural Speech</CardTitle>
              <CardDescription>
                High-quality text-to-speech synthesis
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Instructions */}
        <Card className="bg-slate-900/50 border-slate-800 mb-12">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              How to Use
            </CardTitle>
          </CardHeader>
          <CardContent className="text-slate-300 space-y-2">
            <ol className="list-decimal list-inside space-y-2">
              <li>Click the floating orb button in the bottom-right corner</li>
              <li>Grant microphone permissions when prompted</li>
              <li>Click the microphone button to start speaking</li>
              <li>Watch the orb react to your voice in real-time</li>
              <li>Wait for the AI to process and respond</li>
              <li>The orb changes colors based on state:
                <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                  <li><span className="text-blue-400">Blue</span> - Listening to your voice</li>
                  <li><span className="text-purple-400">Purple</span> - Processing your request</li>
                  <li><span className="text-emerald-400">Emerald</span> - Speaking the response</li>
                  <li><span className="text-indigo-400">Indigo</span> - Idle and ready</li>
                </ul>
              </li>
            </ol>
          </CardContent>
        </Card>

        {/* Try These Commands */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Try These Commands</CardTitle>
            <CardDescription>
              Example voice commands to test the assistant
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                <h4 className="text-white font-semibold mb-2">Fleet Information</h4>
                <ul className="text-slate-400 space-y-1 text-sm">
                  <li>"Show fleet overview"</li>
                  <li>"How many vehicles do I have?"</li>
                  <li>"What are the active alerts?"</li>
                  <li>"Show fuel efficiency report"</li>
                </ul>
              </div>

              <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                <h4 className="text-white font-semibold mb-2">Vehicle Status</h4>
                <ul className="text-slate-400 space-y-1 text-sm">
                  <li>"Check vehicle status"</li>
                  <li>"Which vehicles need maintenance?"</li>
                  <li>"Show vehicle health"</li>
                  <li>"List critical alerts"</li>
                </ul>
              </div>

              <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                <h4 className="text-white font-semibold mb-2">Navigation</h4>
                <ul className="text-slate-400 space-y-1 text-sm">
                  <li>"Navigate to dashboard"</li>
                  <li>"Go to vehicles"</li>
                  <li>"Show alerts"</li>
                  <li>"Open analytics"</li>
                </ul>
              </div>

              <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                <h4 className="text-white font-semibold mb-2">General Questions</h4>
                <ul className="text-slate-400 space-y-1 text-sm">
                  <li>"What's the weather?"</li>
                  <li>"Tell me a joke"</li>
                  <li>"What can you do?"</li>
                  <li>"Help me with fleet management"</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Technical Details */}
        <div className="mt-12 text-center text-slate-500 text-sm">
          <p>Powered by Web Speech API, Three.js, and AI</p>
          <p className="mt-1">Requires HTTPS and microphone permissions</p>
        </div>
      </div>

      {/* The Voice Assistant itself - positioned in bottom-right */}
      <VoiceAssistantWithOrb position="bottom-right" />
    </div>
  );
};

export default VoiceAssistantDemo;
