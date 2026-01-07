# AI Voice Assistant with Audio Orb Visualization

A professional AI voice assistant component with stunning 3D audio-reactive visualizations inspired by Google's audio orb.

## Features

- 🎤 **Voice Recognition**: Real-time speech-to-text with Web Speech API
- 🤖 **AI Integration**: Connects with Gemini AI for intelligent responses
- 🎨 **3D Audio Visualization**: Beautiful Three.js-powered orb that reacts to audio
- 🔊 **Text-to-Speech**: Natural voice synthesis for AI responses
- 💬 **Chat History**: Full conversation tracking
- 🎯 **Multiple States**: Visual feedback for listening, processing, and speaking states
- 📱 **Responsive Design**: Works on desktop and mobile

## Components

### VoiceAssistantWithOrb
The main component that provides a complete voice assistant interface with:
- Audio orb visualization
- Chat history
- Voice controls
- State management

### AudioOrbVisualizer
A standalone 3D visualization component that:
- Reacts to audio frequencies in real-time
- Changes colors based on assistant state
- Uses WebGL shaders for smooth animations
- Supports bass, mid, and treble frequency visualization

### AudioAnalyzer
Utility class for audio frequency analysis:
- FFT-based frequency data extraction
- Normalized frequency ranges
- Bass, mid, and treble intensity calculations

## Usage

### Basic Usage

```tsx
import { VoiceAssistantWithOrb } from '@/components/voice/VoiceAssistantWithOrb';

function App() {
  return (
    <div>
      {/* Voice assistant with center positioning */}
      <VoiceAssistantWithOrb position="center" />
      
      {/* Or bottom-right corner */}
      <VoiceAssistantWithOrb position="bottom-right" />
    </div>
  );
}
```

### Using the Visualizer Standalone

```tsx
import { AudioOrbVisualizer } from '@/components/voice/AudioOrbVisualizer';
import { AudioAnalyzer } from '@/components/voice/AudioAnalyzer';

function MyComponent() {
  const audioContext = new AudioContext();
  const [audioSource, setAudioSource] = useState<AudioNode | null>(null);
  
  useEffect(() => {
    // Setup your audio source
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        const source = audioContext.createMediaStreamSource(stream);
        setAudioSource(source);
      });
  }, []);

  return (
    <AudioOrbVisualizer
      audioContext={audioContext}
      audioSource={audioSource}
      isActive={true}
      state="listening"
    />
  );
}
```

## Configuration

### Environment Variables

Add your Google AI API key to `.env`:

```env
VITE_GOOGLE_API_KEY=your_api_key_here
```

### Props

#### VoiceAssistantWithOrb

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `string` | `undefined` | Additional CSS classes |
| `position` | `'center' \| 'bottom-right' \| 'bottom-left'` | `'center'` | Position of the assistant |

#### AudioOrbVisualizer

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `audioContext` | `AudioContext` | `undefined` | Web Audio API context |
| `audioSource` | `AudioNode` | `undefined` | Audio source node for analysis |
| `isActive` | `boolean` | `false` | Whether the orb should react to audio |
| `state` | `'idle' \| 'listening' \| 'processing' \| 'speaking'` | `'idle'` | Current state for color scheme |

## States

The voice assistant has four states:

1. **Idle** (Indigo/Purple): Ready to listen
2. **Listening** (Blue/Cyan): Recording your voice
3. **Processing** (Purple/Pink): AI is thinking
4. **Speaking** (Emerald/Teal): AI is responding

Each state has its own color scheme in the orb visualization.

## Audio Visualization

The orb visualization uses:
- **WebGL Shaders**: Custom vertex and fragment shaders for smooth animations
- **Audio Reactivity**: Responds to different frequency ranges:
  - Bass (0-20%): Large wave patterns
  - Mid (20-60%): Medium wave patterns
  - Treble (60-100%): Fine detail patterns
- **Fresnel Effect**: Glowing edges for a professional look
- **Smooth Transitions**: Interpolated animations between states

## Browser Support

- **Voice Recognition**: Chrome, Edge, Safari (iOS 14.5+)
- **Speech Synthesis**: All modern browsers
- **WebGL**: Required for orb visualization

## Customization

### Changing Colors

Edit the shader uniforms in [AudioOrbVisualizer.tsx](AudioOrbVisualizer.tsx):

```tsx
material.uniforms.color1.value.set(0x6366f1); // Your color here
material.uniforms.color2.value.set(0x8b5cf6);
material.uniforms.color3.value.set(0x06b6d4);
```

### Adjusting Audio Sensitivity

Modify the AudioAnalyzer settings in [AudioAnalyzer.ts](AudioAnalyzer.ts):

```typescript
this.analyser.fftSize = 256; // Higher = more detail
this.analyser.smoothingTimeConstant = 0.8; // 0-1, higher = smoother
```

### Custom AI Responder

```tsx
import { voiceAssistantService } from '@/services/voiceAssistant';

voiceAssistantService.setResponder(async (prompt, context) => {
  // Your custom AI logic here
  const response = await yourAIService.chat(prompt, context);
  return response;
});
```

## Performance

- **60 FPS**: Optimized for smooth animations
- **Low Memory**: Efficient Three.js rendering
- **Responsive**: Adapts to window resizing
- **Clean Cleanup**: Proper resource disposal

## Dependencies

- `three` - 3D rendering
- `@types/three` - TypeScript definitions
- `lucide-react` - Icons
- Web Speech API (built-in)
- Web Audio API (built-in)

## Examples

Check the existing implementations:
- [VoiceAssistantOrb.tsx](VoiceAssistantOrb.tsx) - Previous simpler version
- [VoiceAssistantButton.tsx](VoiceAssistantButton.tsx) - Compact button version

## Troubleshooting

### Microphone Permission
Make sure to grant microphone permissions when prompted.

### Audio Not Visualizing
- Check if audio source is properly connected
- Verify AudioContext is not suspended
- Ensure `isActive` prop is true

### Voice Recognition Not Working
- Use HTTPS (required for microphone access)
- Check browser compatibility
- Verify microphone is working in system settings

## Future Enhancements

- [ ] Multiple language support
- [ ] Custom wake words
- [ ] Voice fingerprinting
- [ ] Noise cancellation
- [ ] Waveform visualization option
- [ ] VR/AR support

## License

Part of the Fleet Guardian AI project.
