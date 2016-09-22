import modeled from '../enhancers/modeled-enhancer';
import modelReducer from './model-reducer';
import formReducer from './form-reducer';
import { combineReducers } from 'redux';
import identity from 'lodash/identity';

import NULL_ACTION from '../constants/null-action';

const defaults = {
  key: 'forms',
  plugins: [],
};

function getSubModelString(model, subModel) {
  if (!model) return subModel;

  return `${model}.${subModel}`;
}

const defaultStrategy = {
  modelReducer,
  formReducer,
  modeled,
  toJS: identity,
};

function createFormCombiner(strategy = defaultStrategy) {
  function combineForms(forms, model = '', options = {}) {
    const formKeys = Object.keys(forms);
    const modelReducers = {};
    const initialFormState = {};
    const optionsWithDefaults = {
      ...defaults,
      ...options,
    };
    const {
      key,
      plugins,
    } = optionsWithDefaults;

    formKeys.forEach((formKey) => {
      const formValue = forms[formKey];
      const subModel = getSubModelString(model, formKey);

      if (typeof formValue === 'function') {
        let initialState;
        try {
          initialState = formValue(undefined, NULL_ACTION);
        } catch (error) {
          initialState = null;
        }

        modelReducers[formKey] = strategy.modeled(formValue, subModel);
        initialFormState[formKey] = initialState;
      } else {
        modelReducers[formKey] = strategy.modelReducer(subModel, formValue);
        initialFormState[formKey] = strategy.toJS(formValue);
      }
    });

    return combineReducers({
      ...modelReducers,
      [key]: strategy.formReducer(model, initialFormState, { plugins }),
    });
  }

  return combineForms;
}

export default createFormCombiner();
export { createFormCombiner };