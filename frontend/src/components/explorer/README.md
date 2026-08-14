# DEVSPA Explorer

Tailwind-only Explorer module designed to be mounted inside the existing DEVSPA window manager.

## Main component

```jsx
import Explorer from "./components/explorer/Explorer";
```

## File shape

```js
{
  path: "src/App.jsx",
  name: "App.jsx",
  type: "file",
  content: "...",
  status: "modified" // optional: error | ai-fixed | modified
}
```

## Integration

Use the callbacks to connect the Explorer to your existing Editor and Debugger:

- `onOpenEditor(file)`
- `onOpenDebugger(file)`
- `onAnalyze(file)`
- `onRun(file)`
- `onCreateFile(target)`
- `onCreateFolder(target)`
- `onRename(target)`
- `onDelete(target)`
- `onCopyPath(target)`
- `onSelectFile(file)`

No separate CSS file is required. All styling uses Tailwind utility classes.
