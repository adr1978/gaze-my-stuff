export const designGuideContent = `
<div class="space-y-8">
  <section>
    <h2 class="text-xl font-semibold mb-4 text-foreground">🎨 Design System & Style Guide</h2>
    
    <h3 class="text-lg font-semibold mt-4 mb-2 text-foreground">Colour Scheme</h3>
    <ul class="list-disc pl-6 space-y-2 text-muted-foreground">
      <li><strong>CSS Variables:</strong> All colours are defined as HSL values in <code>src/index.css</code> using semantic CSS custom properties (e.g., <code>--background</code>, <code>--primary</code>, <code>--card</code>).</li>
      <li><strong>Primary Action:</strong> <code>hsl(var(--primary))</code> (blue) used for primary buttons, active states, and highlights.</li>
      <li><strong>Surfaces:</strong> <code>hsl(var(--card))</code> (white) used for all control cards and the main canvas container card.</li>
      <li><strong>Borders:</strong> <code>hsl(var(--border))</code> used for standard borders, inputs, and separators.</li>
      <li><strong>Selection:</strong> The active layer thumbnail is highlighted with a <code>ring-2 ring-primary</code> (blue ring). Inactive thumbnails use <code>ring-2 ring-slate-400</code>.</li>
      <li><strong>Notifications:</strong> Sonner toasts are used. Success toasts use a <code>text-green-400</code> icon, and error toasts use <code>text-red-400</code>.</li>
    </ul>

    <h3 class="text-lg font-semibold mt-4 mb-2 text-foreground">Typography</h3>
    <ul class="list-disc pl-6 space-y-2 text-muted-foreground">
      <li><strong>Main Heading (h1):</strong> <code>text-4xl font-bold</code> ("Notion Cover Creator").</li>
      <li><strong>Subheading:</strong> <code>text-xl text-muted-foreground</code> ("Design beautiful...").</li>
      <li><strong>Card Headings (h2):</strong> <code>text-xl font-semibold</code>.</li>
      <li><strong>Labels:</strong> <code>text-sm font-medium</code>.</li>
      <li><strong>Body/Descriptions:</strong> <code>text-sm text-muted-foreground</code>.</li>
    </ul>

    <h3 class="text-lg font-semibold mt-4 mb-2 text-foreground">Layout & Spacing</h3>
    <ul class="list-disc pl-6 space-y-2 text-muted-foreground">
      <li><strong>Page Container:</strong> <code>max-w-7xl mx-auto p-8</code>.</li>
      <li><strong>Canvas Card:</strong> The main canvas container is a <code>Card</code> component with <code>p-6</code> (24px) padding and <code>w-full</code>. It does not change width.</li>
      <li><strong>Canvas Sizing:</strong> An inner <code>div</code> inside the card's padding is centered (<code>mx-auto</code>). Its size is controlled by <code>max-height: 600px</code> and a dynamic <code>aspect-ratio</code>. This creates a "letterbox" effect when non-widescreen sizes are chosen, as the card's width remains constant.</li>
      <li><strong>Control Cards:</strong> A <code>grid grid-cols-1 lg:grid-cols-3 gap-6</code> holds the three control cards, which also use <code>p-6</code> padding.</li>
      <li><strong>Control Spacing:</strong> Internal card sections use <code>space-y-4</code>, with individual controls (like a label and slider) using <code>space-y-2</code>.</li>
    </ul>

    <h3 class="text-lg font-semibold mt-4 mb-2 text-foreground">Components & Styling</h3>
    <ul class="list-disc pl-6 space-y-2 text-muted-foreground">
      <li><strong>Buttons:</strong> All buttons use <code>rounded-full</code>. Primary actions are solid blue, secondary actions (Reset, Remove, Clear) use the <code>outline</code> variant.</li>
      <li><strong>Sliders:</strong> Standard <code>Slider</code> component.</li>
      <li><strong>Selects:</strong> Standard <code>Select</code> component for canvas size, quality, and format.</li>
      <li><strong>Cards:</strong> <code>Card</code> component with <code>p-6</code>, <code>shadow-lg</code> for the canvas card, and <code>shadow-sm</code> for control cards.</li>
      <li><strong>Icons:</strong> All icons from <code>lucide-react</code>, typically <code>h-4 w-4</code>.</li>
    </ul>
  </section>

  <section>
    <h2 class="text-xl font-semibold mb-4 text-foreground">⚙️ Features & Functionality</h2>
    
    <h3 class="text-lg font-semibold mt-4 mb-2 text-foreground">Core Canvas</h3>
    <ul class="list-disc pl-6 space-y-2 text-muted-foreground">
      <li><strong>Rendering:</strong> A single HTML5 <code>&lt;canvas&gt;</code> element is used.</li>
      <li><strong>State Management:</strong> All application state is managed in <code>Index.tsx</code> via React <code>useState</code> and <code>useMemo</code> hooks and passed down as props.</li>
      <li><strong>Image Upload:</strong> The "Upload Image" button accepts image files, creates a new <code>LayerState</code> object, and adds it to the <code>layers</code> array.</li>
      <li><strong>Layer Sizing:</strong> On upload, the image's <code>initialState</code> is calculated to fit within the canvas dimensions and centered. This state is stored for the "Reset" button.</li>
      <li><strong>Layer Limit:</strong> A maximum of 5 layers (<code>MAX_LAYERS</code>) can be added.</li>
      <li><strong>Drag & Drop:</strong> The active layer (or its entire pattern) can be dragged to change its <code>position</code>.</li>
    </ul>

    <h3 class="text-lg font-semibold mt-4 mb-2 text-foreground">Layer Manager</h3>
    <ul class="list-disc pl-6 space-y-2 text-muted-foreground">
      <li><strong>Visibility:</strong> Appears as soon as one layer (<code>layers.length > 0</code>) exists.</li>
      <li><strong>Positioning:</strong> Positioned <code>absolute</code> relative to the main canvas <code>Card</code>. Uses <code>top-6 right-6 z-10</code> to align perfectly with the card's 24px padding, ensuring it never moves, even when the inner canvas element changes width.</li>
      <li><strong>Thumbnails:</strong> <code>w-16 h-16</code> squares showing a <code>thumbnailUrl</code> generated on upload. Uses <code>bg-background/80 backdrop-blur-sm</code> for a semi-transparent effect.</li>
      <li><strong>Active State:</strong> The active layer's thumbnail has a <code>ring-2 ring-primary</code> (blue) border.</li>
      <li><strong>Inactive State:</strong> Inactive thumbnails have a <code>ring-2 ring-slate-400</code> border.</li>
      <li><strong>Reordering:</strong> Layers can be reordered via drag-and-drop within the manager.</li>
      <li><strong>Remove Layer:</strong> The red "X" button on each thumbnail removes that specific layer.</li>
    </ul>

    <h3 class="text-lg font-semibold mt-4 mb-2 text-foreground">Canvas Controls</h3>
    <ul class="list-disc pl-6 space-y-2 text-muted-foreground">
      <li><strong>Canvas Size:</strong> A <code>Select</code> dropdown that changes the logical aspect ratio of the canvas. This re-calculates the canvas <code>div</code>'s <code>aspect-ratio</code> style, which may cause it to "letterbox" inside the fixed-width card.</li>
      <li><strong>Background Colour:</strong> A <code>Popover</code> provides 24 preset colours and a custom HEX/color picker.</li>
      <li><strong>Output Quality & Format:</strong> <code>Select</code> dropdowns that store the desired multiplier (1x, 2x, 3x) and format (PNG/JPG) for export.</li>
      <li><strong>Export:</strong> The "Export Cover" button creates a temporary canvas, scales it by the <code>outputQuality</code>, re-draws all layers and the background, and triggers a download.</li>
    </ul>

    <h3 class="text-lg font-semibold mt-4 mb-2 text-foreground">Image Controls</h3>
    <ul class="list-disc pl-6 space-y-2 text-muted-foreground">
      <li><strong>Controls:</strong> Provides <code>Slider</code> components for Scale, Rotation, and Opacity.</li>
      <li><strong>Target:</strong> All controls modify the currently <code>activeLayer</code>.</li>
      <li><strong>Snap to Centre:</strong> A button to reset the active layer's <code>position</code> to the canvas center.</li>
      <li><strong>Reset Button:</strong> Resets the active layer's scale, rotation, opacity, and position to its saved <code>initialState</code>.
        <ul class="list-disc pl-6 mt-2">
          <li><strong>Disabled Logic:</strong> This button is disabled (<code>isAtDefaultState</code>) if the active layer's current properties exactly match its <code>initialState</code> properties.</li>
        </ul>
      </li>
    </ul>

    <h3 class="text-lg font-semibold mt-4 mb-2 text-foreground">Pattern Controls</h3>
    <ul class="list-disc pl-6 space-y-2 text-muted-foreground">
      <li><strong>Types:</strong> A 2x3 grid of buttons to apply a pattern ("Grid", "Brick", "Diamonds", "Mirror", "Random", "Spread") to the active layer.</li>
      <li><strong>Spacing:</strong> A <code>Slider</code> to control the spacing between pattern tiles. This is automatically disabled for "random" and "spread" patterns.</li>
      <li><strong>Remove:</strong> A button to reset the active layer's <code>pattern</code> to "none".</li>
    </ul>
  </section>

  <section>
    <h2 class="text-xl font-semibold mb-4 text-foreground">🤖 Complete AI Prompt for Recreation</h2>
    <div class="bg-muted p-4 rounded-lg">
      <p class="text-sm text-muted-foreground mb-4"><em>Use this prompt to recreate this application from scratch:</em></p>
      <div class="text-sm space-y-3 text-foreground">
        <p>Create a multi-layer Notion Cover Creator using React, TypeScript, Tailwind CSS, and shadcn/ui components. The app must allow uploading multiple images, managing them as layers, and exporting the final composite.</p>
        
        <p><strong>Core App Structure (<code>Index.tsx</code>):</strong></p>
        <ul class="list-disc pl-6">
          <li>The main page layout should be in a <code>max-w-7xl mx-auto p-8</code> container.</li>
          <li>It must contain a header, a canvas area, and a 3-column grid for controls.</li>
          <li>All state (layers, activeLayerId, canvasSize, backgroundColor, etc.) must be managed in <code>Index.tsx</code>.</li>
        </ul>

        <p><strong>Canvas Area:</strong></p>
        <ul class="list-disc pl-6">
          <li>The canvas area must be a <code>w-full Card</code> component with <code>p-6</code> and <code>position: relative</code>. This card's width does not change.</li>
          <li>Inside this card, an inner <code>div</code> must be centered (<code>mx-auto</code>). This div's size is controlled by <code>max-height: 600px</code> and a dynamic <code>aspect-ratio</code> calculated from the selected <code>canvasSize</code>.</li>
          <li>The <code>CanvasEditor.tsx</code> component (which is just a <code>&lt;canvas&gt;</code> element) should fill this inner <code>div</code> (<code>w-full h-full</code>).</li>
          <li>The canvas must have a checkerboard background pattern to show transparency.</li>
        </ul>

        <p><strong>Layer Management (<code>LayerManager.tsx</code>):</strong></p>
        <ul class="list-disc pl-6">
          <li>The <code>LayerManager</code> must be rendered in <code>Index.tsx</code>, positioned <code>absolute top-6 right-6 z-10</code> relative to the main canvas <code>Card</code>. This ensures it aligns with the 24px card padding and never moves.</li>
          <li>It must be visible as soon as 1 or more layers exist (<code>layers.length > 0</code>).</li>
          <li>It must display layers in reverse order (top layer at the top).</li>
          <li>Layers must be <code>w-16 h-16</code> buttons with a <code>thumbnailUrl</code> as the background. They must have a <code>bg-background/80 backdrop-blur-sm</code> effect.</li>
          <li>The active layer thumbnail must have a <code>ring-2 ring-primary</code> border.</li>
          <li>Inactive thumbnails must have a <code>ring-2 ring-slate-400</code> border.</li>
          <li>Each thumbnail must have a small red "X" button (<code>-top-1.5 -right-1.5</code>) to remove the layer.</li>
          <li>Must support drag-and-drop reordering of layers.</li>
        </ul>

        <p><strong>Layer State (<code>types/index.ts</code>):</strong></p>
        <ul class="list-disc pl-6">
          <li>Create a <code>LayerInitialState</code> type: <code>{ scale, rotation, opacity, position }</code>.</li>
          <li>Create a <code>LayerState</code> type that includes: <code>id</code>, <code>image</code>, <code>thumbnailUrl</code>, <code>scale</code>, <code>rotation</code>, <code>opacity</code>, <code>position</code>, <code>pattern</code>, <code>spacing</code>, <code>randomPatternData</code>, and <code>initialState: LayerInitialState</code>.</li>
          <li>On image upload, the <code>initialState</code> must be saved.</li>
        </ul>

        <p><strong>Control Cards (3-Column Grid):</strong></p>
        <ul class="list-disc pl-6">
          <li><strong>Canvas Controls:</strong> <code>Select</code> for Canvas Size (Notion, 16:9, 4:3, 3:2, 1:1), <code>Popover</code> for Background Colour (with presets and hex input), <code>Select</code> for Output Quality (1x, 2x, 3x), <code>Select</code> for Output Format (PNG/JPG), "Upload Image" button, and "Export Cover" button.</li>
          <li><strong>Pattern Controls:</strong> 2x3 grid of <code>Button</code> components for patterns (Grid, Brick, Diamonds, Mirror, Random, Spread). A <code>Slider</code> for spacing (disabled for "none", "random", "spread"). A "Remove" button.</li>
          <li><strong>Image Controls:</strong> <code>Slider</code> components for Scale, Rotation, and Opacity. A "Snap to Centre" button. A "Reset" button.</li>
        </ul>

        <p><strong>Specific Logic & Styling:</strong></p>
        <ul class="list-disc pl-6">
          <li>All buttons and interactive elements must be <code>rounded-full</code>.</li>
          <li>The "Reset" button in <code>ImageControls.tsx</code> must be disabled by checking if the active layer's current state (scale, rotation, opacity, position) matches its stored <code>initialState</code>.</li>
          <li>The <code>CanvasEditor</code> must loop through the <code>layers</code> array (from bottom to top) and render each one according to its properties, including pattern logic.</li>
          <li>Use Sonner for toasts (e.g., "Layer removed", "Image uploaded").</li>
        </ul>
      </div>
    </div>
  </section>
</div>
`;