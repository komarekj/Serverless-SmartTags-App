const _ = require('lodash');

const comapreValues = (variableValue, ruleValue, operator) => {
  switch (operator) {
    case 'EQUALS': {
      // eslint-disable-next-line eqeqeq
      return variableValue == ruleValue;
    }
    case 'CONTAINS': {
      return variableValue.includes(ruleValue);
    }
    case 'STARTS_WITH': {
      const regex = new RegExp(`^${ruleValue}`);
      return regex.test(variableValue);
    }
    case 'ENDS_WITH': {
      const regex = new RegExp(`${ruleValue}$`);
      return regex.test(variableValue);
    }
    case 'REGEX': {
      const regex = new RegExp(ruleValue);
      return regex.test(variableValue);
    }
    case 'REGEX_IGNORE_CASE': {
      const regex = new RegExp(`${ruleValue}$`, 'i');
      return regex.test(variableValue);
    }
    case 'LESS_THAN': {
      return +variableValue < +ruleValue;
    }
    case 'LESS_EQUALS': {
      return +variableValue <= +ruleValue;
    }
    case 'GREATER_THAN': {
      return +variableValue > +ruleValue;
    }
    case 'GREATER_EQUALS': {
      return +variableValue >= +ruleValue;
    }
    case 'NOT_EQUALS':
    case 'NOT_CONTAINS':
    case 'NOT_STARTS_WITH':
    case 'NOT_ENDS_WITH':
    case 'NOT_REGEX':
    case 'NOT_REGEX_IGNORE_CASE': {
      const reguralOperator = operator.replace('NOT_', '');
      return !comapreValues(variableValue, ruleValue, reguralOperator);
    }
    default:
      return false;
  }
};

const evaluateCondition = (item, condition) => {
  const { value, variable, operator } = condition;
  const isListVariable = variable.includes('[]');

  if (isListVariable) {
    const [listPath, variablePath] = variable.split('[].');
    const listItems = item[listPath];
    const listItemsResults = listItems.map(listItem =>
      comapreValues(_.get(listItem, variablePath), value, operator)
    );

    return listItemsResults.includes(true);
  }

  const variableValue = _.get(item, variable);
  return comapreValues(variableValue, value, operator);
};

module.exports.evaluateRule = (rule, item) => {
  const { conditionsType, conditions } = rule;
  const conditionResults = conditions.map(condition =>
    evaluateCondition(item, condition)
  );

  if (conditionsType === 'all') {
    // One false ruins it for everyone
    return !conditionResults.includes(false);
  }

  // One matching rule is all we need
  return conditionResults.includes(true);
};

// Groups rules by resource type
module.exports.groupRules = rules => _.groupBy(rules, 'resource');
