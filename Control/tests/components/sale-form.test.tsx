import assert from 'node:assert/strict';
import Module from 'node:module';
import { describe, it, mock } from 'node:test';
import React from 'react';
import { act, create } from 'react-test-renderer';

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

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { SaleForm, formatSaleMoney } = require('../../components/sale-form') as typeof import('../../components/sale-form');

function renderSaleForm(overrides: Partial<Parameters<typeof SaleForm>[0]> = {}) {
  const props: Parameters<typeof SaleForm>[0] = {
    quantity: '',
    totalInput: '',
    autoTotal: 1500,
    paymentMethod: 'Cash',
    availablePaymentMethods: ['Cash', 'Mobile Money'],
    formError: '',
    successMessage: '',
    saving: false,
    onQuantityChange: mock.fn(),
    onTotalInputChange: mock.fn(),
    onPaymentMethodChange: mock.fn(),
    onSubmit: mock.fn(),
    ...overrides,
  };
  let tree: ReturnType<typeof create>;

  act(() => {
    tree = create(<SaleForm {...props} />);
  });

  return { props, tree: tree! };
}

function findByHostType(tree: ReturnType<typeof create>, type: string) {
  return tree.root.findAll((node) => node.type === type);
}

describe('SaleForm', () => {
  it('formats the auto total placeholder', () => {
    const { tree } = renderSaleForm();
    const totalInput = findByHostType(tree, 'TextInput')[1];

    assert.equal(totalInput.props.placeholder.replace(/\s/g, ' '), '1 500 F');
    assert.equal(formatSaleMoney(2400.2).replace(/\s/g, ' '), '2 400 F');
  });

  it('forwards quantity and total input changes', () => {
    const onQuantityChange = mock.fn();
    const onTotalInputChange = mock.fn();
    const { tree } = renderSaleForm({ onQuantityChange, onTotalInputChange });
    const inputs = findByHostType(tree, 'TextInput');

    act(() => inputs[0].props.onChangeText('3,5'));
    act(() => inputs[1].props.onChangeText('4000'));

    assert.equal(onQuantityChange.mock.calls[0].arguments[0], '3,5');
    assert.equal(onTotalInputChange.mock.calls[0].arguments[0], '4000');
  });

  it('selects another payment method and submits when enabled', () => {
    const onPaymentMethodChange = mock.fn();
    const onSubmit = mock.fn();
    const { tree } = renderSaleForm({ onPaymentMethodChange, onSubmit });
    const buttons = findByHostType(tree, 'Pressable');

    act(() => buttons[1].props.onPress());
    act(() => buttons[2].props.onPress());

    assert.equal(onPaymentMethodChange.mock.calls[0].arguments[0], 'Mobile Money');
    assert.equal(onSubmit.mock.callCount(), 1);
  });

  it('disables submit while saving', () => {
    const { tree } = renderSaleForm({ saving: true });
    const submit = findByHostType(tree, 'Pressable').at(-1);

    assert.equal(submit?.props.disabled, true);
  });
});
