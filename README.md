# Context Keys Manager

Register, edit, and delete custom VS Code context keys (usable in `when` clauses) via commands without editing source each time.

# ContextKeyManager

ContextKeyManager lets you register, edit, toggle, and delete custom VS Code context keys (usable in `when` clauses) directly from commands—no need to write a separate extension each time.

## Features

- Register: `Context Keys: Register` creates/overwrites a key & value.
- Edit: `Context Keys: Edit Value` changes stored value/type.
- Delete: `Context Keys: Delete` clears and removes a key.
- Toggle: `Context Keys: Toggle Boolean` flips a boolean key (or auto-converts a non-boolean when invoked with an argument).
- Auto re-hydration: previously stored keys restored on activation.

## Supported Value Types

- boolean (`true` / `false`)
- string (raw text)
- number (parsed with `Number()`)
- json (parsed using `JSON.parse`; falls back to string on parse failure)

## Usage

1. Command Palette (`Ctrl+Shift+P`) → run `Context Keys: Register`.
2. Provide a name (recommend a prefix like `user.`) and value.
3. Use the key in `keybindings.json`, menus, views: `"when": "user.myMode == true"`.
4. Toggle quickly:

   ```json
   { "key": "ctrl+alt+m", "command": "contextKeysManager.toggle", "args": "user.myMode" }
   ```

5. Edit or delete via the dedicated commands.

## Example Keybinding

```json
{
  "key": "ctrl+alt+k",
  "command": "workbench.action.findInFiles",
  "when": "user.myMode == true"
}
```

## Programmatic Toggle

```ts
vscode.commands.executeCommand('contextKeysManager.toggle', 'user.myMode');
```

## Development

```bash
cd extension
npm install
npm run compile
```

Launch with `F5` to open an Extension Development Host.

## Packaging

```bash
npm run package
```

Install the generated `.vsix` via: Command Palette → `Extensions: Install from VSIX...`.

## Persistence Notes

- Keys stored in `globalState`; clearing VS Code state or using a different profile resets them.
- Deleting a key sets its context value to `undefined` then removes it from storage.

## License

MIT © Tejaromalius

See `LICENSE` for full text.

## Notes

- Removing a key sets its context value to `undefined`.
- Keys persist via `globalState`; clearing VS Code state removes them.
