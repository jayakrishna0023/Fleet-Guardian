import { VoiceAssistantWithOrb } from '@/components/voice/VoiceAssistantWithOrb';

/**
 * Example: Adding Voice Assistant to Your Application
 * 
 * This file demonstrates different ways to integrate the voice assistant
 * into your fleet management application.
 */

// Example 1: Full-screen center overlay (recommended for main dashboard)
export function Example1_CenterOverlay() {
  return (
    <div className="relative h-screen">
      {/* Your main content */}
      <div className="p-4">
        <h1>Fleet Dashboard</h1>
        {/* ... other content ... */}
      </div>
      
      {/* Voice Assistant - appears as floating button, expands to center */}
      <VoiceAssistantWithOrb position="center" />
    </div>
  );
}

// Example 2: Bottom-right corner (good for persistent access)
export function Example2_BottomRight() {
  return (
    <div className="relative h-screen">
      <div className="p-4">
        <h1>Fleet Dashboard</h1>
        {/* ... other content ... */}
      </div>
      
      {/* Voice Assistant in bottom-right corner */}
      <VoiceAssistantWithOrb position="bottom-right" />
    </div>
  );
}

// Example 3: Bottom-left corner
export function Example3_BottomLeft() {
  return (
    <div className="relative h-screen">
      <div className="p-4">
        <h1>Fleet Dashboard</h1>
        {/* ... other content ... */}
      </div>
      
      {/* Voice Assistant in bottom-left corner */}
      <VoiceAssistantWithOrb position="bottom-left" />
    </div>
  );
}

// Example 4: Conditional rendering (only show in certain views)
export function Example4_Conditional() {
  const showVoiceAssistant = true; // Your condition here
  
  return (
    <div className="relative h-screen">
      <div className="p-4">
        <h1>Fleet Dashboard</h1>
        {/* ... other content ... */}
      </div>
      
      {/* Only render when needed */}
      {showVoiceAssistant && (
        <VoiceAssistantWithOrb position="bottom-right" />
      )}
    </div>
  );
}

// Example 5: With custom styling
export function Example5_CustomStyle() {
  return (
    <div className="relative h-screen">
      <div className="p-4">
        <h1>Fleet Dashboard</h1>
        {/* ... other content ... */}
      </div>
      
      {/* Custom className for additional styling */}
      <VoiceAssistantWithOrb 
        position="bottom-right"
        className="shadow-2xl ring-2 ring-purple-500/20"
      />
    </div>
  );
}

// Example 6: Integration with existing Index.tsx
export function Example6_IndexIntegration() {
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r">
        {/* ... sidebar content ... */}
      </aside>
      
      {/* Main content */}
      <main className="flex-1 relative">
        <header className="border-b p-4">
          <h1>Dashboard</h1>
        </header>
        
        <div className="p-6">
          {/* Your dashboard content */}
        </div>
        
        {/* Voice Assistant - positioned within main content area */}
        <VoiceAssistantWithOrb position="bottom-right" />
      </main>
    </div>
  );
}

/**
 * HOW TO ADD TO YOUR INDEX.TSX:
 * 
 * 1. Import the component:
 *    import { VoiceAssistantWithOrb } from '@/components/voice/VoiceAssistantWithOrb';
 * 
 * 2. Add it before the closing div in your Index component:
 *    
 *    return (
 *      <div className="flex h-screen bg-background">
 *        {isAuthenticated ? (
 *          <>
 *            <Sidebar ... />
 *            <main className="flex-1 flex flex-col overflow-hidden relative">
 *              <Header ... />
 *              <div className="flex-1 overflow-auto p-6">
 *                {renderView()}
 *              </div>
 *              
 *              // ADD THIS LINE:
 *              <VoiceAssistantWithOrb position="bottom-right" />
 *            </main>
 *          </>
 *        ) : (
 *          landingView === 'hero' ? <LuminaHero ... /> : <LoginPage ... />
 *        )}
 *      </div>
 *    );
 * 
 * 3. That's it! The voice assistant will appear as a floating button
 *    and expand when clicked.
 */
