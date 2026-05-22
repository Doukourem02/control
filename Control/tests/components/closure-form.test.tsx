import assert from 'node:assert/strict';
import Module from 'node:module';
import { describe, it, mock } from 'node:test';
import React from 'react';
import { act, create } from 'react-test-renderer';

import type { TodaySummary } from '@/lib/control-data';

/* eslint-disable @typescript-eslint/no-require-imports */

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const originalConsoleError = console.error;
console.error = (...args: unknown[]) => {
  const message = String(args[0] ?? '');
  if (
    message.startsWith('react-test-renderer is deprecated') ||
    message.startsWith('The current testing environment is not configured to support act')
  ) {
    return;
  }

  originalConsoleError(...args);
};

const moduleLoader = Module as unknown as { _load: (...args: any[]) => any };
const originalLoad = moduleLoader._load;
function MockPressable(props: Record<string, unknown>) {
  return React.createElement('Pressable', props);
}
function MockFeather(props: Record<string, unknown>) {
  return React.createElement('Feather', props);
}
const reactNativeMock = {
  ActivityIndicator: 'ActivityIndicator',
  Pressable: MockPressable,
  Text: 'Text',
  TextInput: 'TextInput',
  View: 'View',
};

moduleLoader._load = function patchedLoad(
  request: string,
  parent: unknown,
  isMain: boolean
) {
  if (request === 'react-native') return reactNativeMock;
  if (request === '@expo/vector-icons/Feather') {
    return MockFeather;
  }

  return originalLoad.call(this, request, parent, isMain);
};

const {
  ClosureForm,
  formatClosureMoney,
  parseClosureAmount,
} = require('../../components/closure-form') as typeof import('../../components/closure-form');

const summary: TodaySummary = {
  cashSalesAmount: 1500,
  mobileMoneySalesAmount: 900,
  expensesAmount: 300,
  physicalCashExpected: 1200,
  salesCount: 2,
  expensesCount: 1,
  latestCashGap: 0,
  closureCount: 0,
  isClosed: false,
};

function renderClosureForm(overrides: Partial<Parameters<typeof ClosureForm>[0]> = {}) {
  const props: Parameters<typeof ClosureForm>[0] = {
    summary,
    physicalCashAmount: '',
    note: '',
    isPartial: false,
    saving: false,
    formError: '',
    successMessage: '',
    onPhysicalCashAmountChange: mock.fn(),
    onNoteChange: mock.fn(),
    onPartialChange: mock.fn(),
    onSubmit: mock.fn(),
    ...overrides,
  };
  let tree: ReturnType<typeof create>;

  act(() => {
    tree = create(<ClosureForm {...props} />);
  });

  return { props, tree: tree! };
}

function findByHostType(tree: ReturnType<typeof create>, type: string) {
  return tree.root.findAll((node) => node.type === type);
}

describe('ClosureForm', () => {
  it('parses and formats cash amounts', () => {
    assert.equal(parseClosureAmount('1,5'), 1.5);
    assert.equal(Number.isNaN(parseClosureAmount('   ')), true);
    assert.equal(formatClosureMoney(1200).replace(/\s/g, ' '), '1 200 F');
  });

  it('shows the calculated cash gap when cash is entered', () => {
    const { tree } = renderClosureForm({ physicalCashAmount: '1300' });

    assert.equal(JSON.stringify(tree.toJSON()).includes('100'), true);
  });

  it('keeps submit disabled until cash can be calculated', () => {
    const { tree } = renderClosureForm();
    const submit = findByHostType(tree, 'Pressable').at(-1);

    assert.equal(JSON.stringify(tree.toJSON()).includes('En attente'), true);
    assert.equal(submit?.props.disabled, true);
  });

  it('forwards cash, note, partial toggle and submit actions', () => {
    const onPhysicalCashAmountChange = mock.fn();
    const onNoteChange = mock.fn();
    const onPartialChange = mock.fn();
    const onSubmit = mock.fn();
    const { tree } = renderClosureForm({
      physicalCashAmount: '1200',
      onPhysicalCashAmountChange,
      onNoteChange,
      onPartialChange,
      onSubmit,
    });
    const inputs = findByHostType(tree, 'TextInput');
    const pressables = findByHostType(tree, 'Pressable');

    act(() => inputs[0].props.onChangeText('1400'));
    act(() => inputs[1].props.onChangeText('Fin de journee'));
    act(() => pressables[0].props.onPress());
    act(() => pressables.at(-1)?.props.onPress());

    assert.equal(onPhysicalCashAmountChange.mock.calls[0].arguments[0], '1400');
    assert.equal(onNoteChange.mock.calls[0].arguments[0], 'Fin de journee');
    assert.equal(onPartialChange.mock.calls[0].arguments[0], true);
    assert.equal(onSubmit.mock.callCount(), 1);
  });
});
