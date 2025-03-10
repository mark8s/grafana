import { uniqBy } from 'lodash';
import React, { useState } from 'react';

import { SelectableValue, toOption } from '@grafana/data';
import { selectors } from '@grafana/e2e-selectors';
import { AccessoryButton, InputGroup } from '@grafana/experimental';
import { Select } from '@grafana/ui';

import { QueryBuilderLabelFilter } from './types';

export interface Props {
  defaultOp: string;
  item: Partial<QueryBuilderLabelFilter>;
  onChange: (value: QueryBuilderLabelFilter) => void;
  onGetLabelNames: (forLabel: Partial<QueryBuilderLabelFilter>) => Promise<SelectableValue[]>;
  onGetLabelValues: (forLabel: Partial<QueryBuilderLabelFilter>) => Promise<SelectableValue[]>;
  onDelete: () => void;
  invalidLabel?: boolean;
  invalidValue?: boolean;
}

export function LabelFilterItem({
  item,
  defaultOp,
  onChange,
  onDelete,
  onGetLabelNames,
  onGetLabelValues,
  invalidLabel,
  invalidValue,
}: Props) {
  const [state, setState] = useState<{
    labelNames?: SelectableValue[];
    labelValues?: SelectableValue[];
    isLoadingLabelNames?: boolean;
    isLoadingLabelValues?: boolean;
  }>({});

  const isMultiSelect = () => {
    return operators.find((op) => op.label === item.op)?.isMultiValue;
  };

  const getSelectOptionsFromString = (item?: string): string[] => {
    if (item) {
      if (item.indexOf('|') > 0) {
        return item.split('|');
      }
      return [item];
    }
    return [];
  };

  const getOptions = (): SelectableValue[] => {
    const labelValues = state.labelValues ? [...state.labelValues] : [];
    const selectedOptions = getSelectOptionsFromString(item?.value).map(toOption);

    // Remove possible duplicated values
    return uniqBy([...selectedOptions, ...labelValues], 'value');
  };

  return (
    <div data-testid="prometheus-dimensions-filter-item">
      <InputGroup>
        <Select
          placeholder="Select label"
          aria-label={selectors.components.QueryBuilder.labelSelect}
          inputId="prometheus-dimensions-filter-item-key"
          width="auto"
          value={item.label ? toOption(item.label) : null}
          allowCustomValue
          onOpenMenu={async () => {
            setState({ isLoadingLabelNames: true });
            const labelNames = await onGetLabelNames(item);
            setState({ labelNames, isLoadingLabelNames: undefined });
          }}
          isLoading={state.isLoadingLabelNames}
          options={state.labelNames}
          onChange={(change) => {
            if (change.label) {
              onChange({
                ...item,
                op: item.op ?? defaultOp,
                label: change.label,
              } as any as QueryBuilderLabelFilter);
            }
          }}
          invalid={invalidLabel}
        />

        <Select
          aria-label={selectors.components.QueryBuilder.matchOperatorSelect}
          value={toOption(item.op ?? defaultOp)}
          options={operators}
          width="auto"
          onChange={(change) => {
            if (change.value != null) {
              onChange({ ...item, op: change.value } as any as QueryBuilderLabelFilter);
            }
          }}
        />

        <Select
          placeholder="Select value"
          aria-label={selectors.components.QueryBuilder.valueSelect}
          inputId="prometheus-dimensions-filter-item-value"
          width="auto"
          value={
            isMultiSelect()
              ? getSelectOptionsFromString(item?.value).map(toOption)
              : getSelectOptionsFromString(item?.value).map(toOption)[0]
          }
          allowCustomValue
          onOpenMenu={async () => {
            setState({ isLoadingLabelValues: true });
            const labelValues = await onGetLabelValues(item);
            setState({
              ...state,
              labelValues,
              isLoadingLabelValues: undefined,
            });
          }}
          isMulti={isMultiSelect()}
          isLoading={state.isLoadingLabelValues}
          options={getOptions()}
          onChange={(change) => {
            if (change.value) {
              onChange({ ...item, value: change.value, op: item.op ?? defaultOp } as any as QueryBuilderLabelFilter);
            } else {
              const changes = change
                .map((change: any) => {
                  return change.label;
                })
                .join('|');
              onChange({ ...item, value: changes, op: item.op ?? defaultOp } as any as QueryBuilderLabelFilter);
            }
          }}
          invalid={invalidValue}
        />
        <AccessoryButton aria-label="remove" icon="times" variant="secondary" onClick={onDelete} />
      </InputGroup>
    </div>
  );
}

const operators = [
  { label: '=~', value: '=~', isMultiValue: true },
  { label: '=', value: '=', isMultiValue: false },
  { label: '!=', value: '!=', isMultiValue: false },
  { label: '!~', value: '!~', isMultiValue: true },
];
