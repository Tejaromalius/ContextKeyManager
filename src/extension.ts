import * as vscode from 'vscode';

interface StoredContextKey {
  key: string;
  value: any;
}

const STORAGE_KEY = 'contextKeysManager.registeredKeys';

function loadKeys(context: vscode.ExtensionContext): StoredContextKey[] {
  return context.globalState.get<StoredContextKey[]>(STORAGE_KEY, []);
}

function saveKeys(context: vscode.ExtensionContext, keys: StoredContextKey[]) {
  context.globalState.update(STORAGE_KEY, keys);
}

function parseValue(raw: string, type: string): any {
  switch (type) {
    case 'boolean':
      return raw.toLowerCase() === 'true';
    case 'number':
      return Number(raw);
    case 'json':
      try {
        return JSON.parse(raw);
      } catch (e) {
        vscode.window.showErrorMessage('Invalid JSON; storing as string.');
        return raw;
      }
    default:
      return raw; // string
  }
}

async function registerKey(context: vscode.ExtensionContext) {
  const name = await vscode.window.showInputBox({
    title: 'Register Context Key',
    prompt: 'Enter context key name (e.g. user.myMode)',
    validateInput: (val) => val.trim() === '' ? 'Key cannot be empty' : undefined
  });
  if (!name) { return; }

  const type = await vscode.window.showQuickPick(['boolean', 'string', 'number', 'json'], { title: 'Select value type' });
  if (!type) { return; }

  const valueRaw = await vscode.window.showInputBox({ title: `Enter ${type} value`, value: type === 'boolean' ? 'true' : '' });
  if (valueRaw === undefined) { return; }
  const value = parseValue(valueRaw, type);

  const keys = loadKeys(context);
  if (keys.find(k => k.key === name)) {
    const overwrite = await vscode.window.showQuickPick(['Yes', 'No'], { title: 'Key exists. Overwrite?' });
    if (overwrite !== 'Yes') { return; }
  }

  await vscode.commands.executeCommand('setContext', name, value);
  const filtered = keys.filter(k => k.key !== name);
  filtered.push({ key: name, value });
  saveKeys(context, filtered);
  vscode.window.showInformationMessage(`Context key '${name}' registered.`);
}

async function editKey(context: vscode.ExtensionContext) {
  const keys = loadKeys(context);
  if (keys.length === 0) {
    vscode.window.showInformationMessage('No registered context keys.');
    return;
  }
  const picked = await vscode.window.showQuickPick(keys.map(k => k.key), { title: 'Select key to edit' });
  if (!picked) { return; }
  const existing = keys.find(k => k.key === picked)!;
  const type = await vscode.window.showQuickPick(['boolean', 'string', 'number', 'json'], { title: 'Select new value type' });
  if (!type) { return; }
  const valueRaw = await vscode.window.showInputBox({ title: `Enter new ${type} value`, value: String(existing.value) });
  if (valueRaw === undefined) { return; }
  const value = parseValue(valueRaw, type);
  await vscode.commands.executeCommand('setContext', picked, value);
  existing.value = value;
  saveKeys(context, keys);
  vscode.window.showInformationMessage(`Context key '${picked}' updated.`);
}

async function deleteKey(context: vscode.ExtensionContext) {
  const keys = loadKeys(context);
  if (keys.length === 0) {
    vscode.window.showInformationMessage('No registered context keys.');
    return;
  }
  const picked = await vscode.window.showQuickPick(keys.map(k => k.key), { title: 'Select key to delete' });
  if (!picked) { return; }
  const confirm = await vscode.window.showQuickPick(['Delete', 'Cancel'], { title: `Confirm delete '${picked}'` });
  if (confirm !== 'Delete') { return; }
  // Remove context by setting undefined
  await vscode.commands.executeCommand('setContext', picked, undefined);
  const remaining = keys.filter(k => k.key !== picked);
  saveKeys(context, remaining);
  vscode.window.showInformationMessage(`Context key '${picked}' deleted.`);
}

async function toggleKey(context: vscode.ExtensionContext, keyArg?: string) {
  const keys = loadKeys(context);
  if (keys.length === 0) {
    vscode.window.showInformationMessage('No registered context keys.');
    return;
  }

  let targetKey = keyArg;
  if (!targetKey) {
    targetKey = await vscode.window.showQuickPick(keys.map(k => k.key), { title: 'Select boolean key to toggle' });
  }
  if (!targetKey) { return; }

  const existing = keys.find(k => k.key === targetKey);
  if (!existing) {
    vscode.window.showErrorMessage(`Context key '${targetKey}' not found.`);
    return;
  }

  if (typeof existing.value !== 'boolean') {
    // If argument supplied we auto-convert; if interactive ask.
    if (keyArg) {
      existing.value = !Boolean(existing.value);
    } else {
      const action = await vscode.window.showQuickPick(['Convert to boolean and toggle', 'Cancel'], { title: `Key '${targetKey}' is not boolean.` });
      if (action !== 'Convert to boolean and toggle') { return; }
      existing.value = !Boolean(existing.value);
    }
  } else {
    existing.value = !existing.value;
  }

  await vscode.commands.executeCommand('setContext', targetKey, existing.value);
  saveKeys(context, keys);
  vscode.window.showInformationMessage(`Context key '${targetKey}' set to ${String(existing.value)}.`);
}

export function activate(context: vscode.ExtensionContext) {
  // Re-hydrate stored keys on activation
  const stored = loadKeys(context);
  stored.forEach(k => {
    vscode.commands.executeCommand('setContext', k.key, k.value);
  });

  context.subscriptions.push(
    vscode.commands.registerCommand('contextKeysManager.register', () => registerKey(context)),
    vscode.commands.registerCommand('contextKeysManager.edit', () => editKey(context)),
    vscode.commands.registerCommand('contextKeysManager.delete', () => deleteKey(context)),
    vscode.commands.registerCommand('contextKeysManager.toggle', (...args: any[]) => toggleKey(context, args[0]))
  );

  vscode.window.setStatusBarMessage(`Context Keys Loaded: ${stored.length}`, 3000);
}

export function deactivate() {
  // Nothing special
}
