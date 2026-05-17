#!/usr/bin/env node

const fs = require('fs/promises');
const path = require('path');
const readline = require('readline/promises');
const { stdin: input, stdout: output } = require('process');

const scriptDir = path.dirname(path.resolve(process.argv[1]));
const root = path.resolve(scriptDir, '..');

const pathsToArchive = [
  'app',
  'components',
  'context',
  'data',
  'dist',
  'global.css',
];

async function exists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

function timestamp() {
  return new Date()
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\..+/, '')
    .replace('T', '-');
}

async function getArchiveDir() {
  const preferred = path.join(root, 'app-example');

  if (!(await exists(preferred))) {
    return preferred;
  }

  return path.join(root, `app-example-${timestamp()}`);
}

async function createStarterApp() {
  const appDir = path.join(root, 'app');
  await fs.mkdir(appDir, { recursive: true });

  await fs.writeFile(
    path.join(appDir, '_layout.tsx'),
    `import { Stack } from 'expo-router';

export default function RootLayout() {
  return <Stack />;
}
`,
  );

  await fs.writeFile(
    path.join(appDir, 'index.tsx'),
    `import { StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nouvelle app Control</Text>
      <Text style={styles.subtitle}>Modifie app/index.tsx pour commencer.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    marginTop: 8,
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
  },
});
`,
  );
}

async function resetProject() {
  const rl = readline.createInterface({ input, output });
  const answer = await rl.question(
    'This will move the current app into app-example/ and create a fresh app/. Continue? (y/N) ',
  );
  rl.close();

  if (!['y', 'yes'].includes(answer.trim().toLowerCase())) {
    console.log('Reset cancelled.');
    return;
  }

  const archiveDir = await getArchiveDir();
  await fs.mkdir(archiveDir, { recursive: true });

  for (const relativePath of pathsToArchive) {
    const source = path.join(root, relativePath);

    if (await exists(source)) {
      const destination = path.join(archiveDir, relativePath);
      await fs.mkdir(path.dirname(destination), { recursive: true });
      await fs.rename(source, destination);
      console.log(`Moved ${relativePath} -> ${path.relative(root, destination)}`);
    }
  }

  await fs.writeFile(
    path.join(archiveDir, 'README.md'),
    `# Archived app

This folder was created by \`npm run reset-project\`.
It contains the previous app files before the starter app was recreated.
`,
  );

  await createStarterApp();
  console.log('Created fresh app/ with a minimal Expo Router screen.');
}

resetProject().catch((error) => {
  console.error(error);
  process.exit(1);
});
